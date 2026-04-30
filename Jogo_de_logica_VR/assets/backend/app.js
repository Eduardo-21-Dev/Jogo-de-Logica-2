(function () {
  const path = window.location.pathname.toLowerCase();
	const PROGRESS_STORAGE_KEY = 'css-master-progress-v1';
	const HARD_RESET_FLAG_KEY = 'css-master-hard-reset';
	const USERNAME_STORAGE_KEY = 'css-master-username-v1';
	const PLAYER_ID_STORAGE_KEY = 'css-master-player-id-v1';
	const TOTAL_LESSONS = 6;
	const LAST_PLAYABLE_LESSON = 6;

	// Retorna o nome do jogador salvo ou "Jogador" como fallback.
	function getPlayerName() {
		try {
			return localStorage.getItem(USERNAME_STORAGE_KEY) || 'Jogador';
		} catch (e) {
			return 'Jogador';
		}
	}

	// Nota: Inicializa o modal de nome de usuario na pagina inicial.
	function setupUsernameModal() {
		const overlay = document.getElementById('usernameOverlay');
		const form = document.getElementById('usernameForm');
		const input = document.getElementById('usernameInput');
		const errorEl = document.getElementById('usernameError');

		if (!overlay || !form || !input) {
			return;
		}

		var savedName = '';
		try {
			savedName = localStorage.getItem(USERNAME_STORAGE_KEY) || '';
		} catch (e) {
			// Ignora falhas de armazenamento.
		}

		var savedId = '';
		try {
			savedId = localStorage.getItem(PLAYER_ID_STORAGE_KEY) || '';
		} catch (e) {
			// Ignora falhas de armazenamento.
		}

		if (savedName.trim().length > 0 && savedId) {
			overlay.classList.add('hidden');
			return;
		}

		document.body.style.overflow = 'hidden';
		input.focus();

		form.addEventListener('submit', function (event) {
			event.preventDefault();
			var name = input.value.trim();

			input.classList.remove('input-error');
			errorEl.textContent = '';

			if (name.length < 2) {
				errorEl.textContent = 'O nome deve ter pelo menos 2 caracteres.';
				input.classList.add('input-error');
				input.focus();
				return;
			}

			var submitBtn = form.querySelector('button[type="submit"]');
			if (submitBtn) {
				submitBtn.disabled = true;
				submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
			}

			var horaInicial = new Date().toISOString().slice(0, 19).replace('T', ' ');

			// Nota: Salva o jogador no banco de dados via API REST.
			GameAPI.salvarJogador({
				nome: name,
				fases_concluidas: [],
				fase_atual: 1,
				estrelas: 0,
				hora_inicial: horaInicial,
				hora_final: null
			}).then(function (res) {
				try {
					localStorage.setItem(USERNAME_STORAGE_KEY, name);
					localStorage.setItem(PLAYER_ID_STORAGE_KEY, String(res.id));
				} catch (e) {
					// Ignora falhas de armazenamento.
				}

				overlay.style.animation = 'overlayFadeIn 0.25s ease reverse forwards';
				setTimeout(function () {
					overlay.classList.add('hidden');
					document.body.style.overflow = '';
				}, 220);
			}).catch(function (err) {
				// Nota: Exibe o erro no modal para facilitar o diagnóstico.
				console.error('Erro ao salvar jogador na API:', err);
				errorEl.textContent = err.message || 'Erro ao conectar com o servidor.';
				input.classList.add('input-error');
				input.focus();
				if (submitBtn) {
					submitBtn.disabled = false;
					submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Começar Aventura';
				}
			});
		});

		input.addEventListener('input', function () {
			if (input.classList.contains('input-error')) {
				input.classList.remove('input-error');
				errorEl.textContent = '';
			}
		});
	}

	// Nota: Aplica reset de progresso quando o usuario usa Ctrl+F5.
	function setupHardResetOnCtrlF5() {
		window.addEventListener('keydown', function (event) {
			if (event.ctrlKey && event.key === 'F5') {
				try {
					sessionStorage.setItem(HARD_RESET_FLAG_KEY, '1');
				} catch (error) {
					// Ignora falhas de armazenamento.
				}
			}
		});

		try {
			if (sessionStorage.getItem(HARD_RESET_FLAG_KEY) === '1') {
				localStorage.removeItem(PROGRESS_STORAGE_KEY);
				localStorage.removeItem(USERNAME_STORAGE_KEY);
				localStorage.removeItem(PLAYER_ID_STORAGE_KEY);
				sessionStorage.removeItem(HARD_RESET_FLAG_KEY);
			}
		} catch (error) {
			// Ignora falhas de armazenamento.
		}
	}

	// Nota: Carrega o progresso salvo das fases com validacao basica.
	function loadProgressState() {
		try {
			const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
			if (!raw) {
				return { completedLessons: [], estrelasPorFase: {} };
			}

			const parsed = JSON.parse(raw);
			if (!parsed || !Array.isArray(parsed.completedLessons)) {
				return { completedLessons: [], estrelasPorFase: {} };
			}

			const cleaned = parsed.completedLessons
				.map(Number)
				.filter(function (lesson) {
					return Number.isInteger(lesson) && lesson >= 1 && lesson <= TOTAL_LESSONS;
				})
				.sort(function (a, b) { return a - b; });

			const estrelasPorFase = (parsed.estrelasPorFase && typeof parsed.estrelasPorFase === 'object' && !Array.isArray(parsed.estrelasPorFase))
				? parsed.estrelasPorFase
				: {};

			return { completedLessons: Array.from(new Set(cleaned)), estrelasPorFase };
		} catch (error) {
			return { completedLessons: [], estrelasPorFase: {} };
		}
	}

	// Nota: Salva o progresso atual no armazenamento local do navegador.
	function saveProgressState(progress) {
		try {
			localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
		} catch (error) {
			// Ignora falhas de armazenamento.
		}
	}

	// Sincroniza progresso com o banco de dados (fire-and-forget).
	function syncProgressNoBanco(faseAtual, fasesConcluidas, estrelasPorFase, totalEstrelas) {
		var playerId = '';
		try {
			playerId = localStorage.getItem(PLAYER_ID_STORAGE_KEY) || '';
		} catch (e) {}

		if (!playerId) {
			return;
		}

		GameAPI.atualizarJogador(Number(playerId), {
			fase_atual: faseAtual,
			fases_concluidas: fasesConcluidas,
			estrelas_por_fase: estrelasPorFase || {},
			estrelas: Number.isInteger(totalEstrelas) ? totalEstrelas : 0
		}).catch(function (err) {
			console.warn('[syncProgressNoBanco] Falha ao sincronizar:', err.message);
		});
	}

	// Grava hora_final no banco ao concluir a ultima fase (fire-and-forget).
	function registrarHoraFinal() {
		var playerId = '';
		try {
			playerId = localStorage.getItem(PLAYER_ID_STORAGE_KEY) || '';
		} catch (e) {}

		if (!playerId) {
			return;
		}

		var horaFinal = new Date().toISOString().slice(0, 19).replace('T', ' ');

		GameAPI.atualizarJogador(Number(playerId), {
			hora_final: horaFinal
		}).catch(function (err) {
			console.warn('[registrarHoraFinal] Falha ao gravar hora final:', err.message);
		});
	}

	// Calcula estrelas com base nas vidas restantes ao concluir a fase.
	// 3 vidas → 3 estrelas; 2 vidas → 2 estrelas; 1 vida → 1 estrela.
	function calcularEstrelas(vidas) {
		return Math.max(1, Math.min(3, Number(vidas) || 1));
	}

	// Nota: Marca a fase como concluida, salva estrelas e sincroniza com o banco.
	function markLessonAsCompleted(lessonNumber, stars) {
		if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > TOTAL_LESSONS) {
			return;
		}

		var earnedStars = (Number.isInteger(stars) && stars >= 1 && stars <= 3) ? stars : 3;

		const progress = loadProgressState();
		if (!progress.completedLessons.includes(lessonNumber)) {
			progress.completedLessons.push(lessonNumber);
			progress.completedLessons.sort(function (a, b) { return a - b; });
		}
		// Sempre atualiza estrelas (permite rejogar para melhorar pontuacao).
		progress.estrelasPorFase[String(lessonNumber)] = earnedStars;
		saveProgressState(progress);

		var totalEstrelas = Object.values(progress.estrelasPorFase).reduce(function (sum, s) { return sum + Number(s); }, 0);
		var proximaFase = Math.min(lessonNumber + 1, TOTAL_LESSONS);
		syncProgressNoBanco(proximaFase, progress.completedLessons, progress.estrelasPorFase, totalEstrelas);
	}

	// Nota: Verifica se a fase esta desbloqueada considerando a ordem de progressao.
	function isLessonUnlocked(lessonNumber) {
		if (lessonNumber <= 1) {
			return true;
		}

		const progress = loadProgressState();
		return progress.completedLessons.includes(lessonNumber - 1);
	}

	// Nota: Bloqueia acesso direto a fase nao liberada e redireciona para a home.
	function ensureLessonAccess(lessonNumber) {
		if (isLessonUnlocked(lessonNumber)) {
			// Informa o banco que o jogador entrou nesta fase.
			var progress = loadProgressState();
			var totalEstrelas = Object.values(progress.estrelasPorFase || {}).reduce(function (sum, s) { return sum + Number(s); }, 0);
			syncProgressNoBanco(lessonNumber, progress.completedLessons, progress.estrelasPorFase || {}, totalEstrelas);
			return true;
		}

		window.location.href = '../index.html';
		return false;
	}

	// Nota: Mapeia o numero da licao para o arquivo de pagina correspondente.
	function getPageNumberForLesson(lessonNumber) {
		if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > LAST_PLAYABLE_LESSON) {
			return null;
		}

		return lessonNumber;
	}

	// Nota: Define a quantidade de vidas por fase conforme a progressao solicitada.
	function getLivesForLesson() {
		return 3;
	}

	// Nota: Monta e controla o HUD de vidas da fase.
	function setupLessonLives(lessonNumber, statusEl, runBtn, failPanel) {
		const maxLives = getLivesForLesson(lessonNumber);
		let currentLives = maxLives;

		const hud = document.createElement('div');
		hud.className = 'lives-hud';

		const label = document.createElement('span');
		label.className = 'lives-label';
		label.textContent = 'Vidas:';
		hud.appendChild(label);

		const hearts = [];
		for (let i = 0; i < maxLives; i += 1) {
			const heart = document.createElement('img');
			heart.className = 'life-heart';
			heart.src = '../assets/img/coracao.svg';
			heart.alt = '';
			heart.setAttribute('aria-hidden', 'true');
			hud.appendChild(heart);
			hearts.push(heart);
		}

		if (statusEl && statusEl.parentNode) {
			statusEl.parentNode.insertBefore(hud, statusEl.nextSibling);
		}

		function renderLives() {
			hearts.forEach(function (heart, index) {
				heart.classList.toggle('lost', index >= currentLives);
			});
		}

		function updateFailPanelText(message) {
			if (!failPanel) {
				return;
			}

			const failFirstItem = failPanel.querySelector('.fail-list li');
			if (failFirstItem) {
				failFirstItem.textContent = message;
			}
		}

		// Nota: Quando acaba a ultima vida, limpa progresso e volta para a home.
		function resetProgressAndReturnHome() {
			try {
				localStorage.removeItem(PROGRESS_STORAGE_KEY);
			} catch (error) {
				// Ignora falhas de armazenamento.
			}

			window.location.href = '../index.html';
		}

		renderLives();

		return {
			hasLives: function () {
				return currentLives > 0;
			},
			getCurrentLives: function () {
				return currentLives;
			},
			registerFailure: function (failureReasonText) {
				if (currentLives > 0) {
					currentLives -= 1;
				}

				renderLives();

				if (currentLives > 0) {
					statusEl.className = 'status err';
					statusEl.textContent = failureReasonText + ' Vidas restantes: ' + currentLives + '.';
					updateFailPanelText(getPlayerName() + ' nao cumpriu todos os objetivos. Vidas restantes: ' + currentLives + '.');
					return currentLives;
				}

				runBtn.disabled = true;
				statusEl.className = 'status err';
				statusEl.textContent = 'Game over! Voce ficou sem vidas. Voltando para a pagina inicial...';
				updateFailPanelText(getPlayerName() + ' perdeu todas as vidas nesta fase. Recarregue para tentar novamente.');
				setTimeout(resetProgressAndReturnHome, 900);
				return 0;
			}
		};
	}

	setupHardResetOnCtrlF5();
	setupUsernameModal();

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

		setupVRPanel(textarea);
	}

	// Nota: Injeta o Painel de Controle VR na pagina de licao, permitindo inserir
	// comandos via botoes grandes — ideal para uso com oculos de realidade virtual.
	function setupVRPanel(textarea) {
		if (!textarea) {
			return;
		}

		var panelArticle = textarea.closest('.panel');
		if (!panelArticle) {
			return;
		}

		var buttonsDiv = panelArticle.querySelector('.buttons');
		if (!buttonsDiv) {
			return;
		}

		// Detecta se a fase tem comandos pegar() / largar() pelo caminho da pagina.
		var hasPickDrop = /\/pages\/pagina[3456]\.html$/i.test(path);

		var selectedRepeat = 1;

		// --- Botão de toggle ---
		var toggleBtn = document.createElement('button');
		toggleBtn.className = 'vr-toggle-btn';
		toggleBtn.type = 'button';
		toggleBtn.setAttribute('aria-expanded', 'false');
		toggleBtn.setAttribute('aria-controls', 'vrControlPanel');
		toggleBtn.innerHTML =
			'<span class="vr-toggle-icon" aria-hidden="true">&#128065;</span>' +
			' Controles VR';

		// --- Painel VR ---
		var vrPanel = document.createElement('div');
		vrPanel.id = 'vrControlPanel';
		vrPanel.className = 'vr-panel';
		vrPanel.setAttribute('role', 'region');
		vrPanel.setAttribute('aria-label', 'Painel de controle VR');

		// Insere o painel VR fora do game-shell, ao lado ESQUERDO via page-wrapper flex.
		var vrWrapper = document.createElement('div');
		vrWrapper.className = 'vr-outer-section';
		vrWrapper.appendChild(vrPanel);

		// Se a pagina tiver tutorial, centraliza verticalmente o controle VR
		// para que fique alinhado com a secao de comandos (abaixo do tutorial).
		if (document.getElementById('tutorialPanel')) {
			vrWrapper.classList.add('vr-has-tutorial');
		}

		var gameShell = document.querySelector('.game-shell');
		var pageWrapper = document.createElement('div');
		pageWrapper.className = 'page-wrapper';
		gameShell.parentNode.insertBefore(pageWrapper, gameShell);
		// VR primeiro = coluna esquerda
		pageWrapper.appendChild(vrWrapper);
		pageWrapper.appendChild(gameShell);

		toggleBtn.addEventListener('click', function () {
			var isHidden = vrPanel.classList.contains('hidden');
			vrPanel.classList.toggle('hidden');
			toggleBtn.classList.toggle('active', isHidden);
			toggleBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
		});

		// Insere um comando no textarea e dispara o evento de input para
		// que o prompt-editor atualize a coloração das linhas.
		function insertCommand(cmd) {
			var current = textarea.value;
			var lines = current.split('\n').filter(function (l) {
				return l.trim() !== '';
			});
			lines.push(cmd);
			textarea.value = lines.join('\n');
			textarea.dispatchEvent(new Event('input'));
			textarea.scrollTop = textarea.scrollHeight;
		}

		// --- Título ---
		var title = document.createElement('p');
		title.className = 'vr-panel-title';
		title.innerHTML =
			'<span aria-hidden="true">&#128065;</span> Painel de Controle VR';
		vrPanel.appendChild(title);

		// --- Seletor de repetição ---
		var repeatRow = document.createElement('div');
		repeatRow.className = 'vr-repeat-row';
		var repeatLabel = document.createElement('span');
		repeatLabel.className = 'vr-repeat-label';
		repeatLabel.textContent = 'Repetir:';
		repeatRow.appendChild(repeatLabel);

		for (var i = 1; i <= 9; i += 1) {
			(function (num) {
				var btn = document.createElement('button');
				btn.className = 'vr-repeat-btn' + (num === 1 ? ' selected' : '');
				btn.type = 'button';
				btn.textContent = String(num);
				if (num === 5) {
					btn.style.marginLeft = '4px';
				}
				btn.setAttribute('aria-label', 'Repetir ' + num + ' vez' + (num > 1 ? 'es' : ''));
				btn.addEventListener('click', function () {
					selectedRepeat = num;
					var allRepeat = repeatRow.querySelectorAll('.vr-repeat-btn');
					for (var j = 0; j < allRepeat.length; j += 1) {
						allRepeat[j].classList.remove('selected');
					}
					btn.classList.add('selected');
				});
				repeatRow.appendChild(btn);
			}(i));
		}

		// Botão 10
		(function () {
			var btn10 = document.createElement('button');
			btn10.className = 'vr-repeat-btn';
			btn10.type = 'button';
			btn10.textContent = '10';
			btn10.style.marginLeft = '4px';
			btn10.setAttribute('aria-label', 'Repetir 10 vezes');
			btn10.addEventListener('click', function () {
				selectedRepeat = 10;
				var allRepeat = repeatRow.querySelectorAll('.vr-repeat-btn');
				for (var j = 0; j < allRepeat.length; j += 1) {
					allRepeat[j].classList.remove('selected');
				}
				btn10.classList.add('selected');
			});
			repeatRow.appendChild(btn10);
		}());
		vrPanel.appendChild(repeatRow);

		// Divisor
		var divider1 = document.createElement('hr');
		divider1.className = 'vr-divider';
		vrPanel.appendChild(divider1);

		// --- D-Pad direcional ---
		var dpadWrap = document.createElement('div');
		dpadWrap.className = 'vr-dpad-wrap';

		var dpadSectionLabel = document.createElement('span');
		dpadSectionLabel.className = 'vr-section-label';
		dpadSectionLabel.textContent = 'Movimento';
		dpadWrap.appendChild(dpadSectionLabel);

		var dpadGrid = document.createElement('div');
		dpadGrid.className = 'vr-dpad';
		dpadGrid.setAttribute('role', 'group');
		dpadGrid.setAttribute('aria-label', 'Botoes de movimento');

		// Layout 3x3: posicao [linha][coluna]
		var dpadMap = {
			'0,1': { label: '▲', cmd: 'moverCima',      aria: 'Mover para cima'     },
			'1,0': { label: '◀', cmd: 'moverEsquerda',  aria: 'Mover para esquerda' },
			'1,2': { label: '▶', cmd: 'moverDireita',   aria: 'Mover para direita'  },
			'2,1': { label: '▼', cmd: 'moverBaixo',     aria: 'Mover para baixo'    }
		};

		for (var dr = 0; dr < 3; dr += 1) {
			for (var dc = 0; dc < 3; dc += 1) {
				var key = dr + ',' + dc;
				var dirData = dpadMap[key];
				if (dirData) {
					(function (data) {
						var btn = document.createElement('button');
						btn.className = 'vr-dpad-btn';
						btn.type = 'button';
						btn.textContent = data.label;
						btn.setAttribute('aria-label', data.aria);
						btn.title = data.aria;
						btn.addEventListener('click', function () {
							var repeat = selectedRepeat;
							var cmd = repeat > 1
								? data.cmd + '(' + repeat + ')'
								: data.cmd;
							insertCommand(cmd);
						});
						dpadGrid.appendChild(btn);
					}(dirData));
				} else {
					var emptyCell = document.createElement('div');
					emptyCell.className = 'vr-dpad-cell-empty';
					emptyCell.setAttribute('aria-hidden', 'true');
					dpadGrid.appendChild(emptyCell);
				}
			}
		}

		dpadWrap.appendChild(dpadGrid);
		vrPanel.appendChild(dpadWrap);

		// --- Botões pegar() / largar() (somente fases 3-6) ---
		if (hasPickDrop) {
			var divider2 = document.createElement('hr');
			divider2.className = 'vr-divider';
			vrPanel.appendChild(divider2);

			var actionLabel = document.createElement('span');
			actionLabel.className = 'vr-section-label';
			actionLabel.textContent = 'Acoes especiais';
			vrPanel.appendChild(actionLabel);

			var actionsRow = document.createElement('div');
			actionsRow.className = 'vr-actions-row';

			var specialCmds = [
				{ label: '&#128290; pegar()',  cmd: 'pegar()',  aria: 'Pegar caixa'  },
				{ label: '&#128281; largar()', cmd: 'largar()', aria: 'Largar caixa' }
			];

			specialCmds.forEach(function (item) {
				var btn = document.createElement('button');
				btn.className = 'vr-action-btn';
				btn.type = 'button';
				btn.innerHTML = item.label;
				btn.setAttribute('aria-label', item.aria);
				btn.title = item.aria;
				btn.addEventListener('click', function () {
					insertCommand(item.cmd);
				});
				actionsRow.appendChild(btn);
			});

			vrPanel.appendChild(actionsRow);
		}

		// --- Linha de edição ---
		var divider3 = document.createElement('hr');
		divider3.className = 'vr-divider';
		vrPanel.appendChild(divider3);

		var editRow = document.createElement('div');
		editRow.className = 'vr-edit-row';

		var deleteLineBtn = document.createElement('button');
		deleteLineBtn.className = 'vr-edit-btn';
		deleteLineBtn.type = 'button';
		deleteLineBtn.innerHTML = '&#9003; Apagar linha';
		deleteLineBtn.setAttribute('aria-label', 'Apagar ultima linha do codigo');
		deleteLineBtn.addEventListener('click', function () {
			var lines = textarea.value.split('\n');
			var lastNonEmpty = lines.length - 1;
			while (lastNonEmpty > 0 && !lines[lastNonEmpty].trim()) {
				lastNonEmpty -= 1;
			}
			lines.splice(lastNonEmpty, 1);
			textarea.value = lines.join('\n').replace(/\n+$/, '');
			textarea.dispatchEvent(new Event('input'));
		});

		var clearAllBtn = document.createElement('button');
		clearAllBtn.className = 'vr-edit-btn danger';
		clearAllBtn.type = 'button';
		clearAllBtn.innerHTML = '&#128465; Limpar tudo';
		clearAllBtn.setAttribute('aria-label', 'Limpar todo o codigo');
		clearAllBtn.addEventListener('click', function () {
			textarea.value = '';
			textarea.dispatchEvent(new Event('input'));
		});

		editRow.appendChild(deleteLineBtn);
		editRow.appendChild(clearAllBtn);
		vrPanel.appendChild(editRow);

		// --- Linha executar / resetar ---
		var execRow = document.createElement('div');
		execRow.className = 'vr-exec-row';

		var runVRBtn = document.createElement('button');
		runVRBtn.className = 'vr-exec-btn run';
		runVRBtn.type = 'button';
		runVRBtn.innerHTML = '&#9654; Executar';
		runVRBtn.setAttribute('aria-label', 'Executar comandos');
		runVRBtn.addEventListener('click', function () {
			var runBtn = document.getElementById('runBtn');
			if (runBtn && !runBtn.disabled) {
				runBtn.click();
			}
		});

		var resetVRBtn = document.createElement('button');
		resetVRBtn.className = 'vr-exec-btn reset';
		resetVRBtn.type = 'button';
		resetVRBtn.innerHTML = '&#8635; Resetar';
		resetVRBtn.setAttribute('aria-label', 'Resetar posicao');
		resetVRBtn.addEventListener('click', function () {
			var resetBtn = document.getElementById('resetBtn');
			if (resetBtn && !resetBtn.disabled) {
				resetBtn.click();
			}
		});

		execRow.appendChild(runVRBtn);
		execRow.appendChild(resetVRBtn);
		vrPanel.appendChild(execRow);
	}

	// Nota: Exibe no painel de vitoria a letra correspondente a fase (SENAC).
	function setupWinPanelLetter(winPanel) {
		if (!winPanel) {
			return;
		}

		const phaseMatch = path.match(/\/pages\/pagina(\d+)\.html$/);
		if (!phaseMatch) {
			return;
		}

		const phaseNumber = Number(phaseMatch[1]);
		// Fase 1 é introdução — sem letra. Fases 2-6: S E n a c
		const letterMap = { 2: 'S', 3: 'E', 4: 'n', 5: 'a', 6: 'c' };
		const letter = letterMap[phaseNumber];
		if (!letter) {
			return;
		}

		const winCard = winPanel.querySelector('.win-card');
		if (!winCard) {
			return;
		}

		let letterWrap = winCard.querySelector('.win-letter-wrap');
		if (!letterWrap) {
			letterWrap = document.createElement('div');
			letterWrap.className = 'win-letter-wrap';
			const actionGroup = winCard.querySelector('.win-actions');
			if (actionGroup) {
				winCard.insertBefore(letterWrap, actionGroup);
			} else {
				winCard.appendChild(letterWrap);
			}
		}

		const imagePath = '../assets/img/' + letter + '.png';
		const imageAlt = 'Letra ' + letter + ' desbloqueada nesta fase';
		let letterImage = letterWrap.querySelector('.win-letter-image');
		if (!letterImage) {
			letterImage = document.createElement('img');
			letterImage.className = 'win-letter-image';
			letterImage.decoding = 'async';
			letterImage.addEventListener('error', function () {
				letterWrap.classList.add('hidden');
			});
			letterWrap.appendChild(letterImage);
		}

		letterImage.src = imagePath;
		letterImage.alt = imageAlt;
	}

  // Route: home
	if (path === '/' || path.endsWith('/index.html')) {
		(function () {
			// Nota: Ajusta cards e resumo da home com base no progresso persistido.
			function renderHomeProgress() {
				const progress = loadProgressState();
				const completedSet = new Set(progress.completedLessons);
				const levelCards = Array.from(document.querySelectorAll('.level-card[data-level]'));

				if (levelCards.length) {
					levelCards
						.sort(function (cardA, cardB) {
							return Number(cardA.dataset.level) - Number(cardB.dataset.level);
						})
						.forEach(function (card) {
							const levelId = Number(card.dataset.level);
							const pageNumber = getPageNumberForLesson(levelId);
							const hasPlayablePage = pageNumber !== null;
							const isCompleted = completedSet.has(levelId);
							const isUnlocked = levelId === 1 || isCompleted || completedSet.has(levelId - 1);

							let startButton = card.querySelector('.level-btn');
							const starsRow = card.querySelector('.level-stars');
							const lockOverlay = card.querySelector('.level-lock-overlay');

							card.classList.remove('level-current', 'level-completed', 'level-locked');

							if (isCompleted) {
								card.classList.add('level-completed');
							}

							if (!isCompleted && isUnlocked) {
								card.classList.add('level-current');
							}

							if (!isUnlocked) {
								card.classList.add('level-locked');
							}

							if (lockOverlay) {
								lockOverlay.classList.toggle('hidden', isUnlocked);
								const lockText = lockOverlay.querySelector('span');
								if (lockText && levelId > 1) {
									lockText.textContent = 'Complete a Fase ' + (levelId - 1);
								}
							}

							if (isUnlocked && hasPlayablePage) {
								if (!startButton) {
									startButton = document.createElement('a');
									startButton.className = 'level-btn';
									if (lockOverlay) {
										card.insertBefore(startButton, lockOverlay);
									} else if (starsRow && starsRow.nextSibling) {
										card.insertBefore(startButton, starsRow.nextSibling);
									} else {
										card.appendChild(startButton);
									}
								}

								startButton.href = 'pages/pagina' + pageNumber + '.html';
								startButton.innerHTML = isCompleted
									? '<i class="fas fa-redo"></i> Rejogar'
									: '<i class="fas fa-play"></i> Jogar';
							} else if (startButton) {
								startButton.remove();
							}

							// Atualiza estrelas preenchidas com base no progresso real
							if (starsRow) {
								const earned = isCompleted ? (Number(progress.estrelasPorFase[String(levelId)]) || 0) : 0;
								const starIcons = starsRow.querySelectorAll('i');
								starIcons.forEach(function (icon, idx) {
									icon.className = idx < earned ? 'fas fa-star' : 'far fa-star';
								});
								starsRow.classList.remove('stars-earned-1', 'stars-earned-2', 'stars-earned-3');
								if (isCompleted && earned > 0) {
									starsRow.classList.add('stars-earned-' + earned);
								}
							}
						});
				}

				const completedCount = progress.completedLessons.length;
				let unlockedCount = 0;
				for (let lesson = 1; lesson <= TOTAL_LESSONS; lesson += 1) {
					if (lesson === 1 || completedSet.has(lesson - 1) || completedSet.has(lesson)) {
						unlockedCount += 1;
					}
				}

				const percentage = Math.floor((completedCount / TOTAL_LESSONS) * 100);
				const headerStatValues = document.querySelectorAll('.header-stat span');
				if (headerStatValues[0]) {
					headerStatValues[0].textContent = '3';
				}
				if (headerStatValues[1]) {
					headerStatValues[1].textContent = (completedCount * 3) + ' / ' + (TOTAL_LESSONS * 3);
				}

				var faseAtualLocal = Math.min(completedCount + 1, TOTAL_LESSONS);
				var statFaseEl = document.getElementById('stat-fase');
				var statProgressoEl = document.getElementById('stat-progresso');
				if (statFaseEl) {
					statFaseEl.textContent = 'Fase ' + faseAtualLocal;
				}
				if (statProgressoEl) {
					statProgressoEl.textContent = percentage + '%';
				}
					loadStatsFromDB();

				// Substitui "Tom" nos descritivos das fases pelo nome do jogador
				var playerName = getPlayerName();
				document.querySelectorAll('.level-desc').forEach(function (el) {
					el.textContent = el.textContent.replace(/\bTom\b/g, playerName);
				});

				// Oculta a grade de fases ao completar tudo
				const levelGrid = document.querySelector('.level-grid');
				if (levelGrid) {
					levelGrid.style.display = completedCount >= TOTAL_LESSONS ? 'none' : '';
				}

				// Banner SENAC ao completar todas as fases
				const senacBanner = document.getElementById('senacBanner');
				if (senacBanner) {
					const allDone = completedCount >= TOTAL_LESSONS;
					senacBanner.classList.toggle('hidden', !allDone);
				}
			}

			function calcularTempo(horaInicial, horaFinal) {
				if (!horaInicial) return '0m';
				var inicio = new Date(horaInicial.replace(' ', 'T'));
				var fim = horaFinal ? new Date(horaFinal.replace(' ', 'T')) : new Date();
				var diffMs = fim - inicio;
				if (isNaN(diffMs) || diffMs < 0) return '0m';
				var diffMin = Math.floor(diffMs / 60000);
				if (diffMin < 60) return diffMin + 'm';
				var h = Math.floor(diffMin / 60);
				var m = diffMin % 60;
				return h + 'h ' + (m < 10 ? '0' : '') + m + 'm';
			}

			function loadStatsFromDB() {
				var playerId = '';
				try { playerId = localStorage.getItem(PLAYER_ID_STORAGE_KEY) || ''; } catch (e) {}
				if (!playerId) return;
				GameAPI.getJogador(Number(playerId)).then(function (data) {
					if (!data || !data.jogador) return;
					var j = data.jogador;
					var elFase = document.getElementById('stat-fase');
					var elTempo = document.getElementById('stat-tempo');
					var elProgresso = document.getElementById('stat-progresso');
					if (elFase) {
						elFase.textContent = 'Fase ' + (j.fase_atual || 1);
					}
					if (elTempo) {
						elTempo.textContent = calcularTempo(j.hora_inicial, j.hora_final);
					}
					if (elProgresso) {
						var fases = Array.isArray(j.fases_concluidas) ? j.fases_concluidas : [];
						elProgresso.textContent = Math.floor((fases.length / TOTAL_LESSONS) * 100) + '%';
					}
				}).catch(function () {});
			}

			document.addEventListener('DOMContentLoaded', renderHomeProgress);

			document.addEventListener('DOMContentLoaded', function () {
				var resetarBtn = document.getElementById('resetarBtn');
				if (!resetarBtn) { return; }
				resetarBtn.addEventListener('click', function () {
					try {
						localStorage.removeItem(PROGRESS_STORAGE_KEY);
						localStorage.removeItem(USERNAME_STORAGE_KEY);
						localStorage.removeItem(PLAYER_ID_STORAGE_KEY);
					} catch (e) {}
					window.location.reload();
				});
			});
		})();
    return;
  }

  // Route: pagina1
	if (path.endsWith('/pages/pagina1.html')) {
		if (!ensureLessonAccess(1)) {
			return;
		}
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

		setupWinPanelLetter(winPanel);
		const livesSystem = setupLessonLives(1, statusEl, runBtn, failPanel);

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
    	return raw.replace(/\s+/g, '');
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseMovementCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);
    	const match = cmd.match(/^(moverDireita|moverEsquerda|moverCima|moverBaixo)(?:\((\d+)\))?$/);

    	if (!match) {
    		return null;
    	}

    	const action = match[1];
    	const amount = match[2] ? Number(match[2]) : 1;

    	if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
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
    function calculateStars() {
    	return livesSystem.getCurrentLives();
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps) {
    	const stars = calculateStars();
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

		if (!livesSystem.hasLives()) {
			statusEl.className = 'status err';
			statusEl.textContent = 'Game over! Voce ficou sem vidas nesta fase.';
			return;
		}

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

    			if (parsed.action === 'moverDireita') {
    				nextCol += 1;
    			} else if (parsed.action === 'moverEsquerda') {
    				nextCol -= 1;
    			} else if (parsed.action === 'moverCima') {
    				nextRow -= 1;
    			} else if (parsed.action === 'moverBaixo') {
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
		const starsEarned1 = calculateStars(executedSteps);
		markLessonAsCompleted(1, starsEarned1);
    		showWinPanel(executedSteps);
    		return;
    	}

    	state = { col: start.col, row: start.row };
    	draw();
		livesSystem.registerFailure('Falha na rota: a fase foi resetada para nova tentativa.');
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetBot() {
    	cmdInput.value = '';
    	cmdInput.dispatchEvent(new Event('input'));
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
		if (!ensureLessonAccess(2)) {
			return;
		}
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
    const starRating = document.getElementById('starRating');
    const failPanel = document.getElementById('failPanel');
    const failPanelOk = document.getElementById('failPanelOk');

		setupWinPanelLetter(winPanel);
		const livesSystem = setupLessonLives(2, statusEl, runBtn, failPanel);

    const start = {
    	col: Math.floor(COLS / 2),
    	row: Math.floor(ROWS / 2)
    };

    const chipVariations = [
		[{ col: 4, row: 3 }, { col: 6, row: 3 }, { col: 4, row: 5 }, { col: 6, row: 5 }],
		[{ col: 1, row: 1 }, { col: 9, row: 1 }, { col: 1, row: 7 }, { col: 9, row: 7 }],
		[{ col: 5, row: 1 }, { col: 2, row: 4 }, { col: 8, row: 4 }, { col: 5, row: 7 }],
		[{ col: 3, row: 2 }, { col: 7, row: 2 }, { col: 3, row: 6 }, { col: 7, row: 6 }],
		[{ col: 2, row: 2 }, { col: 2, row: 6 }, { col: 8, row: 2 }, { col: 8, row: 6 }],
		[{ col: 5, row: 2 }, { col: 3, row: 4 }, { col: 7, row: 4 }, { col: 5, row: 6 }],
		[{ col: 1, row: 3 }, { col: 3, row: 1 }, { col: 7, row: 7 }, { col: 9, row: 5 }],
		[{ col: 1, row: 5 }, { col: 3, row: 7 }, { col: 7, row: 1 }, { col: 9, row: 3 }],
		[{ col: 2, row: 1 }, { col: 4, row: 7 }, { col: 8, row: 1 }, { col: 9, row: 6 }],
		[{ col: 4, row: 2 }, { col: 6, row: 2 }, { col: 4, row: 6 }, { col: 6, row: 6 }]
    ];

    let activeVariationIndex = -1;
    let minPassosFase2 = 0;
    let chips = [];

    let state = {
    	col: start.col,
    	row: start.row,
    	collected: new Set()
    };

    const chipElements = new Map();

    function buildChipsForVariation(variationIndex) {
		return chipVariations[variationIndex].map(function (position, index) {
			return {
				id: index,
				col: position.col,
				row: position.row
			};
		});
    }


function calcularMinPassosFase2(variacaoChips) {
		var pos = { col: start.col, row: start.row };
		var restantes = variacaoChips.slice();
		var total = 0;
		while (restantes.length) {
			var minDist = Infinity;
			var idx = 0;
			for (var i = 0; i < restantes.length; i += 1) {
				var d = Math.abs(restantes[i].col - pos.col) + Math.abs(restantes[i].row - pos.row);
				if (d < minDist) { minDist = d; idx = i; }
			}
			total += minDist;
			pos = restantes.splice(idx, 1)[0];
		}
		return total;
	}

	function applyVariationByIndex(variationIndex) {
		activeVariationIndex = variationIndex;
		chips = buildChipsForVariation(activeVariationIndex);
		minPassosFase2 = calcularMinPassosFase2(chips);
	}

    function selectRandomVariationOnLessonStart() {
		const randomVariationIndex = Math.floor(Math.random() * chipVariations.length);
		applyVariationByIndex(randomVariationIndex);
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

    // Nota: Padroniza o texto do comando para facilitar a validacao.
    function normalizeCommand(raw) {
    	return raw.replace(/\s+/g, '');
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseMovementCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);
    	const match = cmd.match(/^(moverDireita|moverEsquerda|moverCima|moverBaixo)(?:\((\d+)\))?$/);

    	if (!match) {
    		return null;
    	}

    	const action = match[1];
    	const amount = match[2] ? Number(match[2]) : 1;

    	if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
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
	    winSummary.textContent = 'Voce coletou as 4 moedas em ' + executedSteps + ' passos.';
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
	    chipCounter.textContent = 'Moedas coletadas: ' + collectedCount + '/' + chips.length;
    	chipCounter.classList.toggle('done', collectedCount === chips.length);
    }

    // Nota: Cria um breve efeito visual para indicar a coleta do chip.
    function spawnChipCollectEffect(col, row) {
    	const pop = document.createElement('div');
    	pop.className = 'chip-pop';

    	const ring = document.createElement('div');
    	ring.className = 'chip-pop-ring';
    	pop.appendChild(ring);

    	for (let i = 0; i < 8; i += 1) {
    		const spark = document.createElement('span');
    		spark.className = 'chip-pop-spark';
    		spark.style.setProperty('--spark-angle', String(i * 45) + 'deg');
    		pop.appendChild(spark);
    	}

    	setEntityPosition(pop, col, row);
    	chipsLayer.appendChild(pop);

    	pop.addEventListener('animationend', function () {
    		pop.remove();
    	});
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
			spawnChipCollectEffect(chip.col, chip.row);
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

		if (!livesSystem.hasLives()) {
			statusEl.className = 'status err';
			statusEl.textContent = 'Game over! Voce ficou sem vidas nesta fase.';
			return;
		}

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

				if (parsed.action === 'moverDireita') {
					nextCol += 1;
				} else if (parsed.action === 'moverEsquerda') {
					nextCol -= 1;
				} else if (parsed.action === 'moverCima') {
					nextRow -= 1;
				} else if (parsed.action === 'moverBaixo') {
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
	    	statusEl.textContent = 'Perfeito! Voce coletou todas as moedas.';
	    	const starsEarned2 = livesSystem.getCurrentLives();
	    	markLessonAsCompleted(2, starsEarned2);
			showWinPanel(executedSteps, starsEarned2);
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
		livesSystem.registerFailure('Falha na rota: a fase foi resetada para nova tentativa.');
		showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson(customStatusText) {
    	cmdInput.value = '';
    	cmdInput.dispatchEvent(new Event('input'));
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
		statusEl.textContent = customStatusText || 'Boneco no centro.';
    }

    runBtn.addEventListener('click', executeCommands);
	resetBtn.addEventListener('click', function () {
		resetLesson();
	});
    docsBtn.addEventListener('click', showDocsPanel);
    errorPanelClose.addEventListener('click', hideErrorPanel);
    docsPanelClose.addEventListener('click', hideDocsPanel);
    failPanelOk.addEventListener('click', hideFailPanel);

	selectRandomVariationOnLessonStart();
	buildGrid();
    resetLesson();
    })();
    return;
  }

  // Route: pagina3 (legacy - desativada)
	if (path.endsWith('/pages/pagina3-parametros.html')) {
		if (!ensureLessonAccess(3)) {
			return;
		}
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

		setupWinPanelLetter(winPanel);
		const livesSystem = setupLessonLives(3, statusEl, runBtn, failPanel);

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
    	return raw.replace(/\s+/g, '');
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseMovementCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);
    	const match = cmd.match(/^(moverDireita|moverEsquerda|moverCima|moverBaixo)(?:\((\d+)\))?$/);

    	if (!match) {
    		return null;
    	}

    	const action = match[1];
    	const amount = match[2] ? Number(match[2]) : 1;
    	const hasParameter = Boolean(match[2]);

    	if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
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

		if (!livesSystem.hasLives()) {
			statusEl.className = 'status err';
			statusEl.textContent = 'Game over! Voce ficou sem vidas nesta fase.';
			return;
		}

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

    			if (parsed.action === 'moverDireita') {
    				nextCol += 1;
    			} else if (parsed.action === 'moverEsquerda') {
    				nextCol -= 1;
    			} else if (parsed.action === 'moverCima') {
    				nextRow -= 1;
    			} else if (parsed.action === 'moverBaixo') {
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
				livesSystem.registerFailure('Falha: voce chegou ao alvo sem usar parametro. A fase foi resetada.');
    			showFailPanel();
    			return;
    		}

    		statusEl.className = 'status ok';
    		statusEl.textContent = 'Excelente! Voce usou parametros e concluiu a pratica.';
	    	markLessonAsCompleted(3);
    		showWinPanel(executedSteps);
    		return;
    	}

    	state = { col: start.col, row: start.row };
    	draw();
		livesSystem.registerFailure('Falha na rota: a fase foi resetada para nova tentativa.');
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson() {
    	cmdInput.value = '';
    	cmdInput.dispatchEvent(new Event('input'));
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

  // Route: pagina4 (legacy - desativada)
	if (path.endsWith('/pages/pagina4-labirinto.html')) {
		if (!ensureLessonAccess(4)) {
			return;
		}
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

		setupWinPanelLetter(winPanel);
		const livesSystem = setupLessonLives(4, statusEl, runBtn, failPanel);

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
    	return raw.replace(/\s+/g, '');
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseMovementCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);
    	const match = cmd.match(/^(moverDireita|moverEsquerda|moverCima|moverBaixo)(?:\((\d+)\))?$/);

    	if (!match) {
    		return null;
    	}

    	const action = match[1];
    	const amount = match[2] ? Number(match[2]) : 1;

    	if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
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
    function calculateStars() {
    	return livesSystem.getCurrentLives();
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps, blockedMoves) {
    	const stars = calculateStars();
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

    	if (action === 'moverDireita') {
    		nextCol += 1;
    	} else if (action === 'moverEsquerda') {
    		nextCol -= 1;
    	} else if (action === 'moverCima') {
    		nextRow -= 1;
    	} else if (action === 'moverBaixo') {
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

		if (!livesSystem.hasLives()) {
			statusEl.className = 'status err';
			statusEl.textContent = 'Game over! Voce ficou sem vidas nesta fase.';
			return;
		}

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
		const starsEarned4 = calculateStars(executedSteps);
	    	markLessonAsCompleted(4, starsEarned4);
    		showWinPanel(executedSteps, blockedMoves);
    		return;
    	}

    	state = { col: start.col, row: start.row };
    	draw();
		livesSystem.registerFailure('Falha na rota: a fase foi resetada para nova tentativa.');
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson() {
    	cmdInput.value = '';
    	cmdInput.dispatchEvent(new Event('input'));
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
    resetBtn.addEventListener('click', function () {
		resetLesson();
	});
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
		if (!ensureLessonAccess(3)) {
			return;
		}
    (function () {
    const CELL = 52;
    const COLS = 11;
    const ROWS = 9;

    const tutorialPanel = document.getElementById('tutorialPanel');
    const practicePanel = document.getElementById('practicePanel');
    const startPracticeBtn = document.getElementById('startPracticeBtn');
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

		setupWinPanelLetter(winPanel);
		const livesSystem = setupLessonLives(3, statusEl, runBtn, failPanel);

    const lessonVariations = [
		{ startBot: { col: 1, row: 7 }, startBox: { col: 3, row: 5 }, target: { col: 9, row: 1 } },
		{ startBot: { col: 1, row: 6 }, startBox: { col: 2, row: 3 }, target: { col: 8, row: 1 } },
		{ startBot: { col: 2, row: 7 }, startBox: { col: 4, row: 4 }, target: { col: 9, row: 2 } },
		{ startBot: { col: 1, row: 5 }, startBox: { col: 5, row: 6 }, target: { col: 8, row: 2 } },
		{ startBot: { col: 3, row: 7 }, startBox: { col: 2, row: 2 }, target: { col: 9, row: 3 } },
		{ startBot: { col: 2, row: 6 }, startBox: { col: 6, row: 5 }, target: { col: 7, row: 1 } },
		{ startBot: { col: 1, row: 7 }, startBox: { col: 4, row: 2 }, target: { col: 8, row: 4 } },
		{ startBot: { col: 2, row: 5 }, startBox: { col: 7, row: 6 }, target: { col: 9, row: 1 } },
		{ startBot: { col: 3, row: 6 }, startBox: { col: 5, row: 3 }, target: { col: 7, row: 2 } },
		{ startBot: { col: 1, row: 4 }, startBox: { col: 6, row: 6 }, target: { col: 8, row: 3 } }
    ];

    let activeVariationIndex = -1;
    let minPassosFase3 = 0;
    let startBot = { col: 1, row: ROWS - 2 };
    let startBox = { col: 3, row: ROWS - 4 };
    let target = { col: COLS - 2, row: 1 };


	function calcularMinPassosFase3() {
		var toBox = Math.abs(startBot.col - startBox.col) + Math.abs(startBot.row - startBox.row);
		var toTarget = Math.abs(startBox.col - target.col) + Math.abs(startBox.row - target.row);
		return toBox + 1 + toTarget + 1;
	}

	function applyVariationByIndex(variationIndex) {
		const variation = lessonVariations[variationIndex];
		activeVariationIndex = variationIndex;
		startBot = { col: variation.startBot.col, row: variation.startBot.row };
		startBox = { col: variation.startBox.col, row: variation.startBox.row };
		target = { col: variation.target.col, row: variation.target.row };
		minPassosFase3 = calcularMinPassosFase3();
	}

	function selectRandomVariationOnLessonStart() {
		const randomVariationIndex = Math.floor(Math.random() * lessonVariations.length);
		applyVariationByIndex(randomVariationIndex);
	}


	function createInitialState() {
		return {
			botCol: startBot.col,
			botRow: startBot.row,
			boxCol: startBox.col,
			boxRow: startBox.row,
			carrying: false,
			delivered: false,
			usedPickCommand: false,
			usedDropCommand: false
		};
	}

    let state = createInitialState();



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
    	return raw.replace(/\s+/g, '');
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);

    	if (cmd === 'pegar()') {
    		return { action: 'pegar', amount: 1 };
    	}

    	if (cmd === 'largar()') {
    		return { action: 'largar', amount: 1 };
    	}

    	const moveMatch = cmd.match(/^(moverDireita|moverEsquerda|moverCima|moverBaixo)(?:\((\d+)\))?$/);
    	if (!moveMatch) {
    		return null;
    	}

    	const action = moveMatch[1];
    	const amount = moveMatch[2] ? Number(moveMatch[2]) : 1;
    	if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
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
    	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps, stars) {
		winSummary.textContent = 'Voce concluiu em ' + executedSteps + ' passos usando pegar().';
    	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
    	starRating.classList.add('stars-' + stars);
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

    	if (action === 'moverDireita') {
    		nextCol += 1;
    	} else if (action === 'moverEsquerda') {
    		nextCol -= 1;
    	} else if (action === 'moverCima') {
    		nextRow -= 1;
    	} else if (action === 'moverBaixo') {
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

		if (!livesSystem.hasLives()) {
			statusEl.className = 'status err';
			statusEl.textContent = 'Game over! Voce ficou sem vidas nesta fase.';
			return;
		}

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
    		const starsEarned3 = livesSystem.getCurrentLives();
	    	markLessonAsCompleted(3, starsEarned3);
    		showWinPanel(executedSteps, starsEarned3);
    		return;
    	}

		state = createInitialState();
    	draw();
		livesSystem.registerFailure('Falha na rota: a fase foi resetada para nova tentativa.');
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson(customStatusText) {
    	cmdInput.value = '';
    	cmdInput.dispatchEvent(new Event('input'));
    	hideErrorPanel();
    	hideDocsPanel();
    	hideWinPanel();
    	hideFailPanel();
		state = createInitialState();
    	draw();
    	statusEl.className = 'status';
		statusEl.textContent = customStatusText || 'Posicao resetada para nova tentativa.';
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

	selectRandomVariationOnLessonStart();
	buildGrid();
    resetLesson();

    })();
    return;
  }

  // Route: pagina4
	if (path.endsWith('/pages/pagina4.html')) {
		if (!ensureLessonAccess(4)) {
			return;
		}
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
    const starRating = document.getElementById('starRating');
    const failPanel = document.getElementById('failPanel');
    const failPanelOk = document.getElementById('failPanelOk');

		setupWinPanelLetter(winPanel);
		let livesSystem = null;

    const lessonVariations = [
    	{ bot: { col: 1, row: 7  }, packages: [{ id: 'red', col: 2, row: 6 }, { id: 'blue', col: 4, row: 4 }, { id: 'green', col: 6, row: 2 }], bases: [{ id: 'red', col: 8, row: 1 }, { id: 'blue', col: 8, row: 3 }, { id: 'green', col: 8, row: 5 }] },
    	{ bot: { col: 0, row: 0  }, packages: [{ id: 'red', col: 3, row: 7 }, { id: 'blue', col: 5, row: 5 }, { id: 'green', col: 7, row: 3 }], bases: [{ id: 'red', col: 10, row: 8 }, { id: 'blue', col: 10, row: 4 }, { id: 'green', col: 10, row: 0 }] },
    	{ bot: { col: 10, row: 8 }, packages: [{ id: 'red', col: 8, row: 6 }, { id: 'blue', col: 5, row: 3 }, { id: 'green', col: 2, row: 1 }], bases: [{ id: 'red', col: 0, row: 7 }, { id: 'blue', col: 0, row: 4 }, { id: 'green', col: 0, row: 1 }] },
    	{ bot: { col: 5, row: 8  }, packages: [{ id: 'red', col: 1, row: 1 }, { id: 'blue', col: 9, row: 1 }, { id: 'green', col: 5, row: 5 }], bases: [{ id: 'red', col: 9, row: 7 }, { id: 'blue', col: 1, row: 7 }, { id: 'green', col: 3, row: 4 }] },
    	{ bot: { col: 0, row: 4  }, packages: [{ id: 'red', col: 7, row: 7 }, { id: 'blue', col: 7, row: 1 }, { id: 'green', col: 7, row: 4 }], bases: [{ id: 'red', col: 10, row: 7 }, { id: 'blue', col: 10, row: 1 }, { id: 'green', col: 10, row: 4 }] },
    	{ bot: { col: 10, row: 0 }, packages: [{ id: 'red', col: 2, row: 7 }, { id: 'blue', col: 5, row: 6 }, { id: 'green', col: 1, row: 4 }], bases: [{ id: 'red', col: 4, row: 0 }, { id: 'blue', col: 8, row: 5 }, { id: 'green', col: 0, row: 8 }] },
    	{ bot: { col: 0, row: 8  }, packages: [{ id: 'red', col: 8, row: 2 }, { id: 'blue', col: 6, row: 0 }, { id: 'green', col: 9, row: 5 }], bases: [{ id: 'red', col: 2, row: 3 }, { id: 'blue', col: 4, row: 6 }, { id: 'green', col: 1, row: 4 }] },
    	{ bot: { col: 10, row: 4 }, packages: [{ id: 'red', col: 1, row: 2 }, { id: 'blue', col: 4, row: 5 }, { id: 'green', col: 7, row: 7 }], bases: [{ id: 'red', col: 9, row: 0 }, { id: 'blue', col: 6, row: 2 }, { id: 'green', col: 3, row: 5 }] },
    	{ bot: { col: 5, row: 0  }, packages: [{ id: 'red', col: 1, row: 8 }, { id: 'blue', col: 5, row: 7 }, { id: 'green', col: 9, row: 8 }], bases: [{ id: 'red', col: 9, row: 2 }, { id: 'blue', col: 3, row: 4 }, { id: 'green', col: 0, row: 6 }] },
    	{ bot: { col: 5, row: 4  }, packages: [{ id: 'red', col: 0, row: 0 }, { id: 'blue', col: 10, row: 0 }, { id: 'green', col: 0, row: 8 }], bases: [{ id: 'red', col: 10, row: 8 }, { id: 'blue', col: 0, row: 4 }, { id: 'green', col: 10, row: 4 }] }
    ];

    let activeVariationIndex = -1;
    let minPassosFase4 = 37;
    let startBot = { col: 1, row: ROWS - 2 };
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


	function calcularMinPassosFase4() {
		var perms = [
			[0, 1, 2], [0, 2, 1], [1, 0, 2],
			[1, 2, 0], [2, 0, 1], [2, 1, 0]
		];
		var best = Infinity;
		perms.forEach(function (perm) {
			var pos = { col: startBot.col, row: startBot.row };
			var total = 0;
			perm.forEach(function (i) {
				var pkg = packages[i];
				var base = bases.find(function (b) { return b.id === pkg.id; });
				total += Math.abs(pkg.col - pos.col) + Math.abs(pkg.row - pos.row) + 1;
				pos = { col: pkg.col, row: pkg.row };
				total += Math.abs(base.col - pos.col) + Math.abs(base.row - pos.row) + 1;
				pos = { col: base.col, row: base.row };
			});
			if (total < best) best = total;
		});
		return best;
	}

	function applyVariationByIndex(variationIndex) {
		const v = lessonVariations[variationIndex];
		activeVariationIndex = variationIndex;
		startBot.col = v.bot.col;
		startBot.row = v.bot.row;
		v.packages.forEach(function (vp) {
			const pkg = packages.find(function (p) { return p.id === vp.id; });
			if (pkg) { pkg.col = vp.col; pkg.row = vp.row; }
		});
		v.bases.forEach(function (vb) {
			const base = bases.find(function (b) { return b.id === vb.id; });
			if (base) { base.col = vb.col; base.row = vb.row; }
		});
		minPassosFase4 = calcularMinPassosFase4();
	}

	function selectRandomVariationOnLessonStart() {
		applyVariationByIndex(Math.floor(Math.random() * lessonVariations.length));
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
    	return raw.replace(/\s+/g, '');
    }

    // Nota: Valida e interpreta um comando digitado no prompt.
    function parseCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);

    	if (cmd === 'pegar()') {
    		return { action: 'pegar', amount: 1 };
    	}

    	if (cmd === 'largar()') {
    		return { action: 'largar', amount: 1 };
    	}

    	const moveMatch = cmd.match(/^(moverDireita|moverEsquerda|moverCima|moverBaixo)(?:\((\d+)\))?$/);
    	if (!moveMatch) {
    		return null;
    	}

    	const action = moveMatch[1];
    	const amount = moveMatch[2] ? Number(moveMatch[2]) : 1;
    	if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
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
    	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
    }

    // Nota: Exibe o painel ou feedback correspondente desta etapa.
    function showWinPanel(executedSteps, stars) {
    	winSummary.textContent = 'Voce entregou todos os pacotes em ' + executedSteps + ' passos.';
    	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
    	starRating.classList.add('stars-' + stars);
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

    	if (action === 'moverDireita') {
    		nextCol += 1;
    	} else if (action === 'moverEsquerda') {
    		nextCol -= 1;
    	} else if (action === 'moverCima') {
    		nextRow -= 1;
    	} else if (action === 'moverBaixo') {
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
    	const v = activeVariationIndex >= 0 ? lessonVariations[activeVariationIndex] : null;
    	packages.forEach(function (pkg) {
    		const vp = v ? v.packages.find(function (p) { return p.id === pkg.id; }) : null;
    		if (vp) { pkg.col = vp.col; pkg.row = vp.row; }
    		pkg.delivered = false;
    	});
    }

	function colorToRgba(hexColor, alphaValue) {
		const normalized = hexColor.replace('#', '');
		const expanded = normalized.length === 3
			? normalized.split('').map(function (char) { return char + char; }).join('')
			: normalized;
		const numeric = Number.parseInt(expanded, 16);
		const red = (numeric >> 16) & 255;
		const green = (numeric >> 8) & 255;
		const blue = numeric & 255;
		return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alphaValue + ')';
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
		baseVisual.style.color = base.color;
		baseVisual.style.background = colorToRgba(base.color, 0.18);
		baseVisual.style.borderColor = base.color;
		baseVisual.style.boxShadow = 'inset 0 0 0 1px ' + colorToRgba(base.color, 0.28);
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
		packageVisual.style.background = 'linear-gradient(180deg, ' + packageItem.color + ', ' + packageItem.color + ')';
		packageVisual.style.border = '2px solid ' + colorToRgba(packageItem.color, 0.9);
		packageVisual.style.boxShadow = 'inset 0 0 0 1px rgba(255, 255, 255, 0.35), 0 4px 10px rgba(15, 23, 42, 0.12)';
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
    	if (livesSystem && !livesSystem.hasLives()) {
    		return;
    	}

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
    		const starsEarned4 = livesSystem.getCurrentLives();
	    	markLessonAsCompleted(4, starsEarned4);
    		showWinPanel(executedSteps, starsEarned4);
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
    	if (livesSystem) { livesSystem.registerFailure('Falha na rota: a fase foi resetada para nova tentativa.'); }
    	showFailPanel();
    }

    // Nota: Restaura estados e elementos para reiniciar a tentativa atual.
    function resetLesson(customStatusText) {
    	cmdInput.value = '';
    	cmdInput.dispatchEvent(new Event('input'));
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
    	renderBases();
    	renderPackages();
    	refreshLayerPositions();
    	draw();
    	statusEl.className = 'status';
    	statusEl.textContent = customStatusText || 'Posicao resetada para nova tentativa.';
    }

    // Nota: Troca do tutorial para a area pratica da licao.
    function startPractice() {
    	tutorialPanel.classList.add('hidden');
    	practicePanel.classList.remove('hidden');
    	livesSystem = setupLessonLives(4, statusEl, runBtn, failPanel);
    	resetLesson();
		practicePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    runBtn.addEventListener('click', executeCommands);
    resetBtn.addEventListener('click', resetLesson);
    docsBtn.addEventListener('click', showDocsPanel);
    errorPanelClose.addEventListener('click', hideErrorPanel);
    docsPanelClose.addEventListener('click', hideDocsPanel);
    failPanelOk.addEventListener('click', hideFailPanel);
    startPracticeBtn.addEventListener('click', startPractice);

    selectRandomVariationOnLessonStart();
    buildGrid();
    resetLesson();

    })();
    return;
  }

  // Route: pagina5
	if (path.endsWith('/pages/pagina5.html')) {
		if (!ensureLessonAccess(5)) {
			return;
		}
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
    const starRating = document.getElementById('starRating');
    const failPanel = document.getElementById('failPanel');
    const failPanelOk = document.getElementById('failPanelOk');

		setupWinPanelLetter(winPanel);
		let livesSystem = null;


	let startBot = { col: 1, row: ROWS - 2 };
	let minPassosFase5 = 0;
	const defaultDoorCell = { col: 6, row: 5 };
	let doorCell = { col: defaultDoorCell.col, row: defaultDoorCell.row };
	const leftPackageIds = ['red', 'blue'];

	const bases = [
		{ id: 'red', col: 2, row: 1, color: '#ef4444' },
		{ id: 'blue', col: 4, row: 2, color: '#3b82f6' },
		{ id: 'green', col: 10, row: 2, color: '#22c55e' }
	];

	// initial package positions are mutable per variation
	let initialPackages = {
		red: { col: 2, row: 8 },
		blue: { col: 4, row: 9 },
		green: { col: 10, row: 8 }
	};

	let packages = [
		{ id: 'red', col: initialPackages.red.col, row: initialPackages.red.row, color: '#ef4444', delivered: false },
		{ id: 'blue', col: initialPackages.blue.col, row: initialPackages.blue.row, color: '#3b82f6', delivered: false },
		{ id: 'green', col: initialPackages.green.col, row: initialPackages.green.row, color: '#22c55e', delivered: false }
	];

	// Nota: Corredores de 1 celula com varias bifurcacoes, deixando o mapa menos espacoso.
	const baseOpenCells = new Set([
	    // Inicio e caixas da esquerda
	    '1,9', '1,8', '2,8', '2,9', '3,9', '4,9',

	    // Rotas para entregar red e blue
	    '2,7', '2,6', '2,5', '1,5', '1,4', '1,3', '1,2', '2,2', '2,1',
	    '3,2', '4,2', '4,3', '4,4', '4,5', '4,6', '4,7', '3,7', '3,8',
	    '3,6', '3,5',

	    // Acesso a porta
	    '5,5', '6,5',

	    // Lado direito: caixa final e base
	    '7,5', '8,5', '9,5', '10,5', '10,6', '10,7', '10,8',
	    '11,7', '11,6', '11,5', '11,4', '10,4', '10,3', '10,2',

	    // Bifurcacoes (rotas alternativas curtas)
	    '8,4', '9,4', '8,6', '9,6', '9,7',
	    '8,3', '9,3', '8,2', '9,2'
    ]);

    // runtime openCells (can be adjusted by variation)
    let openCells = new Set(baseOpenCells);


    let mazeWalls = [];
    let wallSet = new Set();

    function rebuildMazeWalls() {
    	mazeWalls = [];
    	for (let row = 0; row < ROWS; row += 1) {
    		for (let col = 0; col < COLS; col += 1) {
    			const key = col + ',' + row;
   			const isBorder = row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1;
   			if (isBorder || !openCells.has(key)) {
   				mazeWalls.push({ col, row });
   			}
   		}
    	}

    	wallSet = new Set(mazeWalls.map(wall => wall.col + ',' + wall.row));
    }

	// Nota: Busca um caminho ignorando paredes (uso para escavar uma rota quando a variacao isola areas)
	function findPathAny(startCol, startRow, goalCol, goalRow) {
		const startKey = startCol + ',' + startRow;
		const goalKey = goalCol + ',' + goalRow;
		const visited = new Set([startKey]);
		const prev = new Map();
		const queue = [{ col: startCol, row: startRow }];

		function neighbors(c, r) {
			return [
				{ col: c + 1, row: r },
				{ col: c - 1, row: r },
				{ col: c, row: r + 1 },
				{ col: c, row: r - 1 }
			];
		}

		while (queue.length) {
			const cur = queue.shift();
			const key = cur.col + ',' + cur.row;
			if (key === goalKey) {
				// reconstruct
				const path = [];
				let p = key;
				while (p) {
					const parts = p.split(',');
					path.push({ col: Number(parts[0]), row: Number(parts[1]) });
					p = prev.get(p);
				}
				path.reverse();
				return path;
			}

			for (const n of neighbors(cur.col, cur.row)) {
				if (n.col <= 0 || n.col >= COLS - 1 || n.row <= 0 || n.row >= ROWS - 1) {
					continue;
				}
				const nk = n.col + ',' + n.row;
				if (visited.has(nk)) continue;
				visited.add(nk);
				prev.set(nk, key);
				queue.push(n);
			}
		}

		return null;
	}

	function isReachableUsingOpenCells(fromCol, fromRow, toCol, toRow) {
		const startKey = fromCol + ',' + fromRow;
		const goalKey = toCol + ',' + toRow;
		if (!openCells.has(startKey) || !openCells.has(goalKey)) return false;
		const visited = new Set([startKey]);
		const queue = [{ col: fromCol, row: fromRow }];

		while (queue.length) {
			const cur = queue.shift();
			const key = cur.col + ',' + cur.row;
			if (key === goalKey) return true;
			const neigh = [
				{ col: cur.col + 1, row: cur.row },
				{ col: cur.col - 1, row: cur.row },
				{ col: cur.col, row: cur.row + 1 },
				{ col: cur.col, row: cur.row - 1 }
			];
			for (const n of neigh) {
				const nk = n.col + ',' + n.row;
				if (n.col <= 0 || n.col >= COLS - 1 || n.row <= 0 || n.row >= ROWS - 1) continue;
				if (visited.has(nk)) continue;
				if (!openCells.has(nk)) continue;
				visited.add(nk);
				queue.push(n);
			}
		}

		return false;
	}

	// Garantir conectividade (escava caminhos se necessario) entre pontos importantes
	function ensureConnectivity() {
		const start = { col: startBot.col, row: startBot.row };

		// Ensure start can reach the door
		if (!isReachableUsingOpenCells(start.col, start.row, doorCell.col, doorCell.row)) {
			const pathToDoor = findPathAny(start.col, start.row, doorCell.col, doorCell.row);
			if (pathToDoor && pathToDoor.length) {
				for (const node of pathToDoor) {
					openCells.add(node.col + ',' + node.row);
				}
			}
		}

		// For each base, ensure reachability. For the green base, enforce that the route goes via the door
		for (const b of bases) {
			if (b.id === 'green') {
				// carve path from door to green base if needed
				if (!isReachableUsingOpenCells(doorCell.col, doorCell.row, b.col, b.row)) {
					const path = findPathAny(doorCell.col, doorCell.row, b.col, b.row);
					if (path && path.length) {
						for (const node of path) {
							openCells.add(node.col + ',' + node.row);
						}
					}
				}
			} else {
				if (!isReachableUsingOpenCells(start.col, start.row, b.col, b.row)) {
					const path = findPathAny(start.col, start.row, b.col, b.row);
					if (path && path.length) {
						for (const node of path) {
							openCells.add(node.col + ',' + node.row);
						}
					}
				}
			}
		}

		// ensure each package can reach its own base; for green package ensure via door
		for (const pkgId of Object.keys(initialPackages)) {
			const p = initialPackages[pkgId];
			const b = bases.find(x => x.id === pkgId) || null;
			if (!b) continue;
			if (b.id === 'green') {
				// ensure package can reach door, and door to base carved already
				if (!isReachableUsingOpenCells(p.col, p.row, doorCell.col, doorCell.row)) {
					const path = findPathAny(p.col, p.row, doorCell.col, doorCell.row);
					if (path && path.length) {
						for (const node of path) {
							openCells.add(node.col + ',' + node.row);
						}
					}
				}
			} else {
				if (!isReachableUsingOpenCells(p.col, p.row, b.col, b.row)) {
					const path = findPathAny(p.col, p.row, b.col, b.row);
					if (path && path.length) {
						for (const node of path) {
							openCells.add(node.col + ',' + node.row);
						}
					}
				}
			}
		}

		// rebuild walls after carving
		rebuildMazeWalls();
	}

	function bfsMinStepsFase5(fromCol, fromRow, toCol, toRow, doorAberta) {
		if (fromCol === toCol && fromRow === toRow) { return 0; }
		var doorKey = doorCell.col + ',' + doorCell.row;
		var visited = new Set([fromCol + ',' + fromRow]);
		var queue = [{ col: fromCol, row: fromRow, dist: 0 }];
		while (queue.length) {
			var cur = queue.shift();
			var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
			for (var d = 0; d < dirs.length; d += 1) {
				var nc = cur.col + dirs[d][0], nr = cur.row + dirs[d][1];
				var nk = nc + ',' + nr;
				if (visited.has(nk)) { continue; }
				if (!openCells.has(nk)) { continue; }
				if (!doorAberta && nk === doorKey) { continue; }
				visited.add(nk);
				if (nc === toCol && nr === toRow) { return cur.dist + 1; }
				queue.push({ col: nc, row: nr, dist: cur.dist + 1 });
			}
		}
		return 9999;
	}

	function calcularMinPassosFase5() {
		var r = initialPackages.red, b = initialPackages.blue, g = initialPackages.green;
		var rb = bases.find(function(x) { return x.id === 'red'; });
		var bb = bases.find(function(x) { return x.id === 'blue'; });
		var gb = bases.find(function(x) { return x.id === 'green'; });
		var s = startBot;
		var ord1 =
			bfsMinStepsFase5(s.col, s.row, r.col, r.row, false) + 1 +
			bfsMinStepsFase5(r.col, r.row, rb.col, rb.row, false) + 1 +
			bfsMinStepsFase5(rb.col, rb.row, b.col, b.row, false) + 1 +
			bfsMinStepsFase5(b.col, b.row, bb.col, bb.row, false) + 1 +
			bfsMinStepsFase5(bb.col, bb.row, g.col, g.row, true) + 1 +
			bfsMinStepsFase5(g.col, g.row, gb.col, gb.row, true) + 1;
		var ord2 =
			bfsMinStepsFase5(s.col, s.row, b.col, b.row, false) + 1 +
			bfsMinStepsFase5(b.col, b.row, bb.col, bb.row, false) + 1 +
			bfsMinStepsFase5(bb.col, bb.row, r.col, r.row, false) + 1 +
			bfsMinStepsFase5(r.col, r.row, rb.col, rb.row, false) + 1 +
			bfsMinStepsFase5(rb.col, rb.row, g.col, g.row, true) + 1 +
			bfsMinStepsFase5(g.col, g.row, gb.col, gb.row, true) + 1;
		return Math.min(ord1, ord2);
	}

    // Lesson variations: each variation has a fully different maze layout.
    // Design rule: the door always blocks the ONLY path to the green base.
    // The player can only reach the green base after delivering red and blue (which opens the door).
    const lessonVariations = [
    	// Variacao 1
    	// Jogador: canto inferior esquerdo. Caixas vermelha e azul na area esquerda.
    	// Porta na coluna 6, linha 5, bloqueando toda a passagem para a direita.
    	// Base verde e caixa verde ficam exclusivamente acessiveis pelo lado direito (apos porta).
    	{
    		startBot: { col: 1, row: 9 },
    		doorCell: { col: 6, row: 5 },
    		bases: [
    			{ id: 'red',   col: 2,  row: 1, color: '#ef4444' },
    			{ id: 'blue',  col: 4,  row: 2, color: '#3b82f6' },
    			{ id: 'green', col: 11, row: 1, color: '#22c55e' }
    		],
    		initialPackages: { red: { col: 3, row: 8 }, blue: { col: 2, row: 6 }, green: { col: 10, row: 8 } },
    		overrideOpenCells: [
    			// Lado esquerdo: area do jogador, caixas red/blue e rotas ate suas bases
    			'1,9','2,9','3,9','4,9',
    			'1,8','2,8','3,8',
    			'1,7','2,7',
    			'1,6','2,6','3,6',
    			'1,5','2,5','3,5','4,5',
    			'1,4','2,4',
    			'1,3','2,3','3,3','4,3',
    			'1,2','2,2','3,2','4,2',
    			'2,1','3,1','4,1',
    			// Porta (unica abertura para o lado direito)
    			'6,5',
    			// Lado direito: caixa verde e base verde
    			'7,5','8,5','9,5','10,5','11,5',
    			'10,6','10,7','10,8','10,9',
    			'11,6','11,7',
    			'10,4','10,3','10,2','10,1','11,1','11,2','11,3'
    		]
    	},

    	// Variacao 2
    	// Jogador: no meio da borda esquerda. Labirinto com corredores verticais na esquerda.
    	// Porta na coluna 7, linha 3. Base verde no topo direito.
    	{
    		startBot: { col: 1, row: 7 },
    		doorCell: { col: 7, row: 3 },
    		bases: [
    			{ id: 'red',   col: 3,  row: 8, color: '#ef4444' },
    			{ id: 'blue',  col: 1,  row: 2, color: '#3b82f6' },
    			{ id: 'green', col: 10, row: 1, color: '#22c55e' }
    		],
    		initialPackages: { red: { col: 4, row: 9 }, blue: { col: 2, row: 9 }, green: { col: 9, row: 7 } },
    		overrideOpenCells: [
    			// Lado esquerdo
    			'1,9','2,9','3,9','4,9','5,9',
    			'1,8','2,8','3,8','4,8',
    			'1,7','2,7','3,7',
    			'1,6','2,6',
    			'1,5','2,5','3,5','4,5',
    			'1,4','2,4','3,4',
    			'1,3','2,3','3,3','4,3','5,3',
    			'1,2','2,2','3,2',
    			'1,1','2,1',
    			// Porta
    			'7,3',
    			// Lado direito
    			'8,3','9,3','10,3','11,3',
    			'10,1','10,2','11,1','11,2',
    			'9,4','9,5','9,6','9,7','9,8',
    			'10,7','10,8','11,7','11,6'
    		]
    	},

    	// Variacao 3
    	// Jogador: canto superior esquerdo. Rota para red e blue desce e sobe.
    	// Porta na linha 5 central (col 6). Base verde no canto inferior direito.
    	{
    		startBot: { col: 1, row: 1 },
    		doorCell: { col: 6, row: 5 },
    		bases: [
    			{ id: 'red',   col: 4,  row: 1, color: '#ef4444' },
    			{ id: 'blue',  col: 2,  row: 9, color: '#3b82f6' },
    			{ id: 'green', col: 11, row: 9, color: '#22c55e' }
    		],
    		initialPackages: { red: { col: 3, row: 5 }, blue: { col: 4, row: 8 }, green: { col: 8, row: 8 } },
    		overrideOpenCells: [
    			// Lado esquerdo: rota em Z
    			'1,1','2,1','3,1','4,1','5,1',
    			'1,2','1,3',
    			'1,4','2,4','3,4','4,4','5,4',
    			'3,3','3,2',
    			'3,5','4,5','5,5',
    			'1,5','2,5',
    			'1,6','1,7','1,8','1,9',
    			'2,6','2,7','2,8','2,9',
    			'3,8','4,8','5,8',
    			'3,7','4,7',
    			'3,6','4,6','5,6',
    			// Porta
    			'6,5',
    			// Lado direito
    			'7,5','8,5','9,5','10,5','11,5',
    			'8,6','8,7','8,8','8,9',
    			'9,8','9,9','10,9','11,9','11,8','11,7','11,6',
    			'10,6','10,7','10,8'
    		]
    	},

    	// Variacao 4
    	// Jogador: coluna 3, linha inferior. Porta na col 5, linha 7 (bloqueando subida para verde).
    	// Base verde no topo direito, caixa verde no meio direito.
    	{
    		startBot: { col: 3, row: 9 },
    		doorCell: { col: 5, row: 7 },
    		bases: [
    			{ id: 'red',   col: 1,  row: 1, color: '#ef4444' },
    			{ id: 'blue',  col: 3,  row: 3, color: '#3b82f6' },
    			{ id: 'green', col: 10, row: 2, color: '#22c55e' }
    		],
    		initialPackages: { red: { col: 2, row: 8 }, blue: { col: 4, row: 9 }, green: { col: 11, row: 6 } },
    		overrideOpenCells: [
    			// Lado esquerdo/baixo
    			'1,9','2,9','3,9','4,9',
    			'1,8','2,8','3,8','4,8',
    			'1,7','2,7','3,7','4,7',
    			'1,6','2,6','3,6','4,6',
    			'1,5','2,5','3,5','4,5',
    			'1,4','2,4','3,4',
    			'1,3','2,3','3,3',
    			'1,2','2,2',
    			'1,1','2,1',
    			// Porta
    			'5,7',
    			// Lado direito
    			'6,7','7,7','8,7','9,7','10,7','11,7',
    			'11,6','11,5','11,4','11,3',
    			'10,6','10,5','10,4','10,3','10,2','10,1','11,1','11,2',
    			'9,6','9,5'
    		]
    	},

    	// Variacao 5
    	// Jogador: meio da esquerda. Labirinto com "S" na esquerda.
    	// Porta na col 6, linha 8. Base verde no canto inferior direito.
    	{
    		startBot: { col: 1, row: 5 },
    		doorCell: { col: 6, row: 8 },
    		bases: [
    			{ id: 'red',   col: 4,  row: 2, color: '#ef4444' },
    			{ id: 'blue',  col: 1,  row: 8, color: '#3b82f6' },
    			{ id: 'green', col: 10, row: 9, color: '#22c55e' }
    		],
    		initialPackages: { red: { col: 2, row: 3 }, blue: { col: 3, row: 7 }, green: { col: 9, row: 6 } },
    		overrideOpenCells: [
    			// Lado esquerdo
    			'1,5','2,5','3,5',
    			'1,4','2,4','3,4','4,4',
    			'1,3','2,3','3,3',
    			'1,2','2,2','3,2','4,2',
    			'1,1','2,1','3,1','4,1',
    			'1,6','2,6',
    			'1,7','2,7','3,7','4,7',
    			'1,8','2,8','3,8','4,8','5,8',
    			'1,9','2,9','3,9',
    			'4,5','4,6','5,6','5,5','5,4','5,3',
    			// Porta
    			'6,8',
    			// Lado direito
    			'7,8','8,8','9,8','10,8','11,8',
    			'10,9','11,9','11,7','11,6',
    			'9,7','9,6','9,5','9,4','9,3',
    			'10,5','10,6','10,7','10,4','10,3'
    		]
    	},

    	// Variacao 6
    	// Jogador: canto direito inferior. Red e blue estao no lado DIREITO.
    	// Porta bloqueia acesso a base verde no lado ESQUERDO (col 6, linha 4).
    	{
    		startBot: { col: 11, row: 9 },
    		doorCell: { col: 6, row: 4 },
    		bases: [
    			{ id: 'red',   col: 9,  row: 1, color: '#ef4444' },
    			{ id: 'blue',  col: 11, row: 3, color: '#3b82f6' },
    			{ id: 'green', col: 2,  row: 1, color: '#22c55e' }
    		],
    		initialPackages: { red: { col: 10, row: 8 }, blue: { col: 11, row: 6 }, green: { col: 3, row: 8 } },
    		overrideOpenCells: [
    			// Lado direito: jogador, red e blue
    			'11,9','10,9','9,9','8,9',
    			'11,8','10,8','9,8',
    			'11,7','10,7','9,7',
    			'11,6','10,6','9,6',
    			'11,5','10,5','9,5',
    			'11,4','10,4','9,4','8,4','7,4',
    			'11,3','10,3','9,3',
    			'10,2','10,1','9,1','9,2',
    			'8,3','8,2','8,1',
    			// Porta
    			'6,4',
    			// Lado esquerdo (apenas acessivel via porta): caixa e base verde
    			'5,4','4,4','3,4','2,4','1,4',
    			'3,5','3,6','3,7','3,8',
    			'2,5','2,6','2,7','2,8',
    			'1,5','1,6','1,7','1,8','1,9',
    			'2,1','2,2','2,3','1,1','1,2','1,3',
    			'3,1','3,2','3,3','4,3','5,3'
    		]
    	},

    	// Variacao 7
    	// Jogador: coluna 2, linha 8. Corredor em espiral na esquerda.
    	// Porta na col 6, linha 6. Base verde no topo direito.
    	{
    		startBot: { col: 2, row: 8 },
    		doorCell: { col: 6, row: 6 },
    		bases: [
    			{ id: 'red',   col: 5,  row: 9, color: '#ef4444' },
    			{ id: 'blue',  col: 1,  row: 3, color: '#3b82f6' },
    			{ id: 'green', col: 11, row: 2, color: '#22c55e' }
    		],
    		initialPackages: { red: { col: 4, row: 7 }, blue: { col: 2, row: 5 }, green: { col: 9, row: 9 } },
    		overrideOpenCells: [
    			// Lado esquerdo (espiral)
    			'1,9','2,9','3,9','4,9','5,9',
    			'1,8','2,8',
    			'1,7','2,7','3,7','4,7','5,7',
    			'5,8',
    			'1,6','2,6','3,6','4,6','5,6',
    			'1,5','2,5',
    			'1,4','2,4','3,4','4,4','5,4',
    			'5,5',
    			'1,3','2,3',
    			'1,2','2,2','3,2','4,2','5,2',
    			'1,1','2,1','3,1',
    			// Porta
    			'6,6',
    			// Lado direito
    			'7,6','8,6','9,6','10,6','11,6',
    			'9,5','9,4','9,3','9,2','9,1',
    			'10,7','11,7','11,5','11,4','11,3','11,2','11,1',
    			'10,2','10,1'
    		]
    	},

    	// Variacao 8
    	// Jogador: linha do meio esquerda (col 1, row 5). Mapa em formato de grade.
    	// Porta na col 7, linha 5. Base verde no canto inferior direito.
    	{
    		startBot: { col: 1, row: 5 },
    		doorCell: { col: 7, row: 5 },
    		bases: [
    			{ id: 'red',   col: 3,  row: 1, color: '#ef4444' },
    			{ id: 'blue',  col: 5,  row: 9, color: '#3b82f6' },
    			{ id: 'green', col: 11, row: 8, color: '#22c55e' }
    		],
    		initialPackages: { red: { col: 1, row: 3 }, blue: { col: 4, row: 8 }, green: { col: 10, row: 6 } },
    		overrideOpenCells: [
    			// Grade esquerda (linhas impares)
    			'1,1','2,1','3,1','4,1','5,1',
    			'1,2',       '3,2',       '5,2',
    			'1,3','2,3','3,3','4,3','5,3',
    			'1,4',       '3,4',       '5,4',
    			'1,5','2,5','3,5','4,5','5,5','6,5',
    			'1,6',       '3,6',       '5,6',
    			'1,7','2,7','3,7','4,7','5,7',
    			'1,8',       '3,8',       '5,8',
    			'1,9','2,9','3,9','4,9','5,9',
    			// Porta
    			'7,5',
    			// Lado direito
    			'8,5','9,5','10,5','11,5',
    			'8,4','8,3','8,2','8,1','9,1','10,1','11,1',
    			'8,6','8,7','8,8','8,9',
    			'9,8','10,8','11,8','11,9','10,9','9,9',
    			'9,7','10,7','11,7','11,6','10,6','9,6'
    		]
    	},

    	// Variacao 9
    	// Jogador: centro superior esquerdo. Labirinto com corredor em U.
    	// Porta na col 6, linha 3. Base verde no canto direito inferior.
    	{
    		startBot: { col: 2, row: 2 },
    		doorCell: { col: 6, row: 3 },
    		bases: [
    			{ id: 'red',   col: 4,  row: 1, color: '#ef4444' },
    			{ id: 'blue',  col: 1,  row: 7, color: '#3b82f6' },
    			{ id: 'green', col: 10, row: 8, color: '#22c55e' }
    		],
    		initialPackages: { red: { col: 3, row: 3 }, blue: { col: 2, row: 6 }, green: { col: 11, row: 9 } },
    		overrideOpenCells: [
    			// Corredor em U - borda esquerda
    			'1,1','2,1','3,1','4,1','5,1',
    			'1,2','2,2',
    			'1,3','2,3','3,3','4,3','5,3',
    			'5,2',
    			'3,2','4,2',
    			'1,4','2,4','3,4',
    			'1,5','2,5','3,5','4,5','5,5',
    			'1,6','2,6',
    			'1,7','2,7','3,7','4,7','5,7',
    			'1,8','2,8','3,8',
    			'1,9','2,9','3,9','4,9','5,9',
    			'4,6','5,6','5,8',
    			// Porta
    			'6,3',
    			// Lado direito
    			'7,3','8,3','9,3','10,3','11,3',
    			'11,4','11,5','11,6','11,7','11,8','11,9',
    			'10,9','9,9','8,9','7,9',
    			'10,8','10,7','10,6','10,5','10,4',
    			'9,4','8,4','7,4','7,5','8,5','9,5','9,6','9,7','9,8'
    		]
    	},

    	// Variacao 10
    	// Jogador: canto inferior central. Caixas red e blue espalhadas.
    	// Porta na col 6, linha 7 (horizontal). Base verde no topo direito isolado.
    	{
    		startBot: { col: 5, row: 9 },
    		doorCell: { col: 6, row: 7 },
    		bases: [
    			{ id: 'red',   col: 2,  row: 3, color: '#ef4444' },
    			{ id: 'blue',  col: 5,  row: 2, color: '#3b82f6' },
    			{ id: 'green', col: 10, row: 1, color: '#22c55e' }
    		],
    		initialPackages: { red: { col: 1, row: 6 }, blue: { col: 4, row: 5 }, green: { col: 11, row: 7 } },
    		overrideOpenCells: [
    			// Lado esquerdo
    			'1,9','2,9','3,9','4,9','5,9',
    			'1,8','2,8','3,8','4,8','5,8',
    			'1,7','2,7','3,7','4,7','5,7',
    			'1,6','2,6','3,6','4,6','5,6',
    			'1,5','2,5','3,5','4,5','5,5',
    			'1,4','2,4','3,4','4,4',
    			'1,3','2,3','3,3',
    			'1,2','2,2','3,2','4,2','5,2',
    			'1,1','2,1','3,1','4,1','5,1',
    			// Porta
    			'6,7',
    			// Lado direito
    			'7,7','8,7','9,7','10,7','11,7',
    			'11,8','11,9',
    			'10,8','10,9',
    			'11,6','11,5','11,4','11,3','11,2','11,1',
    			'10,2','10,1','10,3','10,4','10,5','10,6',
    			'9,6','9,5','9,4','9,3','9,2','9,1'
    		]
    	}
    ];

    let activeVariationIndex = -1;


    function applyVariationByIndex(index) {
    	const v = lessonVariations[index];
   	activeVariationIndex = index;
   	startBot = { col: v.startBot.col, row: v.startBot.row };

   	// apply variation-specific bases if provided
   	if (v.bases && Array.isArray(v.bases)) {
   		bases.length = 0;
   		for (const b of v.bases) {
   			bases.push({ id: b.id, col: b.col, row: b.row, color: b.color });
   		}
   	}

   	// copy package positions
   	initialPackages = {
   		red: { col: v.initialPackages.red.col, row: v.initialPackages.red.row },
   		blue: { col: v.initialPackages.blue.col, row: v.initialPackages.blue.row },
   		green: { col: v.initialPackages.green.col, row: v.initialPackages.green.row }
   	};

   	packages = [
   		{ id: 'red', col: initialPackages.red.col, row: initialPackages.red.row, color: '#ef4444', delivered: false },
   		{ id: 'blue', col: initialPackages.blue.col, row: initialPackages.blue.row, color: '#3b82f6', delivered: false },
   		{ id: 'green', col: initialPackages.green.col, row: initialPackages.green.row, color: '#22c55e', delivered: false }
   	];

		// apply variation-specific door position (fallback to default)
		if (v.doorCell && Number.isInteger(v.doorCell.col) && Number.isInteger(v.doorCell.row)) {
			doorCell = { col: v.doorCell.col, row: v.doorCell.row };
		} else {
			doorCell = { col: defaultDoorCell.col, row: defaultDoorCell.row };
		}

   	// rebuild open cells: all variations use overrideOpenCells
   	if (v.overrideOpenCells && Array.isArray(v.overrideOpenCells)) {
   		openCells = new Set(v.overrideOpenCells);
   	} else {
   		openCells = new Set(baseOpenCells);
   		if (v.extras) {
   			for (const add of v.extras) {
   				openCells.add(add);
   			}
   		}
   		if (v.removes) {
   			for (const rem of v.removes) {
   				openCells.delete(rem);
   			}
   		}
   	}

   	// ensure important entity cells are open (start, door, bases, packages)
   	openCells.add(startBot.col + ',' + startBot.row);
   	openCells.add(doorCell.col + ',' + doorCell.row);
   	for (const b of bases) {
   		openCells.add(b.col + ',' + b.row);
   	}
   	for (const key of Object.keys(initialPackages)) {
   		const p = initialPackages[key];
   		openCells.add(p.col + ',' + p.row);
   	}

	// guarantee connectivity (may carve additional open cells) and update UI
	ensureConnectivity();
	minPassosFase5 = calcularMinPassosFase5();
    }

    function selectRandomVariationOnLessonStart() {
   	const idx = Math.floor(Math.random() * lessonVariations.length);
   	applyVariationByIndex(idx);
    }


    let state = {
    	botCol: startBot.col,
    	botRow: startBot.row,
    	carryingPackageId: null,
    	usedPickCommand: false,
    	usedDropCommand: false,
		doorUnlocked: false,
		doorOpen: false,
		doorAnimating: false
    };

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

    function setEntityPosition(el, col, row) {
    	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
    }

    function clampToBoard(col, row) {
    	return {
    		col: Math.max(0, Math.min(COLS - 1, col)),
    		row: Math.max(0, Math.min(ROWS - 1, row))
    	};
    }

    function isDoorCell(col, row) {
    	return col === doorCell.col && row === doorCell.row;
    }

    function isWall(col, row) {
    	if (!state.doorOpen && isDoorCell(col, row)) {
    		return true;
    	}
    	return wallSet.has(col + ',' + row);
    }

    function isWalkable(col, row) {
    	return col >= 0 && col < COLS && row >= 0 && row < ROWS && !isWall(col, row);
    }

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

		if (!state.doorOpen || state.doorAnimating) {
    		const doorWrapper = document.createElement('div');
			doorWrapper.className = 'maze-cell';
    		doorWrapper.style.transform = 'translate(' + (doorCell.col * CELL) + 'px,' + (doorCell.row * CELL) + 'px)';

			const doorVisual = document.createElement('div');
			doorVisual.className = state.doorAnimating ? 'maze-door maze-door-opening' : 'maze-door';

			const doorFrame = document.createElement('span');
			doorFrame.className = 'maze-door-frame';

			const leftPanel = document.createElement('span');
			leftPanel.className = 'maze-door-panel left';
			const rightPanel = document.createElement('span');
			rightPanel.className = 'maze-door-panel right';

			const leftDetail = document.createElement('span');
			leftDetail.className = 'maze-door-detail';
			const rightDetail = document.createElement('span');
			rightDetail.className = 'maze-door-detail';
			leftPanel.appendChild(leftDetail);
			rightPanel.appendChild(rightDetail);

			const leftHingeTop = document.createElement('span');
			leftHingeTop.className = 'maze-door-hinge left top';
			const leftHingeBottom = document.createElement('span');
			leftHingeBottom.className = 'maze-door-hinge left bottom';
			const rightHingeTop = document.createElement('span');
			rightHingeTop.className = 'maze-door-hinge right top';
			const rightHingeBottom = document.createElement('span');
			rightHingeBottom.className = 'maze-door-hinge right bottom';

			const handleLeft = document.createElement('span');
			handleLeft.className = 'maze-door-handle left';
			const handleRight = document.createElement('span');
			handleRight.className = 'maze-door-handle right';

			doorVisual.appendChild(doorFrame);
			doorVisual.appendChild(leftPanel);
			doorVisual.appendChild(rightPanel);
			doorVisual.appendChild(leftHingeTop);
			doorVisual.appendChild(leftHingeBottom);
			doorVisual.appendChild(rightHingeTop);
			doorVisual.appendChild(rightHingeBottom);
			doorVisual.appendChild(handleLeft);
			doorVisual.appendChild(handleRight);
    		doorWrapper.appendChild(doorVisual);
    		mazeLayer.appendChild(doorWrapper);
    	}
    }

    function renderBases() {
    	baseLayer.innerHTML = '';
    	for (const base of bases) {
    		const baseCell = document.createElement('div');
    		baseCell.className = 'base-cell';
    		baseCell.dataset.baseId = base.id;
    		baseCell.style.color = base.color;

    		const baseVisual = document.createElement('div');
    		baseVisual.className = 'base';
		baseVisual.style.color = base.color;
    		baseCell.appendChild(baseVisual);
    		setEntityPosition(baseCell, base.col, base.row);
    		baseLayer.appendChild(baseCell);
    	}
    }

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

    function refreshLayerPositions() {
    	for (const packageCell of packageLayer.querySelectorAll('.package-cell')) {
    		const packageId = packageCell.dataset.packageId;
    		const packageItem = packages.find(item => item.id === packageId);
    		if (packageItem && !packageItem.delivered) {
    			setEntityPosition(packageCell, packageItem.col, packageItem.row);
    		}
    	}
    }

    function countDeliveredLeftPackages() {
    	return packages.filter(item => leftPackageIds.includes(item.id) && item.delivered).length;
    }

    function shouldDoorOpen() {
    	return countDeliveredLeftPackages() === leftPackageIds.length;
    }

    function updateDoorState() {
	    if (!state.doorUnlocked && shouldDoorOpen()) {
			state.doorUnlocked = true;
	    	statusEl.className = 'status ok';
			statusEl.textContent = 'Porta destrancada! Encoste nela para abrir e passar para o lado direito.';
			draw();
    	}
    }

	function triggerDoorOpeningOnTouch() {
		if (!state.doorUnlocked || state.doorOpen || state.doorAnimating) {
			return;
		}

		state.doorAnimating = true;
		// Libera a passagem imediatamente para nao consumir movimentos durante a animacao.
		state.doorOpen = true;
		buildMaze();
		statusEl.className = 'status ok';
		statusEl.textContent = 'Porta abrindo... passagem liberada para o lado direito.';
		draw();

		setTimeout(function () {
			state.doorAnimating = false;
			buildMaze();
			draw();
		}, 760);
	}

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

    	const deliveredLeft = countDeliveredLeftPackages();
		if (state.doorAnimating) {
			turnCounter.textContent = 'Porta laranja: ABRINDO... Entregas da esquerda: ' + deliveredLeft + '/2';
		} else if (state.doorOpen) {
    		turnCounter.textContent = 'Porta laranja: ABERTA. Entregas da esquerda: ' + deliveredLeft + '/2';
		} else if (state.doorUnlocked) {
			turnCounter.textContent = 'Porta laranja: DESTRANCADA. Encoste para abrir. Entregas da esquerda: ' + deliveredLeft + '/2';
    	} else {
    		turnCounter.textContent = 'Porta laranja: FECHADA. Entregas da esquerda: ' + deliveredLeft + '/2';
    	}
    }

    function normalizeCommand(raw) {
    	return raw.replace(/\s+/g, '');
    }

    function parseCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);

    	if (cmd === 'pegar()') {
    		return { action: 'pegar', amount: 1 };
    	}

    	if (cmd === 'largar()') {
    		return { action: 'largar', amount: 1 };
    	}

    	const moveMatch = cmd.match(/^(moverDireita|moverEsquerda|moverCima|moverBaixo)(?:\((\d+)\))?$/);
    	if (!moveMatch) {
    		return null;
    	}

    	const action = moveMatch[1];
    	const amount = moveMatch[2] ? Number(moveMatch[2]) : 1;
    	if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
    		return null;
    	}

    	return { action, amount };
    }

		setupPromptEditor(cmdInput, line => Boolean(parseCommand(line)));

    function hideErrorPanel() {
    	errorPanel.classList.add('hidden');
    	errorPanelMsg.textContent = '';
    }

    function showErrorPanel(command) {
    	errorPanelMsg.textContent = 'Comando invalido: "' + command + '". Revise e tente novamente.';
    	errorPanel.classList.remove('hidden');
    }

    function hideDocsPanel() {
    	docsPanel.classList.add('hidden');
    }

    function showDocsPanel() {
    	docsPanel.classList.remove('hidden');
    }

    function hideWinPanel() {
    	winPanel.classList.add('hidden');
    	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
    }

    function showWinPanel(executedSteps, stars) {
    	winSummary.textContent = 'Voce concluiu o labirinto complexo em ' + executedSteps + ' comandos.';
    	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
    	starRating.classList.add('stars-' + stars);
    	winPanel.classList.remove('hidden');
    }

    function hideFailPanel() {
    	failPanel.classList.add('hidden');
    }

    function showFailPanel() {
    	failPanel.classList.remove('hidden');
    }

    function wait(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    function moveBot(action) {
    	let nextCol = state.botCol;
    	let nextRow = state.botRow;

    	if (action === 'moverDireita') {
    		nextCol += 1;
    	} else if (action === 'moverEsquerda') {
    		nextCol -= 1;
    	} else if (action === 'moverCima') {
    		nextRow -= 1;
    	} else if (action === 'moverBaixo') {
    		nextRow += 1;
    	}

	    const bounded = clampToBoard(nextCol, nextRow);
		if (isDoorCell(bounded.col, bounded.row) && !state.doorOpen) {
			triggerDoorOpeningOnTouch();
		}
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

    function getPackageAtBot() {
    	return packages.find(packageItem => !packageItem.delivered && packageItem.col === state.botCol && packageItem.row === state.botRow) || null;
    }

    function getBaseForPackage(packageId) {
    	return bases.find(base => base.id === packageId) || null;
    }

    function allPackagesDelivered() {
    	return packages.every(packageItem => packageItem.delivered);
    }

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
    		updateDoorState();
    	}

    	state.carryingPackageId = null;
    }

    function resetPackages() {
    	for (const packageItem of packages) {
    		const initialPos = initialPackages[packageItem.id];
    		packageItem.col = initialPos.col;
    		packageItem.row = initialPos.row;
    		packageItem.delivered = false;
    	}
    }

    function applyAction(action) {
    	if (action === 'pegar') {
    		pickPackage();
    		return;
    	}

    	if (action === 'largar') {
    		dropPackage();
    		return;
    	}

    	moveBot(action);
    }

    function resetLesson() {
    	cmdInput.value = '';
    	cmdInput.dispatchEvent(new Event('input'));
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
			doorUnlocked: false,
			doorOpen: false,
			doorAnimating: false
    	};
    	resetPackages();
    	renderPackages();
    	renderBases();
    	buildMaze();
    	refreshLayerPositions();
    	draw();
    	statusEl.className = 'status';
	    statusEl.textContent = 'Entregue as 2 caixas do lado esquerdo para destrancar a porta laranja.';
    }

    async function executeCommands() {
    	if (livesSystem && !livesSystem.hasLives()) {
    		return;
    	}

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
    	statusEl.textContent = 'Executando no labirinto complexo...';
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
    			applyAction(parsed.action);
    			executedSteps += 1;
    			draw();
    			await wait(210);

    			if (allPackagesDelivered()) {
    				break;
    			}
    		}
    	}

    	runBtn.disabled = false;
    	resetBtn.disabled = false;

    	if (allPackagesDelivered() && state.usedPickCommand && state.usedDropCommand) {
    		statusEl.className = 'status ok';
    		statusEl.textContent = 'Excelente! Voce abriu a porta laranja e concluiu o lado direito.';
    		const starsEarned5 = livesSystem.getCurrentLives();
	    	markLessonAsCompleted(5, starsEarned5);
    		showWinPanel(executedSteps, starsEarned5);
    		return;
    	}

    	resetLesson();
    	if (livesSystem) { livesSystem.registerFailure('Falha na rota: a fase foi resetada para nova tentativa.'); }
    	showFailPanel();
    }

    function startPractice() {
    	tutorialPanel.classList.add('hidden');
    	practicePanel.classList.remove('hidden');
    	livesSystem = setupLessonLives(5, statusEl, runBtn, failPanel);
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
	// choose a random variation on lesson start (and allow dev cycling)
	selectRandomVariationOnLessonStart();
	buildMaze();
	renderBases();
	renderPackages();
	if (hazardLayer) {
		hazardLayer.innerHTML = '';
	}
	resetLesson();

    })();
    return;
  }


  // Route: pagina6
	if (path.endsWith('/pages/pagina6.html')) {
		if (!ensureLessonAccess(6)) {
			return;
		}
    (function () {
	const CELL = 32;
	const COLS = 21;
	const ROWS = 15;

    const tutorialPanel = document.getElementById('tutorialPanel');
    const practicePanel = document.getElementById('practicePanel');
    const startPracticeBtn = document.getElementById('startPracticeBtn');

    const board = document.getElementById('board');
    const arenaGrid = document.getElementById('arenaGrid');
    const mazeLayer = document.getElementById('mazeLayer');
    const baseLayer = document.getElementById('baseLayer');
    const packageLayer = document.getElementById('packageLayer');
    const botCell = document.getElementById('botCell');
    const cmdInput = document.getElementById('cmdInput');
    const runBtn = document.getElementById('runBtn');
    const resetBtn = document.getElementById('resetBtn');
    const docsBtn = document.getElementById('docsBtn');
    const statusEl = document.getElementById('status');
    const turnCounter = document.getElementById('turnCounter');
    const objectiveAtoC = document.getElementById('objectiveAtoC');
    const objectiveCtoB = document.getElementById('objectiveCtoB');
    const objectiveBtoA = document.getElementById('objectiveBtoA');
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

		setupWinPanelLetter(winPanel);
		let livesSystem = null;

    const areaMeta = {
    	A: { name: 'Area A', color: '#3b82f6' },
    	C: { name: 'Area C', color: '#22c55e' },
    	B: { name: 'Area B', color: '#f97316' }
    };

	// Mutable per-variation positions
	let startBot = { col: 1, row: 2 };
	let minPassosFase6 = 0;
	// 3 portals: A->C (entry in A, exit in C), C->B (entry in C, exit in B), B->A (entry in B, exit in A)
	let portalAtoCEntry = { col: 6, row: 3 };
	let portalAtoCExit  = { col: 8, row: 3 };
	let portalCtoBEntry = { col: 13, row: 6 };
	let portalCtoBExit  = { col: 15, row: 6 };
	let portalBtoAEntry = { col: 15, row: 10 };
	let portalBtoAExit  = { col: 6, row: 10 };

	const bases = [
		{ id: 'baseA', area: 'A', col: 4, row: 11, color: areaMeta.A.color, expects: 'B' },
		{ id: 'baseC', area: 'C', col: 12, row: 4, color: areaMeta.C.color, expects: 'A' },
		{ id: 'baseB', area: 'B', col: 19, row: 8, color: areaMeta.B.color, expects: 'C' }
	];

	let initialBlocks = { A: { col: 2, row: 3 }, C: { col: 11, row: 8 }, B: { col: 17, row: 10 } };

	const blocks = [
		{ id: 'A', originArea: 'A', targetBaseId: 'baseC', col: initialBlocks.A.col, row: initialBlocks.A.row, color: areaMeta.A.color, delivered: false },
		{ id: 'C', originArea: 'C', targetBaseId: 'baseB', col: initialBlocks.C.col, row: initialBlocks.C.row, color: areaMeta.C.color, delivered: false },
		{ id: 'B', originArea: 'B', targetBaseId: 'baseA', col: initialBlocks.B.col, row: initialBlocks.B.row, color: areaMeta.B.color, delivered: false }
	];

	let openCells = new Set();
	let mazeWalls = [];
	let wallSet = new Set();

	function rebuildMazeWalls() {
		mazeWalls = [];
		for (let row = 0; row < ROWS; row += 1) {
			for (let col = 0; col < COLS; col += 1) {
				const key = col + ',' + row;
				const isBorder = row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1;
				if (isBorder || !openCells.has(key)) {
					mazeWalls.push({ col, row });
				}
			}
		}
		wallSet = new Set(mazeWalls.map(function (wall) { return wall.col + ',' + wall.row; }));
	}

	function rebuildMazeWalls() {
		mazeWalls = [];
		for (let row = 0; row < ROWS; row += 1) {
			for (let col = 0; col < COLS; col += 1) {
				const key = col + ',' + row;
				const isBorder = row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1;
				if (isBorder || !openCells.has(key)) {
					mazeWalls.push({ col, row });
				}
			}
		}
		wallSet = new Set(mazeWalls.map(function (wall) { return wall.col + ',' + wall.row; }));
	}

	let activeVariationIndex = -1;

	// Zone layout: A = cols 1-6 | solid wall col 7 | C = cols 8-13 | solid wall col 14 | B = cols 15-19
	// All inter-zone movement is via portals only. Columns 7 and 14 are ALWAYS walls.
	// Portal A->C: entry at last col of A (col 6), exit at first col of C (col 8)
	// Portal C->B: entry at last col of C (col 13), exit at first col of B (col 15)
	// Portal B->A: entry somewhere in B, exit somewhere in A
	const lessonVariations = [
		// ──── Variacao 1 ─────────────────────────────────────────────────────────
		// Portal A->C no topo | C->B no meio | B->A na base
		{
			startBot:    { col: 1, row: 2 },
			portalAtoC:  { entry: { col: 6, row: 3 },  exit: { col: 8, row: 3 } },
			portalCtoB:  { entry: { col: 13, row: 6 }, exit: { col: 15, row: 6 } },
			portalBtoA:  { entry: { col: 19, row: 11 }, exit: { col: 1, row: 11 } },
			blockA: { col: 3, row: 5 },   blockC: { col: 10, row: 8 },  blockB: { col: 17, row: 9 },
			baseC:  { col: 12, row: 2 },  baseB:  { col: 19, row: 4 },  baseA:  { col: 3, row: 12 },
			openCells: [
				// Zona A
				'1,2','2,2','3,2','4,2','5,2','6,2',
				'1,3','1,4','1,5','1,6','1,7','1,8','1,9','1,10','1,11',
				'2,5','3,5','4,5','5,5','6,5','6,4','6,3',
				'2,11','3,11','4,11','5,11',
				'2,12','3,12',
				'3,8','3,9','3,10',
				// Zona C
				'8,3','9,3','10,3','11,3','12,3','12,2',
				'8,4','8,5','8,6',
				'9,6','10,6','11,6','12,6','13,6',
				'10,7','10,8','10,9','10,10','10,11',
				'9,11','11,11','12,11',
				// Zona B
				'15,6','16,6','17,6','18,6','19,6',
				'19,5','19,4','18,4','17,4',
				'19,7','19,8','19,9','19,10','19,11',
				'15,7','15,8','15,9','15,10',
				'16,9','17,9','17,10','17,11'
			]
		},
		// ──── Variacao 2 ─────────────────────────────────────────────────────────
		// Portal A->C na base | C->B no topo | B->A no meio
		{
			startBot:    { col: 2, row: 2 },
			portalAtoC:  { entry: { col: 6, row: 11 }, exit: { col: 8, row: 11 } },
			portalCtoB:  { entry: { col: 13, row: 3 }, exit: { col: 15, row: 3 } },
			portalBtoA:  { entry: { col: 15, row: 8 }, exit: { col: 6, row: 8 } },
			blockA: { col: 4, row: 10 },  blockC: { col: 11, row: 5 },  blockB: { col: 16, row: 6 },
			baseC:  { col: 9, row: 12 },  baseB:  { col: 18, row: 12 }, baseA:  { col: 5, row: 3 },
			openCells: [
				// Zona A
				'1,1','2,1','3,1','4,1','5,1',
				'5,2','5,3','4,3',
				'1,2','1,3','1,4','1,5','1,6','1,7','1,8',
				'2,8','3,8','4,8','5,8','6,8',
				'1,9','1,10','1,11',
				'2,11','3,11','4,11','5,11','6,11',
				'4,10','3,10','2,10',
				// Zona C
				'8,3','9,3','10,3','11,3','12,3','13,3',
				'8,4','8,5','8,6',
				'11,4','11,5','11,6','11,7','11,8','11,9','11,10','11,11',
				'8,11','9,11','9,12','10,11',
				'12,10','12,11','12,12',
				// Zona B
				'15,3','16,3','17,3','18,3',
				'15,4','15,5','15,6','15,7','15,8',
				'16,6','16,7','16,8','16,9','16,10','16,11','16,12',
				'17,12','18,12','19,12',
				'19,11','19,10','19,9','19,8','19,7','19,6','19,5','19,4','19,3'
			]
		},
		// ──── Variacao 3 ─────────────────────────────────────────────────────────
		// Portal A->C no meio | C->B na base | B->A no topo
		{
			startBot:    { col: 1, row: 7 },
			portalAtoC:  { entry: { col: 6, row: 7 },  exit: { col: 8, row: 7 } },
			portalCtoB:  { entry: { col: 13, row: 11 }, exit: { col: 15, row: 11 } },
			portalBtoA:  { entry: { col: 19, row: 2 },  exit: { col: 1, row: 2 } },
			blockA: { col: 5, row: 9 },   blockC: { col: 9, row: 4 },   blockB: { col: 18, row: 8 },
			baseC:  { col: 12, row: 10 }, baseB:  { col: 15, row: 3 },  baseA:  { col: 2, row: 5 },
			openCells: [
				// Zona A
				'1,2','1,3','1,4','1,5','1,6','1,7',
				'2,5','2,7','3,7','4,7','5,7','6,7',
				'1,8','1,9','1,10','1,11','1,12',
				'2,9','3,9','4,9','5,9',
				'2,12','3,12','4,12','5,12','6,12',
				// Zona C
				'8,7','9,7','10,7','11,7','12,7',
				'8,6','8,5','8,4','8,3','8,2',
				'9,4','9,3','9,2','10,2','11,2','12,2',
				'8,8','8,9','8,10','8,11',
				'9,11','10,11','11,11','12,11','13,11',
				'12,9','12,10',
				// Zona B
				'15,3','15,4','15,5','15,6','15,7','15,8','15,9','15,10','15,11',
				'16,3','17,3','18,3','19,3','19,2',
				'16,11','17,11','18,11','19,11',
				'17,7','18,7','18,8','18,9','19,9','19,10'
			]
		},
		// ──── Variacao 4 ─────────────────────────────────────────────────────────
		// Portal A->C linha 5 | C->B linha 9 | B->A linha 4
		{
			startBot:    { col: 1, row: 12 },
			portalAtoC:  { entry: { col: 6, row: 5 },  exit: { col: 8, row: 5 } },
			portalCtoB:  { entry: { col: 13, row: 9 }, exit: { col: 15, row: 9 } },
			portalBtoA:  { entry: { col: 19, row: 4 }, exit: { col: 1, row: 4 } },
			blockA: { col: 2, row: 3 },   blockC: { col: 10, row: 3 },  blockB: { col: 17, row: 12 },
			baseC:  { col: 12, row: 8 },  baseB:  { col: 19, row: 7 },  baseA:  { col: 4, row: 9 },
			openCells: [
				// Zona A
				'1,4','1,5',
				'2,3','2,4','2,5','3,3','4,3','5,3','6,3','6,4','6,5',
				'1,6','1,7','1,8','1,9','1,10','1,11','1,12',
				'2,9','3,9','4,9','5,9',
				'3,12','4,12','5,12','6,12','6,11','6,10',
				// Zona C
				'8,5','9,5','10,5','11,5','12,5',
				'8,4','8,3','9,3','10,3','11,3','12,3',
				'10,4',
				'8,6','8,7','8,8','8,9',
				'9,8','10,8','11,8','12,8','13,9',
				'9,9','10,9','11,9','12,9',
				'8,10','8,11','8,12','9,12','10,12',
				// Zona B
				'15,9','16,9','17,9','18,9','19,9',
				'19,4','19,5','19,6','19,7','19,8',
				'18,7','17,7','16,7',
				'15,10','15,11','15,12',
				'16,12','17,12','18,12','19,12',
				'19,10','19,11'
			]
		},
		// ──── Variacao 5 ─────────────────────────────────────────────────────────
		// Portal A->C linha 2 | C->B linha 12 | B->A linha 7
		{
			startBot:    { col: 5, row: 11 },
			portalAtoC:  { entry: { col: 6, row: 2 },  exit: { col: 8, row: 2 } },
			portalCtoB:  { entry: { col: 13, row: 12 }, exit: { col: 15, row: 12 } },
			portalBtoA:  { entry: { col: 15, row: 7 }, exit: { col: 6, row: 7 } },
			blockA: { col: 1, row: 4 },   blockC: { col: 11, row: 9 },  blockB: { col: 18, row: 3 },
			baseC:  { col: 8, row: 11 },  baseB:  { col: 17, row: 10 }, baseA:  { col: 3, row: 8 },
			openCells: [
				// Zona A
				'1,1','2,1','3,1','4,1','5,1','6,1','6,2',
				'1,2','1,3','1,4','1,5',
				'2,5','3,5','4,5','5,5',
				'5,6','5,7','5,8','5,9','5,10','5,11','6,7',
				'1,6','1,7','1,8','1,9','1,10','1,11',
				'2,8','3,8',
				'2,11','3,11','4,11',
				// Zona C
				'8,2','9,2','10,2','11,2','12,2','13,2',
				'8,3','8,4','8,5','8,6','8,7','8,8','8,9','8,10','8,11',
				'9,9','10,9','11,9','12,9',
				'12,10','12,11','12,12','13,12',
				'9,11','10,11',
				// Zona B
				'15,7','15,8','15,9','15,10','15,11','15,12',
				'16,3','17,3','18,3','19,3',
				'19,2','19,1','18,1','17,1','16,1',
				'19,4','19,5','19,6','19,7','19,8','19,9','19,10',
				'17,10','18,10',
				'16,9','17,9','18,9',
				'16,12','17,12','18,12','19,12'
			]
		},
		// ──── Variacao 6 ─────────────────────────────────────────────────────────
		// Portal A->C linha 9 | C->B linha 4 | B->A linha 12
		{
			startBot:    { col: 3, row: 2 },
			portalAtoC:  { entry: { col: 6, row: 9 },  exit: { col: 8, row: 9 } },
			portalCtoB:  { entry: { col: 13, row: 4 }, exit: { col: 15, row: 4 } },
			portalBtoA:  { entry: { col: 19, row: 12 }, exit: { col: 1, row: 12 } },
			blockA: { col: 5, row: 7 },   blockC: { col: 10, row: 11 }, blockB: { col: 16, row: 8 },
			baseC:  { col: 9, row: 3 },   baseB:  { col: 19, row: 6 },  baseA:  { col: 2, row: 10 },
			openCells: [
				// Zona A
				'1,1','2,1','3,1','4,1','5,1','6,1',
				'6,2','6,3','6,4','6,5','6,6','6,7','6,8','6,9',
				'1,2','1,3','1,4','1,5','1,6','1,7','1,8','1,9',
				'5,7',
				'2,10','1,10','1,11','1,12',
				'2,12','3,12','4,12','5,12','6,12','6,11','6,10',
				// Zona C
				'8,9','9,9','10,9','11,9','12,9',
				'8,8','8,7','8,6','8,5','8,4',
				'9,3','9,4','10,4','11,4','12,4','8,3','13,4',
				'8,10','8,11','8,12',
				'9,11','10,11','11,11','12,11',
				'9,12','10,12','11,12','12,12',
				// Zona B
				'15,4','16,4','17,4','18,4','19,4',
				'19,5','19,6','19,7','19,8','19,9','19,10','19,11','19,12',
				'15,5','15,6','15,7','15,8','15,9','15,10',
				'16,8','17,8','18,8',
				'16,10','17,10','18,10','15,11','15,12','16,12','17,12','18,12'
			]
		},
		// ──── Variacao 7 ─────────────────────────────────────────────────────────
		// Portal A->C linha 6 | C->B linha 2 | B->A linha 9
		{
			startBot:    { col: 1, row: 5 },
			portalAtoC:  { entry: { col: 6, row: 6 },  exit: { col: 8, row: 6 } },
			portalCtoB:  { entry: { col: 13, row: 2 }, exit: { col: 15, row: 2 } },
			portalBtoA:  { entry: { col: 15, row: 9 }, exit: { col: 6, row: 9 } },
			blockA: { col: 4, row: 2 },   blockC: { col: 12, row: 8 },  blockB: { col: 19, row: 5 },
			baseC:  { col: 9, row: 7 },   baseB:  { col: 16, row: 12 }, baseA:  { col: 1, row: 9 },
			openCells: [
				// Zona A
				'1,1','2,1','3,1','4,1','5,1','6,1',
				'4,2','3,2','2,2','1,2',
				'1,3','1,4','1,5','1,6',
				'2,6','3,6','4,6','5,6','6,6',
				'6,5','6,4','6,3','6,2',
				'1,7','1,8','1,9','6,9',
				'2,9','3,9','4,9','5,9',
				'1,10','1,11','1,12',
				'2,12','3,12','4,12','5,12',
				// Zona C
				'8,2','9,2','10,2','11,2','12,2','13,2',
				'8,3','8,4','8,5','8,6',
				'9,6','9,7','9,8',
				'8,7','8,8','8,9','9,9','10,9','11,9',
				'12,7','12,8','12,9','12,10','12,11','12,12',
				'10,11','11,11',
				'13,9',
				// Zona B
				'15,2','16,2','17,2','18,2','19,2',
				'19,3','19,4','19,5','19,6','19,7',
				'15,3','15,4','15,5','15,6','15,7','15,8','15,9',
				'16,9','17,9','18,9',
				'15,10','15,11','15,12',
				'16,12','17,12','18,12','19,12',
				'19,11','19,10','19,9','19,8'
			]
		},
		// ──── Variacao 8 ─────────────────────────────────────────────────────────
		// Portal A->C linha 10 | C->B linha 7 | B->A linha 3
		{
			startBot:    { col: 3, row: 13 },
			portalAtoC:  { entry: { col: 6, row: 10 }, exit: { col: 8, row: 10 } },
			portalCtoB:  { entry: { col: 13, row: 7 }, exit: { col: 15, row: 7 } },
			portalBtoA:  { entry: { col: 19, row: 3 }, exit: { col: 1, row: 3 } },
			blockA: { col: 5, row: 12 },  blockC: { col: 9, row: 6 },   blockB: { col: 17, row: 5 },
			baseC:  { col: 12, row: 11 }, baseB:  { col: 15, row: 13 }, baseA:  { col: 4, row: 4 },
			openCells: [
				// Zona A
				'1,3','1,4','1,5','1,6','1,7','1,8','1,9','1,10',
				'2,4','3,4','4,4',
				'2,10','3,10','4,10','5,10','6,10',
				'1,11','1,12','1,13',
				'2,12','3,12','4,12','5,12',
				'2,13','3,13','4,13','5,13',
				'6,13','6,12','6,11',
				// Zona C
				'8,7','9,7','10,7','11,7','12,7','13,7',
				'8,6','9,6','9,5','9,4','9,3','9,2','9,1',
				'10,1','11,1','12,1','13,1',
				'8,8','8,9','8,10',
				'9,10','10,10','11,10','12,10',
				'12,11','12,12','11,12',
				'8,11','8,12',
				// Zona B
				'15,7','16,7','17,7','18,7','19,7',
				'19,3','19,4','19,5','19,6',
				'19,8','19,9','19,10','19,11','19,12','19,13',
				'15,8','15,9','15,10','15,11','15,12','15,13',
				'17,5','17,6',
				'16,13','17,13','18,13'
			]
		},
		// ──── Variacao 9 ─────────────────────────────────────────────────────────
		// Portal A->C linha 4 | C->B linha 10 | B->A linha 6
		{
			startBot:    { col: 1, row: 1 },
			portalAtoC:  { entry: { col: 6, row: 4 },  exit: { col: 8, row: 4 } },
			portalCtoB:  { entry: { col: 13, row: 10 }, exit: { col: 15, row: 10 } },
			portalBtoA:  { entry: { col: 15, row: 6 }, exit: { col: 6, row: 6 } },
			blockA: { col: 2, row: 3 },   blockC: { col: 9, row: 8 },   blockB: { col: 18, row: 11 },
			baseC:  { col: 11, row: 3 },  baseB:  { col: 19, row: 8 },  baseA:  { col: 5, row: 11 },
			openCells: [
				// Zona A
				'1,1','2,1','3,1','4,1','5,1','6,1',
				'6,2','6,3','6,4',
				'1,2','1,3','1,4',
				'2,3',
				'1,5','1,6','6,6',
				'2,6','3,6','4,6','5,6',
				'1,7','1,8','1,9','1,10','1,11',
				'2,11','3,11','4,11','5,11',
				'3,10','3,11',
				'1,12','2,12','3,12','4,12',
				// Zona C
				'8,4','9,4','10,4','11,4','12,4',
				'8,3','9,3','10,3','11,3','12,3',
				'8,5','8,6','8,7','8,8','8,9','8,10',
				'9,8','9,9','9,10',
				'10,10','11,10','12,10','13,10',
				'8,11','8,12','9,12','10,12',
				// Zona B
				'15,6','15,7','15,8','15,9','15,10',
				'16,6','17,6','18,6','19,6',
				'19,7','19,8','16,8','17,8','18,8',
				'15,11','15,12','15,13',
				'16,11','17,11','18,11','19,11',
				'19,12','19,13','18,13','17,13','16,13'
			]
		},
		// ──── Variacao 10 ────────────────────────────────────────────────────────
		// Portal A->C linha 12 | C->B linha 5 | B->A linha 11
		{
			startBot:    { col: 4, row: 1 },
			portalAtoC:  { entry: { col: 6, row: 12 }, exit: { col: 8, row: 12 } },
			portalCtoB:  { entry: { col: 13, row: 5 }, exit: { col: 15, row: 5 } },
			portalBtoA:  { entry: { col: 19, row: 11 }, exit: { col: 1, row: 11 } },
			blockA: { col: 1, row: 8 },   blockC: { col: 12, row: 7 },  blockB: { col: 17, row: 3 },
			baseC:  { col: 10, row: 13 }, baseB:  { col: 15, row: 9 },  baseA:  { col: 3, row: 6 },
			openCells: [
				// Zona A
				'1,1','2,1','3,1','4,1','5,1','6,1',
				'1,2','1,3','1,4','1,5','1,6','1,7','1,8',
				'2,6','3,6',
				'2,8','3,8','4,8','5,8',
				'1,9','1,10','1,11',
				'2,11','3,11','4,11','5,11','6,11','6,12',
				'1,12','1,13','2,13','3,13','4,13','5,13',
				// Zona C
				'8,5','9,5','10,5','11,5','12,5','13,5',
				'8,4','8,3','8,2','8,1','9,1','10,1','11,1','12,1',
				'8,6','8,7','8,8','8,9','8,10',
				'12,6','12,7','12,8',
				'8,11','8,12',
				'9,12','9,13','10,13','11,13','12,13',
				'8,13',
				// Zona B
				'15,5','16,5','17,5','18,5','19,5',
				'17,3','17,4',
				'19,4','19,5','19,6','19,7','19,8','19,9','19,10','19,11',
				'15,6','15,7','15,8','15,9','15,10','15,11',
				'16,9',
				'16,11','17,11','18,11'
			]
		}
	];


	function bfsMinStepsFase6(fromCol, fromRow, toCol, toRow) {
		if (fromCol === toCol && fromRow === toRow) { return 0; }
		var visited = new Set([fromCol + ',' + fromRow]);
		var queue = [{ col: fromCol, row: fromRow, dist: 0 }];
		while (queue.length) {
			var cur = queue.shift();
			var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
			for (var d = 0; d < dirs.length; d += 1) {
				var nc = cur.col + dirs[d][0], nr = cur.row + dirs[d][1];
				if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) { continue; }
				if (isWall(nc, nr)) { continue; }
				if (isPortalAtoCEntryCell(nc, nr)) { nc = portalAtoCExit.col; nr = portalAtoCExit.row; }
				else if (isPortalCtoBEntryCell(nc, nr)) { nc = portalCtoBExit.col; nr = portalCtoBExit.row; }
				else if (isPortalBtoAEntryCell(nc, nr)) { nc = portalBtoAExit.col; nr = portalBtoAExit.row; }
				var nk = nc + ',' + nr;
				if (visited.has(nk)) { continue; }
				visited.add(nk);
				if (nc === toCol && nr === toRow) { return cur.dist + 1; }
				queue.push({ col: nc, row: nr, dist: cur.dist + 1 });
			}
		}
		return 9999;
	}

	function calcularMinPassosFase6() {
		var bA = initialBlocks.A, bC = initialBlocks.C, bB = initialBlocks.B;
		var baseA = bases.find(function(b) { return b.id === 'baseA'; });
		var baseC = bases.find(function(b) { return b.id === 'baseC'; });
		var baseB = bases.find(function(b) { return b.id === 'baseB'; });
		var s = startBot;
		// Rota natural: A->C, depois C->B, depois B->A (segue o fluxo dos portais)
		return bfsMinStepsFase6(s.col, s.row, bA.col, bA.row) + 1 +
			bfsMinStepsFase6(bA.col, bA.row, baseC.col, baseC.row) + 1 +
			bfsMinStepsFase6(baseC.col, baseC.row, bC.col, bC.row) + 1 +
			bfsMinStepsFase6(bC.col, bC.row, baseB.col, baseB.row) + 1 +
			bfsMinStepsFase6(baseB.col, baseB.row, bB.col, bB.row) + 1 +
			bfsMinStepsFase6(bB.col, bB.row, baseA.col, baseA.row) + 1;
	}

	function applyVariationByIndex(index) {
		const v = lessonVariations[index];
		activeVariationIndex = index;

		startBot        = { col: v.startBot.col,       row: v.startBot.row };
		portalAtoCEntry = { col: v.portalAtoC.entry.col, row: v.portalAtoC.entry.row };
		portalAtoCExit  = { col: v.portalAtoC.exit.col,  row: v.portalAtoC.exit.row };
		portalCtoBEntry = { col: v.portalCtoB.entry.col, row: v.portalCtoB.entry.row };
		portalCtoBExit  = { col: v.portalCtoB.exit.col,  row: v.portalCtoB.exit.row };
		portalBtoAEntry = { col: v.portalBtoA.entry.col, row: v.portalBtoA.entry.row };
		portalBtoAExit  = { col: v.portalBtoA.exit.col,  row: v.portalBtoA.exit.row };

		// Update base positions (mutate existing objects to keep references stable)
		const baseA = bases.find(function (b) { return b.id === 'baseA'; });
		const baseC = bases.find(function (b) { return b.id === 'baseC'; });
		const baseB = bases.find(function (b) { return b.id === 'baseB'; });
		if (baseA) { baseA.col = v.baseA.col; baseA.row = v.baseA.row; }
		if (baseC) { baseC.col = v.baseC.col; baseC.row = v.baseC.row; }
		if (baseB) { baseB.col = v.baseB.col; baseB.row = v.baseB.row; }

		// Update block initial positions and reset
		initialBlocks = {
			A: { col: v.blockA.col, row: v.blockA.row },
			C: { col: v.blockC.col, row: v.blockC.row },
			B: { col: v.blockB.col, row: v.blockB.row }
		};
		for (const block of blocks) {
			const init = initialBlocks[block.id];
			block.col = init.col;
			block.row = init.row;
			block.delivered = false;
		}

		// Build open cell set, ensuring all key positions are traversable
		openCells = new Set(v.openCells);
		openCells.add(startBot.col + ',' + startBot.row);
		openCells.add(portalAtoCEntry.col + ',' + portalAtoCEntry.row);
		openCells.add(portalAtoCExit.col + ',' + portalAtoCExit.row);
		openCells.add(portalCtoBEntry.col + ',' + portalCtoBEntry.row);
		openCells.add(portalCtoBExit.col + ',' + portalCtoBExit.row);
		openCells.add(portalBtoAEntry.col + ',' + portalBtoAEntry.row);
		openCells.add(portalBtoAExit.col + ',' + portalBtoAExit.row);
		for (const b of bases) { openCells.add(b.col + ',' + b.row); }
		for (const bid of ['A', 'C', 'B']) {
			const p = initialBlocks[bid];
			openCells.add(p.col + ',' + p.row);
		}

		rebuildMazeWalls();
		minPassosFase6 = calcularMinPassosFase6();
	}

	function selectRandomVariationOnLessonStart() {
		applyVariationByIndex(Math.floor(Math.random() * lessonVariations.length));
	}


    let state = {
    	botCol: startBot.col,
    	botRow: startBot.row,
    	carryingBlockId: null
    };

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

    function setEntityPosition(el, col, row) {
    	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
    }

    function clampToBoard(col, row) {
    	return {
    		col: Math.max(0, Math.min(COLS - 1, col)),
    		row: Math.max(0, Math.min(ROWS - 1, row))
    	};
    }

    function isDoorCtoBCell(col, row) {
	    return false; // portas removidas — apenas portais
    }

    function isDoorBtoACell(col, row) {
	    return false; // portas removidas — apenas portais
    }

	function isPortalAtoCEntryCell(col, row) {
	    return col === portalAtoCEntry.col && row === portalAtoCEntry.row;
	}

	function isPortalCtoBEntryCell(col, row) {
	    return col === portalCtoBEntry.col && row === portalCtoBEntry.row;
	}

	function isPortalBtoAEntryCell(col, row) {
	    return col === portalBtoAEntry.col && row === portalBtoAEntry.row;
	}

    function isWall(col, row) {
    	return wallSet.has(col + ',' + row);
    }

    function isWalkable(col, row) {
    	return col >= 0 && col < COLS && row >= 0 && row < ROWS && !isWall(col, row);
    }

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

		function renderPortal(pos, labelText, isExit) {
			const cell = document.createElement('div');
			cell.className = 'maze-cell';
			cell.style.transform = 'translate(' + (pos.col * CELL) + 'px,' + (pos.row * CELL) + 'px)';
			const visual = document.createElement('div');
			visual.className = 'maze-portal' + (isExit ? ' exit' : '');
			const label = document.createElement('span');
			label.className = 'maze-portal-label';
			label.textContent = labelText;
			visual.appendChild(label);
			cell.appendChild(visual);
			mazeLayer.appendChild(cell);
		}

		renderPortal(portalAtoCEntry, 'A→C', false);
		renderPortal(portalAtoCExit,  '↩A',  true);
		renderPortal(portalCtoBEntry, 'C→B', false);
		renderPortal(portalCtoBExit,  '↩C',  true);
		renderPortal(portalBtoAEntry, 'B→A', false);
		renderPortal(portalBtoAExit,  '↩B',  true);
    }

    function renderBases() {
    	baseLayer.innerHTML = '';

    	for (const base of bases) {
    		const baseCell = document.createElement('div');
    		baseCell.className = 'base-cell final-base-cell';
    		baseCell.dataset.baseId = base.id;
    		baseCell.style.color = base.color;

    		const baseVisual = document.createElement('div');
    		baseVisual.className = 'base final-base';
			baseVisual.style.color = base.color;
    		baseCell.appendChild(baseVisual);

			const baseLabel = document.createElement('span');
			baseLabel.className = 'final-base-label';
			baseLabel.textContent = 'Base ' + base.area;
			baseCell.appendChild(baseLabel);

			const baseHint = document.createElement('span');
			baseHint.className = 'final-base-hint';
			baseHint.textContent = 'recebe ' + base.expects;
			baseCell.appendChild(baseHint);

    		setEntityPosition(baseCell, base.col, base.row);
    		baseLayer.appendChild(baseCell);
    	}
    }

    function renderBlocks() {
    	packageLayer.innerHTML = '';

    	for (const block of blocks) {
    		const blockCell = document.createElement('div');
    		blockCell.className = 'package-cell final-package-cell';
    		blockCell.dataset.blockId = block.id;
    		if (block.delivered) {
    			blockCell.classList.add('delivered');
    		}

    		const blockVisual = document.createElement('div');
    		blockVisual.className = 'package final-package';
    		blockVisual.style.background = 'linear-gradient(180deg, ' + block.color + ', color-mix(in srgb, ' + block.color + ' 62%, black))';

			const blockLabel = document.createElement('span');
			blockLabel.className = 'final-package-label';
			blockLabel.textContent = block.id;
			blockVisual.appendChild(blockLabel);

    		blockCell.appendChild(blockVisual);
    		setEntityPosition(blockCell, block.col, block.row);
    		packageLayer.appendChild(blockCell);
    	}
    }

    function refreshLayerPositions() {
    	for (const blockCell of packageLayer.querySelectorAll('.final-package-cell')) {
    		const blockId = blockCell.dataset.blockId;
    		const block = blocks.find(item => item.id === blockId);
    		if (block) {
    			setEntityPosition(blockCell, block.col, block.row);
    			blockCell.classList.toggle('delivered', block.delivered);
    		}
    	}
    }

    function normalizeCommand(raw) {
    	return raw.replace(/\s+/g, '');
    }

    function parseCommand(rawLine) {
    	const cmd = normalizeCommand(rawLine);

    	if (cmd === 'pegar()') {
    		return { action: 'pegar', amount: 1 };
    	}

    	if (cmd === 'largar()') {
    		return { action: 'largar', amount: 1 };
    	}

    	const moveMatch = cmd.match(/^(moverDireita|moverEsquerda|moverCima|moverBaixo)(?:\((\d+)\))?$/);
    	if (!moveMatch) {
    		return null;
    	}

    	const action = moveMatch[1];
    	const amount = moveMatch[2] ? Number(moveMatch[2]) : 1;
    	if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
    		return null;
    	}

    	return { action, amount };
    }

		setupPromptEditor(cmdInput, line => Boolean(parseCommand(line)));

    function hideErrorPanel() {
    	errorPanel.classList.add('hidden');
    	errorPanelMsg.textContent = '';
    }

    function showErrorPanel(command) {
    	errorPanelMsg.textContent = 'Comando invalido: "' + command + '". Revise e tente novamente.';
    	errorPanel.classList.remove('hidden');
    }

    function hideDocsPanel() {
    	docsPanel.classList.add('hidden');
    }

    function showDocsPanel() {
    	docsPanel.classList.remove('hidden');
    }

    function hideWinPanel() {
    	finalResultsPanel.classList.add('hidden');
    }

    function calcularTempoFinal(horaInicial, horaFinal) {
    	if (!horaInicial) return '--';
    	var inicio = new Date(horaInicial.replace(' ', 'T'));
    	var fim = horaFinal ? new Date(horaFinal.replace(' ', 'T')) : new Date();
    	var diffMs = fim - inicio;
    	if (isNaN(diffMs) || diffMs < 0) return '--';
    	var diffMin = Math.floor(diffMs / 60000);
    	if (diffMin < 60) return diffMin + 'm';
    	var h = Math.floor(diffMin / 60);
    	var m = diffMin % 60;
    	return h + 'h ' + (m < 10 ? '0' : '') + m + 'm';
    }

    function escapeHtmlFinal(str) {
    	return String(str)
    		.replace(/&/g, '&amp;')
    		.replace(/</g, '&lt;')
    		.replace(/>/g, '&gt;')
    		.replace(/"/g, '&quot;');
    }

    function showWinPanel(executedSteps, stars) {
    	var frpPlayerName  = document.getElementById('frpPlayerName');
    	var finalResultsSub = document.getElementById('finalResultsSub');
    	var finalStarRating = document.getElementById('finalStarRating');
    	var finalTempo = document.getElementById('finalTempo');
    	var finalTotalStars = document.getElementById('finalTotalStars');
    	var finalRankPos = document.getElementById('finalRankPos');
    	var finalRankBody = document.getElementById('finalRankBody');

    	if (frpPlayerName) {
    		frpPlayerName.textContent = getPlayerName();
    	}
    	if (finalResultsSub) {
    		finalResultsSub.textContent = 'Troca concluída em ' + executedSteps + ' comandos: A→C, C→B e B→A.';
    	}
    	if (finalStarRating) {
    		finalStarRating.className = 'frp-mini-stars star-rating stars-' + stars;
    	}

    	var progress = loadProgressState();
    	var totalEstrelas = Object.values(progress.estrelasPorFase).reduce(function (s, v) { return s + Number(v); }, 0);
    	if (finalTotalStars) {
    		finalTotalStars.textContent = totalEstrelas + ' / 18';
    	}

    	finalResultsPanel.classList.remove('hidden');

    	var playerId = '';
    	try { playerId = localStorage.getItem(PLAYER_ID_STORAGE_KEY) || ''; } catch (e) {}

    	if (!playerId) {
    		if (finalRankPos) finalRankPos.textContent = 'Ranking não disponível.';
    		if (finalRankBody) finalRankBody.innerHTML = '<tr><td colspan="5" class="frp-td-loading">Faça login para ver o ranking.</td></tr>';
    		return;
    	}

    	var playerIdNum = Number(playerId);

    	Promise.all([
    		GameAPI.getRanking(100),
    		GameAPI.getJogador(playerIdNum)
    	]).then(function (results) {
    		var ranking = (results[0] && results[0].ranking) ? results[0].ranking : [];
    		var jogador = (results[1] && results[1].jogador) ? results[1].jogador : null;

    		if (jogador && finalTempo) {
    			finalTempo.textContent = calcularTempoFinal(jogador.hora_inicial, jogador.hora_final);
    		}

    		var playerIndex = ranking.findIndex(function (r) { return Number(r.id) === playerIdNum; });

    		if (finalRankPos) {
    			finalRankPos.textContent = playerIndex === -1
    				? 'Posição não encontrada'
    				: '#' + (playerIndex + 1) + ' de ' + ranking.length + ' jogador' + (ranking.length !== 1 ? 'es' : '');
    		}

    		if (finalRankBody) {
    			if (!ranking.length) {
    				finalRankBody.innerHTML = '<tr><td colspan="5" class="frp-td-loading">Sem dados no ranking.</td></tr>';
    				return;
    			}
    			var idx = playerIndex === -1 ? 0 : playerIndex;
    			var start = Math.max(0, idx - 2);
    			var end = Math.min(ranking.length - 1, idx + 2);
    			while (end - start < 4 && start > 0) { start--; }
    			while (end - start < 4 && end < ranking.length - 1) { end++; }

    			var html = '';
    			for (var i = start; i <= end; i++) {
    				var r = ranking[i];
    				var isMe = Number(r.id) === playerIdNum;
    				var fases = Array.isArray(r.fases_concluidas) ? r.fases_concluidas.length : 0;
    				var tempo = calcularTempoFinal(r.hora_inicial, r.hora_final);
    				var posLabel = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
    				html += '<tr class="frp-tr' + (isMe ? ' frp-tr--me' : '') + '">'
    					+ '<td class="frp-td frp-td-pos">' + posLabel + '</td>'
    					+ '<td class="frp-td frp-td-name">' + escapeHtmlFinal(r.nome) + (isMe ? ' <span class="frp-you-badge">você</span>' : '') + '</td>'
    					+ '<td class="frp-td frp-td-c">' + fases + '/6</td>'
    					+ '<td class="frp-td frp-td-c">' + (r.estrelas || 0) + '</td>'
    					+ '<td class="frp-td frp-td-c">' + tempo + '</td>'
    					+ '</tr>';
    			}
    			finalRankBody.innerHTML = html;
    		}
    	}).catch(function () {
    		if (finalRankPos) finalRankPos.textContent = 'Erro ao carregar o ranking.';
    		if (finalRankBody) finalRankBody.innerHTML = '<tr><td colspan="5" class="frp-td-loading">Erro ao conectar com o servidor.</td></tr>';
    	});
    }

    function hideFailPanel() {
    	failPanel.classList.add('hidden');
    }

    function showFailPanel() {
    	failPanel.classList.remove('hidden');
    }

    function wait(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getBaseById(baseId) {
    	return bases.find(base => base.id === baseId) || null;
    }

    function getBlockById(blockId) {
    	return blocks.find(block => block.id === blockId) || null;
    }

    function isBlockOnTarget(blockId, targetBaseId) {
		const block = getBlockById(blockId);
		const targetBase = getBaseById(targetBaseId);
		if (!block || !targetBase) {
			return false;
		}

		return block.delivered && block.col === targetBase.col && block.row === targetBase.row;
    }

    function isObjectiveAtoCComplete() {
    	return isBlockOnTarget('A', 'baseC');
    }

    function isObjectiveCtoBComplete() {
    	return isBlockOnTarget('C', 'baseB');
    }

    function isObjectiveBtoAComplete() {
    	return isBlockOnTarget('B', 'baseA');
    }

    function getCompletedObjectivesCount() {
		let count = 0;
		if (isObjectiveAtoCComplete()) {
			count += 1;
		}
		if (isObjectiveCtoBComplete()) {
			count += 1;
		}
		if (isObjectiveBtoAComplete()) {
			count += 1;
		}
		return count;
    }

    function setObjectiveDone(element, done) {
		if (!element) {
			return;
		}

		element.classList.toggle('done', done);
    }

    function updateObjectivesUI() {
    	setObjectiveDone(objectiveAtoC, isObjectiveAtoCComplete());
    	setObjectiveDone(objectiveCtoB, isObjectiveCtoBComplete());
    	setObjectiveDone(objectiveBtoA, isObjectiveBtoAComplete());
		turnCounter.textContent = 'Objetivos concluidos: ' + getCompletedObjectivesCount() + '/3';
    }

    function allObjectivesCompleted() {
    	return isObjectiveAtoCComplete() && isObjectiveCtoBComplete() && isObjectiveBtoAComplete();
    }

    function updateDoorState() {
	    // Sem portas — nada a fazer
    }

    function draw() {
    	setEntityPosition(botCell, state.botCol, state.botRow);
    	botCell.classList.toggle('carrying', Boolean(state.carryingBlockId));

    	for (const block of blocks) {
    		const blockCell = packageLayer.querySelector('[data-block-id="' + block.id + '"]');
    		if (!blockCell) {
    			continue;
    		}

			blockCell.classList.toggle('delivered', block.delivered);
			setEntityPosition(blockCell, block.col, block.row);
    	}

		updateObjectivesUI();
    }

    function moveBot(action) {
    	let nextCol = state.botCol;
    	let nextRow = state.botRow;

    	if (action === 'moverDireita') {
    		nextCol += 1;
    	} else if (action === 'moverEsquerda') {
    		nextCol -= 1;
    	} else if (action === 'moverCima') {
    		nextRow -= 1;
    	} else if (action === 'moverBaixo') {
    		nextRow += 1;
    	}

		const bounded = clampToBoard(nextCol, nextRow);
		let moved = false;
		if (isWalkable(bounded.col, bounded.row)) {
			state.botCol = bounded.col;
			state.botRow = bounded.row;
			moved = true;
		}

		if (moved && isPortalAtoCEntryCell(state.botCol, state.botRow)) {
			state.botCol = portalAtoCExit.col;
			state.botRow = portalAtoCExit.row;
			statusEl.className = 'status';
			statusEl.textContent = 'Portal A→C ativado: teleportado para a Zona C.';
		} else if (moved && isPortalCtoBEntryCell(state.botCol, state.botRow)) {
			state.botCol = portalCtoBExit.col;
			state.botRow = portalCtoBExit.row;
			statusEl.className = 'status';
			statusEl.textContent = 'Portal C→B ativado: teleportado para a Zona B.';
		} else if (moved && isPortalBtoAEntryCell(state.botCol, state.botRow)) {
			state.botCol = portalBtoAExit.col;
			state.botRow = portalBtoAExit.row;
			statusEl.className = 'status';
			statusEl.textContent = 'Portal B→A ativado: teleportado de volta para a Zona A.';
		}

		if (state.carryingBlockId) {
			const carriedBlock = getBlockById(state.carryingBlockId);
			if (carriedBlock) {
				carriedBlock.col = state.botCol;
				carriedBlock.row = state.botRow;
			}
		}
    }

    function getMovableBlockAtBot() {
    	return blocks.find(block => {
			return !block.delivered && block.col === state.botCol && block.row === state.botRow;
		}) || null;
    }

    function pickBlock() {
    	if (state.carryingBlockId) {
    		return;
    	}

    	const block = getMovableBlockAtBot();
    	if (block) {
    		state.carryingBlockId = block.id;
    	}
    }

    function dropBlock() {
    	if (!state.carryingBlockId) {
    		return;
    	}

		const carriedBlock = getBlockById(state.carryingBlockId);
		if (!carriedBlock) {
			state.carryingBlockId = null;
			return;
		}

		carriedBlock.col = state.botCol;
		carriedBlock.row = state.botRow;

		const targetBase = getBaseById(carriedBlock.targetBaseId);
		carriedBlock.delivered = Boolean(targetBase && carriedBlock.col === targetBase.col && carriedBlock.row === targetBase.row);
		state.carryingBlockId = null;

		updateDoorState();
    }

    function resetBlocks() {
    	for (const block of blocks) {
			const initial = initialBlocks[block.id];
			block.col = initial.col;
			block.row = initial.row;
			block.delivered = false;
		}
    }

    function applyAction(action) {
    	if (action === 'pegar') {
			pickBlock();
			return;
		}

		if (action === 'largar') {
			dropBlock();
			return;
		}

		moveBot(action);
    }

    function resetLesson() {
    	cmdInput.value = '';
    	cmdInput.dispatchEvent(new Event('input'));
    	hideErrorPanel();
    	hideDocsPanel();
    	hideWinPanel();
    	hideFailPanel();

		state = {
			botCol: startBot.col,
			botRow: startBot.row,
			carryingBlockId: null
		};

		resetBlocks();
		renderBlocks();
		renderBases();
		buildMaze();
		refreshLayerPositions();
		draw();

		statusEl.className = 'status';
		statusEl.textContent = 'Use os portais: A→C, C→B e B→A para entregar todos os blocos.';
    }

    async function executeCommands() {
    	if (livesSystem && !livesSystem.hasLives()) {
    		return;
    	}

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
		statusEl.textContent = 'Executando a fase final...';
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
			if (allObjectivesCompleted()) {
				break;
			}

			if (parsed.action === 'pegar' || parsed.action === 'largar') {
				applyAction(parsed.action);
				executedSteps += 1;
				draw();
				await wait(220);
				continue;
			}

			for (let step = 0; step < parsed.amount; step += 1) {
				if (allObjectivesCompleted()) {
					break;
				}

				applyAction(parsed.action);
				executedSteps += 1;
				draw();
				await wait(200);
			}
		}

		runBtn.disabled = false;
		resetBtn.disabled = false;

		if (allObjectivesCompleted()) {
			statusEl.className = 'status ok';
			statusEl.textContent = 'Parabens! Voce concluiu a troca completa da fase final.';
			const starsEarned6 = livesSystem.getCurrentLives();
			markLessonAsCompleted(6, starsEarned6);
			registrarHoraFinal();
			showWinPanel(executedSteps, starsEarned6);
			return;
		}

		resetLesson();
		if (livesSystem) { livesSystem.registerFailure('Falha na rota: a fase foi resetada para nova tentativa.'); }
		showFailPanel();
    }

    function startPractice() {
    	tutorialPanel.classList.add('hidden');
    	practicePanel.classList.remove('hidden');
    	livesSystem = setupLessonLives(6, statusEl, runBtn, failPanel);
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
    selectRandomVariationOnLessonStart();
    resetLesson();

    })();
    return;
  }
})();


