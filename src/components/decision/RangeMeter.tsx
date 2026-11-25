import { motion, useReducedMotion } from 'motion/react';
import { money } from '../../model';
import { ease } from '../../lib/motion';

export type Fit = 'within' | 'risk' | 'over' | 'unknown';

type Props = {
  low: number; mid: number; high: number;
  ceiling: number | null;
  fit: Fit;
  format?: (n: number) => string;
  label?: string;
};

/**
 * A three-point estimate against its ceiling.
 *
 * The model computes low / central / high and the previous charts rendered
 * only the central value, so the uncertainty the product insists on was
 * invisible exactly where it decides something. Here the band is the subject:
 * an option whose CENTRAL cost fits but whose HIGH crosses the ceiling is
 * drawn as at risk, because that is what it is.
 */
export function RangeMeter({ low, mid, high, ceiling, fit, format = money, label }: Props) {
  const still = useReducedMotion();
  const max = Math.max(high, ceiling ?? 0) * 1.12 || 1;
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;

  return (
    <div className="meter" data-fit={fit}>
      {label && <span className="meter-label">{label}</span>}

      <div className="meter-track" role="img"
        aria-label={`${format(mid)} central, range ${format(low)} to ${format(high)}${ceiling ? `, ceiling ${format(ceiling)}` : ''}`}>
        <motion.span
          className="meter-band"
          initial={still ? false : { left: pct(mid), width: 0 }}
          animate={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }}
          transition={{ duration: 0.72, ease: ease.signature }}
        />
        <motion.span
          className="meter-mid"
          initial={still ? false : { left: '0%' }}
          animate={{ left: pct(mid) }}
          transition={{ duration: 0.72, ease: ease.signature }}
        />
        {ceiling !== null && (
          <span className="meter-ceiling" style={{ left: pct(ceiling) }}>
            <i /><em>ceiling</em>
          </span>
        )}
      </div>

      <div className="meter-scale">
        <span>{format(low)}<small>low</small></span>
        <strong className="num">{format(mid)}<small>central</small></strong>
        <span>{format(high)}<small>high</small></span>
      </div>

      <p className="meter-verdict">
        {fit === 'within' && <>High estimate sits inside the ceiling.</>}
        {fit === 'risk' && <>Central estimate fits, but the <strong>high estimate crosses the ceiling</strong>.</>}
        {fit === 'over' && <>Central estimate is already over the ceiling.</>}
        {fit === 'unknown' && <>No confirmed budget to check against.</>}
      </p>
    </div>
  );
}
