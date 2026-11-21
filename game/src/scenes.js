// Festival Lampion — the six scenes as data.
// Each scene is a list of drawable elements plus seven differences.
// render.js turns this data into two SVG panels; the right panel is the
// same scene with the seven differences applied. Positions are in the
// 640x540 viewBox. Every difference has a hit zone (x, y, r).
var FL = window.FL || (window.FL = {});

// ---- tiny element builders (plain data, no DOM here) ----
function C(cx, cy, r, fill, ex) {
  return Object.assign({ type: 'circle', cx: cx, cy: cy, r: r, fill: fill }, ex || {});
}
function E(cx, cy, rx, ry, fill, ex) {
  return Object.assign({ type: 'ellipse', cx: cx, cy: cy, rx: rx, ry: ry, fill: fill }, ex || {});
}
function R(x, y, w, h, fill, ex) {
  return Object.assign({ type: 'rect', x: x, y: y, w: w, h: h, fill: fill }, ex || {});
}
function PG(points, fill, ex) {
  return Object.assign({ type: 'polygon', points: points, fill: fill }, ex || {});
}
function PA(d, fill, stroke, sw, ex) {
  return Object.assign({ type: 'path', d: d, fill: fill, stroke: stroke, sw: sw }, ex || {});
}
function G(children, ex) {
  return Object.assign({ type: 'group', children: children }, ex || {});
}
function starPoints(cx, cy, ro, ri) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? ro : ri;
    pts.push((cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1));
  }
  return pts.join(' ');
}

// ---- motif builders (return group elements) ----
function lantern(x, y, s, body, id) {
  return G([
    PA('M ' + x + ' ' + (y - 26) + ' L ' + x + ' ' + y, 'none', '#8a7bb8', 2),
    R(x - 8 * s, y, 16 * s, 6 * s, '#8a6d2f'),
    E(x, y + 16 * s, 14 * s, 16 * s, body),
    R(x - 6 * s, y + 30 * s, 12 * s, 4 * s, '#8a6d2f'),
    PA('M ' + x + ' ' + (y + 34 * s) + ' L ' + (x - 4 * s) + ' ' + (y + 44 * s) +
       ' M ' + x + ' ' + (y + 34 * s) + ' L ' + x + ' ' + (y + 46 * s) +
       ' M ' + x + ' ' + (y + 34 * s) + ' L ' + (x + 4 * s) + ' ' + (y + 44 * s),
       'none', '#f5b942', 1.5)
  ], { id: id });
}

function fish(x, y, s, color, flip, id) {
  const tail = flip
    ? 'M ' + (x - 14 * s) + ' ' + y + ' L ' + (x - 27 * s) + ' ' + (y - 8 * s) + ' L ' + (x - 27 * s) + ' ' + (y + 8 * s) + ' Z'
    : 'M ' + (x + 14 * s) + ' ' + y + ' L ' + (x + 27 * s) + ' ' + (y - 8 * s) + ' L ' + (x + 27 * s) + ' ' + (y + 8 * s) + ' Z';
  const eyeX = flip ? x - 8 * s : x + 8 * s;
  return G([
    E(x, y, 16 * s, 9 * s, color),
    PG(tail, color),
    C(eyeX, y - 2 * s, 2 * s, '#10202e')
  ], { id: id });
}

function flower(x, y, s, petal, center, id) {
  const petals = [];
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    petals.push(C(x + Math.cos(a) * 9 * s, y + Math.sin(a) * 9 * s, 6 * s, petal));
  }
  return G([
    PA('M ' + x + ' ' + (y + 6 * s) + ' L ' + x + ' ' + (y + 36 * s), 'none', '#2f7a3d', 2.5),
    E(x + 8 * s, y + 24 * s, 8 * s, 4 * s, '#2f7a3d')
  ].concat(petals).concat([C(x, y, 6 * s, center)]), { id: id });
}

function mushroom(x, y, s, cap, id) {
  return G([
    R(x - 5 * s, y, 10 * s, 16 * s, '#f3ead8'),
    PA('M ' + (x - 14 * s) + ' ' + y + ' A ' + 14 * s + ' ' + 12 * s + ' 0 0 1 ' + (x + 14 * s) + ' ' + y + ' Z', cap),
    C(x - 6 * s, y - 6 * s, 2 * s, '#fff'),
    C(x + 5 * s, y - 8 * s, 2.5 * s, '#fff')
  ], { id: id });
}

function butterfly(x, y, s, wing, id) {
  return G([
    E(x - 8 * s, y - 4 * s, 9 * s, 6 * s, wing),
    E(x + 8 * s, y - 4 * s, 9 * s, 6 * s, wing),
    E(x - 8 * s, y + 5 * s, 7 * s, 5 * s, wing, { op: 0.8 }),
    E(x + 8 * s, y + 5 * s, 7 * s, 5 * s, wing, { op: 0.8 }),
    E(x, y, 2.5 * s, 8 * s, '#2b2b3a'),
    PA('M ' + x + ' ' + (y - 8 * s) + ' Q ' + (x - 4 * s) + ' ' + (y - 14 * s) + ' ' + (x - 6 * s) + ' ' + (y - 16 * s), 'none', '#2b2b3a', 1.2)
  ], { id: id });
}

function coral(x, y, s, color, id) {
  return G([
    PA('M ' + x + ' ' + y + ' C ' + (x - 14 * s) + ' ' + (y - 20 * s) + ' ' + (x - 18 * s) + ' ' + (y - 40 * s) + ' ' + (x - 8 * s) + ' ' + (y - 56 * s), 'none', color, 5 * s),
    PA('M ' + x + ' ' + y + ' C ' + (x + 2 * s) + ' ' + (y - 24 * s) + ' ' + (x + 16 * s) + ' ' + (y - 34 * s) + ' ' + (x + 10 * s) + ' ' + (y - 52 * s), 'none', color, 5 * s),
    PA('M ' + x + ' ' + y + ' C ' + (x - 2 * s) + ' ' + (y - 30 * s) + ' ' + (x - 4 * s) + ' ' + (y - 50 * s) + ' ' + x + ' ' + (y - 66 * s), 'none', color, 4 * s)
  ], { id: id });
}

function snail(x, y, s, id) {
  return G([
    E(x, y + 6 * s, 16 * s, 7 * s, '#c9a06a'),
    C(x - 14 * s, y + 2 * s, 10 * s, '#b5651d'),
    C(x - 14 * s, y + 2 * s, 5 * s, '#8a4a12'),
    PA('M ' + (x + 14 * s) + ' ' + (y + 4 * s) + ' L ' + (x + 18 * s) + ' ' + (y - 6 * s), 'none', '#c9a06a', 2),
    C(x + 18 * s, y - 7 * s, 1.8 * s, '#2b2b3a')
  ], { id: id });
}

