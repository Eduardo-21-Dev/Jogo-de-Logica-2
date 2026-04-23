# Jogo-de-Logica-2

## Alterações do Commit (20/04/2026)

- Ajuste da home para utilizar 6 lições (cards e contadores atualizados para 0/6 e 0/18).
- Reorganização do fluxo de fases com atualização das páginas de lição intermediárias.
- Criação da página `pagina3.html` e remoção da antiga `pagina6.html`.
- Atualizações de conteúdo nas páginas `pagina2.html`, `pagina4.html` e `pagina5.html` (títulos, sequência e navegação entre fases).
- Ajustes no `app.js` para acompanhar o novo total de lições e a navegação/progresso.
- Ajustes visuais no `app.css`, incluindo layout dos cards na home e refinamentos de estilos do jogo.

## Atualizações adicionais (20/04/2026)

- Correção das conexões entre fases para garantir fluxo sequencial: lição 1 -> `pagina1.html`, lição 2 -> `pagina2.html`, lição 3 -> `pagina3.html`, lição 4 -> `pagina4.html`, lição 5 -> `pagina5.html`.
- Ajuste de rotas duplicadas/incorretas no `app.js` que afetavam o carregamento da lógica correta da `pagina3.html`.
- Atualização dos links de navegação entre fases nas páginas de lição (incluindo correção de referência para página inexistente).
- Redesenho da fase da `pagina5.html` para um labirinto mais complexo, com menos espaço livre e múltiplos caminhos estreitos.
- Nova mecânica de progressão na fase 5: duas entregas no lado esquerdo para destrancar a passagem ao lado direito.
- Implementação de uma porta 2D em CSS no labirinto (não mais bloco), com animação de abertura.
- Ajuste de comportamento da porta para abrir apenas quando o jogador encosta nela após destravar.
- Refinos de estilo no `app.css` para suportar o novo componente visual da porta e suas animações.

## Atualizações recentes (23/04/2026)

### Pagina 5 — Labirinto com variações completas
- Substituição do sistema de variações por delta (`extras`/`removes`) por variações com `overrideOpenCells` independentes, gerando labirintos completamente diferentes entre si.
- Cada variação reposiciona todos os elementos: jogador, pacotes, bases e a porta.
- A porta é sempre posicionada estrategicamente, bloqueando o acesso direto à base verde e exigindo que o jogador entregue os pacotes vermelho e azul antes de acessá-la.
- `applyVariationByIndex()` atualizado para suportar posições de bases por variação (mutação in-place dos objetos para preservar referências).

### Painel de vitória — Redesenho visual completo
- Novo layout do `.win-panel` / `.fail-panel` com `backdrop-filter: blur(10px)` e `z-index` correto.
- Animação de entrada `@keyframes win-card-in` com curva cubic-bezier de quique.
- Faixa da marca SENAC via `::before` no `.win-card`; faixa vermelha no `.fail-card`.
- Hierarquia tipográfica: `.win-eyebrow`, `.win-title`, `.win-summary`, `.win-icon` (ícone 🏆).
- Botão `.btn-next` com gradiente verde e sombra; `.btn-fail-ok` com gradiente vermelho.
- Ícone 🏆 adicionado ao `.win-card` em todas as 6 páginas de fase (`pagina1.html` – `pagina6.html`).

### Pagina 6 — Fase final: sistema de variações e redesenho visual
- **Sistema de variações**: implementação completa de `lessonVariations[]`, `applyVariationByIndex()`, `selectRandomVariationOnLessonStart()` e `selectNextVariationForDev()`, igual ao modelo da pagina5. Total de **10 variações**, cada uma com labirinto único.
- **Remoção das portas**: o sistema de portas sequenciais (`doorCtoB`, `doorBtoA`) foi completamente removido. As zonas agora são **permanentemente separadas por paredes sólidas** (colunas 7 e 14 são sempre paredes).
- **3 portais bidireccionais**: cada variação define posições independentes para os 3 portais:
  - **A→C**: entrada na Zona A (col 6), saída na Zona C (col 8)
  - **C→B**: entrada na Zona C (col 13), saída na Zona B (col 15)
  - **B→A**: entrada na Zona B, saída na Zona A (posições variáveis por variação)
- `moveBot()` atualizado para detectar e ativar os 3 portais com mensagem específica para cada um.
- Corrigido bug de `ReferenceError` de `devVariationBtn` que existia na versão anterior.
- Adicionados botões DEV (`devVariationBtn`, `devVariationInfo`) ao `pagina6.html`.
- **Portal visual redesenhado**: formato circular (`border-radius: 50%`), gradiente profundo, animação de pulso de brilho (`@keyframes portalGlow`) e anel interno giratório (`@keyframes portalSpin`). Portal de saída em esmeralda com animação invertida.
- **Blocos redesenhados**: `box-shadow` em 3 camadas (shine interno, sombra inferior, sombra externa) e sobreposição de brilho via `::before`.
- **Bases redesenhadas**: borda tracejada com `box-shadow` colorido e fundo translúcido via `color-mix`.



- Recriação da página `pagina6.html` como fase final do jogo.
- Novo desafio final baseado em troca de blocos: `A -> C`, `C -> B` e `B -> A`, mantendo a conclusão apenas com os 3 objetivos completos.
- Redesenho da fase final para 3 zonas separadas (`Zona A`, `Zona C` e `Zona B`), com labirintos distintos por zona.
- Implementação de passagem especial `A -> C` com teleporte do jogador para a zona central, sem alterar os objetivos de entrega.
- Implementação de cadeia de portas na fase final:
	- Porta `C -> B` abre somente após a entrega `A -> C`.
	- Porta `B -> A` abre somente após a entrega `C -> B`.
- Aumento da complexidade do labirinto final (mais linhas, corredores mais estreitos, isolamento de blocos/bases e menos espaço livre).
- Atualização do card da fase 6 na home para refletir o novo tema de labirinto final.
- Ajuste da navegação da `pagina5.html` para encaminhar corretamente para `pagina6.html` após vitória.
- Correção de travamento de movimentação na fase 5 após abertura de porta, evitando perda por consumo indevido de comandos.
- Ampliação dos estilos em `app.css` para suportar elementos da fase final (objetivos, blocos/bases especiais e portal).