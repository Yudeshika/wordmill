import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Grid from './components/Grid.jsx';
import WordRows from './components/WordRows.jsx';
import Wheel from './components/Wheel.jsx';
import { loadDictionary } from './game/dictionary.js';
import { MODES, MODE_KEYS } from './game/generate.js';
import { loadProgress, saveProgress, resetProgress } from './game/storage.js';
import { SettingsIcon } from './assets/icons/index.js';
import coinImg from './assets/images/coin.png';
import hintBadgeImg from './assets/images/hint-badge.png';
import bonusBadgeImg from './assets/images/bonus-badge.png';
import beeCornerImg from './assets/images/bee-corner.png';

const BOARDS = [
  {
    key: 'crossword',
    name: 'Crossword',
    blurb: 'Words interlock. Shared letters give you a way in.',
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
    blurb: 'One row per word. You only know how long each is.',
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
  const [revealed, setRevealed] = useState([]);
  const [showBonus, setShowBonus] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [complete, setComplete] = useState(false);
  const [toast, setToast] = useState(null);
  const flashTimer = useRef(null);
  const toastTimer = useRef(null);

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
    if (level && progress.solved.length === level.words.length) setComplete(true);
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
        return;
      }
      if (level.words.includes(word)) {
        setJustSolved(word);
        setTimeout(() => setJustSolved(null), 700);
        showFlash({ word, kind: 'correct' });
        setProgress((p) => ({ ...p, solved: [...p.solved, word] }));
        return;
      }
      if (dict.valid.has(word)) {
        // Bonus words are collected once and stay collected for good — finding
        // one again on a later level is acknowledged but not rewarded twice.
        if (progress.bonus.includes(word)) {
          showFlash({ word, kind: 'collected' });
          return;
        }
        showFlash({ word, kind: 'bonus' });
        setProgress((p) => ({
          ...p,
          coins: p.coins + BONUS_REWARD,
          bonus: [...p.bonus, word],
          bonusLevel: [...p.bonusLevel, word]
        }));
        return;
      }
      showFlash({ word, kind: 'wrong' });
    },
    [level, progress.solved, progress.bonus, dict, complete, showFlash]
  );

  const takeHint = () => {
    if (!level || progress.coins < HINT_COST) return;
    const options = [];
    for (const word of level.words) {
      if (progress.solved.includes(word)) continue;
      for (let i = 0; i < word.length; i++) {
        const key = word + ':' + i;
        if (!revealed.includes(key)) options.push(key);
      }
    }
    if (!options.length) return;
    const pick = options[Math.floor(Math.random() * options.length)];
    setRevealed((r) => [...r, pick]);
    setProgress((p) => ({ ...p, coins: p.coins - HINT_COST }));
  };

  const nextLevel = () => {
    setComplete(false);
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
          <span className="mode-mark" aria-hidden="true">✦</span>
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
          <div className="coins" aria-label={`${progress.coins} coins`}>
            <img className="coin-dot" src={coinImg} alt="" aria-hidden="true" />
            {progress.coins}
          </div>
          <button className="gear" onClick={() => setShowSettings(true)} aria-label="Settings">
            <SettingsIcon />
          </button>
        </div>
      </header>

      <main className="play-area">
      <div className="board-wrap">
        <img className="board-corner-tl" src={beeCornerImg} alt="" aria-hidden="true" />
        {progress.board === 'rows' ? (
          <WordRows
            level={level}
            solved={progress.solved}
            revealed={revealed}
            justSolved={justSolved}
          />
        ) : (
          <Grid level={level} solved={progress.solved} revealed={revealed} justSolved={justSolved} />
        )}
        <img className="board-corner-br" src={beeCornerImg} alt="" aria-hidden="true" />
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
        onChange={setSelection}
        onSubmit={submit}
        onShuffle={() => setRotation((r) => r + 1)}
      />

      </main>

      <footer className="actions">
        <button className="btn" onClick={takeHint} disabled={progress.coins < HINT_COST}>
          <img className="action-icon" src={hintBadgeImg} alt="" aria-hidden="true" />
          <span>Hint</span>
          <span className="cost">{HINT_COST}</span>
        </button>
        <button className="btn" onClick={() => setShowBonus(true)}>
          <img className="action-icon" src={bonusBadgeImg} alt="" aria-hidden="true" />
          <span>Bonus words</span>
          <span className="cost">{progress.bonus.length}</span>
        </button>
      </footer>

      {showSettings && (
        <div className="sheet" onClick={() => setShowSettings(false)}>
          <div className="sheet-card scrollable" onClick={(e) => e.stopPropagation()}>
            <h2 className="sheet-title">Settings</h2>

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
              losing your place. Your bonus word collection is shared.
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
            <button className="link" onClick={startOver}>
              Reset all progress
            </button>
          </div>
        </div>
      )}

      {showBonus && (
        <div className="sheet" onClick={() => setShowBonus(false)}>
          <div className="sheet-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="sheet-title">Collection</h2>
            <p className="sheet-body">
              Real words you found that weren't in the grid. Once collected, a word stays
              collected — {progress.bonus.length} so far.
            </p>
            {progress.bonusLevel.length > 0 && (
              <div>
                <p className="hud-label">New on this level</p>
                <div className="chips">
                  {progress.bonusLevel.map((w) => (
                    <span className="chip new" key={w}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {progress.bonus.length > 0 ? (
              <div className="chips scroll">
                {progress.bonus.map((w) => (
                  <span className="chip" key={w}>
                    {w}
                  </span>
                ))}
              </div>
            ) : (
              <p className="sheet-body">Nothing collected yet.</p>
            )}
            <button className="btn-primary" onClick={() => setShowBonus(false)}>
              Back to puzzle
            </button>
          </div>
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
                ? `, plus ${progress.bonusLevel.length} new for the collection`
                : ''}. Take 10 coins.
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
