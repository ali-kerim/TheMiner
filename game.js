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
  const languageToggleBtn = document.getElementById('languageToggleBtn');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const recordsBtn = document.getElementById('recordsBtn');
  const rotateNotice = document.getElementById('rotateNotice');
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
  const milestonePopup = document.getElementById('milestonePopup');
  const milestonePopupImage = document.getElementById('milestonePopupImage');

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
  const mineImages = {
    medieval: loadImage('./assets/powder.png'),
    space: loadImage('./assets/black-hole.png'),
  };
  const milestoneImages = {
    25: loadImage('./assets/troll2_1.png'),
    50: loadImage('./assets/gj3.png'),
    75: loadImage('./assets/gj2.png'),
    90: loadImage('./assets/troll2_2.png'),
  };
  const milestoneSounds = {
    25: new Audio('./assets/sounds/hmm.mpeg'),
    50: new Audio('./assets/sounds/letsgo.mpeg'),
    75: new Audio('./assets/sounds/perfect.mpeg'),
    90: new Audio('./assets/sounds/sneaky.mpeg'),
  };
  const MILESTONE_SEQUENCE = [
    { threshold: 0.25, key: 25 },
    { threshold: 0.50, key: 50 },
    { threshold: 0.75, key: 75 },
    { threshold: 0.90, key: 90 },
  ];
  let musicTracks = [];
  let currentMusicIndex = -1;
  let musicPlaybackActive = false;
  let musicEnabled = readStoredAudioSetting('music', true);
  let soundEnabled = readStoredAudioSetting('sound', true);
  const SOUND_VOLUMES = {
    defeat: 0.3,
    victory: 1,
  };

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
      label: 'Нордик',
      font: '"Trebuchet MS", "Gill Sans", Candara, ui-sans-serif, system-ui, sans-serif',
      musicFiles: ['./assets/sounds/nordic1.mp3', './assets/sounds/nordic2.mp3', './assets/sounds/nordic3.mp3'],
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
      label: 'Космос',
      font: '"Segoe UI", "Arial", ui-sans-serif, system-ui, sans-serif',
      musicFiles: ['./assets/sounds/space1.mp3', './assets/sounds/space2.mp3', './assets/sounds/space3.mp3'],
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
      label: 'История',
      font: 'Georgia, "Times New Roman", ui-serif, serif',
      musicFiles: ['./assets/sounds/medieval1.mp3', './assets/sounds/medieval2.mp3', './assets/sounds/medieval3.mp3'],
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
  let currentLanguage = readStoredLanguage();
  const I18N = {
    ru: {
      html_lang: 'ru',
      app_name: 'Минер',
      app_title: 'Минёр',
      difficulty: 'Сложность',
      difficulty_aria: 'Сложность',
      theme: 'Тема',
      theme_aria: 'Тема',
      records: 'Рекорды',
      custom_field: 'Создай свое поле',
      width: 'Ширина',
      height: 'Высота',
      mines: 'Мины',
      play: 'Играть',
      rotate_title: 'Поверните устройство',
      rotate_text: 'Для удобной игры на телефоне используется горизонтальный режим.',
      hint: 'Подсказка',
      hint_button_title: 'Посмотрите рекламу и выберите закрытую клетку для подсказки',
      hint_after_ad: 'Подсказка после рекламы',
      mines_remaining: 'Осталось мин',
      new_game: 'Новая игра',
      time: 'Время',
      menu: 'Меню',
      gameplay_field: 'Игровое поле',
      board_aria: 'Поле сапера',
      controls: 'Управление',
      lmb_open: 'ЛКМ открыть',
      rmb_flag: 'ПКМ флажок',
      long_press_flag: 'Долгое нажатие флажок (тач)',
      click_number_open: 'Клик по цифре открыть вокруг',
      victory_title: 'Победа!',
      close: 'Закрыть',
      field: 'Поле',
      play_again: 'Играть ещё',
      ok: 'ОК',
      loss_title: 'Бум! Поражение',
      loss_continue: 'Продолжить за рекламу',
      records_title: 'Рекорды',
      no_record: 'Пока нет рекорда',
      sec_short: 'сек',
      loading: 'Загрузка...',
      continue_used: 'Продолжение использовано',
      ad_unavailable: 'Реклама недоступна',
      need_watch_short: 'Нужно досмотреть',
      unable_continue: 'Не удалось продолжить',
      watch_ad_to_end: 'Смотрите рекламу до конца',
      loading_ad: 'Загружаем рекламу...',
      need_watch_ad: 'Нужно досмотреть рекламу',
      choose_closed_cell: 'Выберите закрытую клетку',
      switch_language: 'Переключить язык',
      switch_to_en: 'Switch to English',
      switch_to_ru: 'Переключить на русский',
      music_off: 'Выключить музыку',
      music_on: 'Включить музыку',
      sound_off: 'Выключить звуки',
      sound_on: 'Включить звуки',
      preset_beginner: 'Новичок',
      preset_intermediate: 'Средний',
      preset_expert: 'Эксперт',
      preset_custom: 'Свое поле',
      custom_board: 'Свое поле',
      theme_nordic: 'Нордик',
      theme_space: 'Космос',
      theme_medieval: 'История',
      theme_option_nordic: 'Нордическая',
      theme_option_space: 'Космос',
      theme_option_medieval: 'Средневековье',
      minute_mines: 'мин',
      board_separator: '•',
    },
    en: {
      html_lang: 'en',
      app_name: 'Miner',
      app_title: 'Miner',
      difficulty: 'Difficulty',
      difficulty_aria: 'Difficulty',
      theme: 'Theme',
      theme_aria: 'Theme',
      records: 'Records',
      custom_field: 'Create custom field',
      width: 'Width',
      height: 'Height',
      mines: 'Mines',
      play: 'Play',
      rotate_title: 'Rotate your device',
      rotate_text: 'Landscape mode is used on phones for more comfortable play.',
      hint: 'Hint',
      hint_button_title: 'Watch an ad and choose a closed cell for a hint',
      hint_after_ad: 'Hint after ad',
      mines_remaining: 'Mines left',
      new_game: 'New game',
      time: 'Time',
      menu: 'Menu',
      gameplay_field: 'Game field',
      board_aria: 'Minesweeper board',
      controls: 'Controls',
      lmb_open: 'LMB open',
      rmb_flag: 'RMB flag',
      long_press_flag: 'Long press flag (touch)',
      click_number_open: 'Click number to open around',
      victory_title: 'Victory!',
      close: 'Close',
      field: 'Field',
      play_again: 'Play again',
      ok: 'OK',
      loss_title: 'Boom! Defeat',
      loss_continue: 'Continue for ad',
      records_title: 'Records',
      no_record: 'No record yet',
      sec_short: 'sec',
      loading: 'Loading...',
      continue_used: 'Continue already used',
      ad_unavailable: 'Ad unavailable',
      need_watch_short: 'Watch to the end',
      unable_continue: 'Unable to continue',
      watch_ad_to_end: 'Watch the ad to the end',
      loading_ad: 'Loading ad...',
      need_watch_ad: 'You need to watch the ad',
      choose_closed_cell: 'Choose a closed cell',
      switch_language: 'Switch language',
      switch_to_en: 'Switch to English',
      switch_to_ru: 'Switch to Russian',
      music_off: 'Turn music off',
      music_on: 'Turn music on',
      sound_off: 'Turn sounds off',
      sound_on: 'Turn sounds on',
      preset_beginner: 'Beginner',
      preset_intermediate: 'Intermediate',
      preset_expert: 'Expert',
      preset_custom: 'Custom field',
      custom_board: 'Custom field',
      theme_nordic: 'Nordic',
      theme_space: 'Space',
      theme_medieval: 'Medieval',
      theme_option_nordic: 'Nordic',
      theme_option_space: 'Space',
      theme_option_medieval: 'Medieval',
      minute_mines: 'mines',
      board_separator: '•',
    },
  };

  function initYandexSdk() {
    if (yandex.initPromise) return yandex.initPromise;
    if (!window.YaGames || typeof window.YaGames.init !== 'function') {
      yandex.initPromise = Promise.resolve(null);
      return yandex.initPromise;
    }

    yandex.initPromise = window.YaGames.init()
      .then((ysdk) => {
        yandex.ysdk = ysdk;
        syncLanguageFromYandex(ysdk);
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

  function isMobileDevice() {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const narrowViewport = Math.max(window.innerWidth, window.innerHeight) <= 1000;
    const shortLandscapeViewport = window.innerWidth <= 950 && window.innerHeight <= 540;
    const hasTouch = navigator.maxTouchPoints > 0;
    return (coarse || hasTouch || shortLandscapeViewport) && (narrowViewport || shortLandscapeViewport);
  }

  function needsLandscapeMode() {
    return isMobileDevice() && window.innerHeight > window.innerWidth;
  }

  function syncMobileViewportState() {
    const mobile = isMobileDevice();
    const needsLandscape = needsLandscapeMode();
    const mobileLandscape = mobile && window.innerWidth > window.innerHeight;
    const shortViewport = mobile && window.innerHeight <= 500;
    document.body.classList.toggle('isMobileDevice', mobile);
    document.body.classList.toggle('needsLandscape', needsLandscape);
    document.body.classList.toggle('isMobileLandscape', mobileLandscape);
    document.body.classList.toggle('isShortViewport', shortViewport);
    if (rotateNotice) rotateNotice.setAttribute('aria-hidden', needsLandscape ? 'false' : 'true');
  }

  async function tryLockLandscape() {
    if (!isMobileDevice()) return;
    try {
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        await screen.orientation.lock('landscape');
      }
    } catch {}
  }

  function loadImage(src) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    img.addEventListener('load', () => {
      if (state.screen === 'game') draw();
    });
    return img;
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
    milestoneSeen: /** @type {number[]} */ ([]),
    milestoneQueue: /** @type {number[]} */ ([]),
    milestoneActive: false,
    milestoneTimeoutId: /** @type {number | null} */ (null),
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

  function readStoredLanguage() {
    try {
      const stored = localStorage.getItem('miner-language');
      if (stored === 'ru' || stored === 'en') return stored;
    } catch {}
    return 'ru';
  }

  function normalizeLanguage(lang) {
    const value = String(lang || '').trim().toLowerCase();
    if (value.startsWith('ru')) return 'ru';
    if (value.startsWith('en')) return 'en';
    return null;
  }

  function readYandexLanguage(ysdk = yandex.ysdk) {
    if (!ysdk) return null;
    const candidates = [
      ysdk.environment?.i18n?.lang,
      ysdk.environment?.i18n?.language,
      ysdk.environment?.lang,
      ysdk.environment?.language,
      ysdk.deviceInfo?.lang,
      ysdk.deviceInfo?.language,
    ];
    for (const candidate of candidates) {
      const normalized = normalizeLanguage(candidate);
      if (normalized) return normalized;
    }
    return null;
  }

  function syncLanguageFromYandex(ysdk = yandex.ysdk) {
    const sdkLanguage = readYandexLanguage(ysdk);
    if (!sdkLanguage || sdkLanguage === currentLanguage) return;
    applyLanguage(sdkLanguage, false);
  }

  function readStoredAudioSetting(key, fallback) {
    try {
      const raw = localStorage.getItem(`miner-audio:${key}`);
      if (raw === '1') return true;
      if (raw === '0') return false;
    } catch {}
    return fallback;
  }

  function activeTheme() {
    return THEMES[currentThemeKey] || THEMES.nordic;
  }

  function t(key) {
    return I18N[currentLanguage]?.[key] ?? I18N.ru[key] ?? key;
  }

  function getPresetLabel(presetKey) {
    if (presetKey === 'intermediate') return t('preset_intermediate');
    if (presetKey === 'expert') return t('preset_expert');
    if (presetKey === 'custom') return t('preset_custom');
    return t('preset_beginner');
  }

  function getThemeLabel(themeKey) {
    if (themeKey === 'space') return t('theme_space');
    if (themeKey === 'medieval') return t('theme_medieval');
    return t('theme_nordic');
  }

  function saveThemeKey(themeKey) {
    try {
      localStorage.setItem('miner-theme', themeKey);
    } catch {}
  }

  function saveLanguage(lang) {
    try {
      localStorage.setItem('miner-language', lang);
    } catch {}
  }

  function saveAudioSetting(key, enabled) {
    try {
      localStorage.setItem(`miner-audio:${key}`, enabled ? '1' : '0');
    } catch {}
  }

  function syncThemeControls() {
    if (themeSelect) themeSelect.value = currentThemeKey;
    if (themeCycleBtn) themeCycleBtn.textContent = getThemeLabel(currentThemeKey);
  }

  function syncLanguageButton() {
    if (!languageToggleBtn) return;
    languageToggleBtn.textContent = currentLanguage.toUpperCase();
    languageToggleBtn.setAttribute('aria-label', t('switch_language'));
    languageToggleBtn.title = currentLanguage === 'ru' ? t('switch_to_en') : t('switch_to_ru');
  }

  function applyLanguageToDom() {
    document.documentElement.lang = t('html_lang');
    document.title = t('app_name');
    const app = document.getElementById('app');
    if (app) app.setAttribute('aria-label', t('app_name'));
    const menuTitle = document.querySelector('.menuTitle');
    if (menuTitle) menuTitle.textContent = t('app_title');

    const menuLabels = document.querySelectorAll('.menuField .menuLabel');
    if (menuLabels[0]) menuLabels[0].textContent = t('difficulty');
    if (menuLabels[1]) menuLabels[1].textContent = t('theme');

    if (presetSelect) presetSelect.setAttribute('aria-label', t('difficulty_aria'));
    if (themeSelect) themeSelect.setAttribute('aria-label', t('theme_aria'));
    if (presetSelect) {
      presetSelect.options[0].textContent = `${t('preset_beginner')} (9x9, 10)`;
      presetSelect.options[1].textContent = `${t('preset_intermediate')} (16x16, 40)`;
      presetSelect.options[2].textContent = `${t('preset_expert')} (30x16, 99)`;
      presetSelect.options[3].textContent = t('preset_custom');
    }
    if (themeSelect) {
      themeSelect.options[0].textContent = t('theme_option_nordic');
      themeSelect.options[1].textContent = t('theme_option_space');
      themeSelect.options[2].textContent = t('theme_option_medieval');
    }

    if (recordsBtn) recordsBtn.textContent = t('records');
    if (toggleCustomBtn) toggleCustomBtn.textContent = t('custom_field');
    if (playBtn) playBtn.textContent = t('play');
    if (menuBtn) menuBtn.textContent = t('menu');
    if (hintBtn) {
      hintBtn.setAttribute('aria-label', t('hint'));
      hintBtn.title = t('hint_button_title');
    }
    if (themeCycleBtn) {
      themeCycleBtn.setAttribute('aria-label', t('theme'));
      themeCycleBtn.title = t('theme');
    }
    if (minesEl) minesEl.setAttribute('aria-label', t('mines_remaining'));
    if (timeEl) timeEl.setAttribute('aria-label', t('time'));
    if (faceBtn) {
      faceBtn.setAttribute('aria-label', t('new_game'));
      faceBtn.title = t('new_game');
    }
    if (gameScreen) gameScreen.querySelector('.stage')?.setAttribute('aria-label', t('gameplay_field'));
    if (canvas) canvas.setAttribute('aria-label', t('board_aria'));

    const customLabels = customControls?.querySelectorAll('label span');
    if (customLabels?.[0]) customLabels[0].textContent = t('width');
    if (customLabels?.[1]) customLabels[1].textContent = t('height');
    if (customLabels?.[2]) customLabels[2].textContent = t('mines');

    const rotateTitle = document.querySelector('.rotateNoticeTitle');
    const rotateText = document.querySelector('.rotateNoticeText');
    if (rotateTitle) rotateTitle.textContent = t('rotate_title');
    if (rotateText) rotateText.textContent = t('rotate_text');

    const hintTitle = document.querySelector('.hintTitle');
    if (hintTitle) hintTitle.textContent = t('controls');
    const hintRows = document.querySelectorAll('.hintBody div');
    if (hintRows[0]) hintRows[0].innerHTML = currentLanguage === 'ru' ? '<kbd>ЛКМ</kbd> открыть' : '<kbd>LMB</kbd> open';
    if (hintRows[1]) hintRows[1].innerHTML = currentLanguage === 'ru' ? '<kbd>ПКМ</kbd> флажок' : '<kbd>RMB</kbd> flag';
    if (hintRows[2]) hintRows[2].innerHTML = currentLanguage === 'ru' ? '<kbd>Долгое нажатие</kbd> флажок (тач)' : '<kbd>Long press</kbd> flag (touch)';
    if (hintRows[3]) hintRows[3].innerHTML = currentLanguage === 'ru' ? '<kbd>Клик по цифре</kbd> открыть вокруг' : '<kbd>Number click</kbd> open around';

    if (victoryModal) victoryModal.setAttribute('aria-label', t('victory_title'));
    if (lossModal) lossModal.setAttribute('aria-label', t('loss_title'));
    if (recordsModal) recordsModal.setAttribute('aria-label', t('records_title'));
    const modalTitles = document.querySelectorAll('.modalTitle');
    if (modalTitles[0]) modalTitles[0].textContent = t('victory_title');
    if (modalTitles[1]) modalTitles[1].textContent = t('loss_title');
    if (modalTitles[2]) modalTitles[2].textContent = t('records_title');

    if (victoryClose) victoryClose.setAttribute('aria-label', t('close'));
    if (lossClose) lossClose.setAttribute('aria-label', t('close'));
    if (recordsClose) recordsClose.setAttribute('aria-label', t('close'));
    if (victoryAgain) victoryAgain.textContent = t('play_again');
    if (victoryOk) victoryOk.textContent = t('ok');
    if (lossAgain) lossAgain.textContent = t('play_again');
    if (lossOk) lossOk.textContent = t('ok');
    if (recordsOk) recordsOk.textContent = t('ok');

    const victoryTimeLabel = document.getElementById('victoryTimeLabel');
    const victoryBoardLabel = document.getElementById('victoryBoardLabel');
    const lossTimeLabel = document.getElementById('lossTimeLabel');
    const lossBoardLabel = document.getElementById('lossBoardLabel');
    if (victoryTimeLabel) victoryTimeLabel.textContent = t('time');
    if (victoryBoardLabel) victoryBoardLabel.textContent = t('field');
    if (lossTimeLabel) lossTimeLabel.textContent = t('time');
    if (lossBoardLabel) lossBoardLabel.textContent = t('field');
  }

  function applyLanguage(lang, refreshRecords = true) {
    currentLanguage = lang === 'en' ? 'en' : 'ru';
    saveLanguage(currentLanguage);
    applyLanguageToDom();
    syncThemeControls();
    syncAudioButtons();
    syncLanguageButton();
    if (!state.hintAdPending && !state.hintMode) setHintText(t('hint_after_ad'));
    if (refreshRecords && recordsModal && !recordsModal.hidden) showRecordsModal();
    if (lossModal && !lossModal.hidden) {
      showLossModal();
    }
    if (victoryModal && !victoryModal.hidden) {
      showVictoryModal();
    }
  }

  function toggleLanguage() {
    applyLanguage(currentLanguage === 'ru' ? 'en' : 'ru');
  }

  function syncAudioButtons() {
    if (musicToggleBtn) {
      musicToggleBtn.classList.toggle('isOff', !musicEnabled);
      musicToggleBtn.setAttribute('aria-label', musicEnabled ? 'Выключить музыку' : 'Включить музыку');
      musicToggleBtn.title = musicEnabled ? 'Выключить музыку' : 'Включить музыку';
    }
    if (soundToggleBtn) {
      soundToggleBtn.classList.toggle('isOff', !soundEnabled);
      soundToggleBtn.setAttribute('aria-label', soundEnabled ? 'Выключить звуки' : 'Включить звуки');
      soundToggleBtn.title = soundEnabled ? 'Выключить звуки' : 'Включить звуки';
    }
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

    if (restartMusic && changed && !musicPlaybackActive && musicEnabled && state.screen === 'game' && !state.over) {
      startGameMusic();
    }
    if (state.screen === 'game') draw();
  }

  function cycleTheme() {
    const currentIndex = Math.max(0, THEME_KEYS.indexOf(currentThemeKey));
    const nextTheme = THEME_KEYS[(currentIndex + 1) % THEME_KEYS.length];
    applyTheme(nextTheme, true);
  }

  function toggleMusic() {
    musicEnabled = !musicEnabled;
    saveAudioSetting('music', musicEnabled);
    syncAudioButtons();
    if (!musicEnabled) {
      stopGameMusic();
      return;
    }
    if (state.screen === 'game' && !state.over) {
      startGameMusic();
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    saveAudioSetting('sound', soundEnabled);
    if (!soundEnabled) stopOutcomeSounds();
    syncSoundVolumes();
    syncAudioButtons();
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
    document.body.classList.remove('inGame');
    syncMobileViewportState();
    hideMilestonePopup();
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
    document.body.classList.add('inGame');
    syncMobileViewportState();
    tryLockLandscape();
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
    Object.values(milestoneSounds).forEach((sound) => {
      sound.pause();
      sound.currentTime = 0;
    });
  }

  function syncSoundVolumes() {
    outcomeSounds.defeat.volume = soundEnabled ? SOUND_VOLUMES.defeat : 0;
    outcomeSounds.victory.volume = soundEnabled ? SOUND_VOLUMES.victory : 0;
    Object.values(milestoneSounds).forEach((sound) => {
      sound.volume = soundEnabled ? 1 : 0;
    });
  }

  function hideMilestonePopup() {
    if (state.milestoneTimeoutId != null) {
      clearTimeout(state.milestoneTimeoutId);
      state.milestoneTimeoutId = null;
    }
    state.milestoneActive = false;
    if (milestonePopup) {
      milestonePopup.classList.remove('isVisible');
      milestonePopup.hidden = true;
      milestonePopup.style.visibility = 'hidden';
    }
    processMilestoneQueue();
  }

  function playMilestoneVoice(milestoneKey) {
    if (!soundEnabled) return;
    const sound = milestoneSounds[milestoneKey];
    if (!sound) return;
    Object.values(milestoneSounds).forEach((entry) => {
      entry.pause();
      entry.currentTime = 0;
    });
    sound.play().catch((err) => {
      console.warn('Milestone voice playback failed', err);
    });
  }

  function processMilestoneQueue() {
    if (state.milestoneActive || !state.milestoneQueue.length || state.screen !== 'game' || state.over) return;
    const milestoneKey = state.milestoneQueue.shift();
    const milestoneImage = milestoneImages[milestoneKey];
    if (!milestonePopup || !milestonePopupImage || !milestoneImage) return;

    syncMilestonePopupLayout();
    milestonePopupImage.src = milestoneImage.src;
    milestonePopupImage.alt = `${milestoneKey}%`;
    milestonePopup.hidden = false;
    milestonePopup.style.visibility = 'visible';
    milestonePopup.classList.remove('isVisible');
    state.milestoneActive = true;
    playMilestoneVoice(milestoneKey);
    requestAnimationFrame(() => {
      if (milestonePopup && state.milestoneActive) milestonePopup.classList.add('isVisible');
    });
    state.milestoneTimeoutId = window.setTimeout(() => {
      if (milestonePopup) milestonePopup.classList.remove('isVisible');
      state.milestoneTimeoutId = window.setTimeout(() => {
        state.milestoneTimeoutId = null;
        state.milestoneActive = false;
        if (milestonePopup) {
          milestonePopup.hidden = true;
          milestonePopup.style.visibility = 'hidden';
        }
        processMilestoneQueue();
      }, 280);
    }, 1720);
  }

  function countCorrectFlags() {
    let correctFlags = 0;
    for (const cell of state.grid) {
      if (cell.mine && cell.flagged) correctFlags++;
    }
    return correctFlags;
  }

  function updateProgressMilestones() {
    if (state.over) return;
    if (state.mines <= 0 || !state.minesPlaced) return;
    const progress = countCorrectFlags() / state.mines;

    MILESTONE_SEQUENCE.forEach(({ threshold, key }) => {
      if (progress < threshold) return;
      if (state.milestoneSeen.includes(key)) return;
      state.milestoneSeen.push(key);
      state.milestoneQueue.push(key);
    });

    processMilestoneQueue();
  }

  function playOutcomeSound(type) {
    if (!soundEnabled) return;
    const sound = outcomeSounds[type];
    if (!sound) return;
    stopOutcomeSounds();
    sound.currentTime = 0;
    sound.play().catch((err) => {
      console.warn('Outcome sound playback failed', err);
    });
  }

  function configureMusicTracks() {
    const shouldResume = musicPlaybackActive;
    if (musicTracks.length) {
      musicTracks.forEach((track) => {
        track.pause();
        track.currentTime = 0;
      });
    }

    musicTracks = activeTheme().musicFiles.map((src) => new Audio(src));
    currentMusicIndex = -1;
    musicPlaybackActive = false;

    musicTracks.forEach((track) => {
      track.volume = 0.45;
      track.addEventListener('ended', () => {
        if (musicPlaybackActive && musicEnabled && !state.over && state.screen === 'game') {
          playNextMusicTrack();
        }
      });
    });

    if (shouldResume && musicEnabled && state.screen === 'game' && !state.over) {
      startGameMusic();
    }
  }

  function stopGameMusic() {
    musicPlaybackActive = false;
    musicTracks.forEach((track) => {
      track.pause();
      track.currentTime = 0;
    });
    currentMusicIndex = -1;
  }

  function playNextMusicTrack() {
    if (!musicEnabled || state.over || state.screen !== 'game' || musicTracks.length === 0) return;

    if (currentMusicIndex >= 0 && musicTracks[currentMusicIndex]) {
      musicTracks[currentMusicIndex].pause();
      musicTracks[currentMusicIndex].currentTime = 0;
    }

    let nextIndex = Math.floor(Math.random() * musicTracks.length);
    if (musicTracks.length > 1) {
      while (nextIndex === currentMusicIndex) {
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
    if (!musicEnabled) return;
    musicPlaybackActive = true;
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
    hideMilestonePopup();
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
    updateProgressMilestones();
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
    state.milestoneSeen = [];
    state.milestoneQueue = [];
    state.milestoneActive = false;
    if (state.milestoneTimeoutId != null) {
      clearTimeout(state.milestoneTimeoutId);
      state.milestoneTimeoutId = null;
    }
    if (milestonePopup) milestonePopup.hidden = true;
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
    const mobileLandscape = isMobileDevice() && window.innerWidth > window.innerHeight;
    const denseMobileBoard = mobileLandscape && (state.w >= 16 || state.h >= 16 || state.mines >= 40);
    state.dpr = dpr;

    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    state.boardPx.w = canvas.width;
    state.boardPx.h = canvas.height;

    const pad = Math.floor((denseMobileBoard ? 4 : mobileLandscape ? 8 : 18) * dpr);
    const availW = Math.max(1, state.boardPx.w - pad * 2);
    const availH = Math.max(1, state.boardPx.h - pad * 2);
    const fittedCell = Math.floor(Math.min(availW / state.w, availH / state.h));
    const minCell = Math.floor((mobileLandscape && !denseMobileBoard ? 18 : 14) * dpr);
    const maxCell = Math.floor((denseMobileBoard ? 60 : mobileLandscape ? 56 : 44) * dpr);
    state.cell = fittedCell < minCell ? fittedCell : clamp(fittedCell, minCell, maxCell);

    const gridW = state.cell * state.w;
    const gridH = state.cell * state.h;
    state.ox = Math.floor((state.boardPx.w - gridW) / 2);
    state.oy = Math.floor((state.boardPx.h - gridH) / 2);

    if (panelEl) {
      const gridCssW = Math.round(gridW / dpr);
      panelEl.style.setProperty('--panel-width', `${gridCssW}px`);
    }
    syncMilestonePopupLayout();
  }

  function syncMilestonePopupLayout() {
    if (!milestonePopup) return;
    const dpr = state.dpr || 1;
    const gridCssH = Math.max(1, Math.round((state.cell * state.h) / dpr));
    const gridCssW = Math.max(1, Math.round((state.cell * state.w) / dpr));
    const leftSpace = Math.max(0, Math.round(state.ox / dpr) - 8);
    const top = Math.max(0, Math.round(state.oy / dpr));
    const preferredWidth = Math.max(72, Math.round(Math.min(gridCssH * 0.85, gridCssW * 0.28)));
    const maxWidth = leftSpace > 24 ? leftSpace : preferredWidth;
    const left = leftSpace > 24 ? 0 : 8;

    milestonePopup.style.top = `${top}px`;
    milestonePopup.style.left = `${left}px`;
    milestonePopup.style.height = `${gridCssH}px`;
    milestonePopup.style.width = `${maxWidth}px`;
    milestonePopup.style.maxWidth = `${maxWidth}px`;
    milestonePopup.style.transform = 'none';
    milestonePopup.style.display = 'flex';
    milestonePopup.style.alignItems = 'center';
    milestonePopup.style.justifyContent = 'center';
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
    const mobileLandscape = isMobileDevice() && window.innerWidth > window.innerHeight;
    const denseMobileBoard = mobileLandscape && (state.w >= 16 || state.h >= 16 || state.mines >= 40);
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
    const shellPad = denseMobileBoard ? Math.max(3, Math.floor(cell * 0.08)) : Math.max(6, Math.floor(cell * 0.14));
    const shellRadius = denseMobileBoard ? Math.max(8, Math.floor(cell * 0.22)) : 12;

    ctx.fillStyle = colors.shell;
    roundRectFill(ctx, ox - shellPad, oy - shellPad, bw + shellPad * 2, bh + shellPad * 2, shellRadius);
    ctx.strokeStyle = colors.shellStroke;
    ctx.lineWidth = Math.max(1, Math.floor(1 * state.dpr));
    roundRectStroke(ctx, ox - shellPad, oy - shellPad, bw + shellPad * 2, bh + shellPad * 2, shellRadius);

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

    if (currentThemeKey === 'nordic') {
      ctx.strokeStyle = colors.mine;
      ctx.lineWidth = Math.max(1.5, Math.floor(s * 0.05));
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
        const inner = r * 0.24;
        const outer = r * 1.55;
        const sx = cx + Math.cos(a) * inner;
        const sy = cy + Math.sin(a) * inner;
        const ex = cx + Math.cos(a) * outer;
        const ey = cy + Math.sin(a) * outer;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        const branchLen = r * 0.44;
        const branchA = a + Math.PI / 6;
        const branchB = a - Math.PI / 6;
        const bx = cx + Math.cos(a) * (r * 0.98);
        const by = cy + Math.sin(a) * (r * 0.98);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(branchA) * branchLen, by + Math.sin(branchA) * branchLen);
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(branchB) * branchLen, by + Math.sin(branchB) * branchLen);
        ctx.stroke();

        const tx = cx + Math.cos(a) * (r * 1.34);
        const ty = cy + Math.sin(a) * (r * 1.34);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.cos(branchA) * (branchLen * 0.72), ty + Math.sin(branchA) * (branchLen * 0.72));
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + Math.cos(branchB) * (branchLen * 0.72), ty + Math.sin(branchB) * (branchLen * 0.72));
        ctx.stroke();
      }

      ctx.fillStyle = colors.mine;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.mineHi;
      ctx.beginPath();
      ctx.arc(cx - r * 0.12, cy - r * 0.16, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (currentThemeKey === 'space') {
      if (drawThemeMineImage(mineImages.space, px, py, s, colors)) return;
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
      if (drawThemeMineImage(mineImages.medieval, px, py, s, colors)) return;
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

  function drawThemeMineImage(img, px, py, s, colors) {
    if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return false;

    const pad = s * 0.08;
    const size = s - pad * 2;
    const radius = size * 0.26;

    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, px + pad, py + pad, size, size, radius);
    ctx.clip();
    ctx.drawImage(img, px + pad, py + pad, size, size);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = colors.openStroke;
    ctx.lineWidth = Math.max(1, Math.floor(s * 0.04));
    roundRectStroke(ctx, px + pad, py + pad, size, size, radius);
    ctx.restore();
    return true;
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

  function syncThemeControls() {
    if (themeSelect) themeSelect.value = currentThemeKey;
    if (themeCycleBtn) themeCycleBtn.textContent = getThemeLabel(currentThemeKey);
  }

  function syncAudioButtons() {
    if (musicToggleBtn) {
      musicToggleBtn.classList.toggle('isOff', !musicEnabled);
      musicToggleBtn.setAttribute('aria-label', musicEnabled ? t('music_off') : t('music_on'));
      musicToggleBtn.title = musicEnabled ? t('music_off') : t('music_on');
    }
    if (soundToggleBtn) {
      soundToggleBtn.classList.toggle('isOff', !soundEnabled);
      soundToggleBtn.setAttribute('aria-label', soundEnabled ? t('sound_off') : t('sound_on'));
      soundToggleBtn.title = soundEnabled ? t('sound_off') : t('sound_on');
    }
  }

  function boardLabel(w = state.w, h = state.h, m = state.mines) {
    return `${w}x${h} ${t('board_separator')} ${m} ${t('minute_mines')}`;
  }

  function clearHint() {
    stopHintMode();
    setHintText(t('hint_after_ad'));
    clearHintPreview();
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
              setHintText(t('watch_ad_to_end'));
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

  async function startHintMode() {
    if (state.over || state.screen !== 'game' || state.hintAdPending) return;
    if (state.hintMode) {
      state.hintMode = false;
      setHintText(t('hint_after_ad'));
      syncHintButton();
      draw();
      return;
    }

    state.hintAdPending = true;
    setHintText(t('loading_ad'), true);
    syncHintButton();

    const adResult = await showRewardedHintAd();
    state.hintAdPending = false;
    if (state.over || state.screen !== 'game') {
      setHintText(t('hint_after_ad'));
      syncHintButton();
      return;
    }

    if (!adResult.rewarded) {
      setHintText(adResult.error ? t('ad_unavailable') : t('need_watch_ad'), true);
      syncHintButton();
      window.setTimeout(() => {
        if (!state.hintMode && !state.hintAdPending) setHintText(t('hint_after_ad'));
      }, 1800);
      return;
    }

    state.hintMode = true;
    setHintText(t('choose_closed_cell'));
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
    setHintText(t('hint_after_ad'));
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
        label: `${t('custom_board')} (${boardLabel(w, h, m)})`,
        recordKey: `custom:${w}x${h}:${m}`,
      };
    }
    const pr = PRESETS[preset] || PRESETS.beginner;
    return {
      preset,
      w: pr.w,
      h: pr.h,
      m: pr.m,
      label: `${getPresetLabel(preset)} (${boardLabel(pr.w, pr.h, pr.m)})`,
      recordKey: preset,
    };
  }

  function showRecordsModal() {
    const selection = getSelection();
    const best = readRecord(selection.recordKey);
    recordsName.textContent = selection.label;
    recordsValue.textContent = best == null ? t('no_record') : `${fmt3(best)} ${t('sec_short')}`;
    recordsModal.hidden = false;
  }

  function syncLossContinueButton() {
    if (!lossContinue) return;
    lossContinue.disabled = state.lossContinuePending || state.lossContinueUsed;
    if (state.lossContinuePending) {
      setLossContinueLabel(t('loading'));
      return;
    }
    if (state.lossContinueUsed) {
      setLossContinueLabel(t('continue_used'));
      return;
    }
    setLossContinueLabel(t('loss_continue'));
  }

  function scheduleLossContinueLabelReset() {
    window.setTimeout(() => {
      if (state.lossContinuePending || state.lossContinueUsed) return;
      setLossContinueLabel(t('loss_continue'));
    }, 1800);
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
      setLossContinueLabel(adResult.error ? t('ad_unavailable') : t('need_watch_short'));
      if (lossContinue) lossContinue.disabled = false;
      scheduleLossContinueLabelReset();
      return;
    }

    if (!reviveAfterLoss()) {
      setLossContinueLabel(t('unable_continue'));
      if (lossContinue) lossContinue.disabled = false;
      scheduleLossContinueLabelReset();
      return;
    }

    syncLossContinueButton();
  }

  faceBtn.addEventListener('click', restartSameSettings);
  if (hintBtn) hintBtn.addEventListener('click', startHintMode);
  if (playBtn) playBtn.addEventListener('click', startSelectedGame);
  if (menuBtn) menuBtn.addEventListener('click', showMenu);
  if (languageToggleBtn) languageToggleBtn.addEventListener('click', toggleLanguage);
  if (musicToggleBtn) musicToggleBtn.addEventListener('click', toggleMusic);
  if (soundToggleBtn) soundToggleBtn.addEventListener('click', toggleSound);
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
    syncMobileViewportState();
    if (state.screen !== 'game') return;
    resize();
    draw();
  });

  window.addEventListener('orientationchange', () => {
    syncMobileViewportState();
    if (state.screen !== 'game') return;
    resize();
    draw();
  });

  updateCustomVisibility();
  syncMobileViewportState();
  syncSoundVolumes();
  applyTheme(currentThemeKey);
  applyLanguage(currentLanguage, false);
  initYandexSdk();
  showMenu();
})();
