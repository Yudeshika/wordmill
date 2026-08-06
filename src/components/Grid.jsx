import { useLayoutEffect, useRef, useState } from 'react';

export default function Grid({ level, solved, revealed, justSolved }) {
  const wrapRef = useRef(null);
  const [cell, setCell] = useState(34);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const byWidth = (w - (level.cols - 1) * 3) / level.cols;
      const byHeight = (h - (level.rows - 1) * 3) / level.rows;
      setCell(Math.max(20, Math.min(46, Math.floor(Math.min(byWidth, byHeight)))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [level]);

  const map = new Map();
  for (const p of level.placements) {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.row + (p.dir === 'v' ? i : 0);
      const c = p.col + (p.dir === 'h' ? i : 0);
      const key = r + ',' + c;
      const prev = map.get(key);
      const isSolved = solved.includes(p.word);
      const order = justSolved === p.word ? i : null;
      map.set(key, {
        letter: p.word[i],
        solved: (prev && prev.solved) || isSolved,
        order: order !== null ? order : prev ? prev.order : null,
        // Hints are keyed by word and position so they work on either board.
        refs: [...(prev ? prev.refs : []), p.word + ':' + i]
      });
    }
  }

  const cells = [];
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      const key = r + ',' + c;
      const entry = map.get(key);
      if (!entry) {
        cells.push(<div key={key} className="cell empty" />);
        continue;
      }
      const isHinted = !entry.solved && entry.refs.some((ref) => revealed.includes(ref));
      const cls = entry.solved ? 'cell filled' : isHinted ? 'cell hinted' : 'cell blank';
      const animate = entry.solved && entry.order !== null;
      cells.push(
        <div
          key={key}
          className={animate ? cls + ' pop' : cls}
          style={animate ? { animationDelay: entry.order * 45 + 'ms' } : undefined}
        >
          {entry.solved || isHinted ? entry.letter.toUpperCase() : ''}
        </div>
      );
    }
  }

  return (
    <div className="board" ref={wrapRef}>
      <div
        className="grid"
        style={{
          '--cell': cell + 'px',
          gridTemplateColumns: `repeat(${level.cols}, ${cell}px)`
        }}
      >
        {cells}
      </div>
    </div>
  );
}
