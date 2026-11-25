import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { briefFields } from '../../data';
import type { Brief, BriefKey } from '../../data';
import { ease } from '../../lib/motion';
import { DETAIL } from './details';

const W = 760, H = 330;
const SRC = { x: 74, y: H / 2 };
const COL = 352;                       // the fan's landing column
const TGT = { x: 688, y: 108 };        // assembled brief
const ASK = { x: 688, y: 248 };        // what the agent still needs from you
const TOP = 30, GAP = (H - TOP * 2) / (briefFields.length - 1);

const nodeY = (i: number) => TOP + i * GAP;

/** Source → detail: a bezier that leaves flat and arrives flat. */
const fanPath = (i: number) => {
  const y = nodeY(i);
  return `M${SRC.x} ${SRC.y} C${SRC.x + 120} ${SRC.y} ${COL - 120} ${y} ${COL} ${y}`;
};
/** Detail → wherever it ends up: the brief if captured, the ask if not. */
const joinPath = (i: number, to: { x: number; y: number }) => {
  const y = nodeY(i);
  return `M${COL + 150} ${y} C${COL + 250} ${y} ${to.x - 110} ${to.y} ${to.x} ${to.y}`;
};

type Props = {
  brief: Brief;
  active: BriefKey | null;
  captured: number;
  phaseIndex: number;
  /** the run has finished: draw everything into the target */
  collapsing?: boolean;
};

const MISSING_HUE = '72';   // amber — "needs you", never red

/**
 * The agent's work as a horizontal pipeline: your message on the left, the
 * eight details fanning out of it, the assembled brief on the right.
 *
 * Taken from the Control AI reference — a source orb fanning along beziers
 * into tiles, with the live branch blooming and a packet running the path.
 * A detail is only connected to the brief once it has actually been captured,
 * so the diagram is a readout of state rather than decoration.
 */
