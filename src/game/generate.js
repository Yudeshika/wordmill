import { mulberry32, counts, fitsIn, shuffled } from './util.js';
import { packWords } from './pack.js';
import { SHORT_WORDS } from './shortwords.js';
import { BLOCKED } from './blocklist.js';
import { isOffensive } from './offensive.js';

// Frequency-rank cutoffs into the common list (which is ordered by frequency).
// "Standard" keeps every word one you'd recognise. "Wide" reaches further down the
// list and is deliberately reserved for the deep end of Hard — obscurity is the
// lever that makes a puzzle feel unfair rather than difficult, so it arrives late.
const STANDARD_BASE = 3500;
const STANDARD_TARGET = 3500;
const WIDE_BASE = 5500;
const WIDE_TARGET = 6500;

const band = (until, len, target, max, shorts, wide = false) => ({
  until,
  len,
  target,
  max,
  shorts,
  baseRank: wide ? WIDE_BASE : STANDARD_BASE,
  targetRank: wide ? WIDE_TARGET : STANDARD_TARGET,
  wide
});

export const MODES = {
  easy: {
    key: 'easy',
    name: 'Easy',
    // blurb: 'Short words, few of them. Nothing obscure, ever.',
    bands: [
      band(15, [4, 4], 4, 5, 1),
      band(40, [5, 5], 4, 6, 2),
      band(Infinity, [5, 6], 5, 6, 2)
    ]
  },
  normal: {
    key: 'normal',
    name: 'Normal',
    // blurb: 'Ramps from 4 letters to 7. Words stay familiar throughout.',
    bands: [
      band(8, [4, 4], 4, 5, 1),
      band(20, [5, 5], 5, 6, 1),
      band(40, [5, 6], 6, 7, 2),
      band(70, [6, 6], 6, 8, 2),
      band(Infinity, [6, 7], 7, 8, 2)
    ]
  },
  hard: {
    key: 'hard',
    name: 'Hard',
    // blurb: 'Starts at 5 letters and fills bigger grids. Past level 60 the word pool widens.',
    bands: [
      band(5, [5, 5], 5, 6, 1),
      band(15, [6, 6], 6, 7, 1),
      band(35, [6, 6], 7, 8, 2),
      band(60, [6, 7], 7, 8, 2),
      band(Infinity, [7, 7], 7, 8, 2, true)
    ]
  }
};

export const MODE_KEYS = ['easy', 'normal', 'hard'];

const signature = (w) => w.split('').sort().join('');

function maskOf(word) {
  let m = 0;
  for (let i = 0; i < word.length; i++) m |= 1 << (word.charCodeAt(i) - 97);
  return m;
}

/** A word like "pots" whose singular "pot" is also a real word. */
function isPlural(word, set) {
  if (word.length < 4 || !word.endsWith('s') || word.endsWith('ss')) return false;
  if (set.has(word.slice(0, -1))) return true;
  if (word.endsWith('es') && set.has(word.slice(0, -2))) return true;
  return false;
}

export function buildIndex(commonWords) {
  const set = new Set(commonWords);
  const entries = commonWords.map((word, rank) => ({
    word,
    rank,
    counts: counts(word),
    mask: maskOf(word),
    plural: isPlural(word, set),
    blocked: BLOCKED.has(word) || isOffensive(word)
  }));

  const byLength = new Map();
  for (const e of entries) {
    if (!byLength.has(e.word.length)) byLength.set(e.word.length, []);
    byLength.get(e.word.length).push(e);
  }
  return { entries, byLength, set };
}

function subWords(base, index, targetRank) {
  const pool = counts(base);
  const baseMask = maskOf(base);
  const out = [];
  for (const e of index.entries) {
    if (e.word.length > base.length || e.word === base) continue;
    if (e.blocked) continue;
    if (e.rank > targetRank) continue;
    if (e.word.length === 3 && !SHORT_WORDS.has(e.word)) continue;
    if ((e.mask & ~baseMask) !== 0) continue; // cheap reject before the full count check
    if (fitsIn(e.counts, pool)) out.push(e);
  }
  return out;
}

