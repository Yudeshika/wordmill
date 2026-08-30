import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Grid from './components/Grid.jsx';
import WordRows from './components/WordRows.jsx';
import Wheel from './components/Wheel.jsx';
import { loadDictionary } from './game/dictionary.js';
import { MODES, MODE_KEYS } from './game/generate.js';
import { loadProgress, saveProgress, resetProgress } from './game/storage.js';
import { playTap, playCorrect, playBonus, playWrong, playComplete, vibrateTap, vibrateCorrect, vibrateBonus, vibrateWrong, vibrateComplete } from './game/audio.js';
import { CloseIcon, SoundIcon, MuteIcon, VibrateIcon } from './assets/icons/index.js';
import coinImg from './assets/images/coin.png';
import hintBadgeImg from './assets/images/hint-badge.png';
import bonusBadgeImg from './assets/images/bonus-badge.png';
import beeCornerImg from './assets/images/bee-corner.png';

const BOARDS = [
  {
    key: 'crossword',
    name: 'Crossword',
    // blurb: 'Words interlock. Shared letters give you a way in.',
    art: (
      <svg viewBox="0 0 34 26" width="34" height="26" aria-hidden="true">
        <g fill="currentColor">
          <rect x="2" y="2" width="6" height="6" rx="1" />
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <rect x="16" y="2" width="6" height="6" rx="1" />
          <rect x="23" y="2" width="6" height="6" rx="1" />
          <rect x="16" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="16" width="6" height="6" rx="1" />
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <rect x="23" y="16" width="6" height="6" rx="1" />
        </g>
      </svg>
    )
  },
  {
    key: 'rows',
    name: 'Word list',
    // blurb: 'One row per word. You only know how long each is.',
    art: (
      <svg viewBox="0 0 34 26" width="34" height="26" aria-hidden="true">
        <g fill="currentColor">
          <rect x="2" y="2" width="6" height="6" rx="1" />
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <rect x="2" y="10" width="6" height="6" rx="1" />
          <rect x="9" y="10" width="6" height="6" rx="1" />
          <rect x="16" y="10" width="6" height="6" rx="1" />
          <rect x="2" y="18" width="6" height="6" rx="1" />
          <rect x="9" y="18" width="6" height="6" rx="1" />
          <rect x="16" y="18" width="6" height="6" rx="1" />
          <rect x="23" y="18" width="6" height="6" rx="1" />
        </g>
      </svg>
    )
  }
];

// Tile rendering is a look, not a player setting — flip this to compare, then
// delete the loser. Board style (crossword vs word list) stays in settings because
// it changes how the puzzle actually plays.
const TILES_3D = true;

const HINT_COST = 15;
const BONUS_REWARD = 5;