function turtle(x, y, s, id) {
  return G([
    E(x, y, 26 * s, 18 * s, '#3d8a4f'),
    E(x, y, 18 * s, 12 * s, '#6fbf6a'),
    C(x + 28 * s, y - 4 * s, 7 * s, '#6fbf6a'),
    E(x - 20 * s, y + 14 * s, 10 * s, 5 * s, '#6fbf6a'),
    E(x + 20 * s, y + 14 * s, 10 * s, 5 * s, '#6fbf6a'),
    E(x - 20 * s, y - 14 * s, 10 * s, 5 * s, '#6fbf6a'),
    E(x + 20 * s, y - 14 * s, 10 * s, 5 * s, '#6fbf6a')
  ], { id: id });
}

function astronaut(x, y, s, id) {
  return G([
    C(x, y - 26 * s, 14 * s, '#f3ead8'),
    C(x, y - 26 * s, 9 * s, '#7fb3d5'),
    R(x - 12 * s, y - 10 * s, 24 * s, 26 * s, '#e8e8f0'),
    R(x - 22 * s, y - 8 * s, 9 * s, 20 * s, '#d5d5e0'),
    R(x + 13 * s, y - 8 * s, 9 * s, 20 * s, '#d5d5e0'),
    R(x - 11 * s, y + 16 * s, 9 * s, 18 * s, '#c9c9d8'),
    R(x + 2 * s, y + 16 * s, 9 * s, 18 * s, '#c9c9d8')
  ], { id: id });
}

function robotArm(x, y, s, id) {
  return G([
    R(x, y, 60 * s, 10 * s, '#c0c6d4'),
    R(x + 52 * s, y - 8 * s, 10 * s, 26 * s, '#9aa3b2'),
    R(x + 52 * s, y - 14 * s, 34 * s, 8 * s, '#c0c6d4'),
    PG((x + 86 * s) + ' ' + (y - 14 * s) + ' ' + (x + 98 * s) + ' ' + (y - 6 * s) + ' ' + (x + 86 * s) + ' ' + (y + 2 * s), '#e5484d')
  ], { id: id });
}

function porthole(x, y, r, id) {
  return G([
    C(x, y, r, '#c0c6d4'),
    C(x, y, r - 4, '#1a2a4a'),
    C(x - 3, y - 3, 3, '#7fb3d5')
  ], { id: id });
}

function book(x, y, w, h, color, id) {
  return R(x, y, w, h, color, { id: id, stroke: '#00000033', sw: 1 });
}

function seagull(x, y, s, id) {
  return G([
    PA('M ' + (x - 10 * s) + ' ' + y + ' Q ' + (x - 5 * s) + ' ' + (y - 7 * s) + ' ' + x + ' ' + y + ' Q ' + (x + 5 * s) + ' ' + (y - 7 * s) + ' ' + (x + 10 * s) + ' ' + y, 'none', '#2b2b3a', 2)
  ], { id: id });
}

function kite(x, y, s, body, id) {
  return G([
    PG(x + ' ' + (y - 16 * s) + ' ' + (x + 12 * s) + ' ' + y + ' ' + x + ' ' + (y + 16 * s) + ' ' + (x - 12 * s) + ' ' + y, body),
    PA('M ' + x + ' ' + (y + 16 * s) + ' L ' + (x - 4 * s) + ' ' + (y + 30 * s) + ' L ' + (x + 3 * s) + ' ' + (y + 42 * s), 'none', '#f3ead8', 1.5),
    C(x - 4 * s, y + 30 * s, 2.5 * s, '#f5b942'),
    C(x + 3 * s, y + 42 * s, 2.5 * s, '#e5484d')
  ], { id: id });
}

function umbrella(x, y, s, canopy, id) {
  return G([
    PA('M ' + x + ' ' + y + ' L ' + x + ' ' + (y + 46 * s), 'none', '#8a6d2f', 3),
    PA('M ' + (x - 34 * s) + ' ' + (y + 6 * s) + ' Q ' + x + ' ' + (y - 22 * s) + ' ' + (x + 34 * s) + ' ' + (y + 6 * s) + ' Z', canopy),
    PA('M ' + (x - 17 * s) + ' ' + (y + 3 * s) + ' Q ' + (x - 8 * s) + ' ' + (y - 12 * s) + ' ' + x + ' ' + (y + 4 * s), 'none', '#f3ead8', 2),
    PA('M ' + (x + 17 * s) + ' ' + (y + 3 * s) + ' Q ' + (x + 8 * s) + ' ' + (y - 12 * s) + ' ' + x + ' ' + (y + 4 * s), 'none', '#f3ead8', 2)
  ], { id: id });
}

function palm(x, y, s, id) {
  return G([
    PA('M ' + x + ' ' + y + ' Q ' + (x + 8 * s) + ' ' + (y - 40 * s) + ' ' + (x + 2 * s) + ' ' + (y - 80 * s), 'none', '#8a5a2b', 6 * s),
    PA('M ' + (x + 2 * s) + ' ' + (y - 80 * s) + ' Q ' + (x - 28 * s) + ' ' + (y - 100 * s) + ' ' + (x - 54 * s) + ' ' + (y - 84 * s), 'none', '#2f7a3d', 5 * s),
    PA('M ' + (x + 2 * s) + ' ' + (y - 80 * s) + ' Q ' + (x + 30 * s) + ' ' + (y - 102 * s) + ' ' + (x + 56 * s) + ' ' + (y - 86 * s), 'none', '#3d8a4f', 5 * s),
    PA('M ' + (x + 2 * s) + ' ' + (y - 80 * s) + ' Q ' + (x - 8 * s) + ' ' + (y - 108 * s) + ' ' + (x - 26 * s) + ' ' + (y - 118 * s), 'none', '#3d8a4f', 5 * s),
    PA('M ' + (x + 2 * s) + ' ' + (y - 80 * s) + ' Q ' + (x + 14 * s) + ' ' + (y - 110 * s) + ' ' + (x + 30 * s) + ' ' + (y - 118 * s), 'none', '#2f7a3d', 5 * s),
    C(x - 4 * s, y - 76 * s, 4 * s, '#6b4a2f'),
    C(x + 8 * s, y - 74 * s, 4 * s, '#6b4a2f')
  ], { id: id });
}

function boat(x, y, s, id) {
  return G([
    PA('M ' + (x - 26 * s) + ' ' + y + ' L ' + (x + 26 * s) + ' ' + y + ' L ' + (x + 18 * s) + ' ' + (y + 12 * s) + ' L ' + (x - 18 * s) + ' ' + (y + 12 * s) + ' Z', '#8a5a2b'),
    PA('M ' + x + ' ' + y + ' L ' + x + ' ' + (y - 44 * s), 'none', '#6b4220', 3),
    PG(x + ' ' + (y - 42 * s) + ' ' + (x + 22 * s) + ' ' + (y - 6 * s) + ' ' + x + ' ' + (y - 6 * s), '#f3ead8'),
    PG(x + ' ' + (y - 40 * s) + ' ' + (x - 14 * s) + ' ' + (y - 8 * s) + ' ' + x + ' ' + (y - 8 * s), '#e5484d')
  ], { id: id });
}

