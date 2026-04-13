(function () {
  const path = window.location.pathname.toLowerCase();

	// Nota: Escapa caracteres especiais para exibir texto com seguranca no HTML.
	function escapeHtml(text) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	// Nota: Configura o comportamento inicial desta parte da interface.
	function setupPromptEditor(textarea, validateLine) {
		if (!textarea || typeof validateLine !== 'function') {
			return;
		}

		const wrapper = document.createElement('div');
		wrapper.className = 'prompt-editor';

		const gutter = document.createElement('div');
		gutter.className = 'prompt-editor-gutter';

		const preview = document.createElement('pre');
		preview.className = 'prompt-editor-preview';

		const parent = textarea.parentNode;
		if (!parent) {
			return;
		}

		parent.insertBefore(wrapper, textarea);
		wrapper.appendChild(gutter);
		wrapper.appendChild(preview);
		wrapper.appendChild(textarea);
		textarea.classList.add('prompt-editor-input');

		// Nota: Renderiza ou atualiza elementos visuais na tela com base no estado atual.
		function render() {
			const lines = textarea.value.split('\n');
			if (lines.length === 0) {
				lines.push('');
			}

			gutter.innerHTML = lines.map((_, index) => '<span>' + (index + 1) + '</span>').join('');

			preview.innerHTML = lines.map(rawLine => {
				if (!rawLine.trim()) {
					return '<span class="line-empty"> </span>';
				}

				const isValid = Boolean(validateLine(rawLine));
				const cls = isValid ? 'line-valid' : 'line-invalid';
				return '<span class="' + cls + '">' + escapeHtml(rawLine) + '</span>';
			}).join('\n');
		}

		// Nota: Implementa uma parte especifica da logica desta licao.
		function syncScroll() {
			gutter.scrollTop = textarea.scrollTop;
			preview.scrollTop = textarea.scrollTop;
		}

		textarea.addEventListener('input', render);
		textarea.addEventListener('scroll', syncScroll);
		render();
		syncScroll();
	}

  // Route: home
	if (path === '/' || path.endsWith('/index.html')) {
    (function () {
    // ===== LESSONS DATA =====
    const lessons = [
      {
        id: 1,
        title: 'IntroduÃ§Ã£o ao CSS',
        description: 'Aprenda os conceitos bÃ¡sicos de CSS e como estilizar elementos HTML',
        difficulty: 'easy',
        completed: false,
        progress: 0,
        current: true
      },
      {
        id: 2,
        title: 'Seletores CSS',
        description: 'Domine os diferentes tipos de seletores CSS para estilizar elementos com precisÃ£o',
        difficulty: 'easy',
        completed: false,
        progress: 0,
        locked: true
      },
      {
        id: 3,
        title: 'Modelos de Box e EspaÃ§amentos',
        description: 'Understand margin, padding, border e como eles afetam o layout',
        difficulty: 'easy',
        completed: false,
        progress: 0,
        locked: true
      },
      {
        id: 4,
        title: 'Flexbox - O Poder do Layout FlexÃ­vel',
        description: 'Domine Flexbox e crie layouts responsivos e modernos com facilidade',
        difficulty: 'medium',
        completed: false,
        progress: 0,
        locked: true
      },
      {
        id: 5,
        title: 'Grid CSS - Layouts AvanÃ§ados',
        description: 'Aprenda a usar CSS Grid para criar layouts complexos e poderosos',
        difficulty: 'medium',
        completed: false,
        progress: 0,
        locked: true
      },
      {
        id: 6,
        title: 'AnimaÃ§Ãµes e TransiÃ§Ãµes',
        description: 'Crie animaÃ§Ãµes suaves e transiÃ§Ãµes impressionantes com CSS',
        difficulty: 'hard',
        completed: false,
        progress: 0,
        locked: true
      },
      {
        id: 7,
        title: 'TransformaÃ§Ãµes 3D',
        description: 'Crie efeitos 3D impressionantes usando CSS Transforms',
        difficulty: 'hard',
        completed: false,
        progress: 0,
        locked: true
      },
      {
        id: 8,
        title: 'Projeto Final - Website Completo',
        description: 'Combine todos os conhecimentos e crie um website responsivo completo',
        difficulty: 'expert',
        completed: false,
        progress: 0,
        locked: true
      }
    ];

    // ===== GAME STATE =====
    const gameState = {
      currentLesson: 1,
      completedLessons: 0,
      totalLessons: 8,
      timeInvested: '0m',
      progressPercentage: 0,
      achievements: 0,
      streak: 0
    };

    // ===== DOM ELEMENTS =====
    const menuBtn = document.getElementById('menuBtn');

    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', () => {
      initializeUI();
      setupEventListeners();
      updateProgress();
    });

    // ===== INITIALIZE UI =====
    // Nota: Inicializa elementos e estados necessarios antes da interacao do usuario.
    function initializeUI() {
      updateProgress();
      setupLessonCards();
      logWelcomeMessage();
    }

    // ===== SETUP EVENT LISTENERS =====
    // Nota: Configura o comportamento inicial desta parte da interface.
    function setupEventListeners() {
      // Lesson card clicks
      document.querySelectorAll('.lesson-card').forEach((card, index) => {
        card.addEventListener('click', () => handleLessonClick(index + 1));
      });
      
      // Start lesson button
      const startLessonBtns = document.querySelectorAll('.btn-lesson-start');
      startLessonBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleStartLesson();
        });
      });
      
      // Menu button
      menuBtn.addEventListener('click', toggleMenu);
    }

    // ===== UPDATE PROGRESS =====
    // Nota: Implementa uma parte especifica da logica desta licao.
    function updateProgress() {
      // Progress tracking removido - stats bar desativada
    }

    // ===== SETUP LESSON CARDS ANIMATIONS =====
    // Nota: Configura o comportamento inicial desta parte da interface.
    function setupLessonCards() {
      const cards = document.querySelectorAll('.timeline-item');
      cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
      });
    }

    // ===== HANDLE LESSON CLICK =====
    // Nota: Trata uma acao do usuario e aplica a regra correspondente.
    function handleLessonClick(lessonId) {
      const lesson = lessons[lessonId - 1];
      
      if (lesson.locked) {
        showNotification(
          `ðŸ”’ Complete a LiÃ§Ã£o ${lessonId - 1} primeiro!`,
          'warning'
        );
        return;
      }
      
      if (lesson.completed) {
        showNotification(
          `âœ“ VocÃª jÃ¡ completou "${lesson.title}"!`,
          'info'
        );
      } else if (lesson.current) {
        showNotification(
          `â–¶ï¸ Clique em "Continuar LiÃ§Ã£o" para prosseguir!`,
          'info'
        );
      }
    }

    // ===== HANDLE START LESSON =====
    // Nota: Trata uma acao do usuario e aplica a regra correspondente.
    function handleStartLesson() {
      const currentLesson = lessons.find(l => l.current);
      
      if (!currentLesson) {
        showNotification('Nenhuma liÃ§Ã£o ativa encontrada!', 'warning');
        return;
      }
      
      showNotification(
        `ðŸš€ Iniciando "${currentLesson.title}"...`,
        'success'
      );
      
      // Simulate loading lesson page
      setTimeout(() => {
        // Aqui vocÃª pode redirecionar para a pÃ¡gina da liÃ§Ã£o
        console.log(`Carregando liÃ§Ã£o: ${currentLesson.title}`);
        // window.location.href = `lesson-${currentLesson.id}.html`;
      }, 800);
    }

    // ===== HANDLE LESSON COMPLETION =====
    // Nota: Implementa uma parte especifica da logica desta licao.
    function completeLesson(lessonId) {
      const lesson = lessons[lessonId - 1];
      
      if (!lesson.completed) {
        lesson.completed = true;
        lesson.progress = 100;
        
        // Unlock next lesson
        if (lessonId < lessons.length) {
          lessons[lessonId].locked = false;
        }
        
        gameState.completedLessons++;
        gameState.streak++;
        updateProgress();
        
        showNotification(
          `ðŸŽ‰ ParabÃ©ns! VocÃª completou "${lesson.title}"!`,
          'success'
        );
      }
    }

    // ===== NOTIFICATIONS =====
    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${getNotificationColor(type)};
        color: ${type === 'info' || type === 'warning' ? '#000' : '#fff'};
        border-radius: 8px;
        font-weight: bold;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // Nota: Retorna um valor de apoio para uso na logica da fase.
    function getNotificationColor(type) {
      const colors = {
        success: '#00ff41',
        danger: '#ff4757',
        warning: '#ffa502',
        info: '#00d4ff'
      };
      return colors[type] || colors.info;
    }

    // ===== MENU =====
    // Nota: Alterna um estado visual ou de interacao da interface.
    function toggleMenu() {
      showNotification('ðŸ“‹ Menu de OpÃ§Ãµes (Em Desenvolvimento)', 'info');
    }

    // ===== ADD CUSTOM ANIMATIONS =====
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100px);
        }
      }

      .timeline-item {
        animation: fadeInUp 0.6s ease-out forwards;
        opacity: 0;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);

    // ===== WELCOME MESSAGE =====
    // Nota: Implementa uma parte especifica da logica desta licao.
    function logWelcomeMessage() {
      console.log('%cðŸŽ® Bem-vindo ao CSS MASTER! ðŸŽ®', 'font-size: 20px; color: #0066cc; font-weight: bold;');
      console.log('%cAprenda CSS de forma divertida e interativa!', 'font-size: 14px; color: #7209b7; font-weight: bold;');
      console.log('%cProgressÃ£o: 0 de 8 liÃ§Ãµes completadas (0%)', 'font-size: 12px; color: #00b366;');
      console.log('%cComece pela LiÃ§Ã£o 1: IntroduÃ§Ã£o ao CSS', 'font-size: 12px; color: #ff9900;');
    }

    })();
    return;
  }

  // Route: pagina1
	if (path.endsWith('/pages/pagina1.html')) {
    (function () {
    const CELL = 52;
    const COLS = 10;
    const ROWS = 7;

    const board = document.getElementById('board');
    const arenaGrid = document.getElementById('arenaGrid');
    const botCell = document.getElementById('botCell');
    const goalCell = document.getElementById('goalCell');
    const cmdInput = document.getElementById('cmdInput');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const docsBtn = document.getElementById('docsBtn');
    const statusEl = document.getElementById('status');
    const errorPanel = document.getElementById('errorPanel');
    const errorPanelMsg = document.getElementById('errorPanelMsg');
    const errorPanelClose = document.getElementById('errorPanelClose');
    const docsPanel = document.getElementById('docsPanel');
    const docsPanelClose = document.getElementById('docsPanelClose');
    const winPanel = document.getElementById('winPanel');
    const winSummary = document.getElementById('winSummary');
    const starRating = document.getElementById('starRating');
    const failPanel = document.getElementById('failPanel');
    const failPanelOk = document.getElementById('failPanelOk');

    const start = {
    	col: 0,
    	row: Math.floor(ROWS / 2)
    };

    const goal = {
    	col: COLS - 1,
    	row: Math.floor(ROWS / 2)
    };

    let state = {
    	col: start.col,
    	row: start.row
    };

    const minimumStepsToGoal = Math.abs(goal.col - start.col) + Math.abs(goal.row - start.row);

    // Nota: Monta a estrutura visual necessaria para a fase.
    function buildGrid() {
    	board.style.setProperty('--cell-size', CELL + 'px');
    	board.style.setProperty('--cols', COLS);
    	board.style.setProperty('--rows', ROWS);

    	const fragment = document.createDocumentFragment();
    	for (let i = 0; i < COLS * ROWS; i += 1) {
    		const cell = document.createElement('div');
    		cell.className = 'grid-cell';
    		fragment.appendChild(cell);
    	}
    	arenaGrid.appendChild(fragment);
    }

    // Nota: Posiciona um elemento na grade usando coluna e linha.
    function setEntityPosition(el, col, row) {
    	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
    }

    // Nota: Limita coordenadas para permanecer dentro dos limites do tabuleiro.
    function clampToBoard(col, row) {
    	return {
    		col: Math.max(0, Math.min(COLS - 1, col)),
    		row: Math.max(0, Math.min(ROWS - 1, row))
    	};
    }

    // Nota: Desenha o estado atual dos elementos no tabuleiro.
    function draw() {
    	setEntityPosition(botCell, state.col, state.row);
    	setEntityPosition(goalCell, goal.col, goal.row);
    }

    // Nota: Padroniza o texto do comando para facilitar a validacao.
    function normalizeCommand(raw) {
    	return raw.replace(/\s+/g, '').toLowerCase();
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseMovementCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);
    	const match = cmd.match(/^(moverdireita|moveresquerda|movercima|moverbaixo)(?:\((\d+)\))?$/);

    	if (!match) {
    		return null;
    	}

    	const action = match[1];
    	const amount = match[2] ? Number(match[2]) : 1;

    	if (!Number.isInteger(amount) || amount < 1) {
    		return null;
    	}

    	return {
    		action,
    		amount
    	};
    }

		setupPromptEditor(cmdInput, line => Boolean(parseMovementCommand(line)));

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideErrorPanel() {
    	errorPanel.classList.add('hidden');
    	errorPanelMsg.textContent = '';
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showErrorPanel(command) {
    	errorPanelMsg.textContent = 'A funcao "' + command + '" esta errada. Corrija o texto e tente novamente.';
    	errorPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideDocsPanel() {
    	docsPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showDocsPanel() {
    	docsPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideWinPanel() {
    	winPanel.classList.add('hidden');
    	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideFailPanel() {
    	failPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showFailPanel() {
    	failPanel.classList.remove('hidden');
    }

    // Nota: Calcula metricas de apoio, como passos minimos, estrelas ou distancias.
    function calculateStars(executedSteps) {
    	if (executedSteps <= minimumStepsToGoal) {
    		return 3;
    	}

    	if (executedSteps <= minimumStepsToGoal + 3) {
    		return 2;
    	}

    	return 1;
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps) {
    	const stars = calculateStars(executedSteps);
    	winSummary.textContent = 'Voce concluiu em ' + executedSteps + ' passos e recebeu ' + stars + (stars === 1 ? ' estrela.' : ' estrelas.');
    	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
    	starRating.classList.add('stars-' + stars);
    	winPanel.classList.remove('hidden');
    }

    // Nota: Cria um atraso assicrono para animar a execucao passo a passo.
    function wait(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Nota: Executa os comandos do prompt, aplicando regras e verificando vitoria ou falha.
    async function executeCommands() {
    	hideErrorPanel();
    	hideWinPanel();
    	hideFailPanel();

    	const lines = cmdInput.value
    		.split('\n')
    		.map(line => line.trim())
    		.filter(Boolean);

    	if (!lines.length) {
    		statusEl.className = 'status err';
    		statusEl.textContent = 'Digite ao menos um comando.';
    		return;
    	}

    	runBtn.disabled = true;
    	resetBtn.disabled = true;
    	statusEl.className = 'status';
    	statusEl.textContent = 'Executando passo a passo...';
    	let executedSteps = 0;

    	const invalidLine = lines.find(line => {
    		return !parseMovementCommand(line);
    	});

    	if (invalidLine) {
    		runBtn.disabled = false;
    		resetBtn.disabled = false;
    		statusEl.className = 'status err';
    		statusEl.textContent = 'Execucao cancelada: ha funcao invalida no prompt.';
    		showErrorPanel(invalidLine);
    		return;
    	}

    	for (const line of lines) {
    		const parsed = parseMovementCommand(line);

    		for (let step = 0; step < parsed.amount; step += 1) {
    			if (state.col === goal.col && state.row === goal.row) {
    				break;
    			}

    			let nextCol = state.col;
    			let nextRow = state.row;

    			if (parsed.action === 'moverdireita') {
    				nextCol += 1;
    			} else if (parsed.action === 'moveresquerda') {
    				nextCol -= 1;
    			} else if (parsed.action === 'movercima') {
    				nextRow -= 1;
    			} else if (parsed.action === 'moverbaixo') {
    				nextRow += 1;
    			}

    			const bounded = clampToBoard(nextCol, nextRow);
    			state.col = bounded.col;
    			state.row = bounded.row;
    			executedSteps += 1;
    			draw();
    			await wait(260);

    			if (state.col === goal.col && state.row === goal.row) {
    				break;
    			}
    		}

    		if (state.col === goal.col && state.row === goal.row) {
    			break;
    		}
    	}

    	runBtn.disabled = false;
    	resetBtn.disabled = false;

    	if (state.col === goal.col && state.row === goal.row) {
    		statusEl.className = 'status ok';
    		statusEl.textContent = 'Excelente! Voce chegou ao bloco objetivo.';
    		showWinPanel(executedSteps);
    		return;
    	}

    	state = { col: start.col, row: start.row };
    	draw();
    	statusEl.className = 'status err';
    	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetBot() {
    	hideErrorPanel();
    	hideDocsPanel();
    	hideWinPanel();
    	hideFailPanel();
    	state = { col: start.col, row: start.row };
    	draw();
    	statusEl.className = 'status';
    	statusEl.textContent = 'Posicao resetada.';
    }

    runBtn.addEventListener('click', executeCommands);
    resetBtn.addEventListener('click', resetBot);
    docsBtn.addEventListener('click', showDocsPanel);
    errorPanelClose.addEventListener('click', hideErrorPanel);
    docsPanelClose.addEventListener('click', hideDocsPanel);
    failPanelOk.addEventListener('click', hideFailPanel);

    buildGrid();
    resetBot();

    })();
    return;
  }

  // Route: pagina2
	if (path.endsWith('/pages/pagina2.html')) {
    (function () {
    const CELL = 52;
    const COLS = 11;
    const ROWS = 9;

    const board = document.getElementById('board');
    const arenaGrid = document.getElementById('arenaGrid');
    const chipsLayer = document.getElementById('chipsLayer');
    const botCell = document.getElementById('botCell');
    const cmdInput = document.getElementById('cmdInput');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const docsBtn = document.getElementById('docsBtn');
    const statusEl = document.getElementById('status');
    const chipCounter = document.getElementById('chipCounter');
    const errorPanel = document.getElementById('errorPanel');
    const errorPanelMsg = document.getElementById('errorPanelMsg');
    const errorPanelClose = document.getElementById('errorPanelClose');
    const docsPanel = document.getElementById('docsPanel');
    const docsPanelClose = document.getElementById('docsPanelClose');
    const winPanel = document.getElementById('winPanel');
    const winSummary = document.getElementById('winSummary');
    const failPanel = document.getElementById('failPanel');
    const failPanelOk = document.getElementById('failPanelOk');

    const start = {
    	col: Math.floor(COLS / 2),
    	row: Math.floor(ROWS / 2)
    };

    const chips = [
    	{ id: 0, col: start.col - 1, row: start.row - 1 },
    	{ id: 1, col: start.col + 1, row: start.row - 1 },
    	{ id: 2, col: start.col - 1, row: start.row + 1 },
    	{ id: 3, col: start.col + 1, row: start.row + 1 }
    ];

    let state = {
    	col: start.col,
    	row: start.row,
    	collected: new Set()
    };

    const chipElements = new Map();

    // Nota: Monta a estrutura visual necessaria para a fase.
    function buildGrid() {
    	board.style.setProperty('--cell-size', CELL + 'px');
    	board.style.setProperty('--cols', COLS);
    	board.style.setProperty('--rows', ROWS);

    	const fragment = document.createDocumentFragment();
    	for (let i = 0; i < COLS * ROWS; i += 1) {
    		const cell = document.createElement('div');
    		cell.className = 'grid-cell';
    		fragment.appendChild(cell);
    	}
    	arenaGrid.appendChild(fragment);
    }

    // Nota: Posiciona um elemento na grade usando coluna e linha.
    function setEntityPosition(el, col, row) {
    	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
    }

    // Nota: Limita coordenadas para permanecer dentro dos limites do tabuleiro.
    function clampToBoard(col, row) {
    	return {
    		col: Math.max(0, Math.min(COLS - 1, col)),
    		row: Math.max(0, Math.min(ROWS - 1, row))
    	};
    }

    // Nota: Padroniza o texto do comando para facilitar a validacao.
    function normalizeCommand(raw) {
    	return raw.replace(/\s+/g, '').toLowerCase();
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseMovementCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);
    	const match = cmd.match(/^(moverdireita|moveresquerda|movercima|moverbaixo)(?:\((\d+)\))?$/);

    	if (!match) {
    		return null;
    	}

    	const action = match[1];
    	const amount = match[2] ? Number(match[2]) : 1;

    	if (!Number.isInteger(amount) || amount < 1) {
    		return null;
    	}

    	return {
    		action,
    		amount
    	};
    }

		setupPromptEditor(cmdInput, line => Boolean(parseMovementCommand(line)));

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideErrorPanel() {
    	errorPanel.classList.add('hidden');
    	errorPanelMsg.textContent = '';
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showErrorPanel(command) {
    	errorPanelMsg.textContent = 'A funcao "' + command + '" esta errada. Corrija o texto e tente novamente.';
    	errorPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideDocsPanel() {
    	docsPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showDocsPanel() {
    	docsPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideWinPanel() {
    	winPanel.classList.add('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideFailPanel() {
    	failPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showFailPanel() {
    	failPanel.classList.remove('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps) {
    	winSummary.textContent = 'Voce coletou os 4 chips em ' + executedSteps + ' passos.';
    	winPanel.classList.remove('hidden');
    }

    // Nota: Cria um atraso assicrono para animar a execucao passo a passo.
    function wait(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Nota: Cria dados, objetos ou elementos auxiliares para a dinamica da fase.
    function createChips() {
    	chipsLayer.innerHTML = '';
    	chipElements.clear();

    	for (const chip of chips) {
    		const chipCell = document.createElement('div');
    		chipCell.className = 'chip-cell';
    		chipCell.dataset.chipId = String(chip.id);

    		const chipVisual = document.createElement('div');
    		chipVisual.className = 'chip';
    		chipCell.appendChild(chipVisual);

    		setEntityPosition(chipCell, chip.col, chip.row);
    		chipsLayer.appendChild(chipCell);
    		chipElements.set(chip.id, chipCell);
    	}
    }

    // Nota: Implementa uma parte especifica da logica desta licao.
    function updateChipCounter() {
    	const collectedCount = state.collected.size;
    	chipCounter.textContent = 'Chips coletados: ' + collectedCount + '/' + chips.length;
    	chipCounter.classList.toggle('done', collectedCount === chips.length);
    }

    // Nota: Coleta itens quando o jogador passa na posicao correta.
    function collectChipAtCurrentPosition() {
    	for (const chip of chips) {
    		if (chip.col === state.col && chip.row === state.row && !state.collected.has(chip.id)) {
    			state.collected.add(chip.id);
    			const chipEl = chipElements.get(chip.id);
    			if (chipEl) {
    				chipEl.classList.add('collected');
    			}
    			updateChipCounter();
    			break;
    		}
    	}
    }

    // Nota: Desenha o estado atual dos elementos no tabuleiro.
    function draw() {
    	setEntityPosition(botCell, state.col, state.row);
    }

    // Nota: Executa os comandos do prompt, aplicando regras e verificando vitoria ou falha.
    async function executeCommands() {
    	hideErrorPanel();
    	hideWinPanel();
    	hideFailPanel();

    	const lines = cmdInput.value
    		.split('\n')
    		.map(line => line.trim())
    		.filter(Boolean);

    	if (!lines.length) {
    		statusEl.className = 'status err';
    		statusEl.textContent = 'Digite ao menos um comando.';
    		return;
    	}

    	runBtn.disabled = true;
    	resetBtn.disabled = true;
    	statusEl.className = 'status';
    	statusEl.textContent = 'Executando passo a passo...';
    	let executedSteps = 0;

    	const invalidLine = lines.find(line => {
    		return !parseMovementCommand(line);
    	});

    	if (invalidLine) {
    		runBtn.disabled = false;
    		resetBtn.disabled = false;
    		statusEl.className = 'status err';
    		statusEl.textContent = 'Execucao cancelada: ha funcao invalida no prompt.';
    		showErrorPanel(invalidLine);
    		return;
    	}

    	for (const line of lines) {
    		const parsed = parseMovementCommand(line);

    		for (let step = 0; step < parsed.amount; step += 1) {
    			if (state.collected.size === chips.length) {
    				break;
    			}

    			let nextCol = state.col;
    			let nextRow = state.row;

    			if (parsed.action === 'moverdireita') {
    				nextCol += 1;
    			} else if (parsed.action === 'moveresquerda') {
    				nextCol -= 1;
    			} else if (parsed.action === 'movercima') {
    				nextRow -= 1;
    			} else if (parsed.action === 'moverbaixo') {
    				nextRow += 1;
    			}

    			const bounded = clampToBoard(nextCol, nextRow);
    			state.col = bounded.col;
    			state.row = bounded.row;
    			executedSteps += 1;
    			draw();
    			collectChipAtCurrentPosition();
    			await wait(240);

    			if (state.collected.size === chips.length) {
    				break;
    			}
    		}

    		if (state.collected.size === chips.length) {
    			break;
    		}
    	}

    	runBtn.disabled = false;
    	resetBtn.disabled = false;

    	if (state.collected.size === chips.length) {
    		statusEl.className = 'status ok';
    		statusEl.textContent = 'Perfeito! Voce coletou todos os chips.';
    		showWinPanel(executedSteps);
    		return;
    	}

    	state = {
    		col: start.col,
    		row: start.row,
    		collected: new Set()
    	};
    	createChips();
    	draw();
    	collectChipAtCurrentPosition();
    	updateChipCounter();
    	statusEl.className = 'status err';
    	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson() {
    	hideErrorPanel();
    	hideDocsPanel();
    	hideWinPanel();
    	hideFailPanel();
    	state = {
    		col: start.col,
    		row: start.row,
    		collected: new Set()
    	};
    	createChips();
    	draw();
    	collectChipAtCurrentPosition();
    	updateChipCounter();
    	statusEl.className = 'status';
    	statusEl.textContent = 'Posicao resetada. Boneco no centro.';
    }

    runBtn.addEventListener('click', executeCommands);
    resetBtn.addEventListener('click', resetLesson);
    docsBtn.addEventListener('click', showDocsPanel);
    errorPanelClose.addEventListener('click', hideErrorPanel);
    docsPanelClose.addEventListener('click', hideDocsPanel);
    failPanelOk.addEventListener('click', hideFailPanel);

    buildGrid();
    resetLesson();
    })();
    return;
  }

  // Route: pagina3
	if (path.endsWith('/pages/pagina3.html')) {
    (function () {
    const CELL = 52;
    const COLS = 10;
    const ROWS = 7;

    const tutorialPanel = document.getElementById('tutorialPanel');
    const practicePanel = document.getElementById('practicePanel');
    const startPracticeBtn = document.getElementById('startPracticeBtn');

    const board = document.getElementById('board');
    const arenaGrid = document.getElementById('arenaGrid');
    const botCell = document.getElementById('botCell');
    const goalCell = document.getElementById('goalCell');
    const cmdInput = document.getElementById('cmdInput');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statusEl = document.getElementById('status');
    const errorPanel = document.getElementById('errorPanel');
    const errorPanelMsg = document.getElementById('errorPanelMsg');
    const errorPanelClose = document.getElementById('errorPanelClose');
    const winPanel = document.getElementById('winPanel');
    const winSummary = document.getElementById('winSummary');
    const failPanel = document.getElementById('failPanel');
    const failPanelOk = document.getElementById('failPanelOk');

    const start = {
    	col: 0,
    	row: Math.floor(ROWS / 2)
    };

    const goal = {
    	col: COLS - 1,
    	row: Math.floor(ROWS / 2)
    };

    let state = {
    	col: start.col,
    	row: start.row
    };

    // Nota: Monta a estrutura visual necessaria para a fase.
    function buildGrid() {
    	board.style.setProperty('--cell-size', CELL + 'px');
    	board.style.setProperty('--cols', COLS);
    	board.style.setProperty('--rows', ROWS);

    	const fragment = document.createDocumentFragment();
    	for (let i = 0; i < COLS * ROWS; i += 1) {
    		const cell = document.createElement('div');
    		cell.className = 'grid-cell';
    		fragment.appendChild(cell);
    	}
    	arenaGrid.appendChild(fragment);
    }

    // Nota: Posiciona um elemento na grade usando coluna e linha.
    function setEntityPosition(el, col, row) {
    	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
    }

    // Nota: Limita coordenadas para permanecer dentro dos limites do tabuleiro.
    function clampToBoard(col, row) {
    	return {
    		col: Math.max(0, Math.min(COLS - 1, col)),
    		row: Math.max(0, Math.min(ROWS - 1, row))
    	};
    }

    // Nota: Desenha o estado atual dos elementos no tabuleiro.
    function draw() {
    	setEntityPosition(botCell, state.col, state.row);
    	setEntityPosition(goalCell, goal.col, goal.row);
    }

    // Nota: Padroniza o texto do comando para facilitar a validacao.
    function normalizeCommand(raw) {
    	return raw.replace(/\s+/g, '').toLowerCase();
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseMovementCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);
    	const match = cmd.match(/^(moverdireita|moveresquerda|movercima|moverbaixo)(?:\((\d+)\))?$/);

    	if (!match) {
    		return null;
    	}

    	const action = match[1];
    	const amount = match[2] ? Number(match[2]) : 1;
    	const hasParameter = Boolean(match[2]);

    	if (!Number.isInteger(amount) || amount < 1) {
    		return null;
    	}

    	return {
    		action,
    		amount,
    		hasParameter
    	};
    }

		setupPromptEditor(cmdInput, line => Boolean(parseMovementCommand(line)));

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideErrorPanel() {
    	errorPanel.classList.add('hidden');
    	errorPanelMsg.textContent = '';
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showErrorPanel(command) {
    	errorPanelMsg.textContent = 'Comando invalido: "' + command + '". Revise o texto e tente novamente.';
    	errorPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideWinPanel() {
    	winPanel.classList.add('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideFailPanel() {
    	failPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showFailPanel() {
    	failPanel.classList.remove('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps) {
    	winSummary.textContent = 'Voce concluiu em ' + executedSteps + ' passos usando parametros.';
    	winPanel.classList.remove('hidden');
    }

    // Nota: Cria um atraso assicrono para animar a execucao passo a passo.
    function wait(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Nota: Executa os comandos do prompt, aplicando regras e verificando vitoria ou falha.
    async function executeCommands() {
    	hideErrorPanel();
    	hideWinPanel();
    	hideFailPanel();

    	const lines = cmdInput.value
    		.split('\n')
    		.map(line => line.trim())
    		.filter(Boolean);

    	if (!lines.length) {
    		statusEl.className = 'status err';
    		statusEl.textContent = 'Digite ao menos um comando.';
    		return;
    	}

    	runBtn.disabled = true;
    	resetBtn.disabled = true;
    	statusEl.className = 'status';
    	statusEl.textContent = 'Executando passo a passo...';
    	let executedSteps = 0;
    	let usedParameter = false;

    	const parsedLines = [];
    	for (const line of lines) {
    		const parsed = parseMovementCommand(line);
    		if (!parsed) {
    			runBtn.disabled = false;
    			resetBtn.disabled = false;
    			statusEl.className = 'status err';
    			statusEl.textContent = 'Execucao cancelada: ha comando invalido no prompt.';
    			showErrorPanel(line);
    			return;
    		}
    		parsedLines.push(parsed);
    		if (parsed.hasParameter) {
    			usedParameter = true;
    		}
    	}

    	for (const parsed of parsedLines) {
    		for (let step = 0; step < parsed.amount; step += 1) {
    			if (state.col === goal.col && state.row === goal.row) {
    				break;
    			}

    			let nextCol = state.col;
    			let nextRow = state.row;

    			if (parsed.action === 'moverdireita') {
    				nextCol += 1;
    			} else if (parsed.action === 'moveresquerda') {
    				nextCol -= 1;
    			} else if (parsed.action === 'movercima') {
    				nextRow -= 1;
    			} else if (parsed.action === 'moverbaixo') {
    				nextRow += 1;
    			}

    			const bounded = clampToBoard(nextCol, nextRow);
    			state.col = bounded.col;
    			state.row = bounded.row;
    			executedSteps += 1;
    			draw();
    			await wait(250);

    			if (state.col === goal.col && state.row === goal.row) {
    				break;
    			}
    		}

    		if (state.col === goal.col && state.row === goal.row) {
    			break;
    		}
    	}

    	runBtn.disabled = false;
    	resetBtn.disabled = false;

    	if (state.col === goal.col && state.row === goal.row) {
    		if (!usedParameter) {
    			state = { col: start.col, row: start.row };
    			draw();
    			statusEl.className = 'status err';
    			statusEl.textContent = 'Falha: voce chegou ao alvo sem usar parametro. A fase foi resetada.';
    			showFailPanel();
    			return;
    		}

    		statusEl.className = 'status ok';
    		statusEl.textContent = 'Excelente! Voce usou parametros e concluiu a pratica.';
    		showWinPanel(executedSteps);
    		return;
    	}

    	state = { col: start.col, row: start.row };
    	draw();
    	statusEl.className = 'status err';
    	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson() {
    	hideErrorPanel();
    	hideWinPanel();
    	hideFailPanel();
    	state = { col: start.col, row: start.row };
    	draw();
    	statusEl.className = 'status';
    	statusEl.textContent = 'Posicao resetada.';
    }

    // Nota: Troca do tutorial para a area pratica da licao.
    function startPractice() {
    	tutorialPanel.classList.add('hidden');
    	practicePanel.classList.remove('hidden');
    	resetLesson();
    }

    startPracticeBtn.addEventListener('click', startPractice);
    runBtn.addEventListener('click', executeCommands);
    resetBtn.addEventListener('click', resetLesson);
    errorPanelClose.addEventListener('click', hideErrorPanel);
    failPanelOk.addEventListener('click', hideFailPanel);

    buildGrid();
    draw();
    })();
    return;
  }

  // Route: pagina4
	if (path.endsWith('/pages/pagina4.html')) {
    (function () {
    const CELL = 44;
    const COLS = 13;
    const ROWS = 11;

    const board = document.getElementById('board');
    const arenaGrid = document.getElementById('arenaGrid');
    const botCell = document.getElementById('botCell');
    const goalCell = document.getElementById('goalCell');
    const cmdInput = document.getElementById('cmdInput');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const docsBtn = document.getElementById('docsBtn');
    const statusEl = document.getElementById('status');
    const errorPanel = document.getElementById('errorPanel');
    const errorPanelMsg = document.getElementById('errorPanelMsg');
    const errorPanelClose = document.getElementById('errorPanelClose');
    const docsPanel = document.getElementById('docsPanel');
    const docsPanelClose = document.getElementById('docsPanelClose');
    const winPanel = document.getElementById('winPanel');
    const winSummary = document.getElementById('winSummary');
    const starRating = document.getElementById('starRating');
    const failPanel = document.getElementById('failPanel');
    const failPanelOk = document.getElementById('failPanelOk');

    const maze = createComplexMaze();

    const start = findSpecialCell('S');
    const goal = findSpecialCell('G');

    let state = {
    	col: start.col,
    	row: start.row
    };

    const minimumStepsToGoal = calculateMinimumSteps();

    // Nota: Cria dados, objetos ou elementos auxiliares para a dinamica da fase.
    function createSeededRandom(seed) {
    	let current = seed >>> 0;

    	return function random() {
    		current = (current * 1664525 + 1013904223) >>> 0;
    		return current / 4294967296;
    	};
    }

    // Nota: Cria dados, objetos ou elementos auxiliares para a dinamica da fase.
    function createComplexMaze() {
    	const grid = [];
    	for (let row = 0; row < ROWS; row += 1) {
    		const line = [];
    		for (let col = 0; col < COLS; col += 1) {
    			line.push('#');
    		}
    		grid.push(line);
    	}

    	const random = createSeededRandom(4027);
    	const stack = [{ col: 1, row: ROWS - 2 }];
    	grid[ROWS - 2][1] = '.';

    	while (stack.length) {
    		const current = stack[stack.length - 1];
    		const directions = [
    			{ dc: 0, dr: -2 },
    			{ dc: 2, dr: 0 },
    			{ dc: 0, dr: 2 },
    			{ dc: -2, dr: 0 }
    		];

    		for (let i = directions.length - 1; i > 0; i -= 1) {
    			const j = Math.floor(random() * (i + 1));
    			const tmp = directions[i];
    			directions[i] = directions[j];
    			directions[j] = tmp;
    		}

    		let carved = false;

    		for (const dir of directions) {
    			const nextCol = current.col + dir.dc;
    			const nextRow = current.row + dir.dr;

    			if (nextCol <= 0 || nextCol >= COLS - 1 || nextRow <= 0 || nextRow >= ROWS - 1) {
    				continue;
    			}

    			if (grid[nextRow][nextCol] !== '#') {
    				continue;
    			}

    			grid[current.row + dir.dr / 2][current.col + dir.dc / 2] = '.';
    			grid[nextRow][nextCol] = '.';
    			stack.push({ col: nextCol, row: nextRow });
    			carved = true;
    			break;
    		}

    		if (!carved) {
    			stack.pop();
    		}
    	}

    	const startCell = { col: 1, row: ROWS - 2 };
    	const goalCell = findFarthestWalkableCell(grid, startCell);

    	grid[startCell.row][startCell.col] = 'S';
    	grid[goalCell.row][goalCell.col] = 'G';

    	return grid.map(line => line.join(''));
    }

    // Nota: Localiza uma posicao ou item especifico no mapa da fase.
    function findFarthestWalkableCell(grid, startCell) {
    	const queue = [{ col: startCell.col, row: startCell.row, dist: 0 }];
    	const visited = new Set([startCell.col + ',' + startCell.row]);
    	let farthest = { col: startCell.col, row: startCell.row, dist: 0 };

    	while (queue.length) {
    		const current = queue.shift();
    		if (current.dist > farthest.dist) {
    			farthest = current;
    		}

    		const neighbors = [
    			{ col: current.col + 1, row: current.row },
    			{ col: current.col - 1, row: current.row },
    			{ col: current.col, row: current.row + 1 },
    			{ col: current.col, row: current.row - 1 }
    		];

    		for (const n of neighbors) {
    			if (n.col <= 0 || n.col >= COLS - 1 || n.row <= 0 || n.row >= ROWS - 1) {
    				continue;
    			}

    			if (grid[n.row][n.col] === '#') {
    				continue;
    			}

    			const key = n.col + ',' + n.row;
    			if (visited.has(key)) {
    				continue;
    			}

    			visited.add(key);
    			queue.push({ col: n.col, row: n.row, dist: current.dist + 1 });
    		}
    	}

    	return { col: farthest.col, row: farthest.row };
    }

    // Nota: Localiza uma posicao ou item especifico no mapa da fase.
    function findSpecialCell(marker) {
    	for (let row = 0; row < ROWS; row += 1) {
    		const col = maze[row].indexOf(marker);
    		if (col !== -1) {
    			return { col, row };
    		}
    	}

    	return { col: 1, row: 1 };
    }

    // Nota: Monta a estrutura visual necessaria para a fase.
    function buildGrid() {
    	board.style.setProperty('--cell-size', CELL + 'px');
    	board.style.setProperty('--cols', COLS);
    	board.style.setProperty('--rows', ROWS);

    	const fragment = document.createDocumentFragment();
    	for (let row = 0; row < ROWS; row += 1) {
    		for (let col = 0; col < COLS; col += 1) {
    			const cell = document.createElement('div');
    			const value = maze[row][col];
    			cell.className = 'grid-cell';
    			if (value === '#') {
    				cell.classList.add('wall');
    			}
    			if (value === 'S') {
    				cell.classList.add('start');
    			}
    			if (value === 'G') {
    				cell.classList.add('goal');
    			}
    			fragment.appendChild(cell);
    		}
    	}
    	arenaGrid.appendChild(fragment);
    }

    // Nota: Posiciona um elemento na grade usando coluna e linha.
    function setEntityPosition(el, col, row) {
    	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
    }

    // Nota: Verifica se uma condicao especifica e verdadeira para a posicao atual.
    function isWalkable(col, row) {
    	if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
    		return false;
    	}
    	return maze[row][col] !== '#';
    }

    // Nota: Desenha o estado atual dos elementos no tabuleiro.
    function draw() {
    	setEntityPosition(botCell, state.col, state.row);
    	setEntityPosition(goalCell, goal.col, goal.row);
    }

    // Nota: Padroniza o texto do comando para facilitar a validacao.
    function normalizeCommand(raw) {
    	return raw.replace(/\s+/g, '').toLowerCase();
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseMovementCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);
    	const match = cmd.match(/^(moverdireita|moveresquerda|movercima|moverbaixo)(?:\((\d+)\))?$/);

    	if (!match) {
    		return null;
    	}

    	const action = match[1];
    	const amount = match[2] ? Number(match[2]) : 1;

    	if (!Number.isInteger(amount) || amount < 1) {
    		return null;
    	}

    	return { action, amount };
    }

		setupPromptEditor(cmdInput, line => Boolean(parseMovementCommand(line)));

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideErrorPanel() {
    	errorPanel.classList.add('hidden');
    	errorPanelMsg.textContent = '';
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showErrorPanel(command) {
    	errorPanelMsg.textContent = 'Comando invalido: "' + command + '". Revise e tente novamente.';
    	errorPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideDocsPanel() {
    	docsPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showDocsPanel() {
    	docsPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideWinPanel() {
    	winPanel.classList.add('hidden');
    	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideFailPanel() {
    	failPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showFailPanel() {
    	failPanel.classList.remove('hidden');
    }

    // Nota: Calcula metricas de apoio, como passos minimos, estrelas ou distancias.
    function calculateStars(executedSteps) {
    	if (executedSteps <= minimumStepsToGoal) {
    		return 3;
    	}

    	if (executedSteps <= minimumStepsToGoal + 2) {
    		return 2;
    	}

    	return 1;
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps, blockedMoves) {
    	const stars = calculateStars(executedSteps);
    	winSummary.textContent =
    		'Voce venceu em ' +
    		executedSteps +
    		' passos, com ' +
    		blockedMoves +
    		' tentativa(s) contra parede, e ganhou ' +
    		stars +
    		(stars === 1 ? ' estrela.' : ' estrelas.');
    	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
    	starRating.classList.add('stars-' + stars);
    	winPanel.classList.remove('hidden');
    }

    // Nota: Cria um atraso assicrono para animar a execucao passo a passo.
    function wait(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Nota: Retorna um valor de apoio para uso na logica da fase.
    function getNextPosition(action) {
    	let nextCol = state.col;
    	let nextRow = state.row;

    	if (action === 'moverdireita') {
    		nextCol += 1;
    	} else if (action === 'moveresquerda') {
    		nextCol -= 1;
    	} else if (action === 'movercima') {
    		nextRow -= 1;
    	} else if (action === 'moverbaixo') {
    		nextRow += 1;
    	}

    	return { col: nextCol, row: nextRow };
    }

    // Nota: Calcula metricas de apoio, como passos minimos, estrelas ou distancias.
    function calculateMinimumSteps() {
    	const queue = [{ col: start.col, row: start.row, dist: 0 }];
    	const visited = new Set([start.col + ',' + start.row]);

    	while (queue.length) {
    		const current = queue.shift();
    		if (current.col === goal.col && current.row === goal.row) {
    			return current.dist;
    		}

    		const neighbors = [
    			{ col: current.col + 1, row: current.row },
    			{ col: current.col - 1, row: current.row },
    			{ col: current.col, row: current.row + 1 },
    			{ col: current.col, row: current.row - 1 }
    		];

    		for (const n of neighbors) {
    			const key = n.col + ',' + n.row;
    			if (!visited.has(key) && isWalkable(n.col, n.row)) {
    				visited.add(key);
    				queue.push({ col: n.col, row: n.row, dist: current.dist + 1 });
    			}
    		}
    	}

    	return 999;
    }

    // Nota: Executa os comandos do prompt, aplicando regras e verificando vitoria ou falha.
    async function executeCommands() {
    	hideErrorPanel();
    	hideWinPanel();
    	hideFailPanel();

    	const lines = cmdInput.value
    		.split('\n')
    		.map(line => line.trim())
    		.filter(Boolean);

    	if (!lines.length) {
    		statusEl.className = 'status err';
    		statusEl.textContent = 'Digite ao menos um comando.';
    		return;
    	}

    	runBtn.disabled = true;
    	resetBtn.disabled = true;
    	statusEl.className = 'status';
    	statusEl.textContent = 'Executando no labirinto...';
    	let executedSteps = 0;
    	let blockedMoves = 0;

    	const parsedLines = [];
    	for (const line of lines) {
    		const parsed = parseMovementCommand(line);
    		if (!parsed) {
    			runBtn.disabled = false;
    			resetBtn.disabled = false;
    			statusEl.className = 'status err';
    			statusEl.textContent = 'Execucao cancelada: ha comando invalido no prompt.';
    			showErrorPanel(line);
    			return;
    		}
    		parsedLines.push(parsed);
    	}

    	for (const parsed of parsedLines) {
    		for (let step = 0; step < parsed.amount; step += 1) {
    			if (state.col === goal.col && state.row === goal.row) {
    				break;
    			}

    			const next = getNextPosition(parsed.action);
    			executedSteps += 1;

    			if (isWalkable(next.col, next.row)) {
    				state.col = next.col;
    				state.row = next.row;
    				draw();
    			} else {
    				blockedMoves += 1;
    			}

    			await wait(190);

    			if (state.col === goal.col && state.row === goal.row) {
    				break;
    			}
    		}

    		if (state.col === goal.col && state.row === goal.row) {
    			break;
    		}
    	}

    	runBtn.disabled = false;
    	resetBtn.disabled = false;

    	if (state.col === goal.col && state.row === goal.row) {
    		statusEl.className = 'status ok';
    		statusEl.textContent = 'Excelente! Voce decifrou o labirinto.';
    		showWinPanel(executedSteps, blockedMoves);
    		return;
    	}

    	state = { col: start.col, row: start.row };
    	draw();
    	statusEl.className = 'status err';
    	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson() {
    	hideErrorPanel();
    	hideDocsPanel();
    	hideWinPanel();
    	hideFailPanel();
    	state = { col: start.col, row: start.row };
    	draw();
    	statusEl.className = 'status';
    	statusEl.textContent = 'Posicao resetada no inicio do labirinto.';
    }

    runBtn.addEventListener('click', executeCommands);
    resetBtn.addEventListener('click', resetLesson);
    docsBtn.addEventListener('click', showDocsPanel);
    errorPanelClose.addEventListener('click', hideErrorPanel);
    docsPanelClose.addEventListener('click', hideDocsPanel);
    failPanelOk.addEventListener('click', hideFailPanel);

    buildGrid();
    resetLesson();

    })();
    return;
  }

  // Route: pagina5
	if (path.endsWith('/pages/pagina5.html')) {
    (function () {
    const CELL = 52;
    const COLS = 11;
    const ROWS = 9;

    const tutorialPanel = document.getElementById('tutorialPanel');
    const practicePanel = document.getElementById('practicePanel');
    const startPracticeBtn = document.getElementById('startPracticeBtn');
    const demoVideo = document.getElementById('demoVideo');
    const demoVideoNote = document.getElementById('demoVideoNote');

    const board = document.getElementById('board');
    const arenaGrid = document.getElementById('arenaGrid');
    const botCell = document.getElementById('botCell');
    const boxCell = document.getElementById('boxCell');
    const targetCell = document.getElementById('targetCell');
    const cmdInput = document.getElementById('cmdInput');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const docsBtn = document.getElementById('docsBtn');
    const statusEl = document.getElementById('status');
    const errorPanel = document.getElementById('errorPanel');
    const errorPanelMsg = document.getElementById('errorPanelMsg');
    const errorPanelClose = document.getElementById('errorPanelClose');
    const docsPanel = document.getElementById('docsPanel');
    const docsPanelClose = document.getElementById('docsPanelClose');
    const winPanel = document.getElementById('winPanel');
    const winSummary = document.getElementById('winSummary');
    const failPanel = document.getElementById('failPanel');
    const failPanelOk = document.getElementById('failPanelOk');

    const startBot = { col: 1, row: ROWS - 2 };
    const startBox = { col: 3, row: ROWS - 4 };
    const target = { col: COLS - 2, row: 1 };

    let state = {
    	botCol: startBot.col,
    	botRow: startBot.row,
    	boxCol: startBox.col,
    	boxRow: startBox.row,
    	carrying: false,
    	delivered: false,
    	usedPickCommand: false,
    	usedDropCommand: false
    };

    // Nota: Interpola valores para animacao suave entre dois pontos.
    function lerp(a, b, t) {
    	return a + (b - a) * t;
    }

    // Nota: Retorna um valor de apoio para uso na logica da fase.
    function getSegmentPosition(frame, ranges) {
    	for (const segment of ranges) {
    		if (frame <= segment.end) {
    			const size = Math.max(1, segment.end - segment.start);
    			const t = Math.max(0, Math.min(1, (frame - segment.start) / size));
    			return {
    				x: lerp(segment.from.x, segment.to.x, t),
    				y: lerp(segment.from.y, segment.to.y, t),
    				label: segment.label
    			};
    		}
    	}

    	const last = ranges[ranges.length - 1];
    	return { x: last.to.x, y: last.to.y, label: last.label };
    }

    // Nota: Desenha o estado atual dos elementos no tabuleiro.
    function drawDemoFrame(ctx, frame, width, height) {
    	ctx.clearRect(0, 0, width, height);
    	const bg = ctx.createLinearGradient(0, 0, 0, height);
    	bg.addColorStop(0, '#0f172a');
    	bg.addColorStop(1, '#1e293b');
    	ctx.fillStyle = bg;
    	ctx.fillRect(0, 0, width, height);

    	const margin = 28;
    	const gridW = width - margin * 2;
    	const gridH = height - margin * 2 - 44;
    	const cols = 8;
    	const rows = 5;
    	const cellW = gridW / cols;
    	const cellH = gridH / rows;

    	ctx.fillStyle = '#f8fafc';
    	ctx.fillRect(margin, margin, gridW, gridH);
    	ctx.strokeStyle = '#dbe3f2';
    	ctx.lineWidth = 1;
    	for (let c = 0; c <= cols; c += 1) {
    		ctx.beginPath();
    		ctx.moveTo(margin + c * cellW, margin);
    		ctx.lineTo(margin + c * cellW, margin + gridH);
    		ctx.stroke();
    	}
    	for (let r = 0; r <= rows; r += 1) {
    		ctx.beginPath();
    		ctx.moveTo(margin, margin + r * cellH);
    		ctx.lineTo(margin + gridW, margin + r * cellH);
    		ctx.stroke();
    	}

    	const ranges = [
    		{ start: 0, end: 35, from: { x: 1, y: 4 }, to: { x: 3, y: 4 }, label: 'moverDireita(2)' },
    		{ start: 36, end: 72, from: { x: 3, y: 4 }, to: { x: 3, y: 2 }, label: 'moverCima(2)' },
    		{ start: 73, end: 96, from: { x: 3, y: 2 }, to: { x: 3, y: 2 }, label: 'pegar()' },
    		{ start: 97, end: 145, from: { x: 3, y: 2 }, to: { x: 6, y: 2 }, label: 'moverDireita(3)' },
    		{ start: 146, end: 180, from: { x: 6, y: 2 }, to: { x: 6, y: 1 }, label: 'moverCima(1)' },
    		{ start: 181, end: 210, from: { x: 6, y: 1 }, to: { x: 6, y: 1 }, label: 'largar()' }
    	];

    	const pos = getSegmentPosition(frame, ranges);
    	const carrying = frame >= 73 && frame < 181;
    	const delivered = frame >= 181;

    	const targetX = margin + 6 * cellW;
    	const targetY = margin + 1 * cellH;
    	ctx.fillStyle = 'rgba(249,115,22,0.2)';
    	ctx.strokeStyle = '#f97316';
    	ctx.lineWidth = 2;
    	ctx.setLineDash([6, 4]);
    	ctx.fillRect(targetX + 8, targetY + 8, cellW - 16, cellH - 16);
    	ctx.strokeRect(targetX + 8, targetY + 8, cellW - 16, cellH - 16);
    	ctx.setLineDash([]);

    	let boxX = margin + 3 * cellW;
    	let boxY = margin + 2 * cellH;
    	if (carrying) {
    		boxX = margin + pos.x * cellW;
    		boxY = margin + pos.y * cellH;
    	}
    	if (!delivered) {
    		ctx.fillStyle = '#92400e';
    		ctx.fillRect(boxX + 10, boxY + 10, cellW - 20, cellH - 20);
    		ctx.strokeStyle = '#fcd34d';
    		ctx.lineWidth = 2;
    		ctx.strokeRect(boxX + 10, boxY + 10, cellW - 20, cellH - 20);
    	} else {
    		ctx.fillStyle = '#92400e';
    		ctx.fillRect(targetX + 10, targetY + 10, cellW - 20, cellH - 20);
    		ctx.strokeStyle = '#fcd34d';
    		ctx.lineWidth = 2;
    		ctx.strokeRect(targetX + 10, targetY + 10, cellW - 20, cellH - 20);
    	}

    	const botX = margin + pos.x * cellW;
    	const botY = margin + pos.y * cellH;
    	ctx.fillStyle = '#2563eb';
    	ctx.fillRect(botX + 10, botY + 10, cellW - 20, cellH - 20);
    	if (carrying) {
    		ctx.strokeStyle = '#f59e0b';
    		ctx.lineWidth = 2;
    		ctx.strokeRect(botX + 8, botY + 8, cellW - 16, cellH - 16);
    	}
    	ctx.fillStyle = '#dbeafe';
    	ctx.beginPath();
    	ctx.arc(botX + 18, botY + 20, 3, 0, Math.PI * 2);
    	ctx.arc(botX + cellW - 18, botY + 20, 3, 0, Math.PI * 2);
    	ctx.fill();

    	ctx.fillStyle = '#e2e8f0';
    	ctx.font = 'bold 14px Segoe UI';
    	ctx.fillText('TOM', botX + 12, botY + cellH - 10);

    	if (frame >= 181) {
    		ctx.fillStyle = '#22c55e';
    		ctx.font = 'bold 20px Segoe UI';
    		ctx.fillText('OBJETIVO CONCLUIDO', margin + 190, margin + 28);
    	}

    	ctx.fillStyle = '#e2e8f0';
    	ctx.font = 'bold 19px Segoe UI';
    	ctx.fillText('Demonstracao do Tom: pegar e largar no alvo', margin, height - 18);
    	ctx.fillStyle = '#93c5fd';
    	ctx.font = 'bold 18px Consolas';
    	ctx.fillText(pos.label, width - 260, height - 18);
    }

    // Nota: Cria dados, objetos ou elementos auxiliares para a dinamica da fase.
    async function createDemoVideoUrl() {
    	if (!window.MediaRecorder) {
    		throw new Error('MediaRecorder indisponivel');
    	}

    	const canvas = document.createElement('canvas');
    	canvas.width = 720;
    	canvas.height = 406;
    	const ctx = canvas.getContext('2d');
    	if (!ctx) {
    		throw new Error('Canvas 2D indisponivel');
    	}

    	const stream = canvas.captureStream(30);
    	const chunks = [];
    	const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    	recorder.ondataavailable = event => {
    		if (event.data && event.data.size > 0) {
    			chunks.push(event.data);
    		}
    	};

    	const done = new Promise(resolve => {
    		recorder.onstop = () => {
    			const blob = new Blob(chunks, { type: 'video/webm' });
    			resolve(URL.createObjectURL(blob));
    		};
    	});

    	recorder.start();
    	const totalFrames = 210;
    	for (let frame = 0; frame <= totalFrames; frame += 1) {
    		drawDemoFrame(ctx, frame, canvas.width, canvas.height);
    		await wait(1000 / 30);
    	}
    	recorder.stop();

    	return done;
    }

    // Nota: Configura o comportamento inicial desta parte da interface.
    async function setupDemoVideo() {
    	if (!demoVideo || !demoVideoNote) {
    		return;
    	}

    	try {
    		const videoUrl = await createDemoVideoUrl();
    		demoVideo.src = videoUrl;
    		demoVideoNote.textContent = 'Demonstracao pronta. Use os controles do video para pausar ou repetir.';
    	} catch (error) {
    		demoVideoNote.textContent = 'Nao foi possivel gerar o video nesta sessao. Siga o passo a passo do tutorial acima.';
    	}
    }

    // Nota: Monta a estrutura visual necessaria para a fase.
    function buildGrid() {
    	board.style.setProperty('--cell-size', CELL + 'px');
    	board.style.setProperty('--cols', COLS);
    	board.style.setProperty('--rows', ROWS);

    	const fragment = document.createDocumentFragment();
    	for (let i = 0; i < COLS * ROWS; i += 1) {
    		const cell = document.createElement('div');
    		cell.className = 'grid-cell';
    		fragment.appendChild(cell);
    	}
    	arenaGrid.appendChild(fragment);
    }

    // Nota: Posiciona um elemento na grade usando coluna e linha.
    function setEntityPosition(el, col, row) {
    	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
    }

    // Nota: Limita coordenadas para permanecer dentro dos limites do tabuleiro.
    function clampToBoard(col, row) {
    	return {
    		col: Math.max(0, Math.min(COLS - 1, col)),
    		row: Math.max(0, Math.min(ROWS - 1, row))
    	};
    }

    // Nota: Desenha o estado atual dos elementos no tabuleiro.
    function draw() {
    	setEntityPosition(botCell, state.botCol, state.botRow);
    	setEntityPosition(targetCell, target.col, target.row);

    	if (!state.delivered) {
    		setEntityPosition(boxCell, state.boxCol, state.boxRow);
    		boxCell.classList.remove('hidden');
    	} else {
    		boxCell.classList.add('hidden');
    	}

    	botCell.classList.toggle('carrying', state.carrying);
    }

    // Nota: Padroniza o texto do comando para facilitar a validacao.
    function normalizeCommand(raw) {
    	return raw.replace(/\s+/g, '').toLowerCase();
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);

    	if (cmd === 'pegar' || cmd === 'pegar()') {
    		return { action: 'pegar', amount: 1 };
    	}

    	if (cmd === 'largar' || cmd === 'largar()') {
    		return { action: 'largar', amount: 1 };
    	}

    	const moveMatch = cmd.match(/^(moverdireita|moveresquerda|movercima|moverbaixo)(?:\((\d+)\))?$/);
    	if (!moveMatch) {
    		return null;
    	}

    	const action = moveMatch[1];
    	const amount = moveMatch[2] ? Number(moveMatch[2]) : 1;
    	if (!Number.isInteger(amount) || amount < 1) {
    		return null;
    	}

    	return { action, amount };
    }

		setupPromptEditor(cmdInput, line => Boolean(parseCommand(line)));

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideErrorPanel() {
    	errorPanel.classList.add('hidden');
    	errorPanelMsg.textContent = '';
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showErrorPanel(command) {
    	errorPanelMsg.textContent = 'Comando invalido: "' + command + '". Revise e tente novamente.';
    	errorPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideDocsPanel() {
    	docsPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showDocsPanel() {
    	docsPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideWinPanel() {
    	winPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps) {
    	winSummary.textContent = 'Voce concluiu em ' + executedSteps + ' passos usando pegar().';
    	winPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideFailPanel() {
    	failPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showFailPanel() {
    	failPanel.classList.remove('hidden');
    }

    // Nota: Cria um atraso assicrono para animar a execucao passo a passo.
    function wait(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Nota: Move o agente ou obstaculo conforme as regras da fase.
    function moveBot(action) {
    	let nextCol = state.botCol;
    	let nextRow = state.botRow;

    	if (action === 'moverdireita') {
    		nextCol += 1;
    	} else if (action === 'moveresquerda') {
    		nextCol -= 1;
    	} else if (action === 'movercima') {
    		nextRow -= 1;
    	} else if (action === 'moverbaixo') {
    		nextRow += 1;
    	}

    	const bounded = clampToBoard(nextCol, nextRow);
    	state.botCol = bounded.col;
    	state.botRow = bounded.row;

    	if (state.carrying) {
    		state.boxCol = state.botCol;
    		state.boxRow = state.botRow;
    	}
    }

    // Nota: Realiza a acao de pegar item, respeitando as condicoes da fase.
    function pickBox() {
    	state.usedPickCommand = true;

    	if (state.delivered || state.carrying) {
    		return;
    	}

    	if (state.botCol === state.boxCol && state.botRow === state.boxRow) {
    		state.carrying = true;
    	}
    }

    // Nota: Realiza a acao de largar item e valida o resultado da entrega.
    function dropBox() {
    	state.usedDropCommand = true;

    	if (!state.carrying) {
    		state.delivered = state.boxCol === target.col && state.boxRow === target.row;
    		return;
    	}

    	state.carrying = false;
    	state.boxCol = state.botCol;
    	state.boxRow = state.botRow;
    	state.delivered = state.boxCol === target.col && state.boxRow === target.row;
    }

    // Nota: Executa os comandos do prompt, aplicando regras e verificando vitoria ou falha.
    async function executeCommands() {
    	hideErrorPanel();
    	hideWinPanel();
    	hideFailPanel();

    	const lines = cmdInput.value
    		.split('\n')
    		.map(line => line.trim())
    		.filter(Boolean);

    	if (!lines.length) {
    		statusEl.className = 'status err';
    		statusEl.textContent = 'Digite ao menos um comando.';
    		return;
    	}

    	runBtn.disabled = true;
    	resetBtn.disabled = true;
    	statusEl.className = 'status';
    	statusEl.textContent = 'Executando passo a passo...';
    	let executedSteps = 0;

    	const parsedLines = [];
    	for (const line of lines) {
    		const parsed = parseCommand(line);
    		if (!parsed) {
    			runBtn.disabled = false;
    			resetBtn.disabled = false;
    			statusEl.className = 'status err';
    			statusEl.textContent = 'Execucao cancelada: ha comando invalido no prompt.';
    			showErrorPanel(line);
    			return;
    		}
    		parsedLines.push(parsed);
    	}

    	for (const parsed of parsedLines) {
    		if (state.delivered) {
    			break;
    		}

    		if (parsed.action === 'pegar') {
    			pickBox();
    			executedSteps += 1;
    			draw();
    			await wait(220);
    			continue;
    		}

    		if (parsed.action === 'largar') {
    			dropBox();
    			executedSteps += 1;
    			draw();
    			await wait(220);
    			continue;
    		}

    		for (let step = 0; step < parsed.amount; step += 1) {
    			if (state.delivered) {
    				break;
    			}

    			moveBot(parsed.action);
    			executedSteps += 1;
    			draw();
    			await wait(220);
    		}
    	}

    	runBtn.disabled = false;
    	resetBtn.disabled = false;

    	if (state.delivered && state.usedPickCommand && state.usedDropCommand) {
    		statusEl.className = 'status ok';
    		statusEl.textContent = 'Excelente! Voce pegou e largou a caixa no alvo.';
    		showWinPanel(executedSteps);
    		return;
    	}

    	state = {
    		botCol: startBot.col,
    		botRow: startBot.row,
    		boxCol: startBox.col,
    		boxRow: startBox.row,
    		carrying: false,
    		delivered: false,
    		usedPickCommand: false,
    		usedDropCommand: false
    	};
    	draw();
    	statusEl.className = 'status err';
    	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson() {
    	hideErrorPanel();
    	hideDocsPanel();
    	hideWinPanel();
    	hideFailPanel();
    	state = {
    		botCol: startBot.col,
    		botRow: startBot.row,
    		boxCol: startBox.col,
    		boxRow: startBox.row,
    		carrying: false,
    		delivered: false,
    		usedPickCommand: false,
    		usedDropCommand: false
    	};
    	draw();
    	statusEl.className = 'status';
    	statusEl.textContent = 'Posicao resetada para nova tentativa.';
    }

    // Nota: Troca do tutorial para a area pratica da licao.
    function startPractice() {
    	tutorialPanel.classList.add('hidden');
    	practicePanel.classList.remove('hidden');
    	resetLesson();
    }

    runBtn.addEventListener('click', executeCommands);
    resetBtn.addEventListener('click', resetLesson);
    docsBtn.addEventListener('click', showDocsPanel);
    errorPanelClose.addEventListener('click', hideErrorPanel);
    docsPanelClose.addEventListener('click', hideDocsPanel);
    failPanelOk.addEventListener('click', hideFailPanel);
    startPracticeBtn.addEventListener('click', startPractice);

    buildGrid();
    resetLesson();
    setupDemoVideo();

    })();
    return;
  }

  // Route: pagina6
	if (path.endsWith('/pages/pagina6.html')) {
    (function () {
    const CELL = 52;
    const COLS = 11;
    const ROWS = 9;

    const tutorialPanel = document.getElementById('tutorialPanel');
    const practicePanel = document.getElementById('practicePanel');
    const startPracticeBtn = document.getElementById('startPracticeBtn');

    const board = document.getElementById('board');
    const arenaGrid = document.getElementById('arenaGrid');
    const baseLayer = document.getElementById('baseLayer');
    const packageLayer = document.getElementById('packageLayer');
    const botCell = document.getElementById('botCell');
    const cmdInput = document.getElementById('cmdInput');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const docsBtn = document.getElementById('docsBtn');
    const statusEl = document.getElementById('status');
    const errorPanel = document.getElementById('errorPanel');
    const errorPanelMsg = document.getElementById('errorPanelMsg');
    const errorPanelClose = document.getElementById('errorPanelClose');
    const docsPanel = document.getElementById('docsPanel');
    const docsPanelClose = document.getElementById('docsPanelClose');
    const winPanel = document.getElementById('winPanel');
    const winSummary = document.getElementById('winSummary');
    const failPanel = document.getElementById('failPanel');
    const failPanelOk = document.getElementById('failPanelOk');

    const startBot = { col: 1, row: ROWS - 2 };
    const bases = [
    	{ id: 'red', col: 8, row: 1, color: '#ef4444', name: 'Vermelha' },
    	{ id: 'blue', col: 8, row: 3, color: '#3b82f6', name: 'Azul' },
    	{ id: 'green', col: 8, row: 5, color: '#22c55e', name: 'Verde' }
    ];
    const packages = [
    	{ id: 'red', col: 2, row: 6, color: '#ef4444', delivered: false },
    	{ id: 'blue', col: 4, row: 4, color: '#3b82f6', delivered: false },
    	{ id: 'green', col: 6, row: 2, color: '#22c55e', delivered: false }
    ];

    let state = {
    	botCol: startBot.col,
    	botRow: startBot.row,
    	carryingPackageId: null,
    	usedPickCommand: false,
    	usedDropCommand: false
    };

    // Nota: Monta a estrutura visual necessaria para a fase.
    function buildGrid() {
    	board.style.setProperty('--cell-size', CELL + 'px');
    	board.style.setProperty('--cols', COLS);
    	board.style.setProperty('--rows', ROWS);

    	const fragment = document.createDocumentFragment();
    	for (let i = 0; i < COLS * ROWS; i += 1) {
    		const cell = document.createElement('div');
    		cell.className = 'grid-cell';
    		fragment.appendChild(cell);
    	}
    	arenaGrid.appendChild(fragment);
    }

    // Nota: Posiciona um elemento na grade usando coluna e linha.
    function setEntityPosition(el, col, row) {
    	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
    }

    // Nota: Limita coordenadas para permanecer dentro dos limites do tabuleiro.
    function clampToBoard(col, row) {
    	return {
    		col: Math.max(0, Math.min(COLS - 1, col)),
    		row: Math.max(0, Math.min(ROWS - 1, row))
    	};
    }

    // Nota: Desenha o estado atual dos elementos no tabuleiro.
    function draw() {
    	setEntityPosition(botCell, state.botCol, state.botRow);

    	for (const packageItem of packages) {
    		const packageCell = document.querySelector('[data-package-id="' + packageItem.id + '"]');
    		if (packageCell) {
    			packageCell.classList.toggle('hidden', packageItem.delivered);
    			if (!packageItem.delivered) {
    				setEntityPosition(packageCell, packageItem.col, packageItem.row);
    			}
    		}
    	}
    }

    // Nota: Padroniza o texto do comando para facilitar a validacao.
    function normalizeCommand(raw) {
    	return raw.replace(/\s+/g, '').toLowerCase();
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);

    	if (cmd === 'pegar' || cmd === 'pegar()') {
    		return { action: 'pegar', amount: 1 };
    	}

    	if (cmd === 'largar' || cmd === 'largar()') {
    		return { action: 'largar', amount: 1 };
    	}

    	const moveMatch = cmd.match(/^(moverdireita|moveresquerda|movercima|moverbaixo)(?:\((\d+)\))?$/);
    	if (!moveMatch) {
    		return null;
    	}

    	const action = moveMatch[1];
    	const amount = moveMatch[2] ? Number(moveMatch[2]) : 1;
    	if (!Number.isInteger(amount) || amount < 1) {
    		return null;
    	}

    	return { action, amount };
    }

		setupPromptEditor(cmdInput, line => Boolean(parseCommand(line)));

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideErrorPanel() {
    	errorPanel.classList.add('hidden');
    	errorPanelMsg.textContent = '';
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showErrorPanel(command) {
    	errorPanelMsg.textContent = 'Comando invalido: "' + command + '". Revise e tente novamente.';
    	errorPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideDocsPanel() {
    	docsPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showDocsPanel() {
    	docsPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideWinPanel() {
    	winPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps) {
    	winSummary.textContent = 'Voce entregou todos os pacotes em ' + executedSteps + ' passos.';
    	winPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideFailPanel() {
    	failPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showFailPanel() {
    	failPanel.classList.remove('hidden');
    }

    // Nota: Cria um atraso assicrono para animar a execucao passo a passo.
    function wait(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Nota: Move o agente ou obstaculo conforme as regras da fase.
    function moveBot(action) {
    	let nextCol = state.botCol;
    	let nextRow = state.botRow;

    	if (action === 'moverdireita') {
    		nextCol += 1;
    	} else if (action === 'moveresquerda') {
    		nextCol -= 1;
    	} else if (action === 'movercima') {
    		nextRow -= 1;
    	} else if (action === 'moverbaixo') {
    		nextRow += 1;
    	}

    	const bounded = clampToBoard(nextCol, nextRow);
    	state.botCol = bounded.col;
    	state.botRow = bounded.row;

    	if (state.carryingPackageId) {
    		const carriedPackage = packages.find(item => item.id === state.carryingPackageId);
    		if (carriedPackage) {
    			carriedPackage.col = state.botCol;
    			carriedPackage.row = state.botRow;
    		}
    	}
    }

    // Nota: Retorna um valor de apoio para uso na logica da fase.
    function getPackageAtBot() {
    	return packages.find(packageItem => !packageItem.delivered && packageItem.col === state.botCol && packageItem.row === state.botRow) || null;
    }

    // Nota: Retorna um valor de apoio para uso na logica da fase.
    function getBaseForPackage(packageId) {
    	return bases.find(base => base.id === packageId) || null;
    }

    // Nota: Verifica se todas as condicoes exigidas foram atendidas.
    function allPackagesDelivered() {
    	return packages.every(packageItem => packageItem.delivered);
    }

    // Nota: Realiza a acao de pegar item, respeitando as condicoes da fase.
    function pickPackage() {
    	state.usedPickCommand = true;

    	if (state.carryingPackageId) {
    		return;
    	}

    	const packageItem = getPackageAtBot();
    	if (packageItem) {
    		state.carryingPackageId = packageItem.id;
    	}
    }

    // Nota: Realiza a acao de largar item e valida o resultado da entrega.
    function dropPackage() {
    	state.usedDropCommand = true;

    	if (!state.carryingPackageId) {
    		return;
    	}

    	const carriedPackage = packages.find(item => item.id === state.carryingPackageId);
    	if (!carriedPackage) {
    		state.carryingPackageId = null;
    		return;
    	}

    	carriedPackage.col = state.botCol;
    	carriedPackage.row = state.botRow;
    	const matchingBase = getBaseForPackage(carriedPackage.id);
    	if (matchingBase && carriedPackage.col === matchingBase.col && carriedPackage.row === matchingBase.row) {
    		carriedPackage.delivered = true;
    	}

    	state.carryingPackageId = null;
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetPackages() {
    	packages[0].col = 2;
    	packages[0].row = 6;
    	packages[0].delivered = false;
    	packages[1].col = 4;
    	packages[1].row = 4;
    	packages[1].delivered = false;
    	packages[2].col = 6;
    	packages[2].row = 2;
    	packages[2].delivered = false;
    }

    // Nota: Renderiza ou atualiza elementos visuais na tela com base no estado atual.
    function renderBases() {
    	baseLayer.innerHTML = '';
    	for (const base of bases) {
    		const baseCell = document.createElement('div');
    		baseCell.className = 'base-cell';
    		baseCell.dataset.baseId = base.id;
    		baseCell.style.color = base.color;

    		const baseVisual = document.createElement('div');
    		baseVisual.className = 'base';
    		baseCell.appendChild(baseVisual);
    		setEntityPosition(baseCell, base.col, base.row);
    		baseLayer.appendChild(baseCell);
    	}
    }

    // Nota: Renderiza ou atualiza elementos visuais na tela com base no estado atual.
    function renderPackages() {
    	packageLayer.innerHTML = '';
    	for (const packageItem of packages) {
    		const packageCell = document.createElement('div');
    		packageCell.className = 'package-cell';
    		packageCell.dataset.packageId = packageItem.id;
    		if (packageItem.delivered) {
    			packageCell.classList.add('hidden');
    		}

    		const packageVisual = document.createElement('div');
    		packageVisual.className = 'package';
    		packageVisual.style.background = 'linear-gradient(180deg, ' + packageItem.color + ', color-mix(in srgb, ' + packageItem.color + ' 60%, black))';
    		packageCell.appendChild(packageVisual);
    		setEntityPosition(packageCell, packageItem.col, packageItem.row);
    		packageLayer.appendChild(packageCell);
    	}
    }

    // Nota: Implementa uma parte especifica da logica desta licao.
    function refreshLayerPositions() {
    	const packageCells = packageLayer.querySelectorAll('.package-cell');
    	for (const packageCell of packageCells) {
    		const packageId = packageCell.dataset.packageId;
    		const packageItem = packages.find(item => item.id === packageId);
    		if (packageItem && !packageItem.delivered) {
    			setEntityPosition(packageCell, packageItem.col, packageItem.row);
    		}
    	}

    	const baseCells = baseLayer.querySelectorAll('.base-cell');
    	for (const baseCell of baseCells) {
    		const baseId = baseCell.dataset.baseId;
    		const baseItem = bases.find(item => item.id === baseId);
    		if (baseItem) {
    			setEntityPosition(baseCell, baseItem.col, baseItem.row);
    		}
    	}
    }

    // Nota: Executa os comandos do prompt, aplicando regras e verificando vitoria ou falha.
    async function executeCommands() {
    	hideErrorPanel();
    	hideWinPanel();
    	hideFailPanel();

    	const lines = cmdInput.value
    		.split('\n')
    		.map(line => line.trim())
    		.filter(Boolean);

    	if (!lines.length) {
    		statusEl.className = 'status err';
    		statusEl.textContent = 'Digite ao menos um comando.';
    		return;
    	}

    	runBtn.disabled = true;
    	resetBtn.disabled = true;
    	statusEl.className = 'status';
    	statusEl.textContent = 'Executando entregas...';
    	let executedSteps = 0;

    	const parsedLines = [];
    	for (const line of lines) {
    		const parsed = parseCommand(line);
    		if (!parsed) {
    			runBtn.disabled = false;
    			resetBtn.disabled = false;
    			statusEl.className = 'status err';
    			statusEl.textContent = 'Execucao cancelada: ha comando invalido no prompt.';
    			showErrorPanel(line);
    			return;
    		}
    		parsedLines.push(parsed);
    	}

    	for (const parsed of parsedLines) {
    		if (allPackagesDelivered()) {
    			break;
    		}

    		if (parsed.action === 'pegar') {
    			pickPackage();
    			executedSteps += 1;
    			draw();
    			await wait(220);
    			continue;
    		}

    		if (parsed.action === 'largar') {
    			dropPackage();
    			executedSteps += 1;
    			if (allPackagesDelivered()) {
    				draw();
    				await wait(220);
    				break;
    			}
    			draw();
    			await wait(220);
    			continue;
    		}

    		for (let step = 0; step < parsed.amount; step += 1) {
    			if (allPackagesDelivered()) {
    				break;
    			}

    			moveBot(parsed.action);
    			executedSteps += 1;
    			draw();
    			await wait(200);
    		}
    	}

    	runBtn.disabled = false;
    	resetBtn.disabled = false;

    	if (allPackagesDelivered()) {
    		statusEl.className = 'status ok';
    		statusEl.textContent = 'Excelente! Voce entregou todos os pacotes nas bases corretas.';
    		showWinPanel(executedSteps);
    		return;
    	}

    	state = {
    		botCol: startBot.col,
    		botRow: startBot.row,
    		carryingPackageId: null,
    		usedPickCommand: false,
    		usedDropCommand: false
    	};
    	resetPackages();
    	renderPackages();
    	refreshLayerPositions();
    	draw();
    	statusEl.className = 'status err';
    	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson() {
    	hideErrorPanel();
    	hideDocsPanel();
    	hideWinPanel();
    	hideFailPanel();
    	state = {
    		botCol: startBot.col,
    		botRow: startBot.row,
    		carryingPackageId: null,
    		usedPickCommand: false,
    		usedDropCommand: false
    	};
    	resetPackages();
    	renderPackages();
    	refreshLayerPositions();
    	draw();
    	statusEl.className = 'status';
    	statusEl.textContent = 'Posicao resetada para nova tentativa.';
    }

    // Nota: Troca do tutorial para a area pratica da licao.
    function startPractice() {
    	tutorialPanel.classList.add('hidden');
    	practicePanel.classList.remove('hidden');
    	resetLesson();
    }

    runBtn.addEventListener('click', executeCommands);
    resetBtn.addEventListener('click', resetLesson);
    docsBtn.addEventListener('click', showDocsPanel);
    errorPanelClose.addEventListener('click', hideErrorPanel);
    docsPanelClose.addEventListener('click', hideDocsPanel);
    failPanelOk.addEventListener('click', hideFailPanel);
    startPracticeBtn.addEventListener('click', startPractice);

    buildGrid();
    renderBases();
    renderPackages();
    resetLesson();

    })();
    return;
  }

  // Route: pagina7
	if (path.endsWith('/pages/pagina7.html')) {
    (function () {
    const CELL = 44;
    const COLS = 13;
    const ROWS = 11;

    const tutorialPanel = document.getElementById('tutorialPanel');
    const practicePanel = document.getElementById('practicePanel');
    const startPracticeBtn = document.getElementById('startPracticeBtn');

    const board = document.getElementById('board');
    const arenaGrid = document.getElementById('arenaGrid');
    const mazeLayer = document.getElementById('mazeLayer');
    const baseLayer = document.getElementById('baseLayer');
    const packageLayer = document.getElementById('packageLayer');
    const hazardLayer = document.getElementById('hazardLayer');
    const botCell = document.getElementById('botCell');
    const cmdInput = document.getElementById('cmdInput');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const docsBtn = document.getElementById('docsBtn');
    const statusEl = document.getElementById('status');
    const turnCounter = document.getElementById('turnCounter');
    const errorPanel = document.getElementById('errorPanel');
    const errorPanelMsg = document.getElementById('errorPanelMsg');
    const errorPanelClose = document.getElementById('errorPanelClose');
    const docsPanel = document.getElementById('docsPanel');
    const docsPanelClose = document.getElementById('docsPanelClose');
    const winPanel = document.getElementById('winPanel');
    const winSummary = document.getElementById('winSummary');
    const failPanel = document.getElementById('failPanel');
    const failPanelOk = document.getElementById('failPanelOk');

    const startBot = { col: 1, row: ROWS - 2 };
    const bases = [
    	{ id: 'red', col: 10, row: 1, color: '#ef4444' },
    	{ id: 'blue', col: 10, row: 4, color: '#3b82f6' },
    	{ id: 'green', col: 10, row: 7, color: '#22c55e' }
    ];
    const packages = [
    	{ id: 'red', col: 2, row: 8, color: '#ef4444', delivered: false },
    	{ id: 'blue', col: 4, row: 6, color: '#3b82f6', delivered: false },
    	{ id: 'green', col: 6, row: 2, color: '#22c55e', delivered: false }
    ];
    const mazeWalls = [
    	{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }, { col: 4, row: 0 }, { col: 5, row: 0 }, { col: 6, row: 0 }, { col: 7, row: 0 }, { col: 8, row: 0 }, { col: 9, row: 0 }, { col: 10, row: 0 }, { col: 11, row: 0 }, { col: 12, row: 0 },
    	{ col: 0, row: 1 }, { col: 12, row: 1 },
    	{ col: 0, row: 2 }, { col: 12, row: 2 },
    	{ col: 0, row: 3 }, { col: 12, row: 3 },
    	{ col: 0, row: 4 }, { col: 12, row: 4 },
    	{ col: 0, row: 5 }, { col: 12, row: 5 },
    	{ col: 0, row: 6 }, { col: 12, row: 6 },
    	{ col: 0, row: 7 }, { col: 12, row: 7 },
    	{ col: 0, row: 8 }, { col: 12, row: 8 },
    	{ col: 0, row: 9 }, { col: 12, row: 9 },
    	{ col: 0, row: 10 }, { col: 1, row: 10 }, { col: 2, row: 10 }, { col: 3, row: 10 }, { col: 4, row: 10 }, { col: 5, row: 10 }, { col: 6, row: 10 }, { col: 7, row: 10 }, { col: 8, row: 10 }, { col: 9, row: 10 }, { col: 10, row: 10 }, { col: 11, row: 10 }, { col: 12, row: 10 },
    	{ col: 3, row: 1 }, { col: 3, row: 2 }, { col: 3, row: 3 },
    	{ col: 5, row: 3 }, { col: 5, row: 4 }, { col: 5, row: 5 },
    	{ col: 7, row: 5 }, { col: 7, row: 6 }, { col: 7, row: 7 },
    	{ col: 9, row: 2 }, { col: 9, row: 3 }, { col: 9, row: 5 }, { col: 9, row: 6 },
    	{ col: 4, row: 8 }, { col: 5, row: 8 }, { col: 7, row: 8 }, { col: 8, row: 8 }
    ];
    const hazards = [
    	{ id: 'h1', col: 2, row: 1, dir: 1 },
    	{ id: 'h2', col: 8, row: 3, dir: -1 },
    	{ id: 'h3', col: 6, row: 7, dir: 1 },
    	{ id: 'h4', col: 4, row: 5, dir: 1 }
    ];

    let state = {
    	botCol: startBot.col,
    	botRow: startBot.row,
    	carryingPackageId: null,
    	usedPickCommand: false,
    	usedDropCommand: false,
    	turnsLeft: 0
    };

    // Nota: Monta a estrutura visual necessaria para a fase.
    function buildGrid() {
    	board.style.setProperty('--cell-size', CELL + 'px');
    	board.style.setProperty('--cols', COLS);
    	board.style.setProperty('--rows', ROWS);

    	const fragment = document.createDocumentFragment();
    	for (let i = 0; i < COLS * ROWS; i += 1) {
    		const cell = document.createElement('div');
    		cell.className = 'grid-cell';
    		fragment.appendChild(cell);
    	}
    	arenaGrid.appendChild(fragment);
    }

    // Nota: Posiciona um elemento na grade usando coluna e linha.
    function setEntityPosition(el, col, row) {
    	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
    }

    // Nota: Limita coordenadas para permanecer dentro dos limites do tabuleiro.
    function clampToBoard(col, row) {
    	return {
    		col: Math.max(0, Math.min(COLS - 1, col)),
    		row: Math.max(0, Math.min(ROWS - 1, row))
    	};
    }

    // Nota: Gera uma chave textual de coordenadas para comparacoes e buscas.
    function keyFor(col, row) {
    	return col + ',' + row;
    }

    // Nota: Verifica se uma condicao especifica e verdadeira para a posicao atual.
    function isWall(col, row) {
    	return mazeWalls.some(wall => wall.col === col && wall.row === row);
    }

    // Nota: Verifica se uma condicao especifica e verdadeira para a posicao atual.
    function isWalkable(col, row) {
    	return col >= 0 && col < COLS && row >= 0 && row < ROWS && !isWall(col, row);
    }

    // Nota: Verifica se uma condicao especifica e verdadeira para a posicao atual.
    function isHazardAt(col, row) {
    	return hazards.some(hazard => hazard.col === col && hazard.row === row);
    }

    // Nota: Calcula distancia Manhattan entre dois pontos da grade.
    function manhattanDistance(colA, rowA, colB, rowB) {
    	return Math.abs(colA - colB) + Math.abs(rowA - rowB);
    }

    // Nota: Monta a estrutura visual necessaria para a fase.
    function buildMaze() {
    	mazeLayer.innerHTML = '';
    	for (const wall of mazeWalls) {
    		const wallCell = document.createElement('div');
    		wallCell.className = 'maze-cell';
    		wallCell.style.transform = 'translate(' + (wall.col * CELL) + 'px,' + (wall.row * CELL) + 'px)';
    		const wallVisual = document.createElement('div');
    		wallVisual.className = 'maze-wall';
    		wallCell.appendChild(wallVisual);
    		mazeLayer.appendChild(wallCell);
    	}
    }

    // Nota: Renderiza ou atualiza elementos visuais na tela com base no estado atual.
    function renderBases() {
    	baseLayer.innerHTML = '';
    	for (const base of bases) {
    		const baseCell = document.createElement('div');
    		baseCell.className = 'base-cell';
    		baseCell.dataset.baseId = base.id;
    		baseCell.style.color = base.color;

    		const baseVisual = document.createElement('div');
    		baseVisual.className = 'base';
    		baseCell.appendChild(baseVisual);
    		setEntityPosition(baseCell, base.col, base.row);
    		baseLayer.appendChild(baseCell);
    	}
    }

    // Nota: Renderiza ou atualiza elementos visuais na tela com base no estado atual.
    function renderPackages() {
    	packageLayer.innerHTML = '';
    	for (const packageItem of packages) {
    		const packageCell = document.createElement('div');
    		packageCell.className = 'package-cell';
    		packageCell.dataset.packageId = packageItem.id;
    		if (packageItem.delivered) {
    			packageCell.classList.add('hidden');
    		}

    		const packageVisual = document.createElement('div');
    		packageVisual.className = 'package';
    		packageVisual.style.background = 'linear-gradient(180deg, ' + packageItem.color + ', color-mix(in srgb, ' + packageItem.color + ' 60%, black))';
    		packageCell.appendChild(packageVisual);
    		setEntityPosition(packageCell, packageItem.col, packageItem.row);
    		packageLayer.appendChild(packageCell);
    	}
    }

    // Nota: Renderiza ou atualiza elementos visuais na tela com base no estado atual.
    function renderHazards() {
    	hazardLayer.innerHTML = '';
    	for (const hazard of hazards) {
    		const hazardCell = document.createElement('div');
    		hazardCell.className = 'hazard-cell';
    		hazardCell.dataset.hazardId = hazard.id;
    		const hazardVisual = document.createElement('div');
    		hazardVisual.className = 'hazard';
    		hazardCell.appendChild(hazardVisual);
    		setEntityPosition(hazardCell, hazard.col, hazard.row);
    		hazardLayer.appendChild(hazardCell);
    	}
    }

    // Nota: Implementa uma parte especifica da logica desta licao.
    function refreshLayerPositions() {
    	for (const baseCell of baseLayer.querySelectorAll('.base-cell')) {
    		const baseId = baseCell.dataset.baseId;
    		const baseItem = bases.find(item => item.id === baseId);
    		if (baseItem) {
    			setEntityPosition(baseCell, baseItem.col, baseItem.row);
    		}
    	}

    	for (const packageCell of packageLayer.querySelectorAll('.package-cell')) {
    		const packageId = packageCell.dataset.packageId;
    		const packageItem = packages.find(item => item.id === packageId);
    		if (packageItem && !packageItem.delivered) {
    			setEntityPosition(packageCell, packageItem.col, packageItem.row);
    		}
    	}

    	for (const hazardCell of hazardLayer.querySelectorAll('.hazard-cell')) {
    		const hazardId = hazardCell.dataset.hazardId;
    		const hazardItem = hazards.find(item => item.id === hazardId);
    		if (hazardItem) {
    			setEntityPosition(hazardCell, hazardItem.col, hazardItem.row);
    		}
    	}
    }

    // Nota: Desenha o estado atual dos elementos no tabuleiro.
    function draw() {
    	setEntityPosition(botCell, state.botCol, state.botRow);
    	const carriedPackage = state.carryingPackageId ? packages.find(item => item.id === state.carryingPackageId) : null;
    	botCell.classList.toggle('carrying', Boolean(carriedPackage));

    	for (const packageItem of packages) {
    		const packageCell = packageLayer.querySelector('[data-package-id="' + packageItem.id + '"]');
    		if (packageCell) {
    			packageCell.classList.toggle('hidden', packageItem.delivered);
    			if (!packageItem.delivered) {
    				setEntityPosition(packageCell, packageItem.col, packageItem.row);
    			}
    		}
    	}

    	for (const hazard of hazards) {
    		const hazardCell = hazardLayer.querySelector('[data-hazard-id="' + hazard.id + '"]');
    		if (hazardCell) {
    			setEntityPosition(hazardCell, hazard.col, hazard.row);
    		}
    	}

    	turnCounter.textContent = 'Turnos restantes: ' + state.turnsLeft;
    }

    // Nota: Padroniza o texto do comando para facilitar a validacao.
    function normalizeCommand(raw) {
    	return raw.replace(/\s+/g, '').toLowerCase();
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);

    	if (cmd === 'pegar' || cmd === 'pegar()') {
    		return { action: 'pegar', amount: 1 };
    	}

    	if (cmd === 'largar' || cmd === 'largar()') {
    		return { action: 'largar', amount: 1 };
    	}

    	const moveMatch = cmd.match(/^(moverdireita|moveresquerda|movercima|moverbaixo)(?:\((\d+)\))?$/);
    	if (!moveMatch) {
    		return null;
    	}

    	const action = moveMatch[1];
    	const amount = moveMatch[2] ? Number(moveMatch[2]) : 1;
    	if (!Number.isInteger(amount) || amount < 1) {
    		return null;
    	}

    	return { action, amount };
    }

		setupPromptEditor(cmdInput, line => Boolean(parseCommand(line)));

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideErrorPanel() {
    	errorPanel.classList.add('hidden');
    	errorPanelMsg.textContent = '';
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showErrorPanel(command) {
    	errorPanelMsg.textContent = 'Comando invalido: "' + command + '". Revise e tente novamente.';
    	errorPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideDocsPanel() {
    	docsPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showDocsPanel() {
    	docsPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideWinPanel() {
    	winPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps) {
    	winSummary.textContent = 'Voce entregou todos os pacotes em ' + executedSteps + ' turnos.';
    	winPanel.classList.remove('hidden');
    }

    // Nota: Oculta o painel ou elemento relacionado a esta funcao.
    function hideFailPanel() {
    	failPanel.classList.add('hidden');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showFailPanel() {
    	failPanel.classList.remove('hidden');
    }

    // Nota: Cria um atraso assicrono para animar a execucao passo a passo.
    function wait(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Nota: Move o agente ou obstaculo conforme as regras da fase.
    function moveBot(action) {
    	let nextCol = state.botCol;
    	let nextRow = state.botRow;

    	if (action === 'moverdireita') {
    		nextCol += 1;
    	} else if (action === 'moveresquerda') {
    		nextCol -= 1;
    	} else if (action === 'movercima') {
    		nextRow -= 1;
    	} else if (action === 'moverbaixo') {
    		nextRow += 1;
    	}

    	const bounded = clampToBoard(nextCol, nextRow);
    	if (isWalkable(bounded.col, bounded.row)) {
    		state.botCol = bounded.col;
    		state.botRow = bounded.row;
    	}

    	if (state.carryingPackageId) {
    		const carriedPackage = packages.find(item => item.id === state.carryingPackageId);
    		if (carriedPackage) {
    			carriedPackage.col = state.botCol;
    			carriedPackage.row = state.botRow;
    		}
    	}
    }

    // Nota: Move o agente ou obstaculo conforme as regras da fase.
    function moveHazards() {
    	for (const hazard of hazards) {
    		const candidates = [
    			{ col: hazard.col + 1, row: hazard.row, dir: 1 },
    			{ col: hazard.col - 1, row: hazard.row, dir: -1 },
    			{ col: hazard.col, row: hazard.row + 1, dir: 1 },
    			{ col: hazard.col, row: hazard.row - 1, dir: -1 }
    		]
    			.filter(candidate => isWalkable(candidate.col, candidate.row))
    			.filter(candidate => !isHazardAt(candidate.col, candidate.row))
    			.filter(candidate => !(candidate.col === state.botCol && candidate.row === state.botRow));

    		candidates.sort((a, b) => {
    			const distA = manhattanDistance(a.col, a.row, state.botCol, state.botRow);
    			const distB = manhattanDistance(b.col, b.row, state.botCol, state.botRow);
    			return distA - distB;
    		});

    		if (candidates.length) {
    			hazard.col = candidates[0].col;
    			hazard.row = candidates[0].row;
    			hazard.dir = candidates[0].dir;
    		} else {
    			hazard.dir *= -1;
    		}
    	}
    }

    // Nota: Implementa uma parte especifica da logica desta licao.
    function collisionWithHazard() {
    	return hazards.some(hazard => hazard.col === state.botCol && hazard.row === state.botRow);
    }

    // Nota: Retorna um valor de apoio para uso na logica da fase.
    function getPackageAtBot() {
    	return packages.find(packageItem => !packageItem.delivered && packageItem.col === state.botCol && packageItem.row === state.botRow) || null;
    }

    // Nota: Retorna um valor de apoio para uso na logica da fase.
    function getBaseForPackage(packageId) {
    	return bases.find(base => base.id === packageId) || null;
    }

    // Nota: Verifica se todas as condicoes exigidas foram atendidas.
    function allPackagesDelivered() {
    	return packages.every(packageItem => packageItem.delivered);
    }

    // Nota: Realiza a acao de pegar item, respeitando as condicoes da fase.
    function pickPackage() {
    	state.usedPickCommand = true;

    	if (state.carryingPackageId) {
    		return;
    	}

    	const packageItem = getPackageAtBot();
    	if (packageItem) {
    		state.carryingPackageId = packageItem.id;
    	}
    }

    // Nota: Realiza a acao de largar item e valida o resultado da entrega.
    function dropPackage() {
    	state.usedDropCommand = true;

    	if (!state.carryingPackageId) {
    		return;
    	}

    	const carriedPackage = packages.find(item => item.id === state.carryingPackageId);
    	if (!carriedPackage) {
    		state.carryingPackageId = null;
    		return;
    	}

    	carriedPackage.col = state.botCol;
    	carriedPackage.row = state.botRow;
    	const matchingBase = getBaseForPackage(carriedPackage.id);
    	if (matchingBase && carriedPackage.col === matchingBase.col && carriedPackage.row === matchingBase.row) {
    		carriedPackage.delivered = true;
    	}

    	state.carryingPackageId = null;
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetPackages() {
    	packages[0].col = 2;
    	packages[0].row = 8;
    	packages[0].delivered = false;
    	packages[1].col = 4;
    	packages[1].row = 6;
    	packages[1].delivered = false;
    	packages[2].col = 6;
    	packages[2].row = 2;
    	packages[2].delivered = false;
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetHazards() {
    	hazards[0].col = 2;
    	hazards[0].row = 1;
    	hazards[0].dir = 1;
    	hazards[1].col = 8;
    	hazards[1].row = 3;
    	hazards[1].dir = -1;
    	hazards[2].col = 6;
    	hazards[2].row = 7;
    	hazards[2].dir = 1;
    	hazards[3].col = 4;
    	hazards[3].row = 5;
    	hazards[3].dir = -1;
    }

    // Nota: Executa um turno completo da fase, incluindo movimento e verificacoes.
    async function stepTurn(action) {
    	if (action === 'pegar') {
    		pickPackage();
    	} else if (action === 'largar') {
    		dropPackage();
    	} else {
    		moveBot(action);
    	}

    	moveHazards();
    	state.turnsLeft += 1;
    	draw();
    	await wait(200);

    	if (collisionWithHazard()) {
    		return 'collision';
    	}

    	return 'ok';
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson() {
    	hideErrorPanel();
    	hideDocsPanel();
    	hideWinPanel();
    	hideFailPanel();
    	state = {
    		botCol: startBot.col,
    		botRow: startBot.row,
    		carryingPackageId: null,
    		usedPickCommand: false,
    		usedDropCommand: false,
    		turnsLeft: 0
    	};
    	resetPackages();
    	resetHazards();
    	renderPackages();
    	renderBases();
    	renderHazards();
    	refreshLayerPositions();
    	draw();
    	statusEl.className = 'status';
    	statusEl.textContent = 'Posicao resetada para nova tentativa.';
    	turnCounter.textContent = 'Turnos restantes: 0';
    }

    // Nota: Executa os comandos do prompt, aplicando regras e verificando vitoria ou falha.
    async function executeCommands() {
    	hideErrorPanel();
    	hideWinPanel();
    	hideFailPanel();

    	const lines = cmdInput.value
    		.split('\n')
    		.map(line => line.trim())
    		.filter(Boolean);

    	if (!lines.length) {
    		statusEl.className = 'status err';
    		statusEl.textContent = 'Digite ao menos um comando.';
    		return;
    	}

    	runBtn.disabled = true;
    	resetBtn.disabled = true;
    	statusEl.className = 'status';
    	statusEl.textContent = 'Executando com turnos dos blocos vermelhos...';
    	let executedSteps = 0;

    	const parsedLines = [];
    	for (const line of lines) {
    		const parsed = parseCommand(line);
    		if (!parsed) {
    			runBtn.disabled = false;
    			resetBtn.disabled = false;
    			statusEl.className = 'status err';
    			statusEl.textContent = 'Execucao cancelada: ha comando invalido no prompt.';
    			showErrorPanel(line);
    			return;
    		}
    		parsedLines.push(parsed);
    	}

    	for (const parsed of parsedLines) {
    		if (allPackagesDelivered()) {
    			break;
    		}

    		for (let step = 0; step < parsed.amount; step += 1) {
    			const result = await stepTurn(parsed.action);
    			executedSteps += 1;
    			if (result === 'collision') {
    				state = {
    					botCol: startBot.col,
    					botRow: startBot.row,
    					carryingPackageId: null,
    					usedPickCommand: false,
    					usedDropCommand: false,
    					turnsLeft: 0
    				};
    				resetPackages();
    				resetHazards();
    				renderPackages();
    				renderHazards();
    				refreshLayerPositions();
    				draw();
    				runBtn.disabled = false;
    				resetBtn.disabled = false;
    				statusEl.className = 'status err';
    				statusEl.textContent = 'Falha: o boneco encostou em um bloco vermelho. A fase foi reiniciada.';
    				showFailPanel();
    				return;
    			}
    			if (allPackagesDelivered()) {
    				break;
    			}
    		}
    	}

    	runBtn.disabled = false;
    	resetBtn.disabled = false;

    	if (allPackagesDelivered() && state.usedPickCommand && state.usedDropCommand) {
    		statusEl.className = 'status ok';
    		statusEl.textContent = 'Excelente! Voce entregou todos os pacotes e evitou os blocos vermelhos.';
    		showWinPanel(executedSteps);
    		return;
    	}

    	state = {
    		botCol: startBot.col,
    		botRow: startBot.row,
    		carryingPackageId: null,
    		usedPickCommand: false,
    		usedDropCommand: false,
    		turnsLeft: 0
    	};
    	resetPackages();
    	resetHazards();
    	renderPackages();
    	renderHazards();
    	refreshLayerPositions();
    	draw();
    	statusEl.className = 'status err';
    	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
    	showFailPanel();
    }

    // Nota: Troca do tutorial para a area pratica da licao.
    function startPractice() {
    	tutorialPanel.classList.add('hidden');
    	practicePanel.classList.remove('hidden');
    	resetLesson();
    }

    runBtn.addEventListener('click', executeCommands);
    resetBtn.addEventListener('click', resetLesson);
    docsBtn.addEventListener('click', showDocsPanel);
    errorPanelClose.addEventListener('click', hideErrorPanel);
    docsPanelClose.addEventListener('click', hideDocsPanel);
    failPanelOk.addEventListener('click', hideFailPanel);
    startPracticeBtn.addEventListener('click', startPractice);

    buildGrid();
    buildMaze();
    renderBases();
    renderPackages();
    renderHazards();
    resetLesson();

    })();
    return;
  }
})();

