const KEY = 'wordconnect.progress.v1';

const empty = () => ({
  mode: 'normal',
  board: 'crossword', // 'crossword' | 'rows'
  levels: { easy: 1, normal: 1, hard: 1 }, // progress is tracked per difficulty
  coins: 40,
  sound: true,
  vibrate: true,
  solved: [], // grid words solved on the current level
  bonus: [], // every bonus word ever found, across all levels and modes
  bonusLevel: [] // the ones first found on this level
});

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    const base = empty();
    const levels = { ...base.levels, ...(parsed.levels || {}) };
    // Saves from before difficulty modes kept a single `level`.
    if (!parsed.levels && Number(parsed.level)) levels.normal = Number(parsed.level);

    return {
      mode: ['easy', 'normal', 'hard'].includes(parsed.mode) ? parsed.mode : 'normal',
      board: ['crossword', 'rows'].includes(parsed.board) ? parsed.board : 'crossword',
      levels,
      coins: Number.isFinite(parsed.coins) ? parsed.coins : base.coins,
      sound: parsed.sound !== false,
      vibrate: parsed.vibrate !== false,
      solved: Array.isArray(parsed.solved) ? parsed.solved : [],
      bonus: Array.isArray(parsed.bonus) ? parsed.bonus : [],
      bonusLevel: Array.isArray(parsed.bonusLevel) ? parsed.bonusLevel : []
    };
  } catch {
    return empty();
  }
}

export function saveProgress(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode or quota — the game still plays, it just won't resume */
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clean up */
  }
  return empty();
}
