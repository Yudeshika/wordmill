import beeImg from '../assets/images/wordhive-mark.png';

function worldName(level) {
  if (level <= 20)  return 'Meadow';
  if (level <= 60)  return 'Clover';
  if (level <= 120) return 'Wildflower';
  return 'Golden Grove';
}

export default function CompletionSheet({
  currentLevel,
  modeName,
  wordCount,
  bonusWordCount,
  solved,
  bonusWords,
  onNext,
  onHiveMap,
}) {
  const world = worldName(currentLevel);

  const wordsScore   = wordCount * 5;
  const bonusScore   = (bonusWordCount || 0) * 2;
  const levelBonus   = 10;
  const total        = wordsScore + bonusScore + levelBonus;

  // solved is the array of word strings found; bonusWords are the extra words
  const solvedList  = Array.isArray(solved)    ? solved    : [];
  const bonusList   = Array.isArray(bonusWords) ? bonusWords : [];

  return (
    <div className="sheet">
      <div className="sheet-card scrollable">
        {/* Bee */}
        <img src={beeImg} className="completion-bee" alt="" aria-hidden="true" />

        {/* Title */}
        <h2 className="sheet-title">Level complete!</h2>
        <p className="completion-level">
          Level {currentLevel} · {world}
          {modeName ? ` · ${modeName}` : ''}
        </p>

        {/* Score breakdown */}
        <div className="score-card">
          <div className="score-row">
            <span>Words × {wordCount}</span>
            <span className="score-gain">+{wordsScore}</span>
          </div>
          {bonusWordCount > 0 && (
            <div className="score-row">
              <span>Bonus words × {bonusWordCount}</span>
              <span className="score-gain">+{bonusScore}</span>
            </div>
          )}
          <div className="score-row">
            <span>Level complete</span>
            <span className="score-gain">+{levelBonus}</span>
          </div>
          <div className="score-row total">
            <span>Total</span>
            <span className="score-gain">+{total} coins</span>
          </div>
        </div>

        {/* Words found */}
        {solvedList.length > 0 && (
          <div className="words-section">
            <h4>Words found</h4>
            <div className="word-pills">
              {solvedList.map((w) => (
                <span
                  key={w}
                  className={'word-pill' + (bonusList.includes(w) ? ' bonus' : '')}
                >
                  {w.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <button className="btn-primary" onClick={onNext}>
          Next level
        </button>
        {onHiveMap && (
          <button className="btn-link" onClick={onHiveMap}>
            Back to hive map
          </button>
        )}
      </div>
    </div>
  );
}
