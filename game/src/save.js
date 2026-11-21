// Festival Lampion — best score and unlocked levels in localStorage,
// with safe fallbacks when storage is unavailable (private mode, file://).
var FL = window.FL || (window.FL = {});

FL.Save = (function () {
  const BEST_KEY = 'festival-lampion-best';
  const UNLOCK_KEY = 'festival-lampion-unlocked';

  function read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const value = JSON.parse(raw);
      return typeof value === 'number' && isFinite(value) ? value : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadBest() {
    return read(BEST_KEY, 0);
  }

  function saveBest(score) {
    const best = Math.max(loadBest(), score);
    write(BEST_KEY, best);
    return best;
  }

  function loadUnlocked() {
    const n = read(UNLOCK_KEY, 1);
    return Math.min(Math.max(n, 1), FL.CONFIG.levelCount);
  }

  function saveUnlocked(count) {
    const unlocked = Math.min(Math.max(count, 1), FL.CONFIG.levelCount);
    write(UNLOCK_KEY, unlocked);
    return unlocked;
  }

  return {
    loadBest: loadBest,
    saveBest: saveBest,
    loadUnlocked: loadUnlocked,
    saveUnlocked: saveUnlocked
  };
})();
