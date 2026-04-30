(() => {
  'use strict';

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById('board');
  const menuScreen = document.getElementById('menuScreen');
  const gameScreen = document.getElementById('gameScreen');
  const presetSelect = document.getElementById('presetSelect');
  const toggleCustomBtn = document.getElementById('toggleCustomBtn');
  const customControls = document.getElementById('customControls');
  const customW = document.getElementById('customW');
  const customH = document.getElementById('customH');
  const customM = document.getElementById('customM');
  const playBtn = document.getElementById('playBtn');
  const menuBtn = document.getElementById('menuBtn');
  const recordsBtn = document.getElementById('recordsBtn');
  const recordsModal = document.getElementById('recordsModal');
  const recordsClose = document.getElementById('recordsClose');
  const recordsOk = document.getElementById('recordsOk');
  const recordsName = document.getElementById('recordsName');
  const recordsValue = document.getElementById('recordsValue');

  const minesEl = document.getElementById('minesCounter');
  const timeEl = document.getElementById('timeCounter');
  const faceBtn = document.getElementById('faceBtn');
  const hintBtn = document.getElementById('hintBtn');
  const panelEl = document.querySelector('.panel');

  const victoryModal = document.getElementById('victoryModal');
  const victoryClose = document.getElementById('victoryClose');
  const victoryAgain = document.getElementById('victoryAgain');
  const victoryOk = document.getElementById('victoryOk');
  const victoryTime = document.getElementById('victoryTime');
  const victoryBoard = document.getElementById('victoryBoard');

  const lossModal = document.getElementById('lossModal');
  const lossClose = document.getElementById('lossClose');
  const lossAgain = document.getElementById('lossAgain');
  const lossOk = document.getElementById('lossOk');
  const lossTime = document.getElementById('lossTime');
  const lossBoard = document.getElementById('lossBoard');

  const ctx = canvas.getContext('2d', { alpha: false });
  const resultsEndpoint = String(window.SAPER_RESULTS_URL || '').trim();

  const yandex = {
    ysdk: null,
    player: null,
    initPromise: null,
    playerPromise: null,
    loadingReadySent: false,
    adShowing: false,
    gameplayActive: false,
  };

  const PRESETS = {
    beginner: { w: 9, h: 9, m: 10, label: 'Новичок' },
    intermediate: { w: 16, h: 16, m: 40, label: 'Средний' },
    expert: { w: 30, h: 16, m: 99, label: 'Эксперт' },
  };

  const NUMBER_COLORS = [
    null,
    '#2b6cff',
    '#2dbb55',
    '#ff3b4f',
    '#2f4bff',
    '#8a2be2',
    '#2bb7c2',
    '#12151f',
    '#7b8198',
  ];

  function initYandexSdk() {
    if (yandex.initPromise) return yandex.initPromise;
    if (!window.YaGames || typeof window.YaGames.init !== 'function') {
      yandex.initPromise = Promise.resolve(null);
      return yandex.initPromise;
    }

    yandex.initPromise = window.YaGames.init()
      .then((ysdk) => {
        yandex.ysdk = ysdk;
        notifyGameReady();
        loadYandexPlayer();
        return ysdk;
      })
      .catch((err) => {
        console.warn('Yandex Games SDK init failed', err);
        return null;
      });

    return yandex.initPromise;
  }

  function notifyGameReady() {
    if (yandex.loadingReadySent || !yandex.ysdk) return;
    try {
      yandex.ysdk.features?.LoadingAPI?.ready?.();
      yandex.loadingReadySent = true;
    } catch (err) {
      console.warn('Yandex LoadingAPI.ready failed', err);
    }
  }

  function loadYandexPlayer() {
    if (!yandex.ysdk || yandex.playerPromise || typeof yandex.ysdk.getPlayer !== 'function') return yandex.playerPromise;
    yandex.playerPromise = yandex.ysdk
      .getPlayer({ signed: true })
      .then((player) => {
        yandex.player = player;
        return player;
      })
      .catch((err) => {
        console.warn('Yandex player init failed', err);
        return null;
      });
    return yandex.playerPromise;
  }

  function startGameplayMarkup() {
    if (!yandex.ysdk || yandex.gameplayActive || yandex.adShowing || state.screen !== 'game' || state.over) return;
    try {
      yandex.ysdk.features?.GameplayAPI?.start?.();
      yandex.gameplayActive = true;
    } catch (err) {
      console.warn('Yandex GameplayAPI.start failed', err);
    }
  }

  function stopGameplayMarkup() {
    if (!yandex.ysdk || !yandex.gameplayActive) return;
    try {
      yandex.ysdk.features?.GameplayAPI?.stop?.();
    } catch (err) {
      console.warn('Yandex GameplayAPI.stop failed', err);
    } finally {
      yandex.gameplayActive = false;
    }
  }

  function showNewGameAd() {
    initYandexSdk().then((ysdk) => {
      if (!ysdk?.adv || yandex.adShowing) {
        startGameplayMarkup();
        return;
      }

      stopGameplayMarkup();
      yandex.adShowing = true;

      const finishAd = () => {
        yandex.adShowing = false;
        startGameplayMarkup();
      };

      try {
        ysdk.adv.showFullscreenAdv({
          callbacks: {
            onOpen: stopGameplayMarkup,
            onClose: finishAd,
            onError: (err) => {
              console.warn('Yandex fullscreen ad failed', err);
              finishAd();
            },
          },
        });
      } catch (err) {
        console.warn('Yandex fullscreen ad failed', err);
        finishAd();
      }
    });
  }

  function getPlayerPayload() {
    const player = yandex.player;
    if (!player) return null;

    const payload = {};
    try {
      if (typeof player.getUniqueID === 'function') payload.uniqueId = player.getUniqueID();
      if (typeof player.getName === 'function') payload.name = player.getName();
      if (typeof player.isAuthorized === 'function') payload.authorized = player.isAuthorized();
      if (player.signature) payload.signature = player.signature;
    } catch (err) {
      console.warn('Yandex player payload failed', err);
    }
    return payload;
  }

  function sendWinResult() {
    if (!resultsEndpoint) {
      console.info('Set window.SAPER_RESULTS_URL to send win results to Yandex Cloud.');
      return;
    }

    Promise.resolve(yandex.playerPromise)
      .catch(() => null)
      .then(() => {
        const payload = {
          event: 'win',
          wonAt: new Date().toISOString(),
          difficulty: state.currentPreset,
          recordKey: state.currentRecordKey,
          board: {
            width: state.w,
            height: state.h,
            mines: state.mines,
            label: boardLabel(),
          },
          result: {
            timeSec: state.timeSec,
            flags: state.flags,
          },
          yandexPlayer: getPlayerPayload(),
        };

        return fetch(resultsEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      })
      .then((response) => {
        if (response && !response.ok) {
          console.warn('Yandex Cloud result upload failed', response.status, response.statusText);
        }
      })
      .catch((err) => {
        console.warn('Yandex Cloud result upload failed', err);
      });
  }

  const state = {
    w: 9,
    h: 9,
    mines: 10,

    started: false,
    over: false,
    won: false,
    screen: 'menu',

    timeSec: 0,
    timerId: /** @type {number | null} */ (null),

    grid: /** @type {Cell[]} */ ([]),
    revealed: 0,
    flags: 0,

    dpr: 1,
    boardPx: { w: 0, h: 0 },
    cell: 24,
    ox: 0,
    oy: 0,

    pointerDown: false,
    downCell: /** @type {{x:number,y:number}|null} */ (null),
    longPressId: /** @type {number | null} */ (null),
    longPressFired: false,

    boom: /** @type {{x:number,y:number,t0:number}|null} */ (null),
    animRaf: /** @type {number|null} */ (null),

    hintMode: false,
    hintPreview: /** @type {{x:number,y:number}|null} */ (null),
    hintPreviewId: /** @type {number | null} */ (null),
    minesPlaced: false,

    currentPreset: 'beginner',
    currentRecordKey: 'beginner',
  };

  /**
   * @typedef {Object} Cell
   * @property {boolean} mine
   * @property {number} n
   * @property {boolean} revealed
   * @property {boolean} flagged
   * @property {boolean} exploded
   */

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function idx(x, y) {
    return y * state.w + x;
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < state.w && y < state.h;
  }

  function neighbors(x, y, fn) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (inBounds(nx, ny)) fn(nx, ny);
      }
    }
  }

  function setFace(emoji) {
    faceBtn.textContent = emoji;
  }

  function fmt3(n) {
    return String(clamp(n, 0, 999)).padStart(3, '0');
  }

  function boardLabel(w = state.w, h = state.h, m = state.mines) {
    return `${w}x${h} • ${m} мин`;
  }

  function updateCounters() {
    const remaining = state.mines - state.flags;
    minesEl.textContent = fmt3(Math.max(-99, remaining));
    timeEl.textContent = fmt3(state.timeSec);
  }

  function syncHintButton() {
    if (!hintBtn) return;
    hintBtn.classList.toggle('isActive', state.hintMode);
  }

  function clearHintPreview() {
    state.hintPreview = null;
    if (state.hintPreviewId != null) {
      clearTimeout(state.hintPreviewId);
      state.hintPreviewId = null;
    }
  }

  function stopHintMode() {
    state.hintMode = false;
    syncHintButton();
  }

  function clearHint() {
    stopHintMode();
    clearHintPreview();
  }

  function ensureMinesPlaced(safeX, safeY) {
    if (state.minesPlaced) return;
    placeMinesAvoiding(safeX, safeY);
    state.minesPlaced = true;
  }

  function startHintMode() {
    if (state.over || state.screen !== 'game') return;
    state.hintMode = !state.hintMode;
    clearHintPreview();
    syncHintButton();
    draw();
  }

  function previewHintCell(x, y) {
    if (state.over || !inBounds(x, y)) return false;
    const cell = state.grid[idx(x, y)];
    if (cell.revealed || cell.flagged) return false;

    ensureMinesPlaced(x, y);
    state.hintPreview = { x, y };
    stopHintMode();
    if (state.hintPreviewId != null) clearTimeout(state.hintPreviewId);
    state.hintPreviewId = setTimeout(() => {
      state.hintPreview = null;
      state.hintPreviewId = null;
      draw();
    }, 900);
    draw();
    return true;
  }

  function getSelection() {
    const preset = presetSelect.value;
    if (preset === 'custom') {
      const w = clamp(customW.valueAsNumber || 16, 5, 60);
      const h = clamp(customH.valueAsNumber || 16, 5, 40);
      const m = clamp(customM.valueAsNumber || 40, 1, w * h - 1);
      return {
        preset: 'custom',
        w,
        h,
        m,
        label: `Свое поле (${boardLabel(w, h, m)})`,
        recordKey: `custom:${w}x${h}:${m}`,
      };
    }
    const pr = PRESETS[preset] || PRESETS.beginner;
    return {
      preset,
      w: pr.w,
      h: pr.h,
      m: pr.m,
      label: `${pr.label} (${boardLabel(pr.w, pr.h, pr.m)})`,
      recordKey: preset,
    };
  }

  function updateCustomVisibility(forceOpen = false) {
    customControls.hidden = !forceOpen;
    if (forceOpen) presetSelect.value = 'custom';
  }

  function showMenu() {
    state.screen = 'menu';
    stopGameplayMarkup();
    stopTimer();
    clearHint();
    hideVictoryModal();
    hideLossModal();
    hideRecordsModal();
    menuScreen.hidden = false;
    gameScreen.hidden = true;
  }

  function showGame() {
    state.screen = 'game';
    initYandexSdk();
    menuScreen.hidden = true;
    gameScreen.hidden = false;
    requestAnimationFrame(() => {
      resize();
      draw();
    });
  }

  function recordStorageKey(recordKey) {
    return `miner-record:${recordKey}`;
  }

  function readRecord(recordKey) {
    try {
      const raw = localStorage.getItem(recordStorageKey(recordKey));
      return raw == null ? null : Number(raw);
    } catch {
      return null;
    }
  }

  function writeRecord(recordKey, value) {
    try {
      localStorage.setItem(recordStorageKey(recordKey), String(value));
    } catch {}
  }

  function saveRecordIfNeeded() {
    const best = readRecord(state.currentRecordKey);
    if (best == null || state.timeSec < best) {
      writeRecord(state.currentRecordKey, state.timeSec);
    }
  }

  function showRecordsModal() {
    const selection = getSelection();
    const best = readRecord(selection.recordKey);
    recordsName.textContent = selection.label;
    recordsValue.textContent = best == null ? 'Пока нет рекорда' : `${fmt3(best)} сек`;
    recordsModal.hidden = false;
  }

  function hideRecordsModal() {
    recordsModal.hidden = true;
  }

  function showVictoryModal() {
    victoryTime.textContent = fmt3(state.timeSec);
    victoryBoard.textContent = boardLabel();
    victoryModal.hidden = false;
  }

  function hideVictoryModal() {
    victoryModal.hidden = true;
  }

  function showLossModal() {
    lossTime.textContent = fmt3(state.timeSec);
    lossBoard.textContent = boardLabel();
    lossModal.hidden = false;
  }

  function hideLossModal() {
    lossModal.hidden = true;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function startBoom(x, y) {
    state.boom = { x, y, t0: performance.now() };
    if (state.animRaf != null) cancelAnimationFrame(state.animRaf);
    const tick = () => {
      draw();
      if (!state.boom) return;
      const t = (performance.now() - state.boom.t0) / 600;
      if (t >= 1) {
        state.boom = null;
        state.animRaf = null;
        draw();
        return;
      }
      state.animRaf = requestAnimationFrame(tick);
    };
    state.animRaf = requestAnimationFrame(tick);
  }

  function drawBoomOverlay() {
    if (!state.boom) return;
    const t = clamp((performance.now() - state.boom.t0) / 600, 0, 1);
    const k = easeOutCubic(t);
    const cell = state.cell;
    const cx = state.ox + (state.boom.x + 0.5) * cell;
    const cy = state.oy + (state.boom.y + 0.5) * cell;
    const r = cell * 3.2 * k;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const flash = Math.max(0, 1 - t * 3);
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 180, 90, ${0.28 * flash})`;
      ctx.fillRect(0, 0, state.boardPx.w, state.boardPx.h);
    }

    ctx.strokeStyle = `rgba(255, 92, 120, ${0.65 * (1 - t)})`;
    ctx.lineWidth = Math.max(2, Math.floor(cell * 0.14));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.15);
    g.addColorStop(0, `rgba(255, 92, 120, ${0.55 * (1 - t)})`);
    g.addColorStop(0.35, `rgba(255, 178, 77, ${0.35 * (1 - t)})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function stopTimer() {
    if (state.timerId != null) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function startTimer() {
    if (state.timerId != null) return;
    state.timerId = setInterval(() => {
      if (state.over) return;
      state.timeSec = clamp(state.timeSec + 1, 0, 999);
      updateCounters();
    }, 1000);
  }

  function resetGrid() {
    state.grid = [];
    for (let i = 0; i < state.w * state.h; i++) {
      state.grid.push({ mine: false, n: 0, revealed: false, flagged: false, exploded: false });
    }
    state.revealed = 0;
    state.flags = 0;
  }

  function computeNumbers() {
    for (let y = 0; y < state.h; y++) {
      for (let x = 0; x < state.w; x++) {
        const c = state.grid[idx(x, y)];
        if (c.mine) {
          c.n = 0;
          continue;
        }
        let count = 0;
        neighbors(x, y, (nx, ny) => {
          if (state.grid[idx(nx, ny)].mine) count++;
        });
        c.n = count;
      }
    }
  }

  function placeMinesAvoiding(safeX, safeY) {
    const banned = new Set();
    banned.add(idx(safeX, safeY));
    neighbors(safeX, safeY, (nx, ny) => banned.add(idx(nx, ny)));

    const total = state.w * state.h;
    const available = total - banned.size;
    const minesToPlace = clamp(state.mines, 1, Math.max(1, available - 1));
    state.mines = minesToPlace;

    const candidates = [];
    for (let i = 0; i < total; i++) {
      if (!banned.has(i)) candidates.push(i);
    }
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = candidates[i];
      candidates[i] = candidates[j];
      candidates[j] = t;
    }

    for (let i = 0; i < minesToPlace; i++) {
      state.grid[candidates[i]].mine = true;
    }
    computeNumbers();
  }

  function revealCell(x, y) {
    if (state.over) return;
    if (!inBounds(x, y)) return;
    const c = state.grid[idx(x, y)];
    if (c.revealed || c.flagged) return;
    clearHint();

    if (!state.started) {
      state.started = true;
      state.timeSec = 0;
      stopTimer();
      startTimer();
      setFace('😮');
      ensureMinesPlaced(x, y);
    }

    c.revealed = true;
    state.revealed++;

    if (c.mine) {
      c.exploded = true;
      gameOver(false, { boomAt: { x, y } });
      return;
    }

    if (c.n === 0) floodFillZeros(x, y);
    checkWin();
  }

  function floodFillZeros(sx, sy) {
    /** @type {{x:number,y:number}[]} */
    const q = [{ x: sx, y: sy }];
    while (q.length) {
      const { x, y } = q.pop();
      neighbors(x, y, (nx, ny) => {
        const nc = state.grid[idx(nx, ny)];
        if (nc.revealed || nc.flagged) return;
        nc.revealed = true;
        state.revealed++;
        if (!nc.mine && nc.n === 0) q.push({ x: nx, y: ny });
      });
    }
  }

  function toggleFlag(x, y) {
    if (state.over) return;
    if (!inBounds(x, y)) return;
    const c = state.grid[idx(x, y)];
    if (c.revealed) return;
    clearHint();
    c.flagged = !c.flagged;
    state.flags += c.flagged ? 1 : -1;
    updateCounters();
    checkWin();
  }

  function chord(x, y) {
    if (state.over) return;
    if (!inBounds(x, y)) return;
    const c = state.grid[idx(x, y)];
    if (!c.revealed || c.n === 0) return;

    let flagged = 0;
    neighbors(x, y, (nx, ny) => {
      if (state.grid[idx(nx, ny)].flagged) flagged++;
    });
    if (flagged !== c.n) return;

    neighbors(x, y, (nx, ny) => revealCell(nx, ny));
  }

  function revealAllMines() {
    for (const c of state.grid) {
      if (c.mine) c.revealed = true;
    }
  }

  function gameOver(won, opts) {
    state.over = true;
    state.won = won;
    clearHint();
    stopGameplayMarkup();
    stopTimer();

    if (won) {
      saveRecordIfNeeded();
      sendWinResult();
      setFace('😎');
      for (const c of state.grid) {
        if (c.mine && !c.flagged) {
          c.flagged = true;
          state.flags++;
        }
      }
      showVictoryModal();
    } else {
      setFace('😵');
      if (opts?.boomAt) startBoom(opts.boomAt.x, opts.boomAt.y);
      setTimeout(() => {
        if (!state.over || state.won) return;
        revealAllMines();
        updateCounters();
        draw();
      }, 260);
      setTimeout(() => {
        if (!state.over || state.won) return;
        showLossModal();
      }, 520);
    }
    updateCounters();
  }

  function checkWin() {
    if (state.over) return;
    const safeCells = state.w * state.h - state.mines;
    if (state.revealed >= safeCells) gameOver(true);
  }

  function newGame(w, h, m, recordKey, presetKey) {
    stopGameplayMarkup();
    state.w = clamp(w | 0, 5, 60);
    state.h = clamp(h | 0, 5, 40);
    state.mines = clamp(m | 0, 1, Math.max(1, state.w * state.h - 1));
    state.currentRecordKey = recordKey || 'beginner';
    state.currentPreset = presetKey || 'beginner';
    state.started = false;
    state.over = false;
    state.won = false;
    state.timeSec = 0;
    stopTimer();
    if (state.animRaf != null) cancelAnimationFrame(state.animRaf);
    state.animRaf = null;
    state.boom = null;
    state.minesPlaced = false;
    clearHint();
    resetGrid();
    updateCounters();
    setFace('🙂');
    hideVictoryModal();
    hideLossModal();
    resize();
    draw();
    showNewGameAd();
  }

  function startSelectedGame() {
    const selection = getSelection();
    showGame();
    newGame(selection.w, selection.h, selection.m, selection.recordKey, selection.preset);
  }

  function restartSameSettings() {
    newGame(state.w, state.h, state.mines, state.currentRecordKey, state.currentPreset);
  }

  function getCanvasRect() {
    return canvas.getBoundingClientRect();
  }

  function resize() {
    const rect = getCanvasRect();
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    state.dpr = dpr;

    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    state.boardPx.w = canvas.width;
    state.boardPx.h = canvas.height;

    const pad = Math.floor(18 * dpr);
    const availW = Math.max(1, state.boardPx.w - pad * 2);
    const availH = Math.max(1, state.boardPx.h - pad * 2);
    const cell = Math.floor(Math.min(availW / state.w, availH / state.h));
    state.cell = clamp(cell, Math.floor(14 * dpr), Math.floor(44 * dpr));

    const gridW = state.cell * state.w;
    const gridH = state.cell * state.h;
    state.ox = Math.floor((state.boardPx.w - gridW) / 2);
    state.oy = Math.floor((state.boardPx.h - gridH) / 2);

    if (panelEl) {
      const gridCssW = Math.round(gridW / dpr);
      panelEl.style.setProperty('--panel-width', `${gridCssW}px`);
    }
  }

  function toCell(clientX, clientY) {
    const rect = getCanvasRect();
    const x = (clientX - rect.left) * state.dpr;
    const y = (clientY - rect.top) * state.dpr;
    const cx = Math.floor((x - state.ox) / state.cell);
    const cy = Math.floor((y - state.oy) / state.cell);
    if (!inBounds(cx, cy)) return null;
    return { x: cx, y: cy };
  }

  function draw() {
    if (state.screen !== 'game') return;

    const w = state.boardPx.w;
    const h = state.boardPx.h;
    ctx.save();
    ctx.fillStyle = '#07080c';
    ctx.fillRect(0, 0, w, h);

    const g = ctx.createRadialGradient(w * 0.2, h * 0.1, 50, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
    g.addColorStop(0, 'rgba(40,55,120,.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const cell = state.cell;
    const ox = state.ox;
    const oy = state.oy;
    const bw = cell * state.w;
    const bh = cell * state.h;

    ctx.fillStyle = 'rgba(255,255,255,.04)';
    roundRectFill(ctx, ox - 10, oy - 10, bw + 20, bh + 20, 12);
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.lineWidth = Math.max(1, Math.floor(1 * state.dpr));
    roundRectStroke(ctx, ox - 10, oy - 10, bw + 20, bh + 20, 12);

    for (let y = 0; y < state.h; y++) {
      for (let x = 0; x < state.w; x++) {
        const c = state.grid[idx(x, y)];
        const px = ox + x * cell;
        const py = oy + y * cell;
        const isHintPreview = !!state.hintPreview && state.hintPreview.x === x && state.hintPreview.y === y;
        drawCell(px, py, cell, c, isHintPreview);
      }
    }

    drawHintOverlay();
    drawBoomOverlay();

    ctx.restore();
    requestAnimationFrame(() => {
      if (!state.pointerDown && !state.over) setFace('🙂');
    });
  }

  function drawCell(px, py, size, c, hintPreview = false) {
    const s = size;
    const inset = Math.max(1, Math.floor(s * 0.06));
    const border = Math.max(1, Math.floor(s * 0.06));

    if (!c.revealed && !hintPreview) {
      ctx.fillStyle = '#c8cedf';
      ctx.fillRect(px, py, s, s);
      ctx.fillStyle = '#f4f6ff';
      ctx.fillRect(px, py, s, border);
      ctx.fillRect(px, py, border, s);
      ctx.fillStyle = '#8f97b3';
      ctx.fillRect(px, py + s - border, s, border);
      ctx.fillRect(px + s - border, py, border, s);

      if (c.flagged) drawFlag(px, py, s);
      return;
    }

    ctx.fillStyle = '#b7bed4';
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = '#8f97b3';
    ctx.lineWidth = Math.max(1, Math.floor(1 * state.dpr));
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);

    if (hintPreview) {
      ctx.fillStyle = 'rgba(255, 227, 138, .18)';
      ctx.fillRect(px, py, s, s);
    }

    if (c.mine) {
      drawMine(px, py, s, c.exploded);
      return;
    }

    if (c.n > 0) {
      ctx.fillStyle = NUMBER_COLORS[c.n] || '#12151f';
      ctx.font = `700 ${Math.floor(s * 0.62)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(c.n), px + s / 2, py + s / 2 + inset * 0.2);
    }
  }

  function drawHintOverlay() {
    if (!state.hintPreview) return;
    const { x, y } = state.hintPreview;
    const cell = state.grid[idx(x, y)];
    if (!cell || cell.revealed || cell.flagged) {
      clearHintPreview();
      return;
    }

    const px = state.ox + x * state.cell;
    const py = state.oy + y * state.cell;
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 180);
    const inset = Math.max(2, Math.floor(state.cell * 0.08));

    ctx.save();
    ctx.shadowColor = `rgba(110, 168, 254, ${0.45 * pulse})`;
    ctx.shadowBlur = Math.max(8, Math.floor(state.cell * 0.4));
    ctx.lineWidth = Math.max(2, Math.floor(state.cell * 0.1));
    ctx.strokeStyle = `rgba(110, 168, 254, ${0.85 * pulse})`;
    roundRectStroke(ctx, px + inset, py + inset, state.cell - inset * 2, state.cell - inset * 2, Math.max(4, Math.floor(state.cell * 0.16)));
    ctx.restore();
  }

  function drawFlag(px, py, s) {
    const poleX = px + s * 0.44;
    const topY = py + s * 0.22;
    const botY = py + s * 0.78;
    ctx.strokeStyle = '#12151f';
    ctx.lineWidth = Math.max(2, Math.floor(s * 0.08));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(poleX, topY);
    ctx.lineTo(poleX, botY);
    ctx.stroke();

    ctx.fillStyle = '#ff3b4f';
    ctx.beginPath();
    ctx.moveTo(poleX, topY);
    ctx.lineTo(px + s * 0.74, py + s * 0.36);
    ctx.lineTo(poleX, py + s * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#12151f';
    ctx.beginPath();
    ctx.arc(poleX, botY + s * 0.03, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMine(px, py, s, exploded) {
    if (exploded) {
      ctx.fillStyle = 'rgba(255, 60, 80, .35)';
      ctx.fillRect(px, py, s, s);
    }
    const cx = px + s / 2;
    const cy = py + s / 2;
    const r = s * 0.24;

    ctx.strokeStyle = '#12151f';
    ctx.lineWidth = Math.max(1, Math.floor(s * 0.06));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r * 0.4), cy + Math.sin(a) * (r * 0.4));
      ctx.lineTo(cx + Math.cos(a) * (r * 1.6), cy + Math.sin(a) * (r * 1.6));
      ctx.stroke();
    }

    ctx.fillStyle = '#12151f';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRectPath(ctx2, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx2.beginPath();
    ctx2.moveTo(x + rr, y);
    ctx2.arcTo(x + w, y, x + w, y + h, rr);
    ctx2.arcTo(x + w, y + h, x, y + h, rr);
    ctx2.arcTo(x, y + h, x, y, rr);
    ctx2.arcTo(x, y, x + w, y, rr);
    ctx2.closePath();
  }

  function roundRectFill(ctx2, x, y, w, h, r) {
    roundRectPath(ctx2, x, y, w, h, r);
    ctx2.fill();
  }

  function roundRectStroke(ctx2, x, y, w, h, r) {
    roundRectPath(ctx2, x, y, w, h, r);
    ctx2.stroke();
  }

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
    if (state.screen !== 'game') return;
    if (!(e.pointerType === 'mouse' || e.pointerType === 'touch' || e.pointerType === 'pen')) return;
    canvas.setPointerCapture(e.pointerId);
    state.pointerDown = true;
    state.longPressFired = false;
    setFace('😮');

    const c = toCell(e.clientX, e.clientY);
    state.downCell = c;

    if (e.pointerType !== 'mouse' && c && !state.hintMode) {
      clearLongPress();
      state.longPressId = setTimeout(() => {
        state.longPressFired = true;
        toggleFlag(c.x, c.y);
        draw();
      }, 420);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!state.pointerDown) return;
    const c = toCell(e.clientX, e.clientY);
    if (!state.downCell || !c || c.x !== state.downCell.x || c.y !== state.downCell.y) {
      clearLongPress();
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    state.pointerDown = false;
    clearLongPress();
    if (state.over || state.screen !== 'game') {
      draw();
      return;
    }

    const c = toCell(e.clientX, e.clientY);
    if (!c || !state.downCell || c.x !== state.downCell.x || c.y !== state.downCell.y) {
      draw();
      return;
    }

    if (state.longPressFired) {
      draw();
      return;
    }

    if (state.hintMode) {
      if (previewHintCell(c.x, c.y)) return;
      draw();
      return;
    }

    if (e.button === 2) toggleFlag(c.x, c.y);
    else if (e.shiftKey) toggleFlag(c.x, c.y);
    else {
      const cell = state.grid[idx(c.x, c.y)];
      if (cell.revealed && cell.n > 0) chord(c.x, c.y);
      else revealCell(c.x, c.y);
    }
    draw();
  });

  canvas.addEventListener('pointercancel', () => {
    state.pointerDown = false;
    clearLongPress();
    draw();
  });

  function clearLongPress() {
    if (state.longPressId != null) {
      clearTimeout(state.longPressId);
      state.longPressId = null;
    }
  }

  faceBtn.addEventListener('click', restartSameSettings);
  if (hintBtn) hintBtn.addEventListener('click', startHintMode);
  if (playBtn) playBtn.addEventListener('click', startSelectedGame);
  if (menuBtn) menuBtn.addEventListener('click', showMenu);
  if (recordsBtn) recordsBtn.addEventListener('click', showRecordsModal);

  presetSelect.addEventListener('change', () => {
    if (presetSelect.value !== 'custom') {
      customControls.hidden = true;
    }
  });

  if (toggleCustomBtn) {
    toggleCustomBtn.addEventListener('click', () => {
      updateCustomVisibility(customControls.hidden);
    });
  }

  if (recordsClose) recordsClose.addEventListener('click', hideRecordsModal);
  if (recordsOk) recordsOk.addEventListener('click', hideRecordsModal);
  if (recordsModal) {
    recordsModal.addEventListener('click', (e) => {
      if (e.target === recordsModal) hideRecordsModal();
    });
  }

  if (victoryClose) victoryClose.addEventListener('click', hideVictoryModal);
  if (victoryOk) victoryOk.addEventListener('click', hideVictoryModal);
  if (victoryAgain) {
    victoryAgain.addEventListener('click', () => {
      hideVictoryModal();
      restartSameSettings();
    });
  }
  if (victoryModal) {
    victoryModal.addEventListener('click', (e) => {
      if (e.target === victoryModal) hideVictoryModal();
    });
  }

  if (lossClose) lossClose.addEventListener('click', hideLossModal);
  if (lossOk) lossOk.addEventListener('click', hideLossModal);
  if (lossAgain) {
    lossAgain.addEventListener('click', () => {
      hideLossModal();
      restartSameSettings();
    });
  }
  if (lossModal) {
    lossModal.addEventListener('click', (e) => {
      if (e.target === lossModal) hideLossModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!recordsModal.hidden) hideRecordsModal();
    if (!victoryModal.hidden) hideVictoryModal();
    if (!lossModal.hidden) hideLossModal();
    if (state.hintMode) {
      stopHintMode();
      draw();
    }
  });

  window.addEventListener('resize', () => {
    if (state.screen !== 'game') return;
    resize();
    draw();
  });

  updateCustomVisibility();
  initYandexSdk();
  showMenu();
})();
