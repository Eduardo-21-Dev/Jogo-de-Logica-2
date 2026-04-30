<?php
ob_start();

require_once __DIR__ . '/conexao.php';

// ── Cabeçalhos CORS e JSON ────────────────────────────────────────────────────
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function jsonResponse(int $status, array $body): void
{
    ob_clean();
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonBody(): array
{
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function sanitizeNome(string $nome): string
{
    $nome = strip_tags($nome);
    $nome = preg_replace('/[\x00-\x1F\x7F]/u', '', $nome);
    return mb_substr(trim($nome), 0, 60, 'UTF-8');
}

function sanitizeDatetime(?string $valor): ?string
{
    if ($valor === null || $valor === '') {
        return null;
    }
    $ts = strtotime($valor);
    return $ts !== false ? date('Y-m-d H:i:s', $ts) : null;
}

function sanitizarFases(array $fases): array
{
    $sanitizadas = array_values(array_unique(array_filter(
        array_map('intval', $fases),
        fn(int $f) => $f >= 1 && $f <= 6
    )));
    sort($sanitizadas);
    return $sanitizadas;
}

function sanitizarEstrelasPorFase(array $input): array
{
    $result = [];
    foreach ($input as $fase => $estrelas) {
        $f = filter_var($fase, FILTER_VALIDATE_INT);
        $e = filter_var($estrelas, FILTER_VALIDATE_INT);
        if ($f !== false && $f >= 1 && $f <= 6 && $e !== false && $e >= 1 && $e <= 3) {
            $result[(string) $f] = $e;
        }
    }
    return $result;
}

// ── Roteamento ────────────────────────────────────────────────────────────────
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getConexao();

    switch ($action) {

        // ── POST ?action=salvar_jogador ───────────────────────────────────────
        // Cria um novo jogador. Retorna o registro completo com o id gerado.
        // Body: { "nome", "fases_concluidas", "fase_atual", "estrelas",
        //         "hora_inicial", "hora_final" }
        case 'salvar_jogador':
            if ($method !== 'POST') {
                jsonResponse(405, ['erro' => 'Método não permitido.']);
            }

            $body = getJsonBody();

            $nome = sanitizeNome((string) ($body['nome'] ?? ''));
            if (mb_strlen($nome, 'UTF-8') < 2) {
                jsonResponse(422, ['erro' => 'O nome deve ter pelo menos 2 caracteres.']);
            }

            $fases = $body['fases_concluidas'] ?? [];
            if (!is_array($fases)) {
                jsonResponse(422, ['erro' => 'fases_concluidas deve ser um array.']);
            }
            $fasesSanitizadas = sanitizarFases($fases);

            $faseAtual = filter_var($body['fase_atual'] ?? 1, FILTER_VALIDATE_INT);
            $faseAtual = ($faseAtual !== false && $faseAtual >= 1 && $faseAtual <= 6) ? $faseAtual : 1;

            $estrelasSanitizadas = filter_var($body['estrelas'] ?? 0, FILTER_VALIDATE_INT);
            $estrelasSanitizadas = ($estrelasSanitizadas !== false && $estrelasSanitizadas >= 0 && $estrelasSanitizadas <= 18) ? $estrelasSanitizadas : 0;

            $epfInput = (isset($body['estrelas_por_fase']) && is_array($body['estrelas_por_fase']))
                ? $body['estrelas_por_fase'] : [];
            $estrelasPorFase = sanitizarEstrelasPorFase($epfInput);
            // Total de estrelas é sempre a soma das estrelas por fase
            if (!empty($estrelasPorFase)) {
                $estrelasSanitizadas = (int) array_sum($estrelasPorFase);
            }

            $horaInicial = sanitizeDatetime($body['hora_inicial'] ?? null);
            $horaFinal   = sanitizeDatetime($body['hora_final']   ?? null);

            
            $stmtCheck = $pdo->prepare('SELECT id FROM usuarios WHERE nome = :nome LIMIT 1');
            $stmtCheck->execute([':nome' => $nome]);
            if ($stmtCheck->fetch()) {
                jsonResponse(409, ['erro' => "Já existe um usuário cadastrado com o nome \"$nome\"."]);
            }
            $stmt = $pdo->prepare(
                'INSERT INTO usuarios
                    (nome, fases_concluidas, fase_atual, estrelas, estrelas_por_fase, hora_inicial, hora_final)
                 VALUES
                    (:nome, :fases, :fase_atual, :estrelas, :epf, :hora_inicial, :hora_final)'
            );
            $stmt->execute([
                ':nome'         => $nome,
                ':fases'        => json_encode($fasesSanitizadas),
                ':fase_atual'   => $faseAtual,
                ':estrelas'     => $estrelasSanitizadas,
                ':epf'          => json_encode($estrelasPorFase, JSON_FORCE_OBJECT),
                ':hora_inicial' => $horaInicial,
                ':hora_final'   => $horaFinal,
            ]);

            $novoId = (int) $pdo->lastInsertId();

            jsonResponse(201, [
                'sucesso'          => true,
                'id'               => $novoId,
                'nome'             => $nome,
                'fases_concluidas' => $fasesSanitizadas,
                'fase_atual'       => $faseAtual,
                'estrelas'         => $estrelasSanitizadas,
                'estrelas_por_fase' => $estrelasPorFase,
                'hora_inicial'     => $horaInicial,
                'hora_final'       => $horaFinal,
            ]);
            break;

        // ── POST ?action=atualizar_jogador ────────────────────────────────────
        // Atualiza campos de um jogador existente pelo id.
        // Body: { "id", "fases_concluidas"?, "fase_atual"?, "estrelas"?,
        //         "hora_inicial"?, "hora_final"? }
        case 'atualizar_jogador':
            if ($method !== 'POST') {
                jsonResponse(405, ['erro' => 'Método não permitido.']);
            }

            $body = getJsonBody();

            $id = filter_var($body['id'] ?? 0, FILTER_VALIDATE_INT);
            if (!$id || $id <= 0) {
                jsonResponse(422, ['erro' => 'id inválido.']);
            }

            $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE id = :id');
            $stmt->execute([':id' => $id]);
            $atual = $stmt->fetch();

            if (!$atual) {
                jsonResponse(404, ['erro' => 'Jogador não encontrado.']);
            }

            $fases = array_key_exists('fases_concluidas', $body)
                ? $body['fases_concluidas']
                : json_decode($atual['fases_concluidas'], true);
            if (!is_array($fases)) {
                jsonResponse(422, ['erro' => 'fases_concluidas deve ser um array.']);
            }
            $fasesSanitizadas = sanitizarFases($fases);

            $faseAtual = filter_var($body['fase_atual'] ?? $atual['fase_atual'], FILTER_VALIDATE_INT);
            $faseAtual = ($faseAtual !== false && $faseAtual >= 1 && $faseAtual <= 6)
                ? $faseAtual
                : (int) $atual['fase_atual'];

            $estrelas = filter_var($body['estrelas'] ?? $atual['estrelas'], FILTER_VALIDATE_INT);
            $estrelas = ($estrelas !== false && $estrelas >= 0 && $estrelas <= 18)
                ? $estrelas
                : (int) $atual['estrelas'];

            $epfInput = array_key_exists('estrelas_por_fase', $body)
                ? (is_array($body['estrelas_por_fase']) ? $body['estrelas_por_fase'] : [])
                : json_decode($atual['estrelas_por_fase'] ?? '{}', true);
            $estrelasPorFase = sanitizarEstrelasPorFase(is_array($epfInput) ? $epfInput : []);
            // Total de estrelas é sempre a soma das estrelas por fase
            $totalEstrelas = !empty($estrelasPorFase) ? (int) array_sum($estrelasPorFase) : (int) $atual['estrelas'];

            $horaInicial = array_key_exists('hora_inicial', $body)
                ? sanitizeDatetime($body['hora_inicial'])
                : $atual['hora_inicial'];

            $horaFinal = array_key_exists('hora_final', $body)
                ? sanitizeDatetime($body['hora_final'])
                : $atual['hora_final'];

            $stmt = $pdo->prepare(
                'UPDATE usuarios SET
                    fases_concluidas   = :fases,
                    fase_atual         = :fase_atual,
                    estrelas           = :estrelas,
                    estrelas_por_fase  = :epf,
                    hora_inicial       = :hora_inicial,
                    hora_final         = :hora_final
                 WHERE id = :id'
            );
            $stmt->execute([
                ':fases'        => json_encode($fasesSanitizadas),
                ':fase_atual'   => $faseAtual,
                ':estrelas'     => $totalEstrelas,
                ':epf'          => json_encode($estrelasPorFase, JSON_FORCE_OBJECT),
                ':hora_inicial' => $horaInicial,
                ':hora_final'   => $horaFinal,
                ':id'           => $id,
            ]);

            jsonResponse(200, [
                'sucesso'          => true,
                'id'               => $id,
                'nome'             => $atual['nome'],
                'fases_concluidas' => $fasesSanitizadas,
                'fase_atual'       => $faseAtual,
                'estrelas'         => $totalEstrelas,
                'estrelas_por_fase' => $estrelasPorFase,
                'hora_inicial'     => $horaInicial,
                'hora_final'       => $horaFinal,
            ]);
            break;

        // ── GET ?action=get_jogador&id=1 ──────────────────────────────────────
        // Retorna os dados de um jogador pelo id.
        case 'get_jogador':
            if ($method !== 'GET') {
                jsonResponse(405, ['erro' => 'Método não permitido.']);
            }

            $id = filter_var($_GET['id'] ?? 0, FILTER_VALIDATE_INT);
            if (!$id || $id <= 0) {
                jsonResponse(422, ['erro' => 'id inválido.']);
            }

            $stmt = $pdo->prepare(
                'SELECT id, nome, fases_concluidas, fase_atual, estrelas, estrelas_por_fase, hora_inicial, hora_final
                 FROM usuarios WHERE id = :id'
            );
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();

            if (!$row) {
                jsonResponse(404, ['erro' => 'Jogador não encontrado.']);
            }

            $row['fases_concluidas']  = json_decode($row['fases_concluidas'], true) ?? [];
            $row['estrelas_por_fase'] = json_decode($row['estrelas_por_fase'] ?? '{}', true) ?? (object)[];

            jsonResponse(200, ['sucesso' => true, 'jogador' => $row]);
            break;

        // ── GET ?action=ranking&limite=10 ─────────────────────────────────────
        // Retorna o ranking dos jogadores ordenado por estrelas.
        case 'ranking':
            if ($method !== 'GET') {
                jsonResponse(405, ['erro' => 'Método não permitido.']);
            }

            $limite = filter_var($_GET['limite'] ?? 10, FILTER_VALIDATE_INT);
            $limite = ($limite && $limite > 0 && $limite <= 100) ? $limite : 10;

            $stmt = $pdo->prepare(
                'SELECT id,
                        nome,
                        fases_concluidas,
                        fase_atual,
                        estrelas,
                        estrelas_por_fase,
                        hora_inicial,
                        hora_final,
                        JSON_LENGTH(fases_concluidas)                   AS total_fases_concluidas,
                        TIMESTAMPDIFF(SECOND, hora_inicial, hora_final) AS total_tempo_segundos
                 FROM usuarios
                 ORDER BY total_fases_concluidas DESC,
                          estrelas DESC,
                          CASE WHEN hora_final IS NULL THEN 1 ELSE 0 END ASC,
                          total_tempo_segundos ASC
                 LIMIT :limite'
            );
            $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll();

            foreach ($rows as &$row) {
                $row['fases_concluidas']  = json_decode($row['fases_concluidas'], true) ?? [];
                $row['estrelas_por_fase'] = json_decode($row['estrelas_por_fase'] ?? '{}', true) ?? (object)[];
            }
            unset($row);

            jsonResponse(200, ['sucesso' => true, 'ranking' => $rows]);
            break;

        default:
            jsonResponse(404, ['erro' => 'Ação não encontrada.']);
    }
} catch (PDOException $e) {
    error_log('[data.php] DB Error: ' . $e->getMessage());
    jsonResponse(500, ['erro' => 'Erro interno no servidor. Tente novamente.']);
} catch (Throwable $e) {
    error_log('[data.php] App Error: ' . $e->getMessage());
    jsonResponse(500, ['erro' => 'Erro inesperado.']);
}
