import {
  BrainCircuit, Inbox, MessageSquareText, ScanText, ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * The agent works in phases, and each one is shown.
 *
 * Before this, capture was ~3.7s of a single undifferentiated "working" state:
 * the agent appeared to stall, then everything landed at once. Nothing
 * conveyed that it had *received* your message, *read* it, pulled details out,
 * checked them, and only then replied. The durations below are deliberate —
 * they are what makes the work legible, not latency we are faking for effect.
 * Every one is skipped under prefers-reduced-motion via `pace()`.
 */
export type PhaseId = 'receive' | 'read' | 'extract' | 'validate' | 'compose';

export const PHASES: {
  id: PhaseId; label: string; cue: string; icon: LucideIcon; ms: number;
}[] = [
  { id: 'receive',  label: 'Receiving', cue: 'Taking in your message',            icon: Inbox,             ms: 420 },
  { id: 'read',     label: 'Reading',   cue: 'Reading for intent and entities',   icon: ScanText,          ms: 1100 },
  { id: 'extract',  label: 'Extracting',cue: 'Pulling the details apart',         icon: BrainCircuit,      ms: 0   },
  { id: 'validate', label: 'Checking',  cue: 'Checking scope and constraints',    icon: ShieldCheck,       ms: 640 },
  { id: 'compose',  label: 'Replying',  cue: 'Composing the reply',               icon: MessageSquareText, ms: 560 },
];

export const phaseIndex = (id: PhaseId | null) =>
  id ? PHASES.findIndex(p => p.id === id) : -1;

/** Per-field dwell while extracting, so each detail is seen to land. */
/* A detail has to be seen to land. At 520ms four fields were over in 1.5s,
   which read as instant. These are deliberately unhurried. */
export const FIELD_DWELL = 980;
export const FIELD_DWELL_SAMPLE = 720;

/** Dwell on each named phase so it is actually readable. */
export const READ_DWELL = 1100;
export const SETTLE_DWELL = 560;

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** User-set tempo, from Settings. Reduced motion still wins outright. */
const TEMPO: Record<string, number> = { relaxed: 1.35, standard: 1, brisk: 0.6 };

export const pace = (ms: number) => {
  if (reduced()) return Math.min(ms, 60);
  const key = typeof document !== 'undefined' ? document.documentElement.dataset.pace : undefined;
  return Math.round(ms * (TEMPO[key ?? 'standard'] ?? 1));
};

export const hold = (ms: number) => new Promise<void>(r => setTimeout(r, pace(ms)));
