// Festival Lampion — bootstrap: wire everything together, start the menu,
// then apply any deterministic shot state from the URL.
(function () {
  function boot() {
    FL.Game.init();
    FL.Shots.apply();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
