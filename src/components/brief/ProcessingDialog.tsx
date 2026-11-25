import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { PHASES } from '../../features/agentPhases';
import { ease, dur } from '../../lib/motion';
import type { FeedItem } from './ActivityFeed';
import { ProcessingPipeline } from './ProcessingPipeline';
import type { Brief, BriefKey } from '../../data';

const RING = 2 * Math.PI * 26;

type Props = {
  open: boolean;
  phase: number;
  detail: string;
  captured: number;
  items: FeedItem[];
  brief: Brief;
  active: BriefKey | null;
  /** the run has finished; play the collapse before handing off */
  collapsing?: boolean;
  /** every detail captured and in scope — offer the run from here */
  ready?: boolean;
  onGenerate?: () => void;
  onCancel: () => void;
};

/**
 * What the agent is doing, while it is doing it.
 *
 * The brief used to be captured behind a jump to the next screen, so the work
 * was invisible: you pressed enter and arrived somewhere finished. This holds
 * you here until the work is actually done — a ring for overall progress, the
 * named phase, and the running "adding… done" feed underneath.
 */
export function ProcessingDialog({ open, phase, detail, captured, items, brief, active, collapsing = false, ready = false, onGenerate, onCancel }: Props) {
  const still = useReducedMotion();
  const idx = Math.max(0, Math.min(phase, PHASES.length - 1));
  const Icon = PHASES[idx].icon;
  const pct = captured / 8;

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onCancel(); }}>
      <DialogContent className="processing" data-collapsing={collapsing || undefined} showCloseButton={false}>
        <DialogTitle className="sr-only">Processing your brief</DialogTitle>
        <DialogDescription className="sr-only">
          The agent is reading your message and mapping details into the campaign brief.
        </DialogDescription>

        <div className="processing-head">
          <div className="processing-ring">
            <svg viewBox="0 0 60 60" aria-hidden="true">
              <circle className="processing-track" cx="30" cy="30" r="26" />
              <motion.circle
                className="processing-fill" cx="30" cy="30" r="26"
                strokeDasharray={RING}
                animate={{ strokeDashoffset: RING * (1 - pct) }}
                transition={{ duration: 0.76, ease: ease.signature }}
              />
            </svg>
            <span className="processing-orb">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.5, rotate: still ? 0 : -25 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                >
                  <Icon />
                </motion.span>
              </AnimatePresence>
              {!still && <i className="processing-halo" />}
            </span>
          </div>

          <div className="processing-text">
            <span className="processing-eyebrow"><Sparkles />Brief agent</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.strong
                key={detail || PHASES[idx].id}
                initial={{ opacity: 0, y: still ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: still ? 0 : -8 }}
                transition={{ duration: 0.22, ease: ease.signature }}
              >
                {collapsing ? 'Brief assembled' : detail || PHASES[idx].cue}
              </motion.strong>
            </AnimatePresence>
            <span className="processing-count num">{captured} of 8 mapped</span>
          </div>
        </div>

        <ol className="processing-phases">
          {PHASES.map((p, i) => (
            <li key={p.id} data-state={i < idx ? 'done' : i === idx ? 'live' : 'ahead'}>
              <i />{p.label}
            </li>
          ))}
        </ol>

        <motion.div
          className="processing-stage"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: dur.base, ease: ease.out, delay: 0.1 }}
        >
          <ProcessingPipeline brief={brief} active={active} captured={captured} phaseIndex={idx} collapsing={collapsing} />
        </motion.div>

        <div className="processing-ticker" aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.slice(-2).map(it => (
              <motion.span
                key={it.id}
                data-state={it.state}
                initial={{ opacity: 0, y: still ? 0 : 12 }}
                animate={{ opacity: it.state === 'adding' ? 1 : 0.45, y: 0 }}
                exit={{ opacity: 0, y: still ? 0 : -12 }}
                transition={{ duration: 0.3, ease: ease.signature }}
              >
                {it.state === 'done' ? '✓ ' : ''}{it.label}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {ready && (
            <motion.div
              className="processing-ready"
              initial={{ opacity: 0, y: still ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.46, ease: ease.signature }}
            >
              <span className="processing-ready-mark"><Check /></span>
              <div>
                <strong>Everything the run needs is here</strong>
                <small>All eight details captured and inside scope.</small>
              </div>
              <Button onClick={onGenerate} className="generate-button" data-armed="true">
                <Sparkles />Generate recommendation
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="processing-foot">
          <span>Local agent simulation · nothing leaves this browser</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {ready ? 'Review the brief first' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