function crab(x, y, s, id) {
  return G([
    E(x, y, 14 * s, 9 * s, '#e5484d'),
    C(x - 6 * s, y - 10 * s, 2.5 * s, '#2b2b3a'),
    C(x + 6 * s, y - 10 * s, 2.5 * s, '#2b2b3a'),
    PA('M ' + (x - 10 * s) + ' ' + (y - 8 * s) + ' L ' + (x - 18 * s) + ' ' + (y - 14 * s), 'none', '#e5484d', 3),
    PA('M ' + (x + 10 * s) + ' ' + (y - 8 * s) + ' L ' + (x + 18 * s) + ' ' + (y - 14 * s), 'none', '#e5484d', 3),
    C(x - 19 * s, y - 15 * s, 3.5 * s, '#e5484d'),
    C(x + 19 * s, y - 15 * s, 3.5 * s, '#e5484d'),
    PA('M ' + (x - 14 * s) + ' ' + (y + 4 * s) + ' L ' + (x - 22 * s) + ' ' + (y + 8 * s), 'none', '#e5484d', 2),
    PA('M ' + (x + 14 * s) + ' ' + (y + 4 * s) + ' L ' + (x + 22 * s) + ' ' + (y + 8 * s), 'none', '#e5484d', 2)
  ], { id: id });
}

function sandcastle(x, y, s, id) {
  return G([
    R(x - 26 * s, y, 52 * s, 26 * s, '#e8c88a'),
    R(x - 18 * s, y - 14 * s, 14 * s, 14 * s, '#e8c88a'),
    R(x + 4 * s, y - 14 * s, 14 * s, 14 * s, '#e8c88a'),
    R(x - 4 * s, y - 30 * s, 10 * s, 16 * s, '#e8c88a'),
    PA('M ' + (x + 1 * s) + ' ' + (y - 30 * s) + ' L ' + (x + 1 * s) + ' ' + (y - 46 * s), 'none', '#8a6d2f', 2),
    PG((x + 1 * s) + ' ' + (y - 46 * s) + ' ' + (x + 18 * s) + ' ' + (y - 41 * s) + ' ' + (x + 1 * s) + ' ' + (y - 36 * s), '#e5484d'),
    C(x - 12 * s, y + 12 * s, 2 * s, '#d9b06a'),
    C(x + 12 * s, y + 12 * s, 2 * s, '#d9b06a')
  ], { id: id });
}

function bucket(x, y, s, color, id) {
  return G([
    PA('M ' + (x - 14 * s) + ' ' + y + ' L ' + (x + 14 * s) + ' ' + y + ' L ' + (x + 10 * s) + ' ' + (y + 22 * s) + ' L ' + (x - 10 * s) + ' ' + (y + 22 * s) + ' Z', color),
    PA('M ' + (x - 14 * s) + ' ' + y + ' Q ' + x + ' ' + (y - 16 * s) + ' ' + (x + 14 * s) + ' ' + y, 'none', '#8a6d2f', 2.5)
  ], { id: id });
}

function beachBall(x, y, s, id) {
  return G([
    C(x, y, 16 * s, '#f3ead8'),
    PA('M ' + x + ' ' + y + ' L ' + (x - 14 * s) + ' ' + (y - 8 * s) + ' A ' + 16 * s + ' ' + 16 * s + ' 0 0 1 ' + (x + 2 * s) + ' ' + (y - 16 * s) + ' Z', '#e5484d'),
    PA('M ' + x + ' ' + y + ' L ' + (x + 14 * s) + ' ' + (y - 4 * s) + ' A ' + 16 * s + ' ' + 16 * s + ' 0 0 1 ' + (x + 4 * s) + ' ' + (y + 15 * s) + ' Z', '#3f7fd0')
  ], { id: id });
}

// ---- scene builders ----
function buildMarket() {
  const elements = [];
  elements.push(R(0, 0, 640, 540, '#171238'));
  FL.seededScatter(11, 36, 10, 10, 630, 170).forEach(function (p) {
    elements.push(C(p.x, p.y, p.r, p.r > 2 ? '#f5b942' : '#f3ead8', { op: 0.9 }));
  });
  elements.push(C(560, 64, 32, '#f7e8b0'));
  elements.push(C(548, 56, 6, '#e0cd8e'));
  elements.push(C(570, 74, 4, '#e0cd8e'));
  // fireworks over the market
  const fw = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    fw.push(PA('M 130 90 L ' + (130 + Math.cos(a) * 30).toFixed(1) + ' ' + (90 + Math.sin(a) * 30).toFixed(1), 'none', '#f5b942', 2));
    fw.push(C(130 + Math.cos(a) * 38, 90 + Math.sin(a) * 38, 2.5, '#ffd97a'));
  }
  fw.push(C(130, 90, 4, '#ffd97a'));
  elements.push(G(fw));
  // string lights along a sagging wire
  elements.push(PA('M 0 150 Q 320 205 640 140', 'none', '#6b5a9e', 2));
  const bulbColors = ['#e5484d', '#f5b942', '#3fce7c', '#e5484d', '#f5b942', '#3fce7c'];
  const bulbChildren = [];
  for (let i = 0; i < 6; i++) {
    const t = 0.08 + i * 0.168;
    const bx = Math.round(2 * (1 - t) * t * 320 + t * t * 640);
    const by = Math.round((1 - t) * (1 - t) * 150 + 2 * (1 - t) * t * 205 + t * t * 140);
    bulbChildren.push(C(bx, by + 8, 6, bulbColors[i], { id: 'bulb' + (i + 1) }));
  }
  elements.push(G(bulbChildren, { id: 'bulbs' }));
  // left stall
  elements.push(R(40, 240, 190, 26, '#c0392b'));
  elements.push(R(70, 240, 24, 26, '#f3ead8'));
  elements.push(R(130, 240, 24, 26, '#f3ead8'));
  elements.push(R(190, 240, 24, 26, '#f3ead8'));
  elements.push(R(40, 266, 190, 64, '#7a4a21'));
  elements.push(C(70, 258, 8, '#ff9f43'));
  elements.push(C(100, 260, 7, '#3fce7c'));
  elements.push(C(130, 258, 8, '#e5484d'));
  elements.push(C(160, 260, 7, '#f5b942'));
  elements.push(C(195, 258, 8, '#ff7fa5'));
  // right stall
  elements.push(R(420, 240, 180, 26, '#2e7d4f'));
  elements.push(R(450, 240, 22, 26, '#f3ead8'));
  elements.push(R(510, 240, 22, 26, '#f3ead8'));
  elements.push(R(420, 266, 180, 64, '#8a5a2b'));
  elements.push(C(450, 258, 8, '#f5b942'));
  elements.push(C(490, 260, 7, '#ff9f43'));
  elements.push(C(530, 258, 8, '#3fce7c'));
  elements.push(C(570, 260, 7, '#e5484d'));
  // hanging lanterns
  elements.push(lantern(300, 110, 1, '#e5484d', 'lanternA'));
  elements.push(lantern(360, 140, 0.9, '#f5b942', 'lanternB'));
  elements.push(lantern(250, 150, 0.85, '#ff7fa5', 'lanternC'));
  elements.push(G([
    PA('M 470 94 L 470 120', 'none', '#8a7bb8', 2),
    R(462, 120, 16, 6, '#8a6d2f'),
    E(470, 136, 14, 16, '#e5484d'),
    R(464, 150, 12, 4, '#8a6d2f')
  ], {
    id: 'lanternShape',
    alt: G([
      PA('M 470 94 L 470 120', 'none', '#8a7bb8', 2),
      R(462, 120, 16, 6, '#8a6d2f'),
      R(456, 122, 28, 30, '#e5484d'),
      R(464, 150, 12, 4, '#8a6d2f')
    ])
  }));
  // food cart with a little flag
  elements.push(G([
    PA('M 300 360 L 300 332', 'none', '#8a6d2f', 2),
    PG('300 332 322 338 300 344', '#f5b942')
  ], { id: 'flag1' }));
  elements.push(PA('M 260 380 L 340 380 L 330 360 L 270 360 Z', '#e5484d'));
  elements.push(R(265, 380, 70, 44, '#8a5a2b'));
  elements.push(C(285, 372, 7, '#c0c6d4'));
  elements.push(C(310, 372, 7, '#c0c6d4'));
  elements.push(C(280, 428, 9, '#2b2b3a'));
  elements.push(C(320, 428, 9, '#2b2b3a'));
  // ground and the cat on its crate
  elements.push(R(0, 420, 640, 120, '#241a3d'));
  elements.push(E(120, 470, 26, 8, '#31254f'));
  elements.push(E(420, 500, 30, 9, '#31254f'));
  elements.push(R(480, 420, 140, 52, '#8a6d3f'));
  elements.push(R(480, 442, 140, 4, '#6b4f2c'));
  elements.push(G([
    E(545, 408, 22, 12, '#2b2b3a'),
    C(560, 398, 10, '#2b2b3a'),
    PG('553 391 556 380 561 390', '#2b2b3a'),
    PG('563 391 566 380 569 390', '#2b2b3a'),
    PA('M 524 410 Q 512 398 518 388', 'none', '#2b2b3a', 3)
  ], { id: 'cat1' }));
  // ---- enrichment: denser night-market sky, stalls and ground ----
  // extra stars in the sky (kept clear of the added-star zone at 480,60)
  [[200, 50, 2], [240, 80, 1.5], [340, 40, 2], [420, 100, 2], [520, 130, 1.5], [600, 40, 2], [30, 120, 2], [380, 60, 1.5]].forEach(function (s) {
    elements.push(C(s[0], s[1], s[2], '#f3ead8', { op: 0.9 }));
  });
  // a second, smaller firework burst
  const fw2 = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    fw2.push(PA('M 60 60 L ' + (60 + Math.cos(a) * 18).toFixed(1) + ' ' + (60 + Math.sin(a) * 18).toFixed(1), 'none', '#ff7fa5', 1.5));
    fw2.push(C(60 + Math.cos(a) * 23, 60 + Math.sin(a) * 23, 2, '#ffd97a'));
  }
  fw2.push(C(60, 60, 3, '#ffd97a'));
  elements.push(G(fw2));
  // a second string of lights, lower and smaller, on its own wire
  elements.push(PA('M 0 205 Q 320 245 640 195', 'none', '#6b5a9e', 2));
  [[128, 225], [256, 231], [384, 229], [512, 219]].forEach(function (b, i) {
    elements.push(C(b[0], b[1], 5, ['#3fce7c', '#f5b942', '#e5484d', '#3fce7c'][i]));
  });
  // more goods on the stall counters
  [[85, 258, 6, '#3fce7c'], [115, 260, 6, '#f5b942'], [145, 258, 6, '#ff7fa5'], [175, 260, 6, '#ff9f43'], [210, 258, 6, '#3fce7c'],
   [465, 258, 6, '#ff7fa5'], [505, 260, 6, '#f5b942'], [545, 258, 6, '#ff9f43'], [585, 260, 6, '#3fce7c']].forEach(function (g) {
    elements.push(C(g[0], g[1], g[2], g[3]));
  });
  // crates, a sack and a small ground lantern
  elements.push(R(60, 470, 40, 30, '#6b4a2f'));
  elements.push(R(60, 470, 40, 4, '#8a6d3f'));
  elements.push(E(300, 500, 20, 10, '#c9a06a'));
  elements.push(E(610, 495, 10, 12, '#e5484d'));
  const bulb6 = bulbChildren[5];
  return {
    id: 'market',
    name: 'Pasar Malam Lampion',
    sub: 'Level 1 · Pasar malam',
    bg: '#171238',
    elements: elements,
    differences: [
      { id: 'd1', kind: 'missing', target: 'lanternA', x: 300, y: 126, r: 30 },
      { id: 'd2', kind: 'color', target: 'lanternB', from: '#f5b942', to: '#e5484d', x: 360, y: 156, r: 30 },
      { id: 'd3', kind: 'added', el: PG(starPoints(480, 60, 12, 5), '#ffe066'), x: 480, y: 60, r: 28 },
      { id: 'd4', kind: 'move', target: 'cat1', dx: -55, dy: 0, x: 545, y: 408, r: 32 },
      { id: 'd5', kind: 'count', target: 'bulbs', keep: 5, x: bulb6.cx, y: bulb6.cy, r: 30 },
      { id: 'd6', kind: 'flip', target: 'flag1', fx: 300, x: 310, y: 340, r: 30 },
      { id: 'd7', kind: 'shape', target: 'lanternShape', x: 470, y: 136, r: 32 }
    ]
  };
}

function buildReef() {
  const elements = [];
  elements.push(R(0, 0, 640, 540, '#0e4d6e'));
  elements.push(R(0, 0, 640, 300, '#14608a'));
  elements.push(PG('120 0 200 0 120 300 60 300', '#ffffff', { op: 0.06 }));
  elements.push(PG('320 0 380 0 340 300 280 300', '#ffffff', { op: 0.06 }));
  elements.push(PG('560 0 620 0 540 260 500 260', '#ffffff', { op: 0.08 }));
  elements.push(PA('M 0 440 Q 320 420 640 445 L 640 540 L 0 540 Z', '#d9c08a'));
  elements.push(E(90, 470, 50, 20, '#8a8a8a'));
  elements.push(E(560, 480, 60, 22, '#7a7a7a'));
  elements.push(C(320, 470, 18, '#9a9a9a', {
    id: 'rockShape',
    alt: R(302, 452, 36, 36, '#9a9a9a')
  }));
  elements.push(coral(90, 440, 1, '#ff7fa5', 'coral1'));
  elements.push(coral(180, 445, 0.8, '#ff9f43', 'coral2'));
  elements.push(coral(540, 440, 1.1, '#b388ff', 'coral3'));
  elements.push(PA('M 40 540 C 30 500 50 480 40 450', 'none', '#2f7a3d', 4));
  elements.push(PA('M 600 540 C 610 505 590 485 600 455', 'none', '#2f7a3d', 4));
  elements.push(PA('M 250 540 C 240 510 260 495 250 470', 'none', '#3d8a4f', 4));
  elements.push(fish(220, 180, 1, '#ff9f43', false, 'fish1'));
  elements.push(fish(350, 120, 0.9, '#3f7fd0', true, 'fish2'));
  elements.push(fish(480, 220, 1.1, '#ffd23f', false, 'fish3'));
  elements.push(fish(160, 300, 0.85, '#ff7fa5', false, 'fish4'));
  elements.push(fish(420, 330, 0.8, '#3fce7c', true, 'fish5'));
  elements.push(turtle(430, 300, 1, 'turtle1'));
  elements.push(G([
    C(455, 260, 5, '#ffffff', { id: 'bubble1', op: 0.7 }),
    C(465, 230, 4, '#ffffff', { id: 'bubble2', op: 0.7 }),
    C(450, 200, 6, '#ffffff', { id: 'bubble3', op: 0.7 }),
    C(470, 170, 4, '#ffffff', { id: 'bubble4', op: 0.7 })
  ], { id: 'bubbles' }));
  elements.push(R(90, 440, 60, 30, '#8a5a2b'));
  elements.push(PA('M 90 440 A 30 18 0 0 1 150 440 Z', '#6b4220'));
  elements.push(C(100, 435, 4, '#f5b942'));
  elements.push(C(115, 432, 4, '#f5b942'));
  elements.push(C(130, 435, 4, '#f5b942'));
  elements.push(PG(starPoints(520, 470, 14, 6), '#ff9f43', { id: 'starfish1' }));
  // ---- enrichment: more reef life and depth ----
  // an extra light beam
  elements.push(PG('440 0 480 0 440 280 400 280', '#ffffff', { op: 0.05 }));
  // two more small fish (kept away from the difference fish)
  elements.push(fish(90, 140, 0.8, '#ff7fa5', true, 'fishX1'));
  elements.push(fish(540, 150, 0.85, '#3f7fd0', false, 'fishX2'));
  // a jellyfish drifting near the surface
  elements.push(G([
    C(520, 120, 14, '#ff9f43', { op: 0.8 }),
    PA('M 510 132 Q 512 150 508 162 M 520 134 Q 520 152 522 164 M 530 132 Q 528 150 532 162', 'none', '#ff9f43', 2)
  ], { id: 'jelly1' }));
  // a second bubble trail rising from the sunken chest
  elements.push(G([
    C(120, 420, 4, '#ffffff', { op: 0.6 }),
    C(128, 395, 3, '#ffffff', { op: 0.6 }),
    C(118, 370, 4, '#ffffff', { op: 0.6 })
  ], { id: 'chestBubbles' }));
  // two more corals and seaweed on the sand
  elements.push(coral(310, 445, 0.6, '#ff9f43', 'coralX1'));
  elements.push(coral(420, 445, 0.7, '#3fce7c', 'coralX2'));
  elements.push(PA('M 480 540 C 470 505 490 490 480 460', 'none', '#2f7a3d', 4));
  elements.push(PA('M 150 540 C 160 510 140 495 150 470', 'none', '#3d8a4f', 4));
  // more rocks on the seabed
  elements.push(E(200, 500, 30, 12, '#7a7a7a'));
  elements.push(E(420, 505, 26, 10, '#8a8a8a'));
  return {
    id: 'reef',
    name: 'Terumbu Karang',
    sub: 'Level 2 · Laut dalam',
    bg: '#0e4d6e',
    elements: elements,
    differences: [
      { id: 'd1', kind: 'missing', target: 'fish4', x: 160, y: 300, r: 30 },
      { id: 'd2', kind: 'color', target: 'coral1', from: '#ff7fa5', to: '#b388ff', x: 90, y: 400, r: 34 },
      { id: 'd3', kind: 'added', el: PG(starPoints(300, 490, 12, 5), '#ff9f43'), x: 300, y: 490, r: 28 },
      { id: 'd4', kind: 'move', target: 'turtle1', dx: -60, dy: 20, x: 430, y: 300, r: 34 },
      { id: 'd5', kind: 'count', target: 'bubbles', keep: 3, x: 470, y: 170, r: 28 },
      { id: 'd6', kind: 'flip', target: 'fish2', fx: 350, x: 350, y: 120, r: 30 },
      { id: 'd7', kind: 'shape', target: 'rockShape', x: 320, y: 470, r: 30 }
    ]
  };
}

function buildGarden() {
  const elements = [];
  elements.push(R(0, 0, 640, 540, '#3a5a8a'));
  elements.push(R(0, 380, 640, 160, '#3d7a4a'));
  elements.push(R(60, 220, 26, 160, '#6b4220'));
  elements.push(C(75, 190, 60, '#2f7a3d'));
  elements.push(C(40, 220, 40, '#3d8a4f'));
  elements.push(C(115, 220, 42, '#2f7a3d'));
  elements.push(E(320, 380, 22, 9, '#d9d2c0'));
  elements.push(E(320, 420, 26, 10, '#d9d2c0'));
  elements.push(E(320, 460, 30, 11, '#d9d2c0', {
    id: 'stoneShape',
    alt: R(290, 449, 60, 22, '#d9d2c0')
  }));
  elements.push(E(320, 505, 34, 12, '#d9d2c0'));
  // fountain
  elements.push(E(320, 320, 70, 18, '#8a9ab0'));
  elements.push(R(314, 280, 12, 40, '#c0c6d4'));
  elements.push(C(320, 276, 10, '#c0c6d4'));
  elements.push(PA('M 320 300 Q 300 270 280 290', 'none', '#7fb3d5', 3));
  elements.push(PA('M 320 300 Q 340 270 360 290', 'none', '#7fb3d5', 3));
  elements.push(PA('M 320 296 Q 320 262 320 250', 'none', '#7fb3d5', 3));
  elements.push(flower(150, 400, 1, '#e5484d', '#f5b942', 'flower1'));
  elements.push(flower(480, 410, 0.9, '#ff7fa5', '#ffd23f', 'flower2'));
  elements.push(flower(560, 350, 1, '#e5484d', '#f5b942', 'flower3'));
  elements.push(flower(90, 340, 0.85, '#b388ff', '#ffffff', 'flower4'));
  elements.push(flower(420, 350, 0.9, '#ff9f43', '#ffffff', 'flower5'));
  elements.push(mushroom(200, 430, 1, '#e5484d', 'mush1'));
  elements.push(mushroom(520, 460, 0.8, '#ff9f43', 'mush2'));
  elements.push(butterfly(200, 180, 1, '#ff9f43', 'bfly1'));
  elements.push(butterfly(430, 160, 0.9, '#b388ff', 'bfly2'));
  elements.push(snail(200, 470, 1, 'snail1'));
  // ---- enrichment: more garden life ----
  // three more flowers between the path and the edges
  elements.push(flower(250, 380, 0.9, '#ff7fa5', '#ffd23f', 'flowerX1'));
  elements.push(flower(340, 390, 0.85, '#3f7fd0', '#ffffff', 'flowerX2'));
  elements.push(flower(600, 300, 0.9, '#b388ff', '#ffd23f', 'flowerX3'));
  // one more mushroom and a bush
  elements.push(mushroom(120, 450, 0.85, '#b388ff', 'mushX1'));
  elements.push(G([
    C(40, 470, 22, '#2f7a3d'),
    C(60, 462, 18, '#3d8a4f'),
    C(24, 462, 16, '#3d8a4f')
  ], { id: 'bush1' }));
  // a third butterfly and sparkles in the air
  elements.push(butterfly(330, 120, 0.85, '#ff9f43', 'bflyX1'));
  [[300, 150], [380, 200], [500, 250], [220, 260]].forEach(function (p) {
    elements.push(PG(starPoints(p[0], p[1], 6, 2.5), '#ffe066', { op: 0.8 }));
  });
  // water droplets around the fountain
  elements.push(C(280, 300, 3, '#7fb3d5', { op: 0.8 }));
  elements.push(C(360, 300, 3, '#7fb3d5', { op: 0.8 }));
  elements.push(C(320, 258, 3, '#7fb3d5', { op: 0.8 }));
  // grass tufts
  elements.push(PA('M 120 500 L 126 488 L 132 500 M 126 500 L 132 490 L 138 500', 'none', '#2f7a3d', 2));
  elements.push(PA('M 480 500 L 486 488 L 492 500', 'none', '#2f7a3d', 2));
  elements.push(PA('M 560 500 L 566 490 L 572 500', 'none', '#2f7a3d', 2));
  const fireflyChildren = [];
  FL.seededScatter(33, 6, 60, 60, 580, 300).forEach(function (p, i) {
    fireflyChildren.push(G([
      C(p.x, p.y, 5, '#ffe066', { op: 0.25 }),
      C(p.x, p.y, 2.5, '#ffe066', { op: 0.9 })
    ], { id: 'ff' + (i + 1) }));
  });
  elements.push(G(fireflyChildren, { id: 'fireflies' }));
  const ff6 = fireflyChildren[5].children[1];
  return {
    id: 'garden',
    name: 'Taman Ajaib',
    sub: 'Level 3 · Taman peri',
    bg: '#3a5a8a',
    elements: elements,
    differences: [
      { id: 'd1', kind: 'missing', target: 'bfly1', x: 200, y: 180, r: 30 },
      { id: 'd2', kind: 'color', target: 'flower3', from: '#e5484d', to: '#3f7fd0', x: 560, y: 350, r: 30 },
      { id: 'd3', kind: 'added', el: mushroom(590, 420, 0.9, '#b388ff'), x: 590, y: 420, r: 28 },
      { id: 'd4', kind: 'move', target: 'snail1', dx: 60, dy: 0, x: 200, y: 470, r: 32 },
      { id: 'd5', kind: 'count', target: 'fireflies', keep: 5, x: ff6.cx, y: ff6.cy, r: 28 },
      { id: 'd6', kind: 'flip', target: 'bfly2', fx: 430, x: 430, y: 160, r: 30 },
      { id: 'd7', kind: 'shape', target: 'stoneShape', x: 320, y: 460, r: 30 }
    ]
  };
}

function buildStation() {
  const elements = [];
  elements.push(R(0, 0, 640, 540, '#0a0a18'));
  FL.seededScatter(77, 50, 10, 10, 630, 530).forEach(function (p) {
    elements.push(C(p.x, p.y, p.r, p.r > 2 ? '#f5b942' : '#f3ead8', { op: 0.9 }));
  });
  elements.push(G([
    C(150, 80, 7, '#ffffff', { op: 0.3 }),
    C(150, 80, 3, '#ffffff')
  ], { id: 'starA' }));
  elements.push(C(520, 90, 55, '#c96f4a'));
  elements.push(C(500, 75, 10, '#b05a3a'));
  elements.push(C(540, 105, 7, '#b05a3a'));
  elements.push(E(520, 90, 78, 18, 'none', { stroke: '#e8a87c', sw: 4 }));
  elements.push(R(60, 180, 520, 140, '#9aa3b2'));
  elements.push(R(60, 180, 520, 18, '#7a8296'));
  elements.push(PA('M 180 198 L 180 320', 'none', '#7a8296', 2));
  elements.push(PA('M 300 198 L 300 320', 'none', '#7a8296', 2));
  elements.push(PA('M 420 198 L 420 320', 'none', '#7a8296', 2));
  elements.push(G([
    porthole(120, 250, 16, 'ph1'),
    porthole(200, 250, 16, 'ph2'),
    porthole(280, 250, 16, 'ph3'),
    porthole(360, 250, 16, 'ph4')
  ], { id: 'portholes' }));
  elements.push(G([
    C(500, 250, 24, 'none', { stroke: '#c0c6d4', sw: 3 }),
    C(500, 250, 20, '#1a2a4a')
  ], {
    id: 'winShape',
    alt: G([
      R(472, 222, 56, 56, 'none', { stroke: '#c0c6d4', sw: 3 }),
      R(476, 226, 48, 48, '#1a2a4a')
    ])
  }));
  elements.push(R(440, 290, 120, 26, '#2b2b3a'));
  elements.push(C(455, 303, 5, '#3fce7c', { id: 'btn1' }));
  elements.push(C(475, 303, 5, '#e5484d'));
  elements.push(C(495, 303, 5, '#f5b942'));
  elements.push(PA('M 580 180 L 580 130', 'none', '#c0c6d4', 3));
  elements.push(C(580, 126, 6, '#e5484d'));
  elements.push(astronaut(300, 400, 1, 'astro1'));
  elements.push(PA('M 80 320 C 140 380 200 380 260 340', 'none', '#6b7280', 3));
  elements.push(PA('M 480 320 C 440 400 380 400 340 360', 'none', '#6b7280', 3));
  elements.push(robotArm(120, 430, 1, 'arm1'));
  // ---- enrichment: more space around the station ----
  // extra fixed stars (kept clear of the missing-star zone at 150,80
  // and the added-star zone at 80,80)
  [[50, 50, 2], [250, 40, 1.5], [400, 50, 2], [600, 60, 1.5], [40, 200, 2], [620, 200, 1.5]].forEach(function (s) {
    elements.push(C(s[0], s[1], s[2], s[2] > 1.5 ? '#f3ead8' : '#f5b942', { op: 0.9 }));
  });
  // a small blue planet and a satellite
  elements.push(G([
    C(90, 140, 18, '#7fb3d5'),
    C(84, 134, 4, '#5a8ab0'),
    C(96, 146, 3, '#5a8ab0')
  ], { id: 'planet2' }));
  elements.push(G([
    R(420, 60, 20, 10, '#c0c6d4'),
    R(408, 62, 12, 6, '#3f7fd0'),
    R(440, 62, 12, 6, '#3f7fd0'),
    PA('M 430 70 L 436 84', 'none', '#c0c6d4', 2)
  ], { id: 'sat1' }));
  // two more lights on the control panel strip
  elements.push(C(515, 303, 5, '#3fce7c'));
  elements.push(C(535, 303, 5, '#f5b942'));
  // a low cable across the floor and one short wall cable
  elements.push(PA('M 40 510 Q 320 485 600 510', 'none', '#6b7280', 3));
  elements.push(PA('M 60 340 Q 100 380 90 440', 'none', '#6b7280', 3));
  // floating tools
  elements.push(G([
    R(200, 380, 16, 5, '#c0c6d4'),
    C(218, 382, 3, '#e5484d')
  ], { id: 'tool1' }));
  elements.push(G([
    R(420, 400, 14, 5, '#c0c6d4')
  ], { id: 'tool2' }));
  return {
    id: 'station',
    name: 'Stasiun Luar Angkasa',
    sub: 'Level 4 · Orbit bumi',
    bg: '#0a0a18',
    elements: elements,
    differences: [
      { id: 'd1', kind: 'missing', target: 'starA', x: 150, y: 80, r: 28 },
      { id: 'd2', kind: 'color', target: 'btn1', from: '#3fce7c', to: '#e5484d', x: 455, y: 303, r: 28 },
      { id: 'd3', kind: 'added', el: PG(starPoints(80, 80, 10, 4), '#ffe066'), x: 80, y: 80, r: 28 },
      { id: 'd4', kind: 'move', target: 'astro1', dx: 70, dy: -30, x: 300, y: 400, r: 34 },
      { id: 'd5', kind: 'count', target: 'portholes', keep: 3, x: 360, y: 250, r: 30 },
      { id: 'd6', kind: 'flip', target: 'arm1', fx: 120, x: 165, y: 430, r: 34 },
      { id: 'd7', kind: 'shape', target: 'winShape', x: 500, y: 250, r: 32 }
    ]
  };
}

function buildBookshop() {
  const elements = [];
  elements.push(R(0, 0, 640, 540, '#5b3a4a'));
  elements.push(R(0, 440, 640, 100, '#6b4a2f'));
  // window with the moon
  elements.push(R(420, 60, 160, 150, '#2b2b4a'));
  elements.push(R(428, 68, 144, 134, '#1a1440'));
  elements.push(C(520, 110, 20, '#f7e8b0'));
  elements.push(C(460, 90, 2, '#f3ead8'));
  elements.push(C(545, 160, 2, '#f3ead8'));
  elements.push(C(480, 170, 2, '#f5b942'));
  elements.push(PA('M 500 68 L 500 202 M 428 135 L 572 135', 'none', '#2b2b4a', 6));
  // wall clock
  elements.push(C(330, 90, 22, '#f3ead8'));
  elements.push(PA('M 330 90 L 330 74 M 330 90 L 342 96', 'none', '#2b2b3a', 2));
  // shelves with books
  elements.push(R(40, 120, 260, 10, '#8a5a2b'));
  elements.push(R(40, 220, 260, 10, '#8a5a2b'));
  elements.push(R(40, 320, 260, 10, '#8a5a2b'));
  elements.push(book(50, 86, 18, 34, '#e5484d', 'bookTop'));
  elements.push(book(72, 90, 16, 30, '#3f7fd0'));
  elements.push(book(92, 84, 18, 36, '#3fce7c'));
  elements.push(G([
    book(50, 186, 18, 34, '#f5b942', 'sb1'),
    book(72, 190, 16, 30, '#ff9f43', 'sb2'),
    book(92, 184, 18, 36, '#b388ff', 'sb3'),
    book(114, 188, 16, 32, '#3f7fd0', 'sb4'),
    book(134, 186, 18, 34, '#e5484d', 'sb5')
  ], { id: 'shelfBooks' }));
  elements.push(book(50, 286, 18, 34, '#3fce7c'));
  elements.push(book(72, 290, 16, 30, '#ff7fa5'));
  elements.push(book(92, 284, 18, 36, '#f5b942'));
  // ladder leaning on the shelves
  elements.push(G([
    PA('M 300 430 L 330 120', 'none', '#c9a06a', 4),
    PA('M 316 430 L 346 120', 'none', '#c9a06a', 4),
    PA('M 304 360 L 318 360', 'none', '#c9a06a', 3),
    PA('M 308 290 L 322 290', 'none', '#c9a06a', 3),
    PA('M 312 220 L 326 220', 'none', '#c9a06a', 3),
    PA('M 316 150 L 330 150', 'none', '#c9a06a', 3)
  ], { id: 'ladder1' }));
  // table, teapot and lamp
  elements.push(R(400, 400, 160, 12, '#8a5a2b'));
  elements.push(R(410, 412, 10, 28, '#6b4220'));
  elements.push(R(540, 412, 10, 28, '#6b4220'));
  elements.push(G([
    E(470, 382, 26, 18, '#3f7fd0'),
    PG('446 378 428 368 430 380 446 386', '#3f7fd0'),
    PA('M 494 376 Q 508 382 494 392', 'none', '#3f7fd0', 4),
    C(470, 362, 6, '#3f7fd0')
  ], { id: 'teapot1' }));
  elements.push(C(340, 392, 26, '#f5b942', { op: 0.15 }));
  elements.push(E(340, 428, 16, 5, '#2b2b3a'));
  elements.push(R(337, 390, 6, 38, '#2b2b3a'));
  elements.push(PG('322 390 358 390 350 366 330 366', '#f5b942'));
  // rug and the sleeping cat
  elements.push(E(320, 500, 110, 18, '#a33d3d', {
    id: 'rugShape',
    alt: R(210, 482, 220, 36, '#a33d3d')
  }));
  elements.push(G([
    E(300, 486, 34, 14, '#4a4a5a'),
    C(330, 480, 11, '#4a4a5a'),
    PG('323 472 326 462 330 471', '#4a4a5a'),
    PG('333 472 336 462 339 471', '#4a4a5a'),
    PA('M 268 490 Q 250 480 258 468', 'none', '#4a4a5a', 3)
  ], { id: 'cat2' }));
  // floor stack of books
  elements.push(R(560, 478, 44, 10, '#3f7fd0'));
  elements.push(R(564, 468, 38, 10, '#e5484d'));
  elements.push(R(568, 458, 32, 10, '#3fce7c'));
  // ---- enrichment: more books and bookshop warmth ----
  // more books on the top and bottom shelves
  elements.push(book(114, 88, 16, 32, '#ff7fa5'));
  elements.push(book(134, 86, 18, 34, '#3fce7c'));
  elements.push(book(114, 288, 16, 32, '#b388ff'));
  elements.push(book(134, 286, 18, 34, '#3f7fd0'));
  // a framed picture on the wall between the shelves and the ladder
  elements.push(G([
    R(245, 145, 50, 50, '#2e7d4f'),
    C(270, 168, 13, '#f5b942'),
    PA('M 255 190 L 270 176 L 285 190', 'none', '#f5b942', 2)
  ], { id: 'poster1' }));
  // a small wall shelf with two books
  elements.push(R(340, 220, 90, 8, '#8a5a2b'));
  elements.push(book(350, 194, 14, 26, '#e5484d'));
  elements.push(book(368, 198, 12, 22, '#3fce7c'));
  // a small plant on the reading table
  elements.push(G([
    R(536, 372, 16, 12, '#e5484d'),
    E(544, 362, 10, 8, '#3d8a4f'),
    E(538, 356, 7, 6, '#2f7a3d'),
    E(550, 356, 7, 6, '#3d8a4f')
  ], { id: 'plant1' }));
  // a second stack of books on the floor
  elements.push(R(56, 478, 44, 10, '#ff9f43'));
  elements.push(R(60, 468, 38, 10, '#b388ff'));
  // a hanging lamp from the ceiling
  elements.push(G([
    PA('M 200 0 L 200 44', 'none', '#2b2b3a', 2),
    PG('182 44 218 44 210 68 190 68', '#f5b942')
  ], { id: 'lamp1' }));
  return {
    id: 'bookshop',
    name: 'Toko Buku Senja',
    sub: 'Level 5 · Senja di toko buku',
    bg: '#5b3a4a',
    elements: elements,
    differences: [
      { id: 'd1', kind: 'missing', target: 'bookTop', x: 59, y: 103, r: 28 },
      { id: 'd2', kind: 'color', target: 'teapot1', from: '#3f7fd0', to: '#e5484d', x: 470, y: 382, r: 32 },
      { id: 'd3', kind: 'added', el: R(572, 448, 26, 10, '#f5b942'), x: 585, y: 453, r: 28 },
      { id: 'd4', kind: 'move', target: 'cat2', dx: -60, dy: 0, x: 300, y: 486, r: 34 },
      { id: 'd5', kind: 'count', target: 'shelfBooks', keep: 4, x: 143, y: 203, r: 28 },
      { id: 'd6', kind: 'flip', target: 'ladder1', fx: 323, x: 323, y: 275, r: 34 },
      { id: 'd7', kind: 'shape', target: 'rugShape', x: 320, y: 500, r: 34 }
    ]
  };
}

function buildBeach() {
  const elements = [];
  // sunset sky in warm bands
  elements.push(R(0, 0, 640, 80, '#ff9f43'));
  elements.push(R(0, 80, 640, 80, '#ff7b5e'));
  elements.push(R(0, 160, 640, 70, '#e86a8a'));
  elements.push(R(0, 230, 640, 70, '#8a5a9e'));
  // sun low on the horizon with a soft glow
  elements.push(C(520, 210, 52, '#ffd23f', { op: 0.25 }));
  elements.push(C(520, 210, 38, '#ffd23f'));
  elements.push(C(508, 198, 8, '#ffe98a'));
  // clouds
  elements.push(E(110, 70, 34, 12, '#ffd9c0', { op: 0.85 }));
  elements.push(E(140, 66, 26, 10, '#ffd9c0', { op: 0.85 }));
  elements.push(E(360, 62, 26, 9, '#ffe0cc', { op: 0.8 }));
  elements.push(E(300, 55, 30, 11, '#ffe0cc', { op: 0.8 }));
  // kite (d1 missing)
  elements.push(kite(170, 100, 1, '#3f7fd0', 'kite1'));
  // seagulls (d5 count, keep 3 of 4)
  elements.push(G([
    seagull(330, 90, 1, 'gull1'),
    seagull(370, 110, 0.9, 'gull2'),
    seagull(410, 85, 1, 'gull3'),
    seagull(450, 105, 0.9, 'gull4')
  ], { id: 'seagulls' }));
  // sea with waves and a sun-glitter path
  elements.push(R(0, 300, 640, 120, '#2a6f8e'));
  elements.push(R(0, 300, 640, 10, '#3d8aa8'));
  elements.push(PA('M 480 300 L 560 300 L 600 420 L 440 420 Z', '#ffd23f', 'none', 0, { op: 0.25 }));
  elements.push(PA('M 40 330 Q 90 322 140 330 Q 190 338 240 330', 'none', '#e8f4f8', 2.5));
  elements.push(PA('M 380 345 Q 430 337 480 345 Q 530 353 580 345', 'none', '#e8f4f8', 2.5));
  elements.push(PA('M 120 380 Q 170 372 220 380 Q 270 388 320 380', 'none', '#d9ecf2', 2.5));
  elements.push(PA('M 430 395 Q 480 387 530 395 Q 580 403 620 395', 'none', '#d9ecf2', 2.5));
  // sailboat (d6 flip)
  elements.push(boat(300, 350, 1, 'boat1'));
  // sand
  elements.push(R(0, 420, 640, 120, '#e8c88a'));
  elements.push(E(90, 470, 40, 10, '#d9b06a'));
  elements.push(E(380, 510, 46, 10, '#d9b06a'));
  // footprints
  elements.push(E(240, 450, 5, 3, '#c9a06a'));
  elements.push(E(252, 462, 5, 3, '#c9a06a'));
  elements.push(E(240, 474, 5, 3, '#c9a06a'));
  // palm tree
  elements.push(palm(570, 420, 1, 'palm1'));
  // beach umbrella (d2 color)
  elements.push(umbrella(140, 390, 1, '#e5484d', 'umbrella1'));
  // sandcastle
  elements.push(sandcastle(320, 460, 1, 'castle1'));
  // bucket and beach ball
  elements.push(bucket(440, 470, 1, '#3fce7c', 'bucket1'));
  elements.push(beachBall(230, 470, 1, 'ball1'));
  // crab (d4 move)
  elements.push(crab(500, 505, 1, 'crab1'));
  // shell (d7 shape)
  elements.push(C(90, 500, 12, '#f5b942', {
    id: 'shellShape',
    alt: R(78, 488, 24, 24, '#f5b942')
  }));
  elements.push(PA('M 82 500 L 98 500 M 86 494 L 94 506', 'none', '#c9a06a', 1.5));
  return {
    id: 'beach',
    name: 'Pantai Senja',
    sub: 'Level 6 · Senja di pantai',
    bg: '#ff7b5e',
    elements: elements,
    differences: [
      { id: 'd1', kind: 'missing', target: 'kite1', x: 170, y: 100, r: 30 },
      { id: 'd2', kind: 'color', target: 'umbrella1', from: '#e5484d', to: '#3f7fd0', x: 140, y: 390, r: 32 },
      { id: 'd3', kind: 'added', el: PG(starPoints(170, 505, 12, 5), '#ff9f43'), x: 170, y: 505, r: 28 },
      { id: 'd4', kind: 'move', target: 'crab1', dx: 60, dy: 0, x: 500, y: 505, r: 32 },
      { id: 'd5', kind: 'count', target: 'seagulls', keep: 3, x: 450, y: 105, r: 28 },
      { id: 'd6', kind: 'flip', target: 'boat1', fx: 300, x: 300, y: 350, r: 34 },
      { id: 'd7', kind: 'shape', target: 'shellShape', x: 90, y: 500, r: 30 }
    ]
  };
}

FL.SCENES = [buildMarket(), buildReef(), buildGarden(), buildStation(), buildBookshop(), buildBeach()];
