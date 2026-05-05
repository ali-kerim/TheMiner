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
  const themeSelect = document.getElementById('themeSelect');
  const playBtn = document.getElementById('playBtn');
  const menuBtn = document.getElementById('menuBtn');
  const themeCycleBtn = document.getElementById('themeCycleBtn');
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
  const hintText = document.getElementById('hintText');
  const panelEl = document.querySelector('.panel');

  const victoryModal = document.getElementById('victoryModal');
  const victoryClose = document.getElementById('victoryClose');
  const victoryAgain = document.getElementById('victoryAgain');
  const victoryOk = document.getElementById('victoryOk');
  const victoryTime = document.getElementById('victoryTime');
  const victoryBoard = document.getElementById('victoryBoard');

  const lossModal = document.getElementById('lossModal');
  const lossClose = document.getElementById('lossClose');
  const lossContinue = document.getElementById('lossContinue');
  const lossAgain = document.getElementById('lossAgain');
  const lossOk = document.getElementById('lossOk');
  const lossTime = document.getElementById('lossTime');
  const lossBoard = document.getElementById('lossBoard');

  const ctx = canvas.getContext('2d', { alpha: false });
  const resultsEndpoint = String(window.SAPER_RESULTS_URL || '').trim();
  const outcomeSounds = {
    defeat: new Audio('./assets/sounds/defeat.mpeg'),
    victory: new Audio('./assets/sounds/game-won.mp3'),
  };
  let musicTracks = [];
  let currentMusicIndex = -1;
  let musicEnabled = false;

  const yandex = {
    ysdk: null,
    player: null,
    initPromise: null,
    playerPromise: null,
    loadingReadySent: false,
    adShowing: false,
    gameplayActive: false,
  };
  const LOSS_CONTINUE_LABEL = 'Продолжить за рекламу';

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

  const THEMES = {
    nordic: {
      label: 'Nordic',
      font: '"Trebuchet MS", "Gill Sans", Candara, ui-sans-serif, system-ui, sans-serif',
      musicFiles: ['./assets/sounds/1.mp3', './assets/sounds/2.mp3', './assets/sounds/3.mp3'],
      colors: {
        boardBg: '#061016',
        glowA: 'rgba(144,224,239,.18)',
        shell: 'rgba(202,247,255,.08)',
        shellStroke: 'rgba(202,247,255,.20)',
        hidden: '#c9e5eb',
        hiddenHi: '#f4fdff',
        hiddenLo: '#78a7b2',
        open: '#a9cbd3',
        openStroke: '#6f99a4',
        ink: '#10232a',
        flag: '#66d9e8',
        flag2: '#ffffff',
        mine: '#254b56',
        mineHi: 'rgba(255,255,255,.42)',
        explode: 'rgba(144,224,239,.28)',
      },
    },
    space: {
      label: 'Space',
      font: '"Segoe UI", "Arial", ui-sans-serif, system-ui, sans-serif',
      // Add these files later to give the theme its own playlist.
      musicFiles: ['./assets/sounds/space-1.mp3', './assets/sounds/space-2.mp3', './assets/sounds/space-3.mp3'],
      colors: {
        boardBg: '#050713',
        glowA: 'rgba(121,242,255,.16)',
        shell: 'rgba(190,172,255,.07)',
        shellStroke: 'rgba(121,242,255,.22)',
        hidden: '#27284d',
        hiddenHi: '#46488a',
        hiddenLo: '#11142d',
        open: '#1a1c38',
        openStroke: '#3c3f73',
        ink: '#f3f1ff',
        flag: '#79f2ff',
        flag2: '#ff5caa',
        mine: '#806cff',
        mineHi: 'rgba(255,255,255,.38)',
        explode: 'rgba(255,92,170,.30)',
      },
    },
    medieval: {
      label: 'Medieval',
      font: 'Georgia, "Times New Roman", ui-serif, serif',
      // Add these files later to give the theme its own playlist.
      musicFiles: ['./assets/sounds/medieval-1.mp3', './assets/sounds/medieval-2.mp3', './assets/sounds/medieval-3.mp3'],
      colors: {
        boardBg: '#120d08',
        glowA: 'rgba(212,175,55,.16)',
        shell: 'rgba(255,220,150,.06)',
        shellStroke: 'rgba(212,175,55,.20)',
        hidden: '#8f7147',
        hiddenHi: '#d2b070',
        hiddenLo: '#4d3822',
        open: '#c8ad79',
        openStroke: '#7b5c34',
        ink: '#24170b',
        flag: '#c73e3a',
        flag2: '#d4af37',
        mine: '#2b2117',
        mineHi: 'rgba(255,230,176,.30)',
        explode: 'rgba(199,62,58,.32)',
      },
    },
  };
  const THEME_KEYS = Object.keys(THEMES);
  let currentThemeKey = readStoredThemeKey();

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

  function showRewardedHintAd() {
    if (yandex.adShowing) return Promise.resolve({ rewarded: false });

    return initYandexSdk().then((ysdk) => new Promise((resolve) => {
      if (!ysdk?.adv || typeof ysdk.adv.showRewardedVideo !== 'function') {
        resolve({ rewarded: false, error: true });
        return;
      }

      let settled = false;
      let rewarded = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        yandex.adShowing = false;
        startGameplayMarkup();
        resolve(result);
      };

      stopGameplayMarkup();
      yandex.adShowing = true;

      try {
        ysdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => {
              stopGameplayMarkup();
              setHintText('Смотрите рекламу до конца');
            },
            onRewarded: () => {
              rewarded = true;
            },
            onClose: () => {
              finish({ rewarded });
            },
            onError: (err) => {
              console.warn('Yandex rewarded ad failed', err);
              finish({ rewarded: false, error: true });
            },
          },
        });
      } catch (err) {
        console.warn('Yandex rewarded ad failed', err);
        finish({ rewarded: false, error: true });
      }
    }));
  }

  function showRewardedContinueAd() {
    if (yandex.adShowing) return Promise.resolve({ rewarded: false });

    return initYandexSdk().then((ysdk) => new Promise((resolve) => {
      if (!ysdk?.adv || typeof ysdk.adv.showRewardedVideo !== 'function') {
        resolve({ rewarded: false, error: true });
        return;
      }

      let settled = false;
      let rewarded = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        yandex.adShowing = false;
        startGameplayMarkup();
        resolve(result);
      };

      stopGameplayMarkup();
      yandex.adShowing = true;

      try {
        ysdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => {
              stopGameplayMarkup();
            },
            onRewarded: () => {
              rewarded = true;
            },
            onClose: () => {
              finish({ rewarded });
            },
            onError: (err) => {
              console.warn('Yandex rewarded ad failed', err);
              finish({ rewarded: false, error: true });
            },
          },
        });
      } catch (err) {
        console.warn('Yandex rewarded ad failed', err);
        finish({ rewarded: false, error: true });
      }
    }));
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
    hintAdPending: false,
    hintPreview: /** @type {{x:number,y:number}|null} */ (null),
    hintPreviewId: /** @type {number | null} */ (null),
    minesPlaced: false,
    lossContinueUsed: false,
    lossContinuePending: false,

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

  function readStoredThemeKey() {
    try {
      const stored = localStorage.getItem('miner-theme');
      if (stored && THEMES[stored]) return stored;
    } catch {}
    return 'nordic';
  }

  function activeTheme() {
    return THEMES[currentThemeKey] || THEMES.nordic;
  }

  function saveThemeKey(themeKey) {
    try {
      localStorage.setItem('miner-theme', themeKey);
    } catch {}
  }

  function syncThemeControls() {
    const theme = activeTheme();
    if (themeSelect) themeSelect.value = currentThemeKey;
    if (themeCycleBtn) themeCycleBtn.textContent = theme.label;
  }

  function applyTheme(themeKey, restartMusic = false) {
    if (!THEMES[themeKey]) themeKey = 'nordic';
    const changed = currentThemeKey !== themeKey;
    currentThemeKey = themeKey;
    document.body.dataset.theme = currentThemeKey;
    document.body.style.setProperty('--app-font', activeTheme().font);
    saveThemeKey(currentThemeKey);
    syncThemeControls();
    configureMusicTracks();

    if (restartMusic && changed && musicEnabled && state.screen === 'game' && !state.over) {
      startGameMusic();
    }
    if (state.screen === 'game') draw();
  }

  function cycleTheme() {
    const currentIndex = Math.max(0, THEME_KEYS.indexOf(currentThemeKey));
    const nextTheme = THEME_KEYS[(currentIndex + 1) % THEME_KEYS.length];
    applyTheme(nextTheme, true);
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

  function setHintText(text, warn = false) {
    if (!hintText) return;
    hintText.textContent = text;
    hintText.classList.toggle('isWarn', warn);
  }

  function syncHintButton() {
    if (!hintBtn) return;
    hintBtn.classList.toggle('isActive', state.hintMode);
    hintBtn.disabled = state.hintAdPending;
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
    setHintText('Подсказка после рекламы');
    clearHintPreview();
  }

  function ensureMinesPlaced(safeX, safeY) {
    if (state.minesPlaced) return;
    placeMinesAvoiding(safeX, safeY);
    state.minesPlaced = true;
  }

  async function startHintMode() {
    if (state.over || state.screen !== 'game' || state.hintAdPending) return;
    if (state.hintMode) {
      state.hintMode = false;
      setHintText('Подсказка после рекламы');
      syncHintButton();
      draw();
      return;
    }

    state.hintAdPending = true;
    setHintText('Загружаем рекламу...', true);
    syncHintButton();

    const adResult = await showRewardedHintAd();
    state.hintAdPending = false;
    if (state.over || state.screen !== 'game') {
      setHintText('Подсказка после рекламы');
      syncHintButton();
      return;
    }

    if (!adResult.rewarded) {
      setHintText(adResult.error ? 'Реклама недоступна' : 'Нужно досмотреть рекламу', true);
      syncHintButton();
      window.setTimeout(() => {
        if (!state.hintMode && !state.hintAdPending) setHintText('Подсказка после рекламы');
      }, 1800);
      return;
    }

    state.hintMode = true;
    setHintText('Выберите закрытую клетку');
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
    setHintText('Подсказка после рекламы');
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
    stopGameMusic();
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
    syncLossContinueButton();
    lossModal.hidden = false;
  }

  function hideLossModal() {
    lossModal.hidden = true;
  }

  function setLossContinueLabel(label) {
    if (!lossContinue) return;
    lossContinue.textContent = label;
  }

  function syncLossContinueButton() {
    if (!lossContinue) return;
    lossContinue.disabled = state.lossContinuePending || state.lossContinueUsed;
    if (state.lossContinuePending) {
      setLossContinueLabel('Загрузка...');
      return;
    }
    if (state.lossContinueUsed) {
      setLossContinueLabel('Продолжение использовано');
      return;
    }
    setLossContinueLabel(LOSS_CONTINUE_LABEL);
  }

  function scheduleLossContinueLabelReset() {
    window.setTimeout(() => {
      if (state.lossContinuePending || state.lossContinueUsed) return;
      setLossContinueLabel(LOSS_CONTINUE_LABEL);
    }, 1800);
  }

  function findReviveTargetIndex(explodedIndex) {
    const remote = [];
    const fallback = [];

    for (let y = 0; y < state.h; y++) {
      for (let x = 0; x < state.w; x++) {
        const i = idx(x, y);
        const cell = state.grid[i];
        if (i === explodedIndex || cell.mine || cell.revealed || cell.flagged) continue;

        let touchesRevealed = false;
        neighbors(x, y, (nx, ny) => {
          if (state.grid[idx(nx, ny)].revealed) touchesRevealed = true;
        });

        (touchesRevealed ? fallback : remote).push(i);
      }
    }

    const pool = remote.length ? remote : fallback;
    if (!pool.length) return -1;
    return pool[(Math.random() * pool.length) | 0];
  }

  function reviveAfterLoss() {
    const explodedIndex = state.grid.findIndex((cell) => cell.exploded);
    if (explodedIndex < 0) return false;

    const targetIndex = findReviveTargetIndex(explodedIndex);
    if (targetIndex < 0) return false;

    const explodedX = explodedIndex % state.w;
    const explodedY = Math.floor(explodedIndex / state.w);
    const explodedCell = state.grid[explodedIndex];
    const targetCell = state.grid[targetIndex];

    explodedCell.mine = false;
    explodedCell.exploded = false;
    explodedCell.revealed = true;
    targetCell.mine = true;

    for (const cell of state.grid) {
      if (cell.mine) {
        cell.revealed = false;
        cell.exploded = false;
      }
    }

    computeNumbers();

    state.over = false;
    state.won = false;
    state.lossContinueUsed = true;
    state.lossContinuePending = false;
    stopOutcomeSounds();
    if (state.animRaf != null) cancelAnimationFrame(state.animRaf);
    state.animRaf = null;
    state.boom = null;
    hideLossModal();
    setFace('🙂');
    if (explodedCell.n === 0) floodFillZeros(explodedX, explodedY);
    updateCounters();
    draw();
    startTimer();
    startGameMusic();
    startGameplayMarkup();
    checkWin();
    return true;
  }

  async function continueAfterRewardAd() {
    if (state.lossContinueUsed || state.lossContinuePending || !state.over || state.won) return;

    state.lossContinuePending = true;
    syncLossContinueButton();

    const adResult = await showRewardedContinueAd();
    state.lossContinuePending = false;

    if (!state.over || state.won) {
      syncLossContinueButton();
      return;
    }

    if (!adResult.rewarded) {
      setLossContinueLabel(adResult.error ? 'Реклама недоступна' : 'Нужно досмотреть');
      if (lossContinue) lossContinue.disabled = false;
      scheduleLossContinueLabelReset();
      return;
    }

    if (!reviveAfterLoss()) {
      setLossContinueLabel('Не удалось продолжить');
      if (lossContinue) lossContinue.disabled = false;
      scheduleLossContinueLabelReset();
      return;
    }

    syncLossContinueButton();
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

  function stopOutcomeSounds() {
    Object.values(outcomeSounds).forEach((sound) => {
      sound.pause();
      sound.currentTime = 0;
    });
  }

  function playOutcomeSound(type) {
    const sound = outcomeSounds[type];
    if (!sound) return;
    stopOutcomeSounds();
    sound.currentTime = 0;
    sound.play().catch((err) => {
      console.warn('Outcome sound playback failed', err);
    });
  }

  function configureMusicTracks() {
    const wasEnabled = musicEnabled;
    if (musicTracks.length) {
      musicTracks.forEach((track) => {
        track.pause();
        track.currentTime = 0;
      });
    }

    musicTracks = activeTheme().musicFiles.map((src) => new Audio(src));
    currentMusicIndex = -1;
    musicEnabled = wasEnabled;

    musicTracks.forEach((track, index) => {
      track.volume = 0.45;
      track.addEventListener('ended', () => {
        if (musicEnabled && !state.over && state.screen === 'game') {
          playNextMusicTrack(index);
        }
      });
    });
  }

  function stopGameMusic() {
    musicEnabled = false;
    musicTracks.forEach((track) => {
      track.pause();
      track.currentTime = 0;
    });
    currentMusicIndex = -1;
  }

  function playNextMusicTrack(previousIndex = currentMusicIndex) {
    if (!musicEnabled || state.over || state.screen !== 'game' || musicTracks.length === 0) return;

    if (previousIndex >= 0 && musicTracks[previousIndex]) {
      musicTracks[previousIndex].pause();
      musicTracks[previousIndex].currentTime = 0;
    }

    let nextIndex = Math.floor(Math.random() * musicTracks.length);
    if (musicTracks.length > 1) {
      while (nextIndex === previousIndex) {
        nextIndex = Math.floor(Math.random() * musicTracks.length);
      }
    }

    currentMusicIndex = nextIndex;
    const track = musicTracks[currentMusicIndex];
    track.currentTime = 0;
    track.play().catch((err) => {
      console.warn('Background music playback failed', err);
    });
  }

  function startGameMusic() {
    stopGameMusic();
    musicEnabled = true;
    playNextMusicTrack();
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
    stopGameMusic();

    if (won) {
      saveRecordIfNeeded();
      sendWinResult();
      setFace('😎');
      playOutcomeSound('victory');
      for (const c of state.grid) {
        if (c.mine && !c.flagged) {
          c.flagged = true;
          state.flags++;
        }
      }
      showVictoryModal();
    } else {
      setFace('😵');
      playOutcomeSound('defeat');
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
    stopOutcomeSounds();
    if (state.animRaf != null) cancelAnimationFrame(state.animRaf);
    state.animRaf = null;
    state.boom = null;
    state.minesPlaced = false;
    state.lossContinueUsed = false;
    state.lossContinuePending = false;
    clearHint();
    resetGrid();
    updateCounters();
    setFace('🙂');
    hideVictoryModal();
    hideLossModal();
    resize();
    draw();
    startGameMusic();
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

    const theme = activeTheme();
    const colors = theme.colors;
    const w = state.boardPx.w;
    const h = state.boardPx.h;
    ctx.save();
    ctx.fillStyle = colors.boardBg;
    ctx.fillRect(0, 0, w, h);

    const g = ctx.createRadialGradient(w * 0.2, h * 0.1, 50, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
    g.addColorStop(0, colors.glowA);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const cell = state.cell;
    const ox = state.ox;
    const oy = state.oy;
    const bw = cell * state.w;
    const bh = cell * state.h;

    ctx.fillStyle = colors.shell;
    roundRectFill(ctx, ox - 10, oy - 10, bw + 20, bh + 20, 12);
    ctx.strokeStyle = colors.shellStroke;
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
    const theme = activeTheme();
    const colors = theme.colors;
    const s = size;
    const inset = Math.max(1, Math.floor(s * 0.06));
    const border = Math.max(1, Math.floor(s * 0.06));

    if (!c.revealed && !hintPreview) {
      ctx.fillStyle = colors.hidden;
      ctx.fillRect(px, py, s, s);
      ctx.fillStyle = colors.hiddenHi;
      ctx.fillRect(px, py, s, border);
      ctx.fillRect(px, py, border, s);
      ctx.fillStyle = colors.hiddenLo;
      ctx.fillRect(px, py + s - border, s, border);
      ctx.fillRect(px + s - border, py, border, s);

      if (c.flagged) drawFlag(px, py, s);
      return;
    }

    ctx.fillStyle = colors.open;
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = colors.openStroke;
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
      ctx.font = `700 ${Math.floor(s * 0.62)}px ${theme.font}`;
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
    const colors = activeTheme().colors;
    const poleX = px + s * 0.44;
    const topY = py + s * 0.22;
    const botY = py + s * 0.78;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = Math.max(2, Math.floor(s * 0.08));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(poleX, topY);
    ctx.lineTo(poleX, botY);
    ctx.stroke();

    if (currentThemeKey === 'space') {
      ctx.fillStyle = colors.flag;
      ctx.beginPath();
      ctx.moveTo(poleX, topY);
      ctx.quadraticCurveTo(px + s * 0.66, py + s * 0.26, px + s * 0.75, py + s * 0.42);
      ctx.quadraticCurveTo(px + s * 0.58, py + s * 0.47, poleX, py + s * 0.50);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = colors.flag2;
      ctx.beginPath();
      ctx.arc(px + s * 0.62, py + s * 0.37, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    } else if (currentThemeKey === 'medieval') {
      ctx.fillStyle = colors.flag;
      ctx.beginPath();
      ctx.moveTo(poleX, topY);
      ctx.lineTo(px + s * 0.76, py + s * 0.27);
      ctx.lineTo(px + s * 0.64, py + s * 0.42);
      ctx.lineTo(px + s * 0.76, py + s * 0.56);
      ctx.lineTo(poleX, py + s * 0.50);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = colors.flag2;
      ctx.lineWidth = Math.max(1, Math.floor(s * 0.045));
      ctx.beginPath();
      ctx.moveTo(px + s * 0.52, py + s * 0.28);
      ctx.lineTo(px + s * 0.52, py + s * 0.50);
      ctx.stroke();
    } else {
      ctx.fillStyle = colors.flag;
      ctx.beginPath();
      ctx.moveTo(poleX, topY);
      ctx.lineTo(px + s * 0.74, py + s * 0.30);
      ctx.lineTo(px + s * 0.58, py + s * 0.40);
      ctx.lineTo(px + s * 0.74, py + s * 0.50);
      ctx.lineTo(poleX, py + s * 0.50);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = colors.flag2;
      ctx.fillRect(poleX + s * 0.03, py + s * 0.33, s * 0.24, Math.max(1, s * 0.04));
    }

    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(poleX, botY + s * 0.03, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMine(px, py, s, exploded) {
    const colors = activeTheme().colors;
    if (exploded) {
      ctx.fillStyle = colors.explode;
      ctx.fillRect(px, py, s, s);
    }
    const cx = px + s / 2;
    const cy = py + s / 2;
    const r = s * 0.24;

    if (currentThemeKey === 'space') {
      ctx.fillStyle = colors.mine;
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.2, cy - r * 0.45);
      ctx.quadraticCurveTo(cx - r * 0.4, cy - r * 1.35, cx + r * 0.82, cy - r * 1.05);
      ctx.quadraticCurveTo(cx + r * 1.55, cy - r * 0.2, cx + r * 1.05, cy + r * 0.85);
      ctx.quadraticCurveTo(cx - r * 0.1, cy + r * 1.45, cx - r * 1.2, cy + r * 0.52);
      ctx.quadraticCurveTo(cx - r * 1.55, cy + r * 0.05, cx - r * 1.2, cy - r * 0.45);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.beginPath();
      ctx.arc(cx + r * 0.35, cy, r * 0.32, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.38, cy + r * 0.35, r * 0.20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.mineHi;
      ctx.beginPath();
      ctx.arc(cx - r * 0.45, cy - r * 0.48, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (currentThemeKey === 'medieval') {
      ctx.strokeStyle = colors.mine;
      ctx.lineWidth = Math.max(2, Math.floor(s * 0.07));
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.55, cy + r * 1.35);
      ctx.lineTo(cx - r * 0.35, cy + r * 0.25);
      ctx.stroke();
      ctx.fillStyle = colors.mine;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r * 0.78), cy + Math.sin(a) * (r * 0.78));
        ctx.lineTo(cx + Math.cos(a + 0.18) * (r * 1.42), cy + Math.sin(a + 0.18) * (r * 1.42));
        ctx.lineTo(cx + Math.cos(a - 0.18) * (r * 1.42), cy + Math.sin(a - 0.18) * (r * 1.42));
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.mineHi;
      ctx.beginPath();
      ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.strokeStyle = colors.mine;
    ctx.lineWidth = Math.max(1, Math.floor(s * 0.06));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r * 0.4), cy + Math.sin(a) * (r * 0.4));
      ctx.lineTo(cx + Math.cos(a) * (r * 1.6), cy + Math.sin(a) * (r * 1.6));
      ctx.stroke();
    }

    ctx.strokeStyle = colors.flag;
    ctx.lineWidth = Math.max(1, Math.floor(s * 0.045));
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.35, cy);
    ctx.lineTo(cx + r * 1.35, cy);
    ctx.moveTo(cx, cy - r * 1.35);
    ctx.lineTo(cx, cy + r * 1.35);
    ctx.stroke();

    ctx.fillStyle = colors.mine;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      const rr = i % 2 === 0 ? r * 1.02 : r * 0.72;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colors.mineHi;
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
  if (themeCycleBtn) themeCycleBtn.addEventListener('click', cycleTheme);
  if (recordsBtn) recordsBtn.addEventListener('click', showRecordsModal);
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      applyTheme(themeSelect.value, true);
    });
  }

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
  if (lossContinue) lossContinue.addEventListener('click', continueAfterRewardAd);
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
  applyTheme(currentThemeKey);
  initYandexSdk();
  showMenu();
})();
