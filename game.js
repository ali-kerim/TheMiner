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
  const hintControl = document.querySelector('.hintControl');
  const hintInfoPopup = document.getElementById('hintInfoPopup');
  const hintInfoPopupText = document.getElementById('hintInfoPopupText');
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
    defeat: './assets/sounds/defeat.mpeg',
    victory: './assets/sounds/game-won.mp3',
  };
  const mineImages = {
    medieval: loadImage('./assets/powder.png'),
    space: loadImage('./assets/black-hole.png'),
  };
  const milestoneImages = {
    25: {
      ru: loadImage('./assets/troll2_1.png'),
      en: loadImage('./assets/troll2_1_eng.png'),
    },
    50: {
      ru: loadImage('./assets/gj3.png'),
      en: loadImage('./assets/gj3_eng.png'),
    },
    75: {
      ru: loadImage('./assets/gj2.png'),
      en: loadImage('./assets/gj2_eng.png'),
    },
    90: {
      ru: loadImage('./assets/troll2_2.png'),
      en: loadImage('./assets/troll2_2_eng2.png'),
    },
  };
  const milestoneSounds = {
    25: './assets/sounds/hmm.mpeg',
    50: './assets/sounds/letsgo.mpeg',
    75: './assets/sounds/perfect.mpeg',
    90: './assets/sounds/sneaky.mpeg',
  };
  const MILESTONE_SEQUENCE = [
    { threshold: 0.25, key: 25 },
    { threshold: 0.50, key: 50 },
    { threshold: 0.75, key: 75 },
    { threshold: 0.90, key: 90 },
  ];
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const musicBufferCache = new Map();
  let currentMusicIndex = -1;
  let musicBuffers = [];
  let musicPlaybackActive = false;
  let musicAudioContext = null;
  let musicGainNode = null;
  let sfxGainNode = null;
  let musicSourceNode = null;
  let activeMilestoneSourceNode = null;
  let activeOutcomeSourceNode = null;
  let musicSourceStartedAt = 0;
  let musicPauseOffset = 0;
  let musicLoadToken = 0;
  let currentMusicThemeCacheKey = '';
  const sfxBufferCache = new Map();
  let iosAudioUnlocked = false;
  let iosAudioUnlockPromise = null;
  let iosPlayAudioWarmupPromise = null;
  // Remembers whether the current background track was actually playing
  // before the tab became hidden, so we do not auto-enable music on return.
  let musicWasPlayingBeforeHide = false;
  let isMusicMuted = !readStoredAudioSetting('music', true);
  let isSoundMuted = !readStoredAudioSetting('sound', true);
  const SOUND_VOLUMES = {
    defeat: 0.3,
    victory: 1,
  };
  const MUSIC_VOLUME = 0.45;
  const backgroundMusic = {
    play() {
      return playMusic();
    },
    pause() {
      pauseMusic();
    },
  };

  const yandex = {
    ysdk: null,
    player: null,
    initPromise: null,
    scriptPromise: null,
    playerPromise: null,
    loadingReadySent: false,
    adShowing: false,
    gameplayActive: false,
    audioPausedForAd: false,
    musicWasPlayingBeforeAd: false,
    audioContextSuspendedForAd: false,
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
  const storedLanguagePreference = readStoredLanguagePreference();
  let currentLanguage = storedLanguagePreference || 'ru';
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
      hint_make_first_move: 'Сделайте первых ход',
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
      hint_make_first_move: 'Make the first move',
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

  function loadYandexSdkScript() {
    if (yandex.scriptPromise) return yandex.scriptPromise;
    if (!isEmbeddedRuntime()) {
      yandex.scriptPromise = Promise.resolve(null);
      return yandex.scriptPromise;
    }
    if (window.YaGames && typeof window.YaGames.init === 'function') {
      yandex.scriptPromise = Promise.resolve(window.YaGames);
      return yandex.scriptPromise;
    }

    yandex.scriptPromise = new Promise((resolve) => {
      const existingScript = document.querySelector('script[data-yandex-games-sdk="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.YaGames || null), { once: true });
        existingScript.addEventListener('error', () => resolve(null), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://yandex.ru/games/sdk/v2';
      script.async = true;
      script.dataset.yandexGamesSdk = 'true';
      script.addEventListener('load', () => resolve(window.YaGames || null), { once: true });
      script.addEventListener('error', () => resolve(null), { once: true });
      document.head.appendChild(script);
    });

    return yandex.scriptPromise;
  }

  function initYandexSdk() {
    if (yandex.initPromise) return yandex.initPromise;

    yandex.initPromise = loadYandexSdkScript()
      .then(() => {
        if (!isYandexGamesRuntime()) return null;
        return window.YaGames.init();
      })
      .then((ysdk) => {
        if (!ysdk) return null;
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

  function isIosSafari() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const touchMac = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const iosDevice = /iPad|iPhone|iPod/.test(ua) || touchMac;
    const webkit = /WebKit/i.test(ua);
    const otherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/i.test(ua);
    return iosDevice && webkit && !otherIosBrowser;
  }

  function needsLandscapeMode() {
    return isMobileDevice() && window.innerHeight > window.innerWidth;
  }

  function isEmbeddedRuntime() {
    try {
      return window.parent !== window;
    } catch (error) {
      return false;
    }
  }

  function isYandexGamesRuntime() {
    try {
      return isEmbeddedRuntime() && !!window.YaGames && typeof window.YaGames.init === 'function';
    } catch (error) {
      return false;
    }
  }

  function syncViewportCssVars() {
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`);
  }

  function syncMobileViewportState() {
    const mobile = isMobileDevice();
    const needsLandscape = needsLandscapeMode();
    const mobileLandscape = mobile && window.innerWidth > window.innerHeight;
    const shortViewport = mobile && window.innerHeight <= 500;
    const iosSafari = isIosSafari();
    document.body.classList.toggle('isMobileDevice', mobile);
    document.body.classList.toggle('isIosSafari', iosSafari);
    document.body.classList.toggle('needsLandscape', needsLandscape);
    document.body.classList.toggle('isMobileLandscape', mobileLandscape);
    document.body.classList.toggle('isShortViewport', shortViewport);
    if (rotateNotice) rotateNotice.setAttribute('aria-hidden', needsLandscape ? 'false' : 'true');
    syncViewportCssVars();
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

  function getLocalizedMilestoneImage(milestoneKey) {
    const images = milestoneImages[milestoneKey];
    if (!images) return null;
    return currentLanguage === 'en' ? (images.en || images.ru) : (images.ru || images.en);
  }

  function notifyGameReady() {
    if (yandex.loadingReadySent || !yandex.ysdk || !isYandexGamesRuntime()) return;
    try {
      yandex.ysdk.features?.LoadingAPI?.ready?.();
      yandex.loadingReadySent = true;
    } catch (err) {
      console.warn('Yandex LoadingAPI.ready failed', err);
    }
  }

  function loadYandexPlayer() {
    if (!isYandexGamesRuntime() || !yandex.ysdk || yandex.playerPromise || typeof yandex.ysdk.getPlayer !== 'function') return yandex.playerPromise;
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
    if (!isYandexGamesRuntime() || !yandex.ysdk || yandex.gameplayActive || yandex.adShowing || state.screen !== 'game' || state.over) return;
    try {
      yandex.ysdk.features?.GameplayAPI?.start?.();
      yandex.gameplayActive = true;
    } catch (err) {
      console.warn('Yandex GameplayAPI.start failed', err);
    }
  }

  function stopGameplayMarkup() {
    if (!isYandexGamesRuntime() || !yandex.ysdk || !yandex.gameplayActive) return;
    try {
      yandex.ysdk.features?.GameplayAPI?.stop?.();
    } catch (err) {
      console.warn('Yandex GameplayAPI.stop failed', err);
    } finally {
      yandex.gameplayActive = false;
    }
  }

  function showNewGameAd() {
    if (!isYandexGamesRuntime()) {
      startGameplayMarkup();
      return;
    }
    initYandexSdk().then((ysdk) => {
      if (!ysdk?.adv || yandex.adShowing) {
        startGameplayMarkup();
        return;
      }

      stopGameplayMarkup();
      yandex.adShowing = true;

      const finishAd = () => {
        yandex.adShowing = false;
        resumeAudioAfterAd();
        startGameplayMarkup();
      };

      try {
        ysdk.adv.showFullscreenAdv({
          callbacks: {
            onOpen: () => {
              stopGameplayMarkup();
              void pauseAudioForAd();
            },
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
    if (!isYandexGamesRuntime()) return Promise.resolve({ rewarded: false, error: true });
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
        resumeAudioAfterAd();
        startGameplayMarkup();
        resolve(result);
      };

      stopGameplayMarkup();
      yandex.adShowing = true;
      void pauseAudioForAd();

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
    if (!isYandexGamesRuntime()) return Promise.resolve({ rewarded: false, error: true });
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
        resumeAudioAfterAd();
        startGameplayMarkup();
        resolve(result);
      };

      stopGameplayMarkup();
      yandex.adShowing = true;
      void pauseAudioForAd();

      try {
        ysdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => {
              stopGameplayMarkup();
              void pauseAudioForAd();
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

  function readStoredLanguagePreference() {
    try {
      const stored = localStorage.getItem('miner-language');
      if (stored === 'ru' || stored === 'en') return stored;
    } catch {}
    return null;
  }

  function normalizeLanguage(lang) {
    const value = String(lang || '').trim().toLowerCase();
    if (value.startsWith('ru')) return 'ru';
    if (value.startsWith('en')) return 'en';
    return null;
  }

  function readYandexLanguage(ysdk = yandex.ysdk) {
    if (!ysdk) return null;
    // Yandex moderation checks startup auto-detection specifically through
    // `environment.i18n.lang`, so we read that field first and use it directly.
    const directSdkLanguage = normalizeLanguage(ysdk.environment?.i18n?.lang);
    if (directSdkLanguage) return directSdkLanguage;
    const candidates = [
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
    // Always read the SDK language during startup so Yandex debug mode sees
    // I18N usage, but keep manual player choice as a higher-priority override.
    if (storedLanguagePreference) return;
    if (!sdkLanguage || sdkLanguage === currentLanguage) return;
    applyLanguage(sdkLanguage, false, false);
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

  function saveLanguagePreference(lang) {
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
    document.body.dataset.lang = currentLanguage;
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
    if (hintInfoPopup) hintInfoPopup.setAttribute('aria-label', t('hint'));
    if (hintInfoPopupText) hintInfoPopupText.textContent = t('hint_make_first_move');
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

  function applyLanguage(lang, refreshRecords = true, persistPreference = true) {
    currentLanguage = lang === 'en' ? 'en' : 'ru';
    if (persistPreference) {
      // Persist only explicit player choice so SDK auto-detection remains
      // effective for first launch and Yandex debug validation.
      saveLanguagePreference(currentLanguage);
    }
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

  function safePlayBackgroundMusic(contextLabel = 'Background music playback failed') {
    return backgroundMusic.play().catch((error) => {
      console.warn(contextLabel, error);
    });
  }

  function syncAudioButtons() {
    if (musicToggleBtn) {
      musicToggleBtn.classList.toggle('isOff', isMusicMuted);
      musicToggleBtn.setAttribute('aria-label', isMusicMuted ? 'Включить музыку' : 'Выключить музыку');
      musicToggleBtn.title = isMusicMuted ? 'Включить музыку' : 'Выключить музыку';
    }
    if (soundToggleBtn) {
      soundToggleBtn.classList.toggle('isOff', isSoundMuted);
      soundToggleBtn.setAttribute('aria-label', isSoundMuted ? 'Включить звуки' : 'Выключить звуки');
      soundToggleBtn.title = isSoundMuted ? 'Включить звуки' : 'Выключить звуки';
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
    void preloadCurrentThemeMusic();

    if (restartMusic && changed && !musicPlaybackActive && !isMusicMuted && state.screen === 'game' && !state.over) {
      void safePlayBackgroundMusic('Background music restart failed after theme change');
    }
    if (state.screen === 'game') draw();
  }

  function cycleTheme() {
    const currentIndex = Math.max(0, THEME_KEYS.indexOf(currentThemeKey));
    const nextTheme = THEME_KEYS[(currentIndex + 1) % THEME_KEYS.length];
    applyTheme(nextTheme, true);
  }

  function toggleMusic() {
    isMusicMuted = !isMusicMuted;
    saveAudioSetting('music', !isMusicMuted);
    syncAudioButtons();
    if (isMusicMuted) {
      backgroundMusic.pause();
      return;
    }
    prepareIosAudioForPlayback();
    if (state.screen === 'game' && !state.over) {
      void safePlayBackgroundMusic('Background music playback failed after unmuting');
    }
  }

  function toggleSound() {
    isSoundMuted = !isSoundMuted;
    saveAudioSetting('sound', !isSoundMuted);
    if (isSoundMuted) stopOutcomeSounds();
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

  function showHintInfoPopup() {
    if (!hintInfoPopup) return;
    // Show a small local dialog under the hint button before the first move.
    if (hintInfoPopupText) hintInfoPopupText.textContent = t('hint_make_first_move');
    hintInfoPopup.hidden = false;
  }

  function hideHintInfoPopup() {
    if (!hintInfoPopup) return;
    hintInfoPopup.hidden = true;
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
    hideHintInfoPopup();
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

  function reviveAfterLoss() {
    const explodedIndex = state.grid.findIndex((cell) => cell.exploded);
    if (explodedIndex < 0) return false;

    const explodedCell = state.grid[explodedIndex];

    // Rewarded continue must preserve the exact field layout.
    // The detonated mine stays in place and becomes a visible "flag + mine" marker.
    for (const cell of state.grid) {
      if (cell.mine) {
        cell.revealed = false;
        cell.exploded = false;
      }
    }
    explodedCell.revealed = false;
    explodedCell.exploded = true;
    if (!explodedCell.flagged) {
      explodedCell.flagged = true;
      state.flags++;
    }
    state.revealed = Math.max(0, state.revealed - 1);

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
    stopSfxSource('outcome');
    stopSfxSource('milestone');
  }

  function syncSoundVolumes() {
    // Sound effects use Web Audio gain at playback time, so there is no
    // persistent HTMLMediaElement volume state to synchronize.
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
    if (isSoundMuted || isAdAudioBlocked()) return;
    const sound = milestoneSounds[milestoneKey];
    if (!sound) return;
    stopSfxSource('milestone');
    void playBufferedSound(sound, 1, 'milestone', 'Milestone voice playback failed');
  }

  function processMilestoneQueue() {
    if (state.milestoneActive || !state.milestoneQueue.length || state.screen !== 'game' || state.over) return;
    const milestoneKey = state.milestoneQueue.shift();
    const milestoneImage = getLocalizedMilestoneImage(milestoneKey);
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
    if (isSoundMuted || isAdAudioBlocked()) return;
    const sound = outcomeSounds[type];
    if (!sound) return;
    stopOutcomeSounds();
    void playBufferedSound(sound, SOUND_VOLUMES[type] || 1, 'outcome', 'Outcome sound playback failed');
  }

  function ensureMusicAudioContext() {
    if (musicAudioContext || !AudioContextCtor) return musicAudioContext;

    // The background music uses Web Audio so mobile browsers do not expose it
    // as a separate media session in the system notification area.
    musicAudioContext = new AudioContextCtor();
    musicGainNode = musicAudioContext.createGain();
    musicGainNode.gain.value = MUSIC_VOLUME;
    musicGainNode.connect(musicAudioContext.destination);
    sfxGainNode = musicAudioContext.createGain();
    sfxGainNode.gain.value = 1;
    sfxGainNode.connect(musicAudioContext.destination);
    return musicAudioContext;
  }

  function stopSfxSource(channel) {
    const sourceNode = channel === 'milestone' ? activeMilestoneSourceNode : activeOutcomeSourceNode;
    if (!sourceNode) return;

    if (channel === 'milestone') {
      activeMilestoneSourceNode = null;
    } else {
      activeOutcomeSourceNode = null;
    }

    try {
      sourceNode.stop();
    } catch {}
    sourceNode.disconnect();
  }

  function isMusicActuallyPlaying() {
    return Boolean(musicSourceNode);
  }

  function resumeMusicAudioContext() {
    const audioContext = ensureMusicAudioContext();
    if (!audioContext) return Promise.resolve(null);
    if (audioContext.state === 'running') return Promise.resolve(audioContext);
    return audioContext.resume().then(() => audioContext).catch((err) => {
      console.warn('Music audio context resume failed', err);
      return null;
    });
  }

  function clearBrowserMediaSession() {
    const mediaSession = navigator.mediaSession;
    if (!mediaSession) return;

    try {
      mediaSession.metadata = null;
    } catch {}

    try {
      mediaSession.playbackState = 'none';
    } catch {}

    ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto', 'stop'].forEach((action) => {
      try {
        mediaSession.setActionHandler(action, null);
      } catch {}
    });
  }

  function primeMusicAudioContext(audioContext) {
    if (!audioContext) return Promise.resolve();

    try {
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(audioContext.destination);

      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioContext.createBuffer(1, 1, 22050);
      sourceNode.connect(gainNode);
      sourceNode.start(0);
      sourceNode.stop(audioContext.currentTime + 0.001);
    } catch {}

    return Promise.resolve();
  }

  function unlockIosAudio() {
    if (!isIosSafari()) return Promise.resolve(true);
    if (iosAudioUnlocked) return Promise.resolve(true);
    if (iosAudioUnlockPromise) return iosAudioUnlockPromise;

    iosAudioUnlockPromise = resumeMusicAudioContext()
      .then((audioContext) => {
        if (!audioContext) return false;
        return primeMusicAudioContext(audioContext).then(() => audioContext.state === 'running');
      })
      .then((unlocked) => {
        iosAudioUnlocked = Boolean(unlocked);
        return iosAudioUnlocked;
      })
      .then(() => {
        clearBrowserMediaSession();
      })
      .catch((err) => {
        console.warn('iOS audio unlock failed', err);
        return false;
      })
      .then(() => {
        const unlocked = iosAudioUnlocked;
        iosAudioUnlockPromise = null;
        return unlocked;
      });

    return iosAudioUnlockPromise;
  }

  function prepareIosAudioForPlayback() {
    if (!isIosSafari()) return Promise.resolve(true);
    return unlockIosAudio();
  }

  function preloadCurrentThemeMusic() {
    const audioContext = ensureMusicAudioContext();
    if (!audioContext) return Promise.resolve([]);
    return loadMusic().catch((error) => {
      console.warn('Background music preload failed', error);
      return [];
    });
  }

  function warmupIosPlayAudio() {
    if (!isIosSafari()) return Promise.resolve(true);
    if (iosPlayAudioWarmupPromise) return iosPlayAudioWarmupPromise;

    iosPlayAudioWarmupPromise = (async () => {
      const unlocked = await prepareIosAudioForPlayback();
      if (!unlocked) return false;
      const audioContext = await resumeMusicAudioContext();
      if (!audioContext) return false;
      await preloadCurrentThemeMusic();
      clearBrowserMediaSession();
      return true;
    })()
      .catch((error) => {
        console.warn('iOS play audio warmup failed', error);
        return false;
      })
      .finally(() => {
        iosPlayAudioWarmupPromise = null;
      });

    return iosPlayAudioWarmupPromise;
  }

  function decodeAudioDataCompat(audioContext, arrayBuffer) {
    const copy = arrayBuffer.slice(0);
    try {
      const decoded = audioContext.decodeAudioData(copy);
      if (decoded && typeof decoded.then === 'function') {
        return decoded;
      }
    } catch (err) {
      // Older WebKit implementations may require the callback form below.
    }

    return new Promise((resolve, reject) => {
      audioContext.decodeAudioData(copy, resolve, reject);
    });
  }

  function createMusicThemeCacheKey() {
    return `${currentThemeKey}:${activeTheme().musicFiles.join('|')}`;
  }

  async function loadSharedAudioBuffer(src) {
    const audioContext = ensureMusicAudioContext();
    if (!audioContext) return null;

    let bufferPromise = sfxBufferCache.get(src);
    if (!bufferPromise) {
      bufferPromise = (async () => {
        let arrayBuffer = null;
        try {
          const response = await fetch(src);
          if (!response.ok) {
            throw new Error(`Failed to load audio file: ${src}`);
          }
          arrayBuffer = await response.arrayBuffer();
        } catch (fetchErr) {
          arrayBuffer = await loadArrayBufferViaXhr(src);
        }

        return decodeAudioDataCompat(audioContext, arrayBuffer);
      })();
      sfxBufferCache.set(src, bufferPromise);
    }

    try {
      return await bufferPromise;
    } catch (err) {
      sfxBufferCache.delete(src);
      throw err;
    }
  }

  async function playBufferedSound(src, volume = 1, channel = 'outcome', errorLabel = 'Sound playback failed') {
    if (isIosSafari()) {
      await unlockIosAudio();
    }

    const audioContext = await resumeMusicAudioContext();
    if (!audioContext || !sfxGainNode) return;

    try {
      const buffer = await loadSharedAudioBuffer(src);
      if (!buffer) return;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(sfxGainNode);

      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.connect(gainNode);

      if (channel === 'milestone') {
        activeMilestoneSourceNode = sourceNode;
      } else {
        activeOutcomeSourceNode = sourceNode;
      }

      sourceNode.addEventListener('ended', () => {
        gainNode.disconnect();
        if (channel === 'milestone' && activeMilestoneSourceNode === sourceNode) {
          activeMilestoneSourceNode = null;
        }
        if (channel === 'outcome' && activeOutcomeSourceNode === sourceNode) {
          activeOutcomeSourceNode = null;
        }
        sourceNode.disconnect();
      }, { once: true });

      sourceNode.start(0);
      clearBrowserMediaSession();
    } catch (err) {
      console.warn(errorLabel, err);
    }
  }

  function loadArrayBufferViaXhr(src) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', src, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = () => {
        // In some local desktop runs the browser may report status 0 for file-like loads.
        if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.response)) {
          resolve(xhr.response);
          return;
        }
        reject(new Error(`XHR music load failed: ${src} (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error(`XHR music load failed: ${src}`));
      xhr.send();
    });
  }

  async function loadMusicBuffer(src) {
    const audioContext = ensureMusicAudioContext();
    if (!audioContext) return null;

    let arrayBuffer = null;
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to load music file: ${src}`);
      }
      arrayBuffer = await response.arrayBuffer();
    } catch (fetchErr) {
      // Fallback for desktop/local runs where fetch() may be blocked for local assets.
      arrayBuffer = await loadArrayBufferViaXhr(src);
    }

    return decodeAudioDataCompat(audioContext, arrayBuffer);
  }

  async function loadMusic() {
    const audioContext = ensureMusicAudioContext();
    if (!audioContext) return [];

    const cacheKey = createMusicThemeCacheKey();
    if (currentMusicThemeCacheKey === cacheKey && musicBuffers.length) {
      return musicBuffers;
    }

    let bufferPromise = musicBufferCache.get(cacheKey);
    if (!bufferPromise) {
      bufferPromise = Promise.all(activeTheme().musicFiles.map((src) => loadMusicBuffer(src)));
      musicBufferCache.set(cacheKey, bufferPromise);
    }

    try {
      const buffers = (await bufferPromise).filter(Boolean);
      if (createMusicThemeCacheKey() === cacheKey) {
        musicBuffers = buffers;
        currentMusicThemeCacheKey = cacheKey;
      }
      return buffers;
    } catch (err) {
      musicBufferCache.delete(cacheKey);
      console.warn('Background music loading failed', err);
      return [];
    }
  }

  function getCurrentMusicBuffer() {
    if (currentMusicIndex < 0) return null;
    return musicBuffers[currentMusicIndex] || null;
  }

  function getSafeMusicOffset(buffer, offset) {
    if (!buffer || !buffer.duration) return 0;
    const normalizedOffset = offset % buffer.duration;
    return normalizedOffset >= 0 ? normalizedOffset : normalizedOffset + buffer.duration;
  }

  function teardownMusicSource(keepOffset = false) {
    if (!musicSourceNode) {
      if (!keepOffset) musicPauseOffset = 0;
      return;
    }

    const currentBuffer = musicSourceNode.buffer;
    if (keepOffset && currentBuffer) {
      const elapsed = musicAudioContext.currentTime - musicSourceStartedAt;
      musicPauseOffset = getSafeMusicOffset(currentBuffer, elapsed);
    } else {
      musicPauseOffset = 0;
    }

    const sourceNode = musicSourceNode;
    musicSourceNode = null;
    try {
      sourceNode.stop();
    } catch (err) {
      // Source nodes are one-shot; stopping an already finished node is safe to ignore.
    }
    sourceNode.disconnect();
  }

  function pickNextMusicIndex(buffers) {
    if (!buffers.length) return -1;
    let nextIndex = Math.floor(Math.random() * buffers.length);
    if (buffers.length > 1) {
      while (nextIndex === currentMusicIndex) {
        nextIndex = Math.floor(Math.random() * buffers.length);
      }
    }
    return nextIndex;
  }

  function configureMusicTracks() {
    const shouldResume = musicPlaybackActive;
    musicLoadToken++;
    teardownMusicSource(false);
    musicBuffers = [];
    currentMusicThemeCacheKey = '';
    currentMusicIndex = -1;
    musicPlaybackActive = false;

    if (shouldResume && !isMusicMuted && state.screen === 'game' && !state.over) {
      startGameMusic();
    }
  }

  function stopMusic() {
    musicLoadToken++;
    musicPlaybackActive = false;
    musicWasPlayingBeforeHide = false;
    teardownMusicSource(false);
    currentMusicIndex = -1;
    clearBrowserMediaSession();
  }

  function pauseMusic() {
    musicLoadToken++;
    teardownMusicSource(true);
    clearBrowserMediaSession();
  }

  function suspendMusicAudioContext() {
    if (!musicAudioContext || musicAudioContext.state !== 'running') return Promise.resolve(false);
    return musicAudioContext.suspend()
      .then(() => true)
      .catch((err) => {
        console.warn('Music audio context suspend failed', err);
        return false;
      });
  }

  function isAdAudioBlocked() {
    return yandex.adShowing || yandex.audioPausedForAd;
  }

  function pauseAudioForAd() {
    if (yandex.audioPausedForAd) return Promise.resolve();

    yandex.audioPausedForAd = true;
    yandex.musicWasPlayingBeforeAd = Boolean(isMusicActuallyPlaying() && !isMusicMuted && musicPlaybackActive);
    stopOutcomeSounds();

    if (yandex.musicWasPlayingBeforeAd) {
      pauseMusic();
    } else {
      musicPlaybackActive = false;
    }

    return suspendMusicAudioContext().then((suspended) => {
      yandex.audioContextSuspendedForAd = suspended;
    });
  }

  function resumeAudioAfterAd() {
    if (!yandex.audioPausedForAd) return;

    const shouldResumeMusic = yandex.musicWasPlayingBeforeAd && !isMusicMuted && state.screen === 'game' && !state.over;
    yandex.audioPausedForAd = false;
    yandex.musicWasPlayingBeforeAd = false;
    yandex.audioContextSuspendedForAd = false;

    if (shouldResumeMusic) {
      void safePlayBackgroundMusic('Background music resume failed after ad');
      return;
    }

    if (isMusicMuted || state.screen !== 'game' || state.over) {
      stopMusic();
    }
  }

  async function playMusic() {
    if (isMusicMuted || state.over || state.screen !== 'game' || isAdAudioBlocked()) return;

    if (isIosSafari()) {
      await unlockIosAudio();
    }

    musicPlaybackActive = true;
    const playbackToken = ++musicLoadToken;
    const audioContext = await resumeMusicAudioContext();
    if (!audioContext) return;

    const buffers = await loadMusic();
    if (
      playbackToken !== musicLoadToken ||
      !musicPlaybackActive ||
      isMusicMuted ||
      state.over ||
      state.screen !== 'game' ||
      !buffers.length
    ) {
      return;
    }

    if (currentMusicIndex < 0 || !buffers[currentMusicIndex]) {
      currentMusicIndex = pickNextMusicIndex(buffers);
      musicPauseOffset = 0;
    }

    const currentBuffer = getCurrentMusicBuffer();
    if (!currentBuffer || !musicGainNode) return;

    // AudioBufferSourceNode cannot be restarted after stop(), so we create
    // a fresh looping node every time we resume or switch tracks.
    if (musicSourceNode) {
      teardownMusicSource(false);
    }
    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = currentBuffer;
    sourceNode.loop = true;
    sourceNode.connect(musicGainNode);
    musicSourceNode = sourceNode;

    const startOffset = getSafeMusicOffset(currentBuffer, musicPauseOffset);
    musicSourceStartedAt = audioContext.currentTime - startOffset;
    try {
      sourceNode.start(0, startOffset);
    } catch (error) {
      if (musicSourceNode === sourceNode) musicSourceNode = null;
      sourceNode.disconnect();
      musicPlaybackActive = false;
      throw error;
    }
    clearBrowserMediaSession();
  }

  function stopGameMusic() {
    stopMusic();
  }

  function handleDocumentVisibilityChange() {
    if (document.hidden) {
      // Pause only if music was really playing before hiding the tab.
      musicWasPlayingBeforeHide = Boolean(isMusicActuallyPlaying() && !isMusicMuted && musicPlaybackActive);
      if (musicWasPlayingBeforeHide) {
        pauseMusic();
      }
      return;
    }

    if (isAdAudioBlocked()) {
      musicWasPlayingBeforeHide = false;
      return;
    }

    // Resume only when the player did not mute music manually and the game
    // is still in a state where music is supposed to be active.
    if (!musicWasPlayingBeforeHide || isMusicMuted || state.over || state.screen !== 'game') {
      musicWasPlayingBeforeHide = false;
      return;
    }

    musicWasPlayingBeforeHide = false;
    void safePlayBackgroundMusic('Background music resume failed after tab became visible');
  }

  function startGameMusic() {
    stopMusic();
    if (isMusicMuted) return;
    void safePlayBackgroundMusic();
  }

  function installIosAudioUnlockHandlers() {
    if (!isIosSafari() || !playBtn) return;
    const unlockOnPlayGesture = () => {
      void warmupIosPlayAudio();
    };
    playBtn.addEventListener('touchstart', unlockOnPlayGesture, { passive: true });
    playBtn.addEventListener('pointerdown', unlockOnPlayGesture, { passive: true });
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

  function newGame(w, h, m, recordKey, presetKey, options = {}) {
    const deferMusicStart = Boolean(options.deferMusicStart);
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
    if (!deferMusicStart) startGameMusic();
    showNewGameAd();
  }

  function startSelectedGame(options = {}) {
    const selection = getSelection();
    const deferMusicStart = Boolean(options.deferMusicStart);
    if (!deferMusicStart) void prepareIosAudioForPlayback();
    showGame();
    newGame(selection.w, selection.h, selection.m, selection.recordKey, selection.preset, { deferMusicStart });
  }

  let playButtonStartLocked = false;

  function handlePlayButtonPress() {
    if (playButtonStartLocked) return;
    playButtonStartLocked = true;
    const shouldDeferMusicStartForIos = isIosSafari() && !isMusicMuted;
    const iosWarmupPromise = shouldDeferMusicStartForIos ? warmupIosPlayAudio() : null;
    startSelectedGame({ deferMusicStart: shouldDeferMusicStartForIos });
    if (iosWarmupPromise) {
      void iosWarmupPromise.then((ready) => {
        if (!ready || isMusicMuted || state.screen !== 'game' || state.over || isMusicActuallyPlaying()) return;
        return safePlayBackgroundMusic('iOS background music start failed after Play warmup');
      });
    }
    window.setTimeout(() => {
      playButtonStartLocked = false;
    }, 700);
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

      // After rewarded continue, the failed cell stays closed and receives
      // only an automatic flag, without exposing the mine visually.
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

  // Disable the browser context menu globally so right click and long press
  // stay inside the game's own input model on desktop and mobile.
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Prevent accidental text selection during rapid taps, drags, and long press.
  document.addEventListener('selectstart', (e) => e.preventDefault());

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

  if (gameScreen) {
    // CSS overscroll-behavior handles modern browsers, but mobile Safari and
    // some Android WebViews can still expose page dragging or pull-to-refresh.
    // Prevent touch scrolling only inside active gameplay so menu scrolling
    // and form controls remain available.
    gameScreen.addEventListener('touchmove', (e) => {
      if (state.screen !== 'game' || gameScreen.hidden) return;
      if (!(e.target instanceof Node) || !gameScreen.contains(e.target)) return;
      if (e.touches.length !== 1) return;
      e.preventDefault();
    }, { passive: false });
  }

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
      musicToggleBtn.classList.toggle('isOff', isMusicMuted);
      musicToggleBtn.setAttribute('aria-label', isMusicMuted ? t('music_on') : t('music_off'));
      musicToggleBtn.title = isMusicMuted ? t('music_on') : t('music_off');
    }
    if (soundToggleBtn) {
      soundToggleBtn.classList.toggle('isOff', isSoundMuted);
      soundToggleBtn.setAttribute('aria-label', isSoundMuted ? t('sound_on') : t('sound_off'));
      soundToggleBtn.title = isSoundMuted ? t('sound_on') : t('sound_off');
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
        resumeAudioAfterAd();
        startGameplayMarkup();
        resolve(result);
      };

      stopGameplayMarkup();
      yandex.adShowing = true;
      void pauseAudioForAd();

      try {
        ysdk.adv.showRewardedVideo({
          callbacks: {
            onOpen: () => {
              stopGameplayMarkup();
              void pauseAudioForAd();
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
      hideHintInfoPopup();
      setHintText(t('hint_after_ad'));
      syncHintButton();
      draw();
      return;
    }

    // Before the first move, the player should not watch an ad for a hint yet.
    if (!state.started) {
      if (hintInfoPopup && !hintInfoPopup.hidden) hideHintInfoPopup();
      else showHintInfoPopup();
      syncHintButton();
      return;
    }

    hideHintInfoPopup();
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
  if (playBtn) {
    playBtn.addEventListener('click', handlePlayButtonPress);
  }
  if (menuBtn) menuBtn.addEventListener('click', showMenu);
  if (languageToggleBtn) languageToggleBtn.addEventListener('click', toggleLanguage);
  if (musicToggleBtn) musicToggleBtn.addEventListener('click', toggleMusic);
  if (soundToggleBtn) soundToggleBtn.addEventListener('click', toggleSound);
  if (themeCycleBtn) themeCycleBtn.addEventListener('click', cycleTheme);
  if (recordsBtn) recordsBtn.addEventListener('click', showRecordsModal);
  document.addEventListener('visibilitychange', handleDocumentVisibilityChange);
  document.addEventListener('pointerdown', (e) => {
    if (!hintInfoPopup || hintInfoPopup.hidden || !hintControl) return;
    // Close the local hint popup when the player interacts outside the hint area.
    if (!hintControl.contains(e.target)) hideHintInfoPopup();
  });
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

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      syncMobileViewportState();
      if (state.screen !== 'game') return;
      resize();
      draw();
    });
    window.visualViewport.addEventListener('scroll', () => {
      syncViewportCssVars();
    });
  }

  updateCustomVisibility();
  syncMobileViewportState();
  installIosAudioUnlockHandlers();
  syncSoundVolumes();
  applyTheme(currentThemeKey);
  // Apply a fallback language immediately, then let SDK startup auto-detection
  // replace it during launch when no manual language preference is stored.
  applyLanguage(currentLanguage, false, Boolean(storedLanguagePreference));
  initYandexSdk().then((ysdk) => {
    const launchLanguage = readYandexLanguage(ysdk) || currentLanguage;
    if (storedLanguagePreference) return ysdk;
    applyLanguage(launchLanguage, false, false);
    return ysdk;
  });
  showMenu();
})();
