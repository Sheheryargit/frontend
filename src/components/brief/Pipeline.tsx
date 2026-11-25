import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';
import { briefFields } from '../../data';
import type { Brief, BriefKey } from '../../data';
import { ease, dur } from '../../lib/motion';
import { DETAIL } from './details';

export type NodeState = 'done' | 'active' | 'sensed' | 'idle';

export function stateOf(
  key: BriefKey, brief: Brief, sensed: BriefKey[], active: BriefKey | null,
): NodeState {
  if (active === key) return 'active';
  if (brief[key]?.trim()) return 'done';
  if (sensed.includes(key)) return 'sensed';
  return 'idle';
}

type Props = {
  brief: Brief;
  sensed?: BriefKey[];
  active?: BriefKey | null;
  orientation: 'horizontal' | 'vertical';
  /** vertical only: render the value, and let the row be opened for editing */
  renderValue?: (key: BriefKey, state: NodeState) => React.ReactNode;
  onOpen?: (key: BriefKey) => void;
  openKey?: BriefKey | null;
};

/**
 * The capture pipeline.
 *
 * Eight stages on a single rail. The rail behind each node is filled when that
 * stage is complete, so progress is legible as distance travelled rather than
 * as a count — and a pulse runs the rail while the agent is mid-capture, which
 * is what makes it read as a pipeline rather than a checklist.
 */
export function Pipeline({
  brief, sensed = [], active = null, orientation, renderValue, onOpen, openKey,
}: Props) {
  const still = useReducedMotion();
  const done = briefFields.filter(f => brief[f.key]?.trim()).length;
  const pct = (done / briefFields.length) * 100;

  return (
    <div className={`pipe pipe--${orientation}`} data-busy={active ? 'true' : undefined}>
      <div className="pipe-rail" aria-hidden="true">
        <motion.span
          className="pipe-rail-fill"
          animate={orientation === 'horizontal' ? { width: `${pct}%` } : { height: `${pct}%` }}
          transition={{ duration: dur.panel, ease: ease.signature }}
        />
        {active && !still && <span className="pipe-rail-pulse" />}
      </div>

      <ol className="pipe-nodes">
        {briefFields.map((f, i) => {
          const st = stateOf(f.key, brief, sensed, active);
          const G = DETAIL[f.key].icon;
          const open = openKey === f.key;
          return (
            <li key={f.key} className="pipe-node" data-state={st} data-open={open || undefined}>
              <motion.button
                type="button"
                className="pipe-dot"
                aria-label={`${f.label}: ${st === 'done' ? 'captured' : st === 'active' ? 'capturing' : st === 'sensed' ? 'detected' : 'not yet captured'}`}
                onClick={onOpen ? () => onOpen(f.key) : undefined}
                disabled={!onOpen}
                animate={st === 'sensed' && !still ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={{ duration: 0.7, ease: ease.signature }}
                whileHover={onOpen && !still ? { scale: 1.08 } : {}}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={st}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                  >
                    {st === 'done' ? <Check />
                      : st === 'active' ? <Loader2 className="animate-spin motion-keep" />
                      : <G />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              <div className="pipe-text">
                <span className="pipe-label">
                  {orientation === 'horizontal' ? DETAIL[f.key].short : f.label}
                </span>
                {orientation === 'vertical' && (
                  <span className="pipe-value">{renderValue?.(f.key, st)}</span>
                )}
              </div>

              {orientation === 'horizontal' && i < briefFields.length - 1 && (
                <span className="pipe-gap" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
