<?php
// ── Configuração do banco ─────────────────────────────────────────────────────
$host    = 'localhost';
$banco   = 'semana_s';
$usuario = 'root';
$senha   = '';
$charset = 'utf8mb4';

// ── Teste de conexão PDO ──────────────────────────────────────────────────────
$dsn = "mysql:host=$host;dbname=$banco;charset=$charset";

$opcoes = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $usuario, $senha, $opcoes);

    echo "<h2 style='color:green'>✔ Conexão bem-sucedida!</h2>";
    echo "<p>Banco: <strong>$banco</strong> | Host: <strong>$host</strong></p>";

    // ── Verifica se a tabela usuarios existe ──────────────────────────────────
    $stmt = $pdo->query("SHOW TABLES LIKE 'usuarios'");
    $tabelaExiste = $stmt->fetch();

    if ($tabelaExiste) {
        echo "<p style='color:green'>✔ Tabela <strong>usuarios</strong> encontrada.</p>";

        // Conta os registros
        $count = $pdo->query("SELECT COUNT(*) AS total FROM usuarios")->fetch();
        echo "<p>Total de registros na tabela: <strong>{$count['total']}</strong></p>";

        // Lista os últimos 5 registros
        $rows = $pdo->query(
            "SELECT id, nome, fase_atual, estrelas, hora_inicial, hora_final
             FROM usuarios
             ORDER BY id DESC
             LIMIT 5"
        )->fetchAll();

        if ($rows) {
            echo "<h3>Últimos registros:</h3>";
            echo "<table border='1' cellpadding='6' cellspacing='0' style='border-collapse:collapse'>";
            echo "<thead><tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Fase Atual</th>
                    <th>Estrelas</th>
                    <th>Hora Inicial</th>
                    <th>Hora Final</th>
                  </tr></thead><tbody>";
            foreach ($rows as $row) {
                echo "<tr>
                        <td>{$row['id']}</td>
                        <td>" . htmlspecialchars($row['nome']) . "</td>
                        <td>{$row['fase_atual']}</td>
                        <td>{$row['estrelas']}</td>
                        <td>{$row['hora_inicial']}</td>
                        <td>{$row['hora_final']}</td>
                      </tr>";
            }
            echo "</tbody></table>";
        } else {
            echo "<p style='color:orange'>⚠ A tabela existe mas não tem registros ainda.</p>";
        }
    } else {
        echo "<p style='color:red'>✘ Tabela <strong>usuarios</strong> NÃO encontrada no banco.</p>";
        echo "<p>Execute o SQL abaixo para criá-la:</p>";
        echo "<pre style='background:#f4f4f4;padding:12px'>
CREATE TABLE IF NOT EXISTS usuarios (
  id               INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  nome             VARCHAR(60)      NOT NULL,
  fases_concluidas JSON             NOT NULL DEFAULT ('[]'),
  fase_atual       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  estrelas         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  hora_inicial     DATETIME         NULL,
  hora_final       DATETIME         NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        </pre>";
    }

} catch (PDOException $e) {
    echo "<h2 style='color:red'>✘ Falha na conexão</h2>";
    echo "<p><strong>Erro:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<ul>
            <li>Verifique se o MySQL / XAMPP está rodando</li>
            <li>Confirme o nome do banco: <strong>$banco</strong></li>
            <li>Confirme o usuário: <strong>$usuario</strong></li>
            <li>Confirme a senha configurada</li>
          </ul>";
}
