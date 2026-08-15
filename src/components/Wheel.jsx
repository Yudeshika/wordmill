import { useCallback, useRef, useState } from 'react';
import { ShuffleIcon } from '../assets/icons/index.js';

const RING = 0.345;
const TILE = 0.2;
const HIT = 0.115;

function positions(count) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: 0.5 + RING * Math.cos(angle), y: 0.5 + RING * Math.sin(angle) };
  });
}

export default function Wheel({ letters, selection, onChange, onSubmit, onShuffle }) {
  const ref = useRef(null);
  const dragging = useRef(false);
  const [cursor, setCursor] = useState(null);
  const pts = positions(letters.length);

  const locate = useCallback((event) => {
    const box = ref.current.getBoundingClientRect();
    return {
      x: (event.clientX - box.left) / box.width,
      y: (event.clientY - box.top) / box.height
    };
  }, []);

  const hitTest = (p) => {
    for (let i = 0; i < pts.length; i++) {
      const dx = p.x - pts[i].x;
      const dy = p.y - pts[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < HIT) return i;
    }
    return -1;
  };

  const begin = (event) => {
    if (event.target.closest('.shuffle')) return;
    ref.current.setPointerCapture(event.pointerId);
    dragging.current = true;
    const p = locate(event);
    setCursor(p);
    const hit = hitTest(p);
    onChange(hit >= 0 ? [hit] : []);
  };

  const move = (event) => {
    if (!dragging.current) return;
    const p = locate(event);
    setCursor(p);
    const hit = hitTest(p);
    if (hit < 0) return;
    if (selection.length >= 2 && hit === selection[selection.length - 2]) {
      onChange(selection.slice(0, -1));
    } else if (!selection.includes(hit)) {
      onChange([...selection, hit]);
    }
  };

  const end = (event) => {
    dragging.current = false;
    if (ref.current.hasPointerCapture(event.pointerId)) {
      ref.current.releasePointerCapture(event.pointerId);
    }
    setCursor(null);
    onSubmit(selection.map((i) => letters[i]).join(''));
    onChange([]);
  };

  const line = selection.map((i) => `${pts[i].x},${pts[i].y}`).join(' ');
  const tail = selection.length && cursor ? cursor : null;

  return (
    <div className="wheel-wrap">
      <div
        className="wheel"
        ref={ref}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div className="wheel-disc" />
        <svg className="wheel-svg" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          {selection.length > 0 && (
            <polyline
              points={line}
              fill="none"
              stroke="var(--honey)"
              strokeWidth="0.022"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {tail && (
            <line
              x1={pts[selection[selection.length - 1]].x}
              y1={pts[selection[selection.length - 1]].y}
              x2={tail.x}
              y2={tail.y}
              stroke="var(--honey)"
              strokeWidth="0.022"
              strokeLinecap="round"
              opacity="0.55"
            />
          )}
        </svg>

        {letters.map((ch, i) => (
          <div
            key={i}
            className={selection.includes(i) ? 'letter on' : 'letter'}
            style={{
              left: `${(pts[i].x - TILE / 2) * 100}%`,
              top: `${(pts[i].y - TILE / 2) * 100}%`,
              width: `${TILE * 100}%`,
              height: `${TILE * 100}%`,
              fontSize: `calc(min(78vw, 300px) * ${TILE * 0.55})`
            }}
          >
            {ch.toUpperCase()}
          </div>
        ))}

        <button className="shuffle" onClick={onShuffle} aria-label="Shuffle letters">
          <ShuffleIcon />
        </button>
      </div>
    </div>
  );
}
