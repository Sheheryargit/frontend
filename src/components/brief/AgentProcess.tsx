import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';
import { PHASES } from '../../features/agentPhases';
import { ease, dur } from '../../lib/motion';

type Props = {
  /** 0-4, matching PHASES. Negative hides the strip. */
  index: number;
  /** what the agent is doing right now, e.g. the detail it is extracting */
  detail?: string;
  captured?: number;
};

/**
 * The agent's working state, as five named phases rather than one spinner.
 * Receiving → Reading → Extracting → Checking → Replying. The strip shows
 * which phase is live, which are done, and what is happening inside the
 * current one — so a pause reads as work rather than as a stall.
 */
export function AgentProcess({ index, detail, captured }: Props) {
  const still = useReducedMotion();
  const current = Math.max(0, Math.min(index, PHASES.length - 1));
  if (index < 0) return null;

  return (
    <motion.div
      className="agent-process"
      initial={{ opacity: 0, y: still ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: still ? 0 : -6 }}
      transition={{ duration: dur.base, ease: ease.signature }}
      role="status"
      aria-live="polite"
      aria-label={`Agent ${PHASES[current].label}: ${detail || PHASES[current].cue}`}
    >
      <ol className="agent-process-rail">
        {PHASES.map((p, i) => {
          const state = i < current ? 'done' : i === current ? 'live' : 'ahead';
          const Icon = p.icon;
          return (
            <li key={p.id} className="agent-phase" data-state={state}>
              <span className="agent-phase-dot">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={state}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                  >
                    {state === 'done' ? <Check />
                      : state === 'live' ? <Icon />
                      : <Icon />}
                  </motion.span>
                </AnimatePresence>
                {state === 'live' && !still && <i className="agent-phase-ring" />}
              </span>
              <span className="agent-phase-label">{p.label}</span>
            </li>
          );
        })}
      </ol>

      <div className="agent-process-cue">
        <Loader2 className="animate-spin motion-keep" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={detail || PHASES[current].id}
            initial={{ opacity: 0, y: still ? 0 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: still ? 0 : -5 }}
            transition={{ duration: 0.18, ease: ease.out }}
          >
            {detail || PHASES[current].cue}
          </motion.span>
        </AnimatePresence>
        {typeof captured === 'number' && captured > 0 && (
          <span className="agent-process-count num">{captured}/8</span>
        )}
      </div>
    </motion.div>
  );
}
