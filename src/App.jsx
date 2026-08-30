import { useEffect, useMemo, useRef, useState } from 'react';
import Grid from './components/Grid.jsx';
import WordRows from './components/WordRows.jsx';
import Wheel from './components/Wheel.jsx';
import Hud from './components/Hud.jsx';
import SettingsSheet from './components/SettingsSheet.jsx';
import WinOverlay from './components/WinOverlay.jsx';
import FlyingCoins from './components/FlyingCoins.jsx';
import CompletionSheet from './components/CompletionSheet.jsx';
import { useProgress } from './hooks/useProgress.js';
import { useGameLogic } from './hooks/useGameLogic.js';
import { useCoinClaim } from './hooks/useCoinClaim.js';
import { loadDictionary } from './game/dictionary.js';
import { MODES } from './game/generate.js';
import beeCornerImg from './assets/images/bee-corner.png';
import hintBadgeImg from './assets/images/hint-badge.png';
import bonusBadgeImg from './assets/images/bonus-badge.png';

const TILES_3D = true;
const HINT_COST = 15;

export default function App() {
  const [dict, setDict]           = useState(null);
  const [error, setError]         = useState(null);
  const [selection, setSelection] = useState([]);
  const [rotation, setRotation]   = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast]         = useState(null);
  const toastTimer                = useRef(null);

  const { progress, setProgress, switchMode, nextLevel, setBoard, startOver } = useProgress();

  const currentLevel = progress.levels[progress.mode];

  const level = useMemo(() => {
    if (!dict) return null;
    return dict.plannerFor(progress.mode).get(currentLevel);
  }, [dict, progress.mode, currentLevel]);

  const {
    flash, justSolved, justHinted, revealed,
    complete, showWin,
    submit, takeHint, resetLevel, onLetterSelect,
    BONUS_REWARD,
  } = useGameLogic({ dict, level, progress, setProgress });

  const { coinClaim, flyingCoins, claimBtnRef, coinHudRef, claimCoins } = useCoinClaim({ progress, setProgress });

  useEffect(() => {
    loadDictionary().then(setDict).catch((e) => setError(e.message));
    return () => clearTimeout(toastTimer.current);
  }, []);

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  const letters = useMemo(() => {
    if (!level) return [];
    const n = level.letters.length;
    const offset = ((rotation % n) + n) % n;
    return [...level.letters.slice(offset), ...level.letters.slice(0, offset)];
  }, [level, rotation]);

  const handleNextLevel = () => {
    nextLevel();
    resetLevel();
    setSelection([]);
    setRotation(0);
  };

  const handleSwitchMode = (mode) => {
    setShowSettings(false);
    switchMode(mode);
    resetLevel();
    setSelection([]);
    setRotation(0);
  };

  const handleSetBoard = (board) => {
    setBoard(board);
    setShowSettings(false);
    if (board === 'rows') showToast('Shortest words first, A – Z within each length');
  };

  const handleStartOver = () => {
    startOver();
    resetLevel();
    setSelection([]);
    setRotation(0);
    setShowSettings(false);
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
          {progress.bonus.length} bonus words. Try another difficulty, or reset to play through again.
        </p>
        <button className="btn-primary" onClick={handleStartOver}>
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
      <Hud
        modeName={MODES[progress.mode].name}
        currentLevel={currentLevel}
        solved={progress.solved.length}
        totalWords={level.words.length}
        coins={progress.coins}
        coinClaim={coinClaim}
        coinHudRef={coinHudRef}
        onSettings={() => setShowSettings(true)}
      />

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
            <Grid
              level={level}
              solved={progress.solved}
              revealed={revealed}
              justSolved={justSolved}
              justHinted={justHinted}
            />
          )}
        </div>

        <div className={previewClass} aria-live="polite">
          {note ? (
            <span className={'preview-note' + (flash.kind === 'bonus' ? ' gain' : '')}>{note}</span>
          ) : previewWord ? (
            previewWord.split('').map((ch, i) => (
              <span className="preview-letter" key={i}>{ch.toUpperCase()}</span>
            ))
          ) : (
            <span className="preview-placeholder">Build a word</span>
          )}
        </div>

        <Wheel
          letters={letters}
          selection={selection}
          onChange={(sel) => {
            if (sel.length > selection.length) onLetterSelect();
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
        <SettingsSheet
          progress={progress}
          setProgress={setProgress}
          onClose={() => setShowSettings(false)}
          onSetBoard={handleSetBoard}
          onSwitchMode={handleSwitchMode}
          onStartOver={handleStartOver}
        />
      )}

      <FlyingCoins coins={flyingCoins} />
      <WinOverlay visible={showWin} />

      {toast && <div className="toast" role="status">{toast}</div>}

      {complete && (
        <CompletionSheet
          currentLevel={currentLevel}
          wordCount={level.words.length}
          bonusWordCount={progress.bonusLevel.length}
          onNext={handleNextLevel}
        />
      )}
    </div>
  );
}
