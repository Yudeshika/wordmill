export default function CompletionSheet({ currentLevel, wordCount, bonusWordCount, onNext }) {
  return (
    <div className="sheet">
      <div className="sheet-card">
        <h2 className="sheet-title">Level {currentLevel} done</h2>
        <p className="sheet-body">
          {wordCount} words found
          {bonusWordCount > 0
            ? `, plus ${bonusWordCount} new bonus ${bonusWordCount === 1 ? 'word' : 'words'}`
            : ''}. +10 coins.
        </p>
        <button className="btn-primary" onClick={onNext}>
          Next level
        </button>
      </div>
    </div>
  );
}
