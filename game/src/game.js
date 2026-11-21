// Festival Lampion — the game state machine: menu, playing, paused,
// level-complete, level-failed, game-complete. Timer, scoring, hints,
// level progression and the HUD live here.
var FL = window.FL || (window.FL = {});

FL.Game = (function () {
  const CFG = FL.CONFIG;

  const game = {
    state: 'menu',
    levelIndex: 0,
    found: new Set(),
    score: 0,
    levelStartScore: 0,
    timeLeft: CFG.levelTimeSeconds,
    hintsLeft: CFG.hintsPerLevel,
    stars: [],
    timerId: null,
    muted: false,
    marks: [],
    best: 0,
    unlocked: 1
  };

  function $(id) {
    return document.getElementById(id);
  }

  function scene() {
    return FL.SCENES[game.levelIndex];
  }

  function formatTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  function renderHud() {
    $('level-name').textContent = scene().name;
    $('counter').textContent = 'Ditemukan ' + game.found.size + '/' + CFG.differencesPerLevel;
    $('timer').textContent = formatTime(game.timeLeft);
    $('timer').classList.toggle('low', game.timeLeft <= 15 && game.state === 'playing');
    $('score').textContent = 'Skor ' + game.score;
    $('hints-left').textContent = game.hintsLeft;
    $('hint-btn').disabled = game.hintsLeft <= 0 || game.state !== 'playing';
  }

  function renderPanels() {
    const found = game.found;
    const sc = scene();
    $('panel-left').innerHTML = FL.panelSvg(sc, 'left', found, game.marks);
    $('panel-right').innerHTML = FL.panelSvg(sc, 'right', found, game.marks);
  }

  function showOverlay(id) {
    ['menu', 'pause-overlay', 'level-complete-overlay', 'level-failed-overlay', 'game-complete-overlay'].forEach(function (name) {
      $(name).classList.toggle('hidden', name !== id);
    });
  }

  function stopTimer() {
    if (game.timerId !== null) {
      clearInterval(game.timerId);
      game.timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    game.timerId = setInterval(function () {
      game.timeLeft -= 0.25;
      if (game.timeLeft <= 0) {
        game.timeLeft = 0;
        renderHud();
        levelFailed();
        return;
      }
      renderHud();
    }, 250);
  }

  function freezeTimer() {
    stopTimer();
  }

  function startLevel(index, options) {
    const opts = options || {};
    game.levelIndex = index;
    game.found = new Set(opts.foundIds || []);
    // Shot states pre-find differences: credit their points so the score
    // matches the found count (+100 per find). Real play never passes
    // foundIds, so this only affects deterministic screenshots.
    if (opts.foundIds) game.score += opts.foundIds.length * CFG.pointsPerFind;
    game.timeLeft = opts.timeLeft !== undefined ? opts.timeLeft : CFG.levelTimeSeconds;
    game.hintsLeft = CFG.hintsPerLevel;
    game.marks = [];
    game.levelStartScore = game.score;
    game.state = 'playing';
    showOverlay(null);
    renderPanels();
    renderHud();
    setStatus('Klik perbedaan pada gambar kiri atau kanan.');
    if (opts.freezeTimer) {
      freezeTimer();
    } else {
      startTimer();
    }
  }

  function setStatus(text) {
    $('status-text').textContent = text;
  }

  function handlePanelClick(side, x, y) {
    if (game.state !== 'playing') return;
    const sc = scene();
    for (const diff of sc.differences) {
      if (game.found.has(diff.id)) continue;
      const dx = x - diff.x;
      const dy = y - diff.y;
      if (dx * dx + dy * dy <= diff.r * diff.r) {
        game.found.add(diff.id);
        game.score += CFG.pointsPerFind;
        FL.Audio.chime();
        renderPanels();
        renderHud();
        if (game.found.size === CFG.differencesPerLevel) {
          levelComplete();
        } else {
          setStatus('Ketemu! ' + game.found.size + ' dari ' + CFG.differencesPerLevel + ' perbedaan.');
        }
        return;
      }
    }
    // Wrong click: red X, a buzz, and five seconds off the clock.
    FL.Audio.buzz();
    game.timeLeft = Math.max(0, game.timeLeft - CFG.wrongClickPenaltySeconds);
    const mark = { kind: 'wrong', side: side, x: x, y: y };
    game.marks.push(mark);
    renderPanels();
    renderHud();
    setStatus('Bukan itu! −5 detik.');
    setTimeout(function () {
      const i = game.marks.indexOf(mark);
      if (i >= 0) game.marks.splice(i, 1);
      if (game.state === 'playing') renderPanels();
    }, CFG.wrongMarkMs);
    if (game.timeLeft <= 0) levelFailed();
  }

  function useHint() {
    if (game.state !== 'playing' || game.hintsLeft <= 0) return;
    const sc = scene();
    const remaining = sc.differences.filter(function (d) { return !game.found.has(d.id); });
    if (remaining.length === 0) return;
    game.hintsLeft -= 1;
    const diff = remaining[0];
    const markL = { kind: 'hint', side: 'left', x: diff.x, y: diff.y, r: diff.r };
    const markR = { kind: 'hint', side: 'right', x: diff.x, y: diff.y, r: diff.r };
    game.marks.push(markL, markR);
    renderPanels();
    renderHud();
    setStatus('Petunjuk: ada perbedaan di lingkaran emas itu!');
    setTimeout(function () {
      [markL, markR].forEach(function (m) {
        const i = game.marks.indexOf(m);
        if (i >= 0) game.marks.splice(i, 1);
      });
      if (game.state === 'playing') renderPanels();
    }, CFG.hintPulseMs);
  }

  function starCount(timeLeft) {
    if (timeLeft >= CFG.starThresholds.three) return 3;
    if (timeLeft >= CFG.starThresholds.two) return 2;
    return 1;
  }

  function levelComplete() {
    stopTimer();
    const bonus = Math.round(game.timeLeft) * CFG.timeBonusPerSecond;
    game.score += bonus;
    const stars = starCount(game.timeLeft);
    game.stars[game.levelIndex] = stars;
    game.unlocked = FL.Save.saveUnlocked(Math.max(game.unlocked, Math.min(game.levelIndex + 2, CFG.levelCount)));
    game.state = 'levelComplete';
    FL.Audio.jingle();
    $('complete-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    $('complete-bonus').textContent = 'Bonus waktu: +' + bonus + ' poin (' + Math.round(game.timeLeft) + ' detik tersisa)';
    $('complete-total').textContent = 'Skor total: ' + game.score;
    $('btn-next-level').textContent = game.levelIndex + 1 >= CFG.levelCount ? 'Lihat Hasil' : 'Lanjut';
    showOverlay('level-complete-overlay');
    renderHud();
  }

  function levelFailed() {
    stopTimer();
    if (game.state === 'levelFailed') return;
    game.score = game.levelStartScore;
    game.state = 'levelFailed';
    $('failed-found').textContent = 'Kamu menemukan ' + game.found.size + ' dari ' + CFG.differencesPerLevel + ' perbedaan.';
    showOverlay('level-failed-overlay');
    renderHud();
  }

  function nextLevel() {
    if (game.levelIndex + 1 >= CFG.levelCount) {
      gameComplete();
    } else {
      startLevel(game.levelIndex + 1);
    }
  }

  function gameComplete() {
    stopTimer();
    game.state = 'gameComplete';
    game.best = FL.Save.saveBest(game.score);
    FL.Audio.fanfare();
    const totalStars = game.stars.reduce(function (a, b) { return a + (b || 0); }, 0);
    $('final-score').textContent = 'Skor total: ' + game.score;
    $('final-best').textContent = 'Skor terbaik: ' + game.best;
    $('final-stars').textContent = '★'.repeat(totalStars) + '☆'.repeat(CFG.levelCount * 3 - totalStars) + ' (' + totalStars + '/' + CFG.levelCount * 3 + ')';
    showOverlay('game-complete-overlay');
  }

  function backToMenu() {
    stopTimer();
    game.state = 'menu';
    renderMenu();
    showOverlay('menu');
  }

  function togglePause() {
    if (game.state === 'playing') {
      stopTimer();
      game.state = 'paused';
      showOverlay('pause-overlay');
    } else if (game.state === 'paused') {
      game.state = 'playing';
      showOverlay(null);
      startTimer();
    }
  }

  function restartLevel() {
    if (game.state === 'playing' || game.state === 'paused' || game.state === 'levelFailed') {
      game.score = game.levelStartScore;
      startLevel(game.levelIndex);
    }
  }

  function toggleMute() {
    game.muted = FL.Audio.setMuted(!game.muted);
    $('btn-mute').textContent = game.muted ? '🔇' : '🔊';
    $('btn-mute').setAttribute('aria-label', game.muted ? 'Nyalakan suara' : 'Bisukan suara');
  }

  function handleEnter() {
    if (game.state === 'menu') {
      startLevel(0);
      FL.Audio.ensure();
      FL.Audio.startPad();
    } else if (game.state === 'levelComplete') {
      nextLevel();
    } else if (game.state === 'levelFailed') {
      startLevel(game.levelIndex);
    } else if (game.state === 'gameComplete') {
      game.score = 0;
      game.stars = [];
      startLevel(0);
    } else if (game.state === 'paused') {
      togglePause();
    }
  }

  function renderMenu() {
    game.best = FL.Save.loadBest();
    game.unlocked = FL.Save.loadUnlocked();
    $('menu-best').textContent = 'Skor terbaik: ' + game.best;
    const select = $('level-select');
    select.innerHTML = '';
    FL.SCENES.forEach(function (sc, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-btn' + (i + 1 <= game.unlocked ? '' : ' locked');
      btn.textContent = (i + 1 <= game.unlocked ? (i + 1) + '. ' : '🔒 ') + sc.name;
      btn.disabled = i + 1 > game.unlocked;
      btn.addEventListener('click', function () {
        game.score = 0;
        game.stars = [];
        startLevel(i);
        FL.Audio.ensure();
        FL.Audio.startPad();
      });
      select.appendChild(btn);
    });
  }

  function init() {
    game.best = FL.Save.loadBest();
    game.unlocked = FL.Save.loadUnlocked();
    renderMenu();
    renderPanels();
    renderHud();
    showOverlay('menu');
    $('btn-start').addEventListener('click', function () {
      game.score = 0;
      game.stars = [];
      startLevel(0);
      FL.Audio.ensure();
      FL.Audio.startPad();
    });
    $('hint-btn').addEventListener('click', useHint);
    $('btn-mute').addEventListener('click', toggleMute);
    $('btn-pause').addEventListener('click', togglePause);
    $('btn-resume').addEventListener('click', togglePause);
    $('btn-restart-level').addEventListener('click', function () {
      restartLevel();
    });
    $('btn-quit-menu').addEventListener('click', backToMenu);
    $('btn-next-level').addEventListener('click', nextLevel);
    $('btn-retry').addEventListener('click', function () {
      startLevel(game.levelIndex);
    });
    $('btn-play-again').addEventListener('click', function () {
      game.score = 0;
      game.stars = [];
      startLevel(0);
    });
    FL.Input.init(api);
  }

  const api = {
    init: init,
    state: function () { return game.state; },
    handlePanelClick: handlePanelClick,
    useHint: useHint,
    togglePause: togglePause,
    restartLevel: restartLevel,
    toggleMute: toggleMute,
    handleEnter: handleEnter,
    startLevel: startLevel,
    freezeTimer: freezeTimer,
    levelComplete: levelComplete,
    backToMenu: backToMenu,
    scene: scene,
    get found() { return game.found; },
    get timeLeft() { return game.timeLeft; },
    set timeLeft(v) { game.timeLeft = v; },
    get score() { return game.score; },
    get levelIndex() { return game.levelIndex; }
  };

  return api;
})();