export function ProcessingPipeline({ brief, active, captured, phaseIndex, collapsing = false }: Props) {
  const still = useReducedMotion();
  const reading = phaseIndex <= 1;
  /* Once extraction is over we know what is missing, so the unfilled branches
     stop hanging and route to the ask node instead of simply staying dim. */
  const resolved = phaseIndex >= 3 || collapsing;
  const missing = briefFields.filter(f => !brief[f.key]?.trim()).length;

  return (
    <div className="ppipe" data-collapsing={collapsing || undefined} role="img" aria-label={`Mapping details: ${captured} of ${briefFields.length} captured`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="ppipe-bloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <radialGradient id="ppipe-core">
            <stop offset="0%" stopColor="var(--a-3)" />
            <stop offset="100%" stopColor="var(--a-4)" />
          </radialGradient>
        </defs>

        {/* fan + join, one branch per detail */}
        {briefFields.map((f, i) => {
          const on = !!brief[f.key]?.trim();
          const live = active === f.key;
          const needs = !on && resolved;
          const hue = needs ? MISSING_HUE : String(DETAIL[f.key].hue);
          const state = live ? 'live' : on ? 'done' : needs ? 'needs' : 'idle';
          return (
            <g key={f.key} className="ppipe-branch" data-state={state} style={{ ['--d-hue' as string]: hue }}>
              {(on || live || needs) && <path d={fanPath(i)} className="ppipe-halo" filter="url(#ppipe-bloom)" />}
              <motion.path
                d={fanPath(i)} className="ppipe-line"
                initial={still ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.85, ease: ease.signature, delay: still ? 0 : 0.25 + i * 0.22 }}
              />
              {on && (
                <motion.path
                  d={joinPath(i, TGT)} className="ppipe-line ppipe-line--join"
                  initial={still ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: ease.signature }}
                />
              )}
              {needs && (
                <motion.path
                  d={joinPath(i, ASK)} className="ppipe-line ppipe-line--join ppipe-line--ask"
                  initial={still ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: ease.signature, delay: i * 0.07 }}
                />
              )}
              {live && !still && (
                <circle r="3.4" className="ppipe-packet">
                  <animateMotion dur="0.95s" repeatCount="indefinite" path={fanPath(i)} />
                </circle>
              )}
            </g>
          );
        })}

        {/* source */}
        <g className="ppipe-src" data-reading={reading || undefined}>
          <circle cx={SRC.x} cy={SRC.y} r="32" className="ppipe-src-halo" filter="url(#ppipe-bloom)" />
          {!still && (
            <>
              <circle cx={SRC.x} cy={SRC.y} r="29" className="ppipe-orbit ppipe-orbit--out"
                style={{ transformOrigin: `${SRC.x}px ${SRC.y}px` }} />
              <circle cx={SRC.x} cy={SRC.y} r="24" className="ppipe-orbit ppipe-orbit--in"
                style={{ transformOrigin: `${SRC.x}px ${SRC.y}px` }} />
            </>
          )}
          <circle cx={SRC.x} cy={SRC.y} r="17" fill="url(#ppipe-core)" />
          {!still && <circle cx={SRC.x} cy={SRC.y} r="17" className="ppipe-src-ring" />}
        </g>

        {/* assembled brief */}
        <g className="ppipe-tgt" data-complete={captured === briefFields.length || undefined}>
          <circle cx={TGT.x} cy={TGT.y} r={18 + (captured / briefFields.length) * 8} className="ppipe-tgt-core" />
          <circle cx={TGT.x} cy={TGT.y} r="27" className="ppipe-tgt-ring" style={{ transformOrigin: `${TGT.x}px ${TGT.y}px` }} />
          <text x={TGT.x} y={TGT.y + 4} textAnchor="middle" className="ppipe-tgt-count">{captured}</text>
        </g>

        {/* what the agent still needs from you */}
        {resolved && missing > 0 && (
          <g className="ppipe-ask">
            <circle cx={ASK.x} cy={ASK.y} r={18 + (missing / briefFields.length) * 8} className="ppipe-ask-core" />
            <circle cx={ASK.x} cy={ASK.y} r="27" className="ppipe-ask-ring" style={{ transformOrigin: `${ASK.x}px ${ASK.y}px` }} />
            <text x={ASK.x} y={ASK.y + 4} textAnchor="middle" className="ppipe-ask-count">{missing}</text>
          </g>
        )}
      </svg>

      {/* the detail nodes sit above the svg so their type stays crisp */}
      <ul className="ppipe-nodes">
        {briefFields.map((f, i) => {
          const on = !!brief[f.key]?.trim();
          const live = active === f.key;
          const Glyph = DETAIL[f.key].icon;
          return (
            <li
              key={f.key}
              className="ppipe-node"
              data-state={live ? 'live' : on ? 'done' : resolved ? 'needs' : 'idle'}
              style={{
                ['--d-hue' as string]: (!brief[f.key]?.trim() && resolved) ? MISSING_HUE : String(DETAIL[f.key].hue),
                left: `${((collapsing ? (brief[f.key]?.trim() ? TGT.x : ASK.x) : COL) / W) * 100}%`,
                top: `${((collapsing ? (brief[f.key]?.trim() ? TGT.y : ASK.y) : nodeY(i)) / H) * 100}%`,
                transitionDelay: collapsing && !still ? `${i * 42}ms` : undefined,
              }}
            >
              <span className="ppipe-node-dot">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={live ? 'live' : on ? 'done' : 'idle'}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                  >
                    {on ? <Check /> : <Glyph />}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="ppipe-node-label">{DETAIL[f.key].short}</span>
              <AnimatePresence>
                {live && (
                  <motion.span
                    className="ppipe-node-state"
                    initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: ease.out }}
                  >
                    adding
                  </motion.span>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      <span className="ppipe-cap ppipe-cap--src">your message</span>
      <span className="ppipe-cap ppipe-cap--tgt">campaign brief</span>
      {resolved && missing > 0 && (
        <span className="ppipe-cap ppipe-cap--ask">your input required</span>
      )}
    </div>
  );
}
