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

## Atualizações recentes (22/04/2026)

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