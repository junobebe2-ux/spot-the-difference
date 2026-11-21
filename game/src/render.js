// Festival Lampion — builds the two SVG panels from scene data.
// The left panel renders the scene as defined; the right panel renders the
// same scene with the seven differences applied. Found markers, wrong-click
// marks and hint pulses are drawn as overlay groups inside each panel.
var FL = window.FL || (window.FL = {});

FL.drawElement = function drawElement(el) {
  const attrs = [];
  if (el.op !== undefined) attrs.push('opacity="' + el.op + '"');
  if (el.stroke !== undefined) attrs.push('stroke="' + el.stroke + '"');
  if (el.sw !== undefined) attrs.push('stroke-width="' + el.sw + '"');
  const a = attrs.length ? ' ' + attrs.join(' ') : '';
  switch (el.type) {
    case 'circle':
      return '<circle cx="' + el.cx + '" cy="' + el.cy + '" r="' + el.r + '" fill="' + el.fill + '"' + a + '/>';
    case 'ellipse':
      return '<ellipse cx="' + el.cx + '" cy="' + el.cy + '" rx="' + el.rx + '" ry="' + el.ry + '" fill="' + el.fill + '"' + a + '/>';
    case 'rect': {
      const rx = el.rx !== undefined ? ' rx="' + el.rx + '"' : '';
      return '<rect x="' + el.x + '" y="' + el.y + '" width="' + el.w + '" height="' + el.h + '" fill="' + el.fill + '"' + rx + a + '/>';
    }
    case 'polygon':
      return '<polygon points="' + el.points + '" fill="' + el.fill + '"' + a + '/>';
    case 'path':
      return '<path d="' + el.d + '" fill="' + el.fill + '"' + a + '/>';
    case 'text':
      return '<text x="' + el.x + '" y="' + el.y + '" font-size="' + (el.size || 16) + '" fill="' + el.fill + '" text-anchor="' + (el.anchor || 'middle') + '">' + el.text + '</text>';
    case 'group': {
      const t = el.transform ? ' transform="' + el.transform + '"' : '';
      return '<g' + t + a + '>' + el.children.map(drawElement).join('') + '</g>';
    }
    default:
      return '';
  }
};

function cloneElements(list) {
  return JSON.parse(JSON.stringify(list));
}

function findIn(list, id) {
  for (const el of list) {
    if (el.id === id) return el;
    if (el.children) {
      const found = findIn(el.children, id);
      if (found) return found;
    }
  }
  return null;
}

function removeById(list, id) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].id === id) {
      list.splice(i, 1);
      continue;
    }
    if (list[i].children) removeById(list[i].children, id);
  }
}

function replaceById(list, id, replacement) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list[i] = replacement;
      return true;
    }
    if (list[i].children && replaceById(list[i].children, id, replacement)) return true;
  }
  return false;
}

function recolor(el, from, to) {
  if (el.fill === from) el.fill = to;
  if (el.stroke === from) el.stroke = to;
  (el.children || []).forEach(function (child) { recolor(child, from, to); });
}

// Apply one scene's differences to a cloned element list (right panel).
FL.applyDifferences = function applyDifferences(elements, differences) {
  const right = cloneElements(elements);
  for (const diff of differences) {
    if (diff.kind === 'missing') {
      removeById(right, diff.target);
    } else if (diff.kind === 'added') {
      right.push(JSON.parse(JSON.stringify(diff.el)));
    } else if (diff.kind === 'color') {
      const target = findIn(right, diff.target);
      if (target) recolor(target, diff.from, diff.to);
    } else if (diff.kind === 'move') {
      const target = findIn(right, diff.target);
      if (target) {
        replaceById(right, diff.target, {
          type: 'group',
          transform: 'translate(' + diff.dx + ' ' + diff.dy + ')',
          children: [target]
        });
      }
    } else if (diff.kind === 'flip') {
      const target = findIn(right, diff.target);
      if (target) {
        replaceById(right, diff.target, {
          type: 'group',
          transform: 'translate(' + 2 * diff.fx + ' 0) scale(-1 1)',
          children: [target]
        });
      }
    } else if (diff.kind === 'count') {
      const target = findIn(right, diff.target);
      if (target && target.children) target.children = target.children.slice(0, diff.keep);
    } else if (diff.kind === 'shape') {
      const target = findIn(right, diff.target);
      if (target && target.alt) replaceById(right, diff.target, JSON.parse(JSON.stringify(target.alt)));
    }
  }
  return right;
};

// Render one panel's SVG content: the scene elements plus green circles
// around every difference already found, plus any transient marks.
FL.panelSvg = function panelSvg(scene, side, foundIds, marks) {
  const elements = side === 'right'
    ? FL.applyDifferences(scene.elements, scene.differences)
    : scene.elements;
  let svg = elements.map(FL.drawElement).join('');
  for (const diff of scene.differences) {
    if (foundIds.has(diff.id)) {
      svg += '<circle class="found-ring" cx="' + diff.x + '" cy="' + diff.y + '" r="' + diff.r + '"/>';
      svg += '<circle class="found-dot" cx="' + diff.x + '" cy="' + diff.y + '" r="5"/>';
    }
  }
  for (const mark of marks || []) {
    if (mark.side !== side) continue;
    if (mark.kind === 'wrong') {
      const s = 10;
      svg += '<g class="wrong-mark" stroke="#ff5a5a" stroke-width="4" stroke-linecap="round">' +
        '<line x1="' + (mark.x - s) + '" y1="' + (mark.y - s) + '" x2="' + (mark.x + s) + '" y2="' + (mark.y + s) + '"/>' +
        '<line x1="' + (mark.x + s) + '" y1="' + (mark.y - s) + '" x2="' + (mark.x - s) + '" y2="' + (mark.y + s) + '"/>' +
        '</g>';
    } else if (mark.kind === 'hint') {
      svg += '<circle class="hint-ring" cx="' + mark.x + '" cy="' + mark.y + '" r="' + mark.r + '"/>';
    }
  }
  return svg;
};

// Convert a mouse click on a panel into viewBox coordinates.
FL.viewCoords = function viewCoords(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const scaleX = FL.CONFIG.viewWidth / rect.width;
  const scaleY = FL.CONFIG.viewHeight / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
};
