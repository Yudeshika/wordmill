import { useCallback, useEffect, useRef, useState } from 'react';
import {
  playTap, playCorrect, playBonus, playWrong, playComplete,
  vibrateTap, vibrateCorrect, vibrateBonus, vibrateWrong, vibrateComplete
} from '../game/audio.js';

const HINT_COST = 15;
const BONUS_REWARD = 5;

export function useGameLogic({ dict, level, progress, setProgress }) {
  const [flash, setFlash]           = useState(null);
  const [justSolved, setJustSolved] = useState(null);
  const [justHinted, setJustHinted] = useState(null);
  const [revealed, setRevealed]     = useState([]);
  const [complete, setComplete]     = useState(false);
  const [showWin, setShowWin]       = useState(false);

  const flashTimer      = useRef(null);
  const completeTimer   = useRef(null);
  const justSolvedTimer = useRef(null);
  const justHintedTimer = useRef(null);

  const soundRef   = useRef(progress.sound);
  const vibrateRef = useRef(progress.vibrate);
  useEffect(() => { soundRef.current   = progress.sound;    }, [progress.sound]);
  useEffect(() => { vibrateRef.current = progress.vibrate;  }, [progress.vibrate]);

  useEffect(() => {
    return () => {
      clearTimeout(flashTimer.current);
      clearTimeout(completeTimer.current);
      clearTimeout(justSolvedTimer.current);
      clearTimeout(justHintedTimer.current);
    };
  }, []);

  // Completion detection — guarded by !complete so it only fires once per level.
  useEffect(() => {
    if (!complete && level && level.words.every((w) => progress.solved.includes(w))) {
      if (soundRef.current)   playComplete();
      if (vibrateRef.current) vibrateComplete();
      setShowWin(true);
      completeTimer.current = setTimeout(() => {
        setShowWin(false);
        setComplete(true);
      }, 3200);
    }
  }, [level, progress.solved, complete]);

  const showFlash = useCallback((state) => {
    clearTimeout(flashTimer.current);
    setFlash(state);
    flashTimer.current = setTimeout(() => setFlash(null), 700);
  }, []);

  const submit = useCallback((word) => {
    if (!level || word.length < 3 || complete) {
      if (word.length > 0 && word.length < 3) showFlash({ word, kind: 'wrong' });
      return;
    }
    if (progress.solved.includes(word)) {
      showFlash({ word, kind: 'seen' });
      if (soundRef.current)   playWrong();
      if (vibrateRef.current) vibrateWrong();
      return;
    }
    if (level.words.includes(word)) {
      clearTimeout(justSolvedTimer.current);
      setJustSolved(word);
      justSolvedTimer.current = setTimeout(() => setJustSolved(null), 700);
      showFlash({ word, kind: 'correct' });
      if (soundRef.current)   playCorrect();
      if (vibrateRef.current) vibrateCorrect();
      setProgress((p) => p.solved.includes(word) ? p : { ...p, solved: [...p.solved, word] });
      return;
    }
    if (dict.valid.has(word)) {
      if (progress.bonus.includes(word)) {
        showFlash({ word, kind: 'collected' });
        if (soundRef.current)   playWrong();
        if (vibrateRef.current) vibrateWrong();
        return;
      }
      showFlash({ word, kind: 'bonus' });
      if (soundRef.current)   playBonus();
      if (vibrateRef.current) vibrateBonus();
      setProgress((p) => ({
        ...p,
        unclaimedCoins: p.unclaimedCoins + BONUS_REWARD,
        bonus:      [...p.bonus, word],
        bonusLevel: [...p.bonusLevel, word]
      }));
      return;
    }
    if (soundRef.current)   playWrong();
    if (vibrateRef.current) vibrateWrong();
    showFlash({ word, kind: 'wrong' });
  }, [level, progress.solved, progress.bonus, dict, complete, showFlash, setProgress]);

  const takeHint = useCallback(() => {
    if (!level || progress.coins < HINT_COST) return;

    const solvedSet = new Set(progress.solved);
    const cellWords = new Map();
    for (const p of level.placements) {
      for (let i = 0; i < p.word.length; i++) {
        const r       = p.row + (p.dir === 'v' ? i : 0);
        const c       = p.col + (p.dir === 'h' ? i : 0);
        const cellKey = r + ',' + c;
        if (!cellWords.has(cellKey)) cellWords.set(cellKey, []);
        cellWords.get(cellKey).push(p.word);
      }
    }

    const options = [];
    for (const p of level.placements) {
      if (solvedSet.has(p.word)) continue;
      for (let i = 0; i < p.word.length; i++) {
        const key     = p.word + ':' + i;
        if (revealed.includes(key)) continue;
        const r       = p.row + (p.dir === 'v' ? i : 0);
        const c       = p.col + (p.dir === 'h' ? i : 0);
        const sharers = cellWords.get(r + ',' + c) || [];
        if (sharers.some((w) => solvedSet.has(w))) continue;
        options.push(key);
      }
    }
    if (!options.length) return;

    const pick = options[Math.floor(Math.random() * options.length)];
    setRevealed((r) => [...r, pick]);
    setProgress((p) => ({ ...p, coins: p.coins - HINT_COST }));
    clearTimeout(justHintedTimer.current);
    setJustHinted(pick);
    justHintedTimer.current = setTimeout(() => setJustHinted(null), 800);
  }, [level, progress.solved, progress.coins, revealed, setProgress]);

  // Called by App when advancing levels or switching modes — resets all in-level state.
  const resetLevel = useCallback(() => {
    clearTimeout(completeTimer.current);
    clearTimeout(justSolvedTimer.current);
    clearTimeout(justHintedTimer.current);
    setRevealed([]);
    setComplete(false);
    setShowWin(false);
    setFlash(null);
    setJustSolved(null);
    setJustHinted(null);
  }, []);

  // Fired when the user drags onto a new letter tile.
  const onLetterSelect = useCallback(() => {
    if (soundRef.current)   playTap();
    if (vibrateRef.current) vibrateTap();
  }, []);

  return {
    flash, justSolved, justHinted, revealed,
    complete, showWin,
    submit, takeHint, resetLevel, onLetterSelect,
    BONUS_REWARD
  };
}