/**
 * Pick the words that go in the grid. Two rules beyond "fits in the base word":
 * never both a word and its plural, and prefer singulars when we have a choice.
 */
function chooseTargets(base, subs, band, rng) {
  const picked = [base];
  const chosen = new Set([base]);

  const conflicts = (word) => {
    if (chosen.has(word.slice(0, -1))) return true;
    if (chosen.has(word + 's')) return true;
    if (word.endsWith('es') && chosen.has(word.slice(0, -2))) return true;
    if (chosen.has(word + 'es')) return true;
    return false;
  };

  const ordered = shuffled(subs, rng).sort((a, b) => b.word.length - a.word.length);
  const longs = ordered.filter((e) => e.word.length > 3);
  const shorts = ordered.filter((e) => e.word.length === 3);

  const take = (list, limit, allowPlural) => {
    for (const e of list) {
      if (picked.length >= limit) return;
      if (chosen.has(e.word)) continue;
      if (e.plural && !allowPlural) continue;
      if (conflicts(e.word)) continue;
      picked.push(e.word);
      chosen.add(e.word);
    }
  };

  const longLimit = band.max - band.shorts;
  take(longs, longLimit, false);
  take(shorts, longLimit + band.shorts, false);
  // Only fall back to plurals if singulars could not fill the level.
  if (picked.length < band.target) take(longs, band.max, true);
  if (picked.length < band.target) take(shorts, band.max, true);

  return picked;
}

function tryBase(base, level, band, index, modeSeed) {
  const rng = mulberry32(level * 2654435761 + modeSeed);
  const subs = subWords(base, index, band.targetRank);
  if (subs.length < band.target - 1) return null;

  const picked = chooseTargets(base, subs, band, rng);
  if (picked.length < band.target) return null;

  const packed = packWords(picked);
  if (packed.words.length < band.target) return null;
  if (!packed.words.includes(base)) return null;

  return {
    level,
    base,
    letters: shuffled(base.split(''), rng),
    words: packed.words,
    placements: packed.placements,
    rows: packed.rows,
    cols: packed.cols
  };
}

/**
 * Levels come from one global running plan rather than being generated in
 * isolation, so no two levels ever share a letter set. Level N is still
 * deterministic: the plan is always built from level 1 with fixed seeds.
 */
export function createPlanner(index, modeKey = 'normal') {
  const mode = MODES[modeKey] || MODES.normal;
  const bands = mode.bands;
  const modeSeed = 0x9e37 + MODE_KEYS.indexOf(mode.key) * 0x4f1b;

  const pools = bands.map((band, i) => {
    const bySig = new Map();
    for (let len = band.len[0]; len <= band.len[1]; len++) {
      for (const e of index.byLength.get(len) || []) {
        if (e.blocked) continue;
        if (e.rank > band.baseRank) continue;
        if (e.plural) continue; // never build a level around a plural
        if (new Set(e.word).size < e.word.length - 1) continue; // too many repeated letters
        const sig = signature(e.word);
        const held = bySig.get(sig);
        if (!held || e.rank < held.rank) bySig.set(sig, e);
      }
    }
    return shuffled(
      [...bySig.values()].map((e) => e.word),
      mulberry32(0x51ed + i * 7919 + modeSeed)
    );
  });

  const cursors = bands.map(() => 0);
  const usedSignatures = new Set();
  const cache = [];

  function buildNext(level) {
    const bandIndex = bands.findIndex((b) => level <= b.until);
    const band = bands[bandIndex];
    const pool = pools[bandIndex];

    while (cursors[bandIndex] < pool.length) {
      const base = pool[cursors[bandIndex]++];
      const sig = signature(base);
      if (usedSignatures.has(sig)) continue;
      const built = tryBase(base, level, band, index, modeSeed);
      if (!built) continue;
      usedSignatures.add(sig);
      return built;
    }
    return null;
  }

  return {
    mode: mode.key,
    get(level) {
      for (let n = cache.length + 1; n <= level; n++) cache[n - 1] = buildNext(n);
      return cache[level - 1];
    },
    get poolSize() {
      return pools.reduce((sum, p) => sum + p.length, 0);
    }
  };
}