export default function App() {
  const [dict, setDict] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(loadProgress);
  const [selection, setSelection] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [flash, setFlash] = useState(null);
  const [justSolved, setJustSolved] = useState(null);
  const [justHinted, setJustHinted] = useState(null);
  const [revealed, setRevealed] = useState([]);
  const [coinClaim, setCoinClaim] = useState(false);
  const [flyingCoins, setFlyingCoins] = useState([]);
  const claimBtnRef = useRef(null);
  const coinHudRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [complete, setComplete] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [toast, setToast] = useState(null);
  const flashTimer = useRef(null);
  const toastTimer = useRef(null);
  const completeTimer = useRef(null);
  const soundRef = useRef(progress.sound);
  const vibrateRef = useRef(progress.vibrate);
  useEffect(() => { soundRef.current = progress.sound; }, [progress.sound]);
  useEffect(() => { vibrateRef.current = progress.vibrate; }, [progress.vibrate]);

  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    loadDictionary().then(setDict).catch((e) => setError(e.message));
    return () => {
      clearTimeout(flashTimer.current);
      clearTimeout(toastTimer.current);
      clearTimeout(completeTimer.current);
    };
  }, []);

  const currentLevel = progress.levels[progress.mode];

  const level = useMemo(() => {
    if (!dict) return null;
    return dict.plannerFor(progress.mode).get(currentLevel);
  }, [dict, progress.mode, currentLevel]);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (level && level.words.every((w) => progress.solved.includes(w))) {
      if (soundRef.current) playComplete();
      if (vibrateRef.current) vibrateComplete();
      setShowWin(true);
      completeTimer.current = setTimeout(() => {
        setShowWin(false);
        setComplete(true);
      }, 3200);
    }
  }, [level, progress.solved.length]);

  const letters = useMemo(() => {
    if (!level) return [];
    const n = level.letters.length;
    const offset = ((rotation % n) + n) % n;
    return [...level.letters.slice(offset), ...level.letters.slice(0, offset)];
  }, [level, rotation]);

  const showFlash = useCallback((state) => {
    clearTimeout(flashTimer.current);
    setFlash(state);
    flashTimer.current = setTimeout(() => setFlash(null), 700);
  }, []);

  const submit = useCallback(
    (word) => {
      if (!level || word.length < 3 || complete) {
        if (word.length > 0 && word.length < 3) showFlash({ word, kind: 'wrong' });
        return;
      }
      if (progress.solved.includes(word)) {
        showFlash({ word, kind: 'seen' });
        if (soundRef.current) playWrong();
        if (vibrateRef.current) vibrateWrong();
        return;
      }
      if (level.words.includes(word)) {
        setJustSolved(word);
        setTimeout(() => setJustSolved(null), 700);
        showFlash({ word, kind: 'correct' });
        if (soundRef.current) playCorrect();
        if (vibrateRef.current) vibrateCorrect();
        setProgress((p) => p.solved.includes(word) ? p : { ...p, solved: [...p.solved, word] });
        return;
      }
      if (dict.valid.has(word)) {
        // Bonus words are collected once and stay collected for good — finding
        // one again on a later level is acknowledged but not rewarded twice.
        if (progress.bonus.includes(word)) {
          showFlash({ word, kind: 'collected' });
          if (soundRef.current) playWrong();
          if (vibrateRef.current) vibrateWrong();
          return;
        }
        showFlash({ word, kind: 'bonus' });
        if (soundRef.current) playBonus();
        if (vibrateRef.current) vibrateBonus();
        setProgress((p) => ({
          ...p,
          unclaimedCoins: p.unclaimedCoins + BONUS_REWARD,
          bonus: [...p.bonus, word],
          bonusLevel: [...p.bonusLevel, word]
        }));
        return;
      }
      if (soundRef.current) playWrong();
      if (vibrateRef.current) vibrateWrong();
      showFlash({ word, kind: 'wrong' });
    },
    [level, progress.solved, progress.bonus, dict, complete, showFlash]
  );

  const claimCoins = useCallback(() => {
    if (!progress.unclaimedCoins) return;

    const fromEl = claimBtnRef.current;
    const toEl = coinHudRef.current;

    if (!fromEl || !toEl) {
      setProgress((p) => ({ ...p, coins: p.coins + p.unclaimedCoins, unclaimedCoins: 0 }));
      return;
    }

    const from = fromEl.getBoundingClientRect();
    const to = toEl.getBoundingClientRect();
    const count = Math.min(Math.ceil(progress.unclaimedCoins / BONUS_REWARD), 5);
    const FLIGHT = 500;
    const STAGGER = 80;

    setFlyingCoins(
      Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: from.left + from.width / 2 - 14,
        y: from.top + from.height / 2 - 14,
        dx: to.left + to.width / 2 - 14 - (from.left + from.width / 2 - 14),
        dy: to.top + to.height / 2 - 14 - (from.top + from.height / 2 - 14),
        delay: i * STAGGER,
      }))
    );

    // Transfer coins when first one lands
    setTimeout(() => {
      setProgress((p) => ({ ...p, coins: p.coins + p.unclaimedCoins, unclaimedCoins: 0 }));
      setCoinClaim(true);
      setTimeout(() => setCoinClaim(false), 600);
    }, FLIGHT);

    // Clean up after last coin lands
    setTimeout(() => setFlyingCoins([]), FLIGHT + (count - 1) * STAGGER + 100);
  }, [progress.unclaimedCoins]);

  const takeHint = () => {
    if (!level || progress.coins < HINT_COST) return;
    const solvedSet = new Set(progress.solved);
    // Build a map from grid cell key to all placements at that cell, so we can
    // detect cells that are already visible because a crossing solved word is there.
    const cellWords = new Map();
    for (const p of level.placements) {
      for (let i = 0; i < p.word.length; i++) {
        const r = p.row + (p.dir === 'v' ? i : 0);
        const c = p.col + (p.dir === 'h' ? i : 0);
        const cellKey = r + ',' + c;
        if (!cellWords.has(cellKey)) cellWords.set(cellKey, []);
        cellWords.get(cellKey).push(p.word);
      }
    }
    const options = [];
    for (const p of level.placements) {
      if (solvedSet.has(p.word)) continue;
      for (let i = 0; i < p.word.length; i++) {
        const key = p.word + ':' + i;
        if (revealed.includes(key)) continue;
        // Skip cells already visible because a crossing solved word occupies them.
        const r = p.row + (p.dir === 'v' ? i : 0);
        const c = p.col + (p.dir === 'h' ? i : 0);
        const sharers = cellWords.get(r + ',' + c) || [];
        if (sharers.some((w) => solvedSet.has(w))) continue;
        options.push(key);
      }
    }
    if (!options.length) return;
    const pick = options[Math.floor(Math.random() * options.length)];
    setRevealed((r) => [...r, pick]);
    setProgress((p) => ({ ...p, coins: p.coins - HINT_COST }));
    setJustHinted(pick);
    setTimeout(() => setJustHinted(null), 800);
  };

  const nextLevel = () => {
    setComplete(false);
    setShowWin(false);
    setRevealed([]);
    setSelection([]);
    setRotation(0);
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
    setShowSettings(false);
    if (board === 'rows') showToast('Shortest words first, A – Z within each length');
  };

  const switchMode = (mode) => {
    setShowSettings(false);
    if (mode === progress.mode) return;
    setComplete(false);
    setRevealed([]);
    setSelection([]);
    setRotation(0);
    // Each mode keeps its own level, so this resumes rather than restarts.
    setProgress((p) => ({ ...p, mode, solved: [], bonusLevel: [] }));
  };

  const startOver = () => {
    setComplete(false);
    setRevealed([]);
    setSelection([]);
    setProgress(resetProgress());
  };

  if (error) {
    return (
      <div className="centered">
        <p className="sheet-title">Word lists didn't load</p>
        <p className="sheet-body">{error}. Refresh to try again.</p>
      </div>
    );
  }

  if (!dict) {
    return (
      <div className="centered">
        <p className="hud-label">Word Connect</p>
        <p className="sheet-body">Setting up the puzzle…</p>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="centered">
        <p className="sheet-title">That's every level</p>
        <p className="sheet-body">
          You've cleared all {currentLevel - 1} on {MODES[progress.mode].name} and collected{' '}
          {progress.bonus.length} bonus words. Try another difficulty, or reset to play through
          again.
        </p>
        <button className="btn-primary" onClick={startOver}>
          Start over
        </button>
      </div>
    );
  }

  const previewWord = flash ? flash.word : selection.map((i) => letters[i]).join('');
  const note =
    flash && flash.kind === 'bonus'
      ? `new bonus word · +${BONUS_REWARD}`
      : flash && flash.kind === 'collected'
        ? 'already collected'
        : flash && flash.kind === 'seen'
          ? 'already found'
          : null;
  const previewClass =
    'preview' +
    (!previewWord && !note ? ' idle' : '') +
    (flash ? ' ' + (flash.kind === 'seen' || flash.kind === 'collected' ? 'wrong' : flash.kind) : '');

  return (
    <div className={TILES_3D ? 'app tiles-3d' : 'app'}>
      <header className="hud">
        <div className="hud-section hud-level">
          {/* <span className="mode-mark" aria-hidden="true">✦</span> */}
          <div>
            <div className="hud-label">{MODES[progress.mode].name}</div>
            <div className="hud-value"><span className="value-prefix">Level</span> {currentLevel}</div>
          </div>
        </div>
        <div className="hud-section hud-center">
          <div className="hud-label">Words found</div>
          <div className="hud-value">
            {progress.solved.length} <span className="value-divider">/</span> {level.words.length}
          </div>
        </div>
        <div className="hud-section hud-right">
          <div ref={coinHudRef} className={'coins' + (coinClaim ? ' claimed' : '')} aria-label={`${progress.coins} coins`}>
            <img src={coinImg} className="coin-img" aria-hidden="true" alt="" />
            {progress.coins}
          </div>
          <button className="gear" onClick={() => setShowSettings(true)} aria-label="Settings">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="play-area">
      <div className="board-frame">
        <img src={beeCornerImg} className="bee-corner bee-corner--tl" aria-hidden="true" alt="" />
        <img src={beeCornerImg} className="bee-corner bee-corner--br" aria-hidden="true" alt="" />
        {progress.board === 'rows' ? (
          <WordRows
            level={level}
            solved={progress.solved}
            revealed={revealed}
            justSolved={justSolved}
            justHinted={justHinted}
          />
        ) : (
          <Grid level={level} solved={progress.solved} revealed={revealed} justSolved={justSolved} justHinted={justHinted} />
        )}
      </div>

      <div className={previewClass} aria-live="polite">
        {note ? (
          <span className={'preview-note' + (flash.kind === 'bonus' ? ' gain' : '')}>{note}</span>
        ) : previewWord ? (
          previewWord.split('').map((ch, i) => (
            <span className="preview-letter" key={i}>
              {ch.toUpperCase()}
            </span>
          ))
        ) : (
          <span className="preview-placeholder">Build a word</span>
        )}
      </div>

      <Wheel
        letters={letters}
        selection={selection}
        onChange={(sel) => {
          if (sel.length > selection.length) {
            if (soundRef.current) playTap();
            if (vibrateRef.current) vibrateTap();
          }
          setSelection(sel);
        }}
        onSubmit={submit}
        onShuffle={() => setRotation((r) => r + 1)}
      />

      </main>

      <footer className="actions">
        <button className="btn" onClick={takeHint} disabled={progress.coins < HINT_COST}>
          <img src={hintBadgeImg} className="action-badge" aria-hidden="true" alt="" />
          <span>Hint</span>
          <span className="cost">{HINT_COST}</span>
        </button>
        <button
          ref={claimBtnRef}
          className={'btn' + (progress.unclaimedCoins > 0 ? ' has-unclaimed' : '')}
          disabled={progress.unclaimedCoins === 0}
          onClick={claimCoins}
        >
          <img src={bonusBadgeImg} className="action-badge" aria-hidden="true" alt="" />
          <span>Claim coins</span>
          {progress.unclaimedCoins > 0 && (
            <span className="cost">+{progress.unclaimedCoins}</span>
          )}
        </button>
      </footer>

      {showSettings && (
        <div className="sheet" onClick={() => setShowSettings(false)}>
          <div className="sheet-card scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-header">
              <h2 className="sheet-title">Settings</h2>
              <button className="sheet-close" onClick={() => setShowSettings(false)} aria-label="Close settings">
                <CloseIcon size={20} />
              </button>
            </div>

            <div>
              <p className="hud-label">Board</p>
              <div className="boards">
                {BOARDS.map((b) => (
                  <button
                    key={b.key}
                    className={'board-option' + (progress.board === b.key ? ' on' : '')}
                    onClick={() => setBoard(b.key)}
                  >
                    <span className="board-art" aria-hidden="true">
                      {b.art}
                    </span>
                    <span className="board-name">{b.name}</span>
                    <span className="board-blurb">{b.blurb}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="hud-label">Difficulty</p>
            <p className="sheet-body">
              Each difficulty keeps its own level, so you can switch and come back without
              losing your place.
            </p>
            <div className="modes">
              {MODE_KEYS.map((key) => (
                <button
                  key={key}
                  className={'mode' + (key === progress.mode ? ' on' : '')}
                  onClick={() => switchMode(key)}
                >
                  <span className="mode-head">
                    <span className="mode-name">{MODES[key].name}</span>
                    <span className="mode-level">level {progress.levels[key]}</span>
                  </span>
                  <span className="mode-blurb">{MODES[key].blurb}</span>
                </button>
              ))}
            </div>
            <p className="hud-label">Audio &amp; Haptics</p>
            <div className="toggles">
              <button
                className={'toggle' + (progress.sound ? ' on' : '')}
                onClick={() => setProgress((p) => ({ ...p, sound: !p.sound }))}
                aria-pressed={progress.sound}
              >
                {progress.sound ? <SoundIcon size={18} /> : <MuteIcon size={18} />}
                <span>{progress.sound ? 'Sound on' : 'Sound off'}</span>
              </button>
              <button
                className={'toggle' + (progress.vibrate ? ' on' : '')}
                onClick={() => setProgress((p) => ({ ...p, vibrate: !p.vibrate }))}
                aria-pressed={progress.vibrate}
              >
                <VibrateIcon size={18} />
                <span>{progress.vibrate ? 'Vibrate on' : 'Vibrate off'}</span>
              </button>
            </div>

            <button className="link" onClick={startOver}>
              Reset all progress
            </button>
          </div>
        </div>
      )}


      {flyingCoins.map((c) => (
        <img
          key={c.id}
          src={coinImg}
          className="flying-coin"
          aria-hidden="true"
          alt=""
          style={{
            left: c.x,
            top: c.y,
            '--dx': `${c.dx}px`,
            '--dy': `${c.dy}px`,
            '--delay': `${c.delay}ms`,
          }}
        />
      ))}

      {showWin && (
        <div className="win-overlay" aria-hidden="true">
          <img src={coinImg} className="win-coin" alt="" />
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}

      {complete && (
        <div className="sheet">
          <div className="sheet-card">
            <h2 className="sheet-title">Level {currentLevel} done</h2>
            <p className="sheet-body">
              {level.words.length} words found
              {progress.bonusLevel.length > 0
                ? `, plus ${progress.bonusLevel.length} new bonus ${progress.bonusLevel.length === 1 ? 'word' : 'words'}`
                : ''}. +10 coins.
            </p>
            <button className="btn-primary" onClick={nextLevel}>
              Next level
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
