const key = (r, c) => r + ',' + c;

function canPlace(cells, word, r, c, dr, dc) {
  const before = cells.get(key(r - dr, c - dc));
  const after = cells.get(key(r + dr * word.length, c + dc * word.length));
  if (before !== undefined || after !== undefined) return -1;

  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const rr = r + dr * i;
    const cc = c + dc * i;
    const existing = cells.get(key(rr, cc));
    if (existing !== undefined) {
      if (existing !== word[i]) return -1;
      crossings++;
    } else {
      const n1 = cells.get(key(rr + dc, cc + dr));
      const n2 = cells.get(key(rr - dc, cc - dr));
      if (n1 !== undefined || n2 !== undefined) return -1;
    }
  }
  if (crossings === 0 || crossings === word.length) return -1;
  return crossings;
}

function bounds(cells) {
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const k of cells.keys()) {
    const [r, c] = k.split(',').map(Number);
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (c < minC) minC = c;
    if (c > maxC) maxC = c;
  }
  return { minR, maxR, minC, maxC, rows: maxR - minR + 1, cols: maxC - minC + 1 };
}

export function packWords(words, limits = { rows: 9, cols: 8 }) {
  const sorted = words.slice().sort((a, b) => b.length - a.length || a.localeCompare(b));
  const cells = new Map();
  const placements = [];
  const placed = [];

  const first = sorted[0];
  for (let i = 0; i < first.length; i++) cells.set(key(0, i), first[i]);
  placements.push({ word: first, row: 0, col: 0, dir: 'h' });
  placed.push(first);

  for (const word of sorted.slice(1)) {
    let best = null;
    for (const [k, letter] of cells) {
      const [ar, ac] = k.split(',').map(Number);
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== letter) continue;
        for (const [dr, dc] of [[1, 0], [0, 1]]) {
          const r = ar - dr * i;
          const c = ac - dc * i;
          const crossings = canPlace(cells, word, r, c, dr, dc);
          if (crossings < 0) continue;

          const probe = new Map(cells);
          for (let j = 0; j < word.length; j++) probe.set(key(r + dr * j, c + dc * j), word[j]);
          const b = bounds(probe);
          if (b.rows > limits.rows || b.cols > limits.cols) continue;

          const score = crossings * 12 - (b.rows + b.cols) * 2 - Math.abs(b.rows - b.cols);
          if (!best || score > best.score) {
            best = { score, r, c, dr, dc };
          }
        }
      }
    }
    if (!best) continue;
    const { r, c, dr, dc } = best;
    for (let j = 0; j < word.length; j++) cells.set(key(r + dr * j, c + dc * j), word[j]);
    placements.push({ word, row: r, col: c, dir: dr === 1 ? 'v' : 'h' });
    placed.push(word);
  }

  const b = bounds(cells);
  return {
    placements: placements.map((p) => ({ ...p, row: p.row - b.minR, col: p.col - b.minC })),
    words: placed,
    rows: b.rows,
    cols: b.cols
  };
}
