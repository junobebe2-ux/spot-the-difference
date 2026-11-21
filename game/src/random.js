// Festival Lampion — a small deterministic seeded random generator
// (mulberry32 style, written from scratch). Scene layouts that need a
// sprinkle of dots (stars, fireflies, bubbles) use it with a fixed seed,
// so the same scene renders identically on every load and in every shot.
var FL = window.FL || (window.FL = {});

FL.mulberry32 = function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

FL.seededScatter = function seededScatter(seed, count, x0, y0, x1, y1) {
  const rand = FL.mulberry32(seed);
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.round(x0 + rand() * (x1 - x0)),
      y: Math.round(y0 + rand() * (y1 - y0)),
      r: 1 + Math.floor(rand() * 3)
    });
  }
  return points;
};
