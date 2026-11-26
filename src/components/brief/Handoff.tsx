import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { FlybuysAgentMark } from '../product/FlybuysAgentMark';
import { ease } from '../../lib/motion';

export type HandoffStyle = 'dissolve' | 'aperture' | 'wipe' | 'bloom';

/** Total ms each style needs, so the caller can time the view switch. */
export const HANDOFF_TIMING: Record<HandoffStyle, { swap: number; total: number }> = {
  dissolve: { swap: 155, total: 420 },
  aperture: { swap: 266, total: 610 },
  wipe:     { swap: 240, total: 535 },
  bloom:    { swap: 205, total: 560 },
};

/**
 * The hand-off from processing to the canvas.
 *
 * Four treatments, because which one feels right is a matter of taste rather
 * than correctness. Each holds a neutral field for a beat in the middle — the
 * canvas mounts behind it there, so it is already settling when the veil
 * clears and the screen appears to *enrich* rather than to swap.
 */
export function Handoff({ active, style = 'dissolve' }: { active: boolean; style?: HandoffStyle }) {
  const still = useReducedMotion();
  if (still) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div className="handoff" data-style={style} aria-hidden="true"
          initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>

          {/* ---- dissolve: a neutral field, held, then lifted ---- */}
          {style === 'dissolve' && (
            <>
              <motion.span className="hx-veil"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.42, ease: 'linear', times: [0, 0.22, 0.55, 1] }}
              />
              <motion.span className="hx-mark"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 1.06] }}
                transition={{ duration: 0.34, ease: ease.signature, times: [0, 0.3, 0.6, 1] }}
              >
                <FlybuysAgentMark />
              </motion.span>
            </>
          )}

          {/* ---- aperture: light gathers inward, then opens like a shutter ---- */}
          {style === 'aperture' && (
            <>
              <motion.span className="hx-veil"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.6, ease: 'linear', times: [0, 0.2, 0.5, 1] }}
              />
              {[0, 0.04, 0.08].map((d, i) => (
                <motion.span key={i} className="hx-gather"
                  initial={{ scale: 9, opacity: 0 }}
                  animate={{ scale: 0.15, opacity: [0, 0.7, 0] }}
                  transition={{ duration: 0.29, ease: ease.signature, delay: d }}
                />
              ))}
              <motion.span className="hx-iris"
                initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                animate={{ clipPath: 'circle(78% at 50% 50%)' }}
                transition={{ duration: 0.35, ease: ease.signature, delay: 0.25 }}
              />
            </>
          )}

          {/* ---- wipe: a soft band crosses, leaving the canvas behind it ---- */}
          {style === 'wipe' && (
            <>
              <motion.span className="hx-panel"
                initial={{ x: '-102%' }}
                animate={{ x: ['-102%', '0%', '0%', '102%'] }}
                transition={{ duration: 0.53, ease: ease.signature, times: [0, 0.34, 0.5, 1] }}
              />
              <motion.span className="hx-edge"
                initial={{ x: '-102%' }}
                animate={{ x: ['-102%', '2%', '2%', '104%'] }}
                transition={{ duration: 0.53, ease: ease.signature, times: [0, 0.34, 0.5, 1] }}
              />
            </>
          )}

          {/* ---- bloom: the original outward burst ---- */}
          {style === 'bloom' && (
            <>
              <motion.span className="hx-core"
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 1, 0.75], opacity: [0, 1, 0.9] }}
                transition={{ duration: 0.25, ease: ease.signature, times: [0, 0.6, 1] }}
              />
              <motion.span className="hx-bloom"
                initial={{ scale: 0, opacity: 0.85 }}
                animate={{ scale: 22, opacity: 0 }}
                transition={{ duration: 0.37, ease: ease.signature, delay: 0.18 }}
              />
              {[0.20, 0.25].map((d, i) => (
                <motion.span key={i} className="hx-ring"
                  initial={{ scale: 0.1, opacity: 0.55 }}
                  animate={{ scale: 16, opacity: 0 }}
                  transition={{ duration: 0.31, ease: ease.signature, delay: d }}
                />
              ))}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
