import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertCircle, Check, ChevronRight, Loader2, Minus, Pencil, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { briefFields } from '../../data';
import type { Brief, BriefKey } from '../../data';
import { ease, dur, stagger } from '../../lib/motion';
import { DETAIL } from './details';
import { statusOf, reasonFor, tally } from './briefStatus';
import { DetailEditor } from './DetailEditor';
import { BriefViability } from './BriefViability';
import type { Status } from './briefStatus';

const MARK = { ready: Check, check: AlertCircle, missing: Minus } as const;

type Props = {
  brief: Brief;
  fieldOrigins: Partial<Record<BriefKey, 'agent' | 'edited'>>;
  activeField: BriefKey | null;
  /** fields that changed in the last turn, for the brief confirm flash */
  justAdded: BriefKey[];
  working: boolean;
  valid: boolean;
  onField: (key: BriefKey, value: string) => void;
  onGenerate: () => void;
  onSample: () => void;
  header?: React.ReactNode;
  notice?: React.ReactNode;
};

/**
 * The brief, as a state board.
 *
 * Every row answers one question: can this be used? Green means captured and
 * inside scope, amber means captured but not trusted, red means absent. The
 * counts at the top always add up to eight, so nothing hides.
 */
export function BriefPanel({
  brief, fieldOrigins, activeField, justAdded, working, valid,
  onField, onGenerate, onSample, header, notice,
}: Props) {
  const still = useReducedMotion();
  const [editing, setEditing] = useState<BriefKey | null>(null);
  const t = tally(brief);

  return (
    <section className="board" data-tour="brief-details">
      <header className="board-head">
        <div className="board-title">
          <h2>Campaign brief</h2>
          {header}
        </div>

        <div className="board-tally" role="status" aria-label={`${t.ready} ready, ${t.check} to check, ${t.missing} missing`}>
          {([['ready', t.ready], ['check', t.check], ['missing', t.missing]] as const).map(([k, n]) => {
            const Icon = MARK[k];
            return (
              <motion.span key={k} className="tally" data-kind={k} data-zero={n === 0 || undefined}
                animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 440, damping: 26 }}>
                <Icon /><strong className="num">{n}</strong>
                <small>{k === 'ready' ? 'ready' : k === 'check' ? 'to check' : 'missing'}</small>
              </motion.span>
            );
          })}
        </div>

        <div className="board-bar" aria-hidden="true">
          {(['ready', 'check', 'missing'] as const).map(k => (
            <motion.i key={k} data-kind={k}
              animate={{ flexGrow: Math.max(t[k], 0.001) }}
              transition={{ duration: 0.6, ease: ease.signature }} />
          ))}
        </div>
      </header>

      {notice}
      <BriefViability brief={brief} />

      <AnimatePresence mode="wait" initial={false}>
      {editing ? (
        <DetailEditor
          key={editing}
          field={editing}
          brief={brief}
          onCommit={(k, v) => onField(k, v)}
          onClose={() => setEditing(null)}
        />
      ) : (
      <motion.ol
        key="list"
        className="board-rows scroll-contain"
        initial={{ opacity: 0, x: still ? 0 : -18 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: still ? 0 : -18 }}
        transition={{ duration: dur.panel, ease: ease.signature }}
      >
        {briefFields.map((f, i) => {
          const value = brief[f.key]?.trim();
          const st: Status = activeField === f.key ? 'ready' : statusOf(f.key, brief);
          const busy = activeField === f.key;
          const added = justAdded.includes(f.key);
          const Icon = MARK[st];
          const Glyph = DETAIL[f.key].icon;
          const reason = reasonFor(f.key, brief);
          return (
            <motion.li
              key={f.key}
              className="row" data-status={busy ? 'busy' : st}
              style={{ ['--d-hue' as string]: String(DETAIL[f.key].hue) }}
              initial={{ opacity: 0, y: still ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.base, ease: ease.signature, delay: stagger(i, 0.035, 8) }}
            >
              <button
                className="row-main"
                onClick={() => setEditing(f.key)}
                aria-label={`${f.label}: ${busy ? 'capturing' : st}`}
              >
                <span className="row-rule" aria-hidden="true" />
                <span className="row-glyph"><Glyph /></span>

                <span className="row-body">
                  <span className="row-label">{f.label}</span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={value || st}
                      className="row-value"
                      initial={{ opacity: 0, y: still ? 0 : 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: still ? 0 : -4 }}
                      transition={{ duration: 0.2, ease: ease.out }}
                    >
                      {busy ? 'capturing…' : value || 'not captured'}
                    </motion.span>
                  </AnimatePresence>
                  {reason && !busy && <span className="row-reason">{reason}</span>}
                </span>

                <span className="row-right">
                  <AnimatePresence>
                    {added && (
                      <motion.span className="row-added"
                        initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: ease.out }}>
                        added
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {value && !busy && (
                    <span className="row-origin">
                      {fieldOrigins[f.key] === 'edited' ? <Pencil /> : <Sparkles />}
                    </span>
                  )}
                  <span className="row-mark">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span key={busy ? 'busy' : st}
                        initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }}
                        transition={{ type: 'spring', stiffness: 470, damping: 26 }}>
                        {busy ? <Loader2 className="animate-spin motion-keep" /> : <Icon />}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <ChevronRight className="row-chevron" />
                </span>
              </button>

            </motion.li>
          );
        })}
      </motion.ol>
      )}
      </AnimatePresence>

      <footer className="board-foot" data-tour="generate">
        <Button variant="ghost" size="sm" disabled={working} onClick={onSample}>Load sample</Button>
        <Button onClick={onGenerate} disabled={!valid || working}
          data-armed={valid && !working ? 'true' : undefined} className="generate-button">
          <Sparkles />Generate recommendation
        </Button>
        <span className="board-hint">
          {valid ? 'Checks audience, budget and evidence constraints.'
            : t.missing ? `${t.missing} missing · ${t.check} to check`
            : `${t.check} detail${t.check === 1 ? '' : 's'} need a second look`}
        </span>
      </footer>
    </section>
  );
}
