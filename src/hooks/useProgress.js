import { useEffect, useState } from 'react';
import { loadProgress, saveProgress, resetProgress } from '../game/storage.js';

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const switchMode = (mode) => {
    setProgress((p) => p.mode === mode ? p : { ...p, mode, solved: [], bonusLevel: [] });
  };

  const nextLevel = () => {
    setProgress((p) => ({
      ...p,
      levels: { ...p.levels, [p.mode]: p.levels[p.mode] + 1 },
      coins: p.coins + 10,
      solved: [],
      bonusLevel: []
    }));
  };

  const setBoard = (board) => {
    setProgress((p) => ({ ...p, board }));
  };

  // Mark a level as done (value=1) or perfect/no-hints (value=2). Never downgrades.
  const markCrown = (level, mode, perfect) => {
    const value = perfect ? 2 : 1;
    setProgress((p) => {
      const existing = (p.crowns[mode] || {})[level] || 0;
      if (existing >= value) return p;
      return {
        ...p,
        crowns: { ...p.crowns, [mode]: { ...p.crowns[mode], [level]: value } }
      };
    });
  };

  const startOver = () => {
    setProgress(resetProgress());
  };

  return { progress, setProgress, switchMode, nextLevel, setBoard, markCrown, startOver };
}
