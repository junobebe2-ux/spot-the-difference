// Festival Lampion — mouse clicks on both panels (hit testing against the
// difference zones) and keyboard shortcuts (H, R, M, Esc/P, Enter).
var FL = window.FL || (window.FL = {});

FL.Input = (function () {
  function init(game) {
    const left = document.getElementById('panel-left');
    const right = document.getElementById('panel-right');

    function onPanelClick(side) {
      return function (event) {
        const svg = side === 'left' ? left : right;
        const p = FL.viewCoords(svg, event.clientX, event.clientY);
        game.handlePanelClick(side, p.x, p.y);
      };
    }
    left.addEventListener('click', onPanelClick('left'));
    right.addEventListener('click', onPanelClick('right'));

    document.addEventListener('keydown', function (event) {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === 'h') {
        game.useHint();
      } else if (key === 'r') {
        game.restartLevel();
      } else if (key === 'm') {
        game.toggleMute();
      } else if (key === 'escape' || key === 'p') {
        game.togglePause();
      } else if (key === 'enter') {
        game.handleEnter();
      }
    });
  }

  return { init: init };
})();
