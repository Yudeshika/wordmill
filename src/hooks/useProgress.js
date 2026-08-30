import { useEffect, useState } from 'react';
import { loadProgress, saveProgress, resetProgress } from '../game/storage.js';

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const switchMode = (mode) => {
    if (mode === progress.mode) return;
    setProgress((p) => ({ ...p, mode, solved: [], bonusLevel: [] }));
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

  const startOver = () => {
    setProgress(resetProgress());
  };

  return { progress, setProgress, switchMode, nextLevel, setBoard, startOver };
}
