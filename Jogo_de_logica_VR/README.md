# Jogo de Lógica

Jogo educacional de lógica com 6 fases, desenvolvido em HTML/CSS/JavaScript com backend em PHP e banco de dados MySQL (XAMPP).

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript (IIFE) |
| Backend | PHP 8.2 + PDO |
| Banco | MySQL (XAMPP) — banco `semana_s`, tabela `usuarios` |
| Servidor | Apache (XAMPP) — `http://localhost/Jogo_de_logica/` |

---

## Estrutura do projeto

```
Jogo_de_logica/
├── index.html              # Tela de login / cadastro
├── assets/
│   ├── backend/
│   │   ├── app.js          # Toda a lógica do jogo (roteamento, fases, estrelas)
│   │   └── api.js          # GameAPI — comunicação com o backend PHP
│   ├── css/
│   │   └── app.css         # Estilos globais
│   └── img/                # Imagens e ícones
├── pages/
│   ├── pagina1.html        # Fase 1 — Navegação em grade (distância Manhattan)
│   ├── pagina2.html        # Fase 2 — Coleta de chips (TSP guloso)
│   ├── pagina3.html        # Fase 3 — Pegar e largar caixa
│   ├── pagina4.html        # Fase 4 — Entrega de pacotes coloridos
│   ├── pagina5.html        # Fase 5 — Labirinto com porta e pacotes
│   └── pagina6.html        # Fase 6 — Troca de blocos com portais
└── service/
    ├── data.php            # API REST (login, cadastro, progresso, estrelas)
    └── teste_conexao.php   # Diagnóstico de conexão com o banco
```

---

## Funcionalidades implementadas

### Sistema de estrelas por percentual de eficiência

Cada fase atribui de 1 a 3 estrelas com base na quantidade de passos executados em relação ao mínimo ótimo da variação:

| Resultado | Critério |
|-----------|---------|
| ⭐⭐⭐ 3 estrelas | `passos <= mínimo` |
| ⭐⭐ 2 estrelas | `mínimo < passos <= floor(mínimo × 1.50)` |
| ⭐ 1 estrela | `passos > floor(mínimo × 1.50)` |

A função global `calcularEstrelas(passos, minPassos)` centraliza essa lógica em `app.js`.

---

### Cálculo do mínimo ótimo por fase

| Fase | Método | Recalculado por variação? |
|------|--------|--------------------------|
| **1** — Grade livre | Distância Manhattan (start → goal) | Fixo (grid = 9 passos) |
| **2** — Coleta de chips | Vizinho mais próximo (greedy TSP) em Manhattan | Sim |
| **3** — Pegar/largar caixa | Manhattan(bot→caixa) + 1 + Manhattan(caixa→alvo) + 1 | Sim |
| **4** — Pacotes coloridos | Valor fixo = **37 passos** (layout estático, rota vermelho→verde→azul) | Não |
| **5** — Labirinto com porta | BFS no labirinto (porta fechada para vermelho/azul; aberta para verde) | Sim |
| **6** — Troca com portais | BFS com teleporte por portais; rota A→C→B→A | Sim |

---

### Progresso e persistência

- **localStorage** (`css-master-progress-v1`): armazena `{ completedLessons: [], estrelasPorFase: {} }` localmente.
- **Banco de dados**: as estrelas de cada fase são sincronizadas via `GameAPI` e persistidas na tabela `usuarios` (coluna `estrelas_por_fase` em JSON).
- **Ranking**: exibido na tela inicial com base nos dados do banco.

---

## Detalhes por fase

### Fase 1 — Navegação em grade
- Grade 11×9; robô se move para o objetivo com o menor número de passos.
- Mínimo = `|goal.col - start.col| + |goal.row - start.row|`.

### Fase 2 — Coleta de chips
- Grade 11×9; 10 variações com chips em posições aleatórias.
- Mínimo calculado via nearest-neighbor TSP a partir da posição inicial `(5, 4)`.

### Fase 3 — Pegar e largar caixa
- Grade 11×9; 10 variações de posição de caixa e alvo.
- Mínimo = passos até a caixa + `pegar()` + passos até o alvo + `largar()`.

### Fase 4 — Entrega de pacotes coloridos
- Layout fixo; 3 pacotes (vermelho, verde, azul) entregues em bases específicas.
- Mínimo hardcoded = **37 passos** (rota ótima calculada manualmente).

### Fase 5 — Labirinto com porta
- Grade 13×11; 10 variações de labirinto gerado proceduralmente.
- Porta controlada por chave: pacotes vermelho e azul entregues com porta fechada; verde exige porta aberta.
- Mínimo calculado por BFS que considera o estado da porta.

### Fase 6 — Troca de blocos com portais
- Grade 21×15; 10 variações com portais de teleporte.
- Objetivo: trocar blocos A↔C↔B↔A usando os portais.
- Mínimo calculado por BFS que simula o teleporte ao entrar em células de entrada dos portais.

---

## Como executar

1. Copiar a pasta `Jogo_de_logica` para `c:\xampp\htdocs\`.
2. Iniciar o Apache e o MySQL no painel do XAMPP.
3. Importar o banco de dados (criar banco `semana_s` com tabela `usuarios`).
4. Acessar `http://localhost/Jogo_de_logica/`.

---

## Alterações recentes

### v1.0.0 — Sistema de estrelas por eficiência (27/04/2026)

- **`assets/backend/app.js`**
  - Adicionada função global `calcularEstrelas(passos, minPassos)` com limiares percentuais.
  - **Fase 1**: `calculateStars` atualizado para usar `calcularEstrelas` com distância Manhattan.
  - **Fase 2**: adicionado cálculo de mínimo via TSP guloso (`calcularMinPassosFase2`); `showWinPanel` e `hideWinPanel` atualizados para exibir/limpar `starRating`; condição de vitória gera e salva estrelas.
  - **Fase 3**: adicionado `calcularMinPassosFase3` (Manhattan + ações pegar/largar); sistema de estrelas completo.
  - **Fase 4**: adicionada constante `MIN_PASSOS_FASE4 = 37`; sistema de estrelas completo.
  - **Fase 4 (labirinto legado)**: `calculateStars` atualizado para usar `calcularEstrelas` com BFS existente.
  - **Fase 5**: adicionados `bfsMinStepsFase5` (BFS ciente da porta) e `calcularMinPassosFase5` (testa 2 ordens de coleta); sistema de estrelas completo.
  - **Fase 6**: adicionados `bfsMinStepsFase6` (BFS com teleporte por portais) e `calcularMinPassosFase6` (rota A→C→B→A); sistema de estrelas completo.
  - `markLessonAsCompleted(lessonNumber, stars)` recebe e persiste as estrelas em todas as fases.

- **`service/data.php`**
  - Suporte ao campo `estrelas_por_fase` (JSON) na tabela `usuarios`.
  - Endpoints para leitura e atualização de estrelas por fase.

- **`assets/backend/api.js`**
  - Métodos `GameAPI` atualizados para enviar e receber `estrelas_por_fase`.
