// Festival Lampion — deterministic screenshots.
// ?shot=start|play|play2|win&seed=1 puts the game into a fixed state with
// no randomness and no running timer, so the same URL renders identically
// every time. See shots.json for the four shot URLs.
var FL = window.FL || (window.FL = {});

FL.Shots = (function () {
  function apply() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return;
    const game = FL.Game;
    if (shot === 'start') {
      game.backToMenu();
      return;
    }
    if (shot === 'play') {
      const ids = FL.SCENES[0].differences.slice(0, 3).map(function (d) { return d.id; });
      game.startLevel(0, { foundIds: ids, timeLeft: 72, freezeTimer: true });
      return;
    }
    if (shot === 'play2') {
      const ids = FL.SCENES[2].differences.slice(0, 5).map(function (d) { return d.id; });
      game.startLevel(2, { foundIds: ids, timeLeft: 54, freezeTimer: true });
      return;
    }
    if (shot === 'win') {
      const ids = FL.SCENES[0].differences.map(function (d) { return d.id; });
      game.startLevel(0, { foundIds: ids, timeLeft: 45, freezeTimer: true });
      game.levelComplete();
      return;
    }
  }

  return { apply: apply };
})();
