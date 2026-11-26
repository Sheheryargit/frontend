import {
  BrainCircuit, Inbox, MessageSquareText, ScanText, ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PhaseId = 'receive' | 'read' | 'extract' | 'validate' | 'compose';

export const PHASES: {
  id: PhaseId; label: string; cue: string; icon: LucideIcon; ms: number;
}[] = [
  { id: 'receive',  label: 'Receiving', cue: 'Taking in your message',            icon: Inbox,             ms: 260 },
  { id: 'read',     label: 'Reading',   cue: 'Reading for intent and entities',   icon: ScanText,          ms: 280 },
  { id: 'extract',  label: 'Extracting',cue: 'Pulling the details apart',         icon: BrainCircuit,      ms: 0   },
  { id: 'validate', label: 'Checking',  cue: 'Checking scope and constraints',    icon: ShieldCheck,       ms: 240 },
  { id: 'compose',  label: 'Replying',  cue: 'Composing the reply',               icon: MessageSquareText, ms: 160 },
];

export const phaseIndex = (id: PhaseId | null) =>
  id ? PHASES.findIndex(p => p.id === id) : -1;

/** Demo dwell keeps individual field events legible at standard pace. */
export const FIELD_DWELL = 170;
export const FIELD_DWELL_SAMPLE = 145;
export const READ_DWELL = PHASES[1].ms;

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
