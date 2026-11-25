import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/** A tweened value with stable digit widths. The first render begins at the
 * real value for reduced-motion users and counts up only for visual context. */
export function AnimatedValue({ value, format }: { value: number; format: (n: number) => string }) {
  const still = useReducedMotion();
  const previous = useRef(still ? value : 0);
  const [display, setDisplay] = useState(previous.current);

  useEffect(() => {
    if (still) { previous.current = value; setDisplay(value); return; }
    const from = previous.current;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 820);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(from + (value - from) * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
      else previous.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); previous.current = value; };
  }, [value, still]);

  return <span className="animated-value">{format(display)}</span>;
}

/** Every lit dot maps to the displayed illustrative interval on a 0–30%
 * scale. It communicates range without fabricating a probability curve. */
export function DotRange({ low, mid, high }: { low: number; mid: number; high: number }) {
  const columns = 31;
  const rows = 4;
  return <div className="dot-range" role="img" aria-label={`Illustrative activation range ${(low * 100).toFixed(1)} to ${(high * 100).toFixed(1)} percent; central estimate ${(mid * 100).toFixed(1)} percent`}>
    <svg viewBox="0 0 310 48" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: columns }, (_, col) => {
        const v = col / (columns - 1) * .3;
        const inRange = v >= low - .002 && v <= high + .002;
        const central = Math.abs(v - mid) < .005;
        return Array.from({ length: rows }, (_, row) =>
          <circle key={`${col}-${row}`} cx={6 + col * 9.9} cy={6 + row * 9.4} r={central ? 2.5 : 1.9}
            className={central ? 'dot-range-center' : inRange ? 'dot-range-lit' : 'dot-range-idle'}
            style={{ animationDelay: `${Math.min(col * 18 + row * 24, 650)}ms` }} />);
      })}
    </svg>
    <div><span>0%</span><span>30%</span></div>
  </div>;
}
