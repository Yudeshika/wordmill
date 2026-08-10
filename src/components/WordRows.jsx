import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import beeCornerImg from '../assets/images/bee-corner.png';

/**
 * The second board style: instead of an interlocking crossword, each target word
 * gets its own row of blanks. Shorter words first, so the rows form a staircase
 * and the shape of the level reads at a glance.
 */
export default function WordRows({ level, solved, revealed, justSolved }) {
  const wrapRef = useRef(null);
  const [cell, setCell] = useState(34);

  const rows = useMemo(
    () => level.words.slice().sort((a, b) => a.length - b.length || a.localeCompare(b)),
    [level]
  );
  const longest = rows.reduce((n, w) => Math.max(n, w.length), 0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const byWidth = (el.clientWidth - (longest - 1) * 4) / longest;
      const byHeight = (el.clientHeight - (rows.length - 1) * 6) / rows.length;
      setCell(Math.max(18, Math.min(44, Math.floor(Math.min(byWidth, byHeight)))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [longest, rows.length]);

  return (
    <div className="board" ref={wrapRef}>
      <img className="board-corner-tl" src={beeCornerImg} alt="" aria-hidden="true" />
      <img className="board-corner-br" src={beeCornerImg} alt="" aria-hidden="true" />
      <div className="rows" style={{ '--cell': cell + 'px' }}>
        {rows.map((word) => {
          const isSolved = solved.includes(word);
          return (
            <div className="row" key={word}>
              {word.split('').map((ch, i) => {
                const hinted = !isSolved && revealed.includes(word + ':' + i);
                const cls = isSolved ? 'cell filled' : hinted ? 'cell hinted' : 'cell blank';
                const animate = isSolved && justSolved === word;
                return (
                  <div
                    key={i}
                    className={animate ? cls + ' pop' : cls}
                    style={{
                      width: cell + 'px',
                      height: cell + 'px',
                      ...(animate ? { animationDelay: i * 45 + 'ms' } : null)
                    }}
                  >
                    {isSolved || hinted ? ch.toUpperCase() : ''}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
