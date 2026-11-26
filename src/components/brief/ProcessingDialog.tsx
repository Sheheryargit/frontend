import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { FlybuysAgentMark } from '../product/FlybuysAgentMark';
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
                transition={{ duration: still ? 0 : 0.22, ease: ease.signature }}
              />
            </svg>
            <FlybuysAgentMark size="orbit" active={!collapsing && !ready} className="processing-agent-mark" />
          </div>

          <div className="processing-text">
            <span className="processing-eyebrow"><FlybuysAgentMark />Brief agent</span>
            <strong role="status">{collapsing ? 'Brief assembled' : detail || PHASES[idx].cue}</strong>
            <span className="processing-count num">{captured} of 8 mapped</span>
          </div>
        </div>

        <ol className="processing-phases">
          {PHASES.map((p, i) => {
            const PhaseIcon = i < idx ? Check : p.icon;
            return (
              <li key={p.id} aria-current={i === idx ? 'step' : undefined}
                data-state={i < idx ? 'done' : i === idx ? 'live' : 'ahead'}>
                <PhaseIcon size={14} aria-hidden="true" />{p.label}
              </li>
            );
          })}
        </ol>

        <motion.div
          className="processing-stage"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: dur.base, ease: ease.out }}
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
              transition={{ duration: 0.21, ease: ease.signature }}
            >
              <span className="processing-ready-mark"><Check /></span>
              <div>
                <strong>Everything the run needs is here</strong>
                <small>All eight details captured and inside scope.</small>
              </div>
              <Button onClick={onGenerate} className="generate-button" data-armed="true">
                <FlybuysAgentMark />Generate recommendation
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
