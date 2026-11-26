import { FlybuysAgentMark } from '../product/FlybuysAgentMark';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, PanelRight, Pencil, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { briefFields } from '../../data';
import type { Brief, BriefKey } from '../../data';
import { ease, dur, modalChoreography } from '../../lib/motion';
import { Pipeline, stateOf } from './Pipeline';

type Props = {
  open: boolean;
  brief: Brief;
  fieldOrigins: Partial<Record<BriefKey, 'agent' | 'edited'>>;
  activeField: BriefKey | null;
  sensed: BriefKey[];
  captured: number;
  working: boolean;
  nextPrompt?: string;
  valid: boolean;
  thread: ReactNode;
  onField: (key: BriefKey, value: string) => void;
  onGenerate: () => void;
  onEdit: () => void;
};

/**
 * The capture console.
 *
 * Conversation on the left, the capture pipeline on the right — not a form.
 * Each stage on the rail opens in place for editing, so correcting what the
 * agent heard happens where you are looking rather than in a separate panel.
 */
export function CaptureConsole({
  open, brief, fieldOrigins, activeField, sensed, captured, working,
  nextPrompt, valid, thread, onField, onGenerate, onEdit,
}: Props) {
  const [openKey, setOpenKey] = useState<BriefKey | null>(null);
  const editRef = useRef<HTMLDivElement>(null);

  // the row that is open for editing takes focus, so the keyboard follows the eye
  useEffect(() => {
    if (!openKey) return;
    const el = editRef.current?.querySelector<HTMLElement>('input, textarea, [role="combobox"]');
    el?.focus();
  }, [openKey]);

  // a stage the agent is actively filling opens itself
  useEffect(() => { if (activeField) setOpenKey(null); }, [activeField]);

  const field = (key: BriefKey) => {
    const value = brief[key] || '';
    const f = briefFields.find(x => x.key === key)!;
    if (key === 'type') return (
      <Select value={brief.type || ''} onValueChange={v => { onField('type', v); setOpenKey(null); }}>
        <SelectTrigger aria-label="Campaign type"><SelectValue placeholder="Select a campaign type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Repeat purchase">Repeat purchase</SelectItem>
          <SelectItem value="Basket build">Basket build · needs evidence</SelectItem>
          <SelectItem value="Win-back">Win-back · needs evidence</SelectItem>
        </SelectContent>
      </Select>
    );
    if (key === 'partner') return (
      <Select value={brief.partner || ''} onValueChange={v => { onField('partner', v); setOpenKey(null); }}>
        <SelectTrigger aria-label="Partner"><SelectValue placeholder="Select partner" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Partner A (supermarket)">Partner A (supermarket)</SelectItem>
          <SelectItem value="Partner B" disabled>Partner B · unavailable</SelectItem>
        </SelectContent>
      </Select>
    );
    if (key === 'objective' || key === 'constraints') return (
      <Textarea
        aria-label={f.label} value={value} placeholder={f.placeholder}
        rows={key === 'objective' ? 3 : 2}
        onChange={e => onField(key, e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') setOpenKey(null); }}
      />
    );
    return (
      <Input
        aria-label={f.label} value={value} placeholder={f.placeholder}
        onChange={e => onField(key, e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape' || e.key === 'Enter') setOpenKey(null); }}
      />
    );
  };

  const value = (key: BriefKey) => {
    const v = brief[key]?.trim();
    const st = stateOf(key, brief, sensed, activeField);
    if (openKey === key) {
      return (
        <motion.div
          ref={editRef}
          className="pipe-edit"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: dur.base, ease: ease.signature }}
        >
          {field(key)}
          <button className="pipe-edit-close" onClick={() => setOpenKey(null)} aria-label="Done editing">
            <Check />Done
          </button>
        </motion.div>
      );
    }
    if (!v) return <span className="pipe-empty">{st === 'sensed' ? 'detected in your message' : st === 'active' ? 'capturing…' : 'not captured yet'}</span>;
    return (
      <span className="pipe-filled">
        <span>{v}</span>
        <span className="pipe-origin">
          {fieldOrigins[key] === 'edited' ? <><Pencil />edited</> : <><FlybuysAgentMark />captured</>}
        </span>
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onEdit(); }}>
      <DialogContent
        className="console"
        showCloseButton={false}
        onOpenAutoFocus={e => {
          e.preventDefault();
          const t = document.querySelector<HTMLTextAreaElement>('.console-thread textarea');
          t?.focus();
        }}
      >
        <DialogTitle className="sr-only">Capturing your campaign brief</DialogTitle>
        <DialogDescription className="sr-only">
          Answer on the left. Each stage on the right can be opened and corrected.
        </DialogDescription>

        <motion.header {...modalChoreography.content(0)} className="console-head">
          <FlybuysAgentMark size="avatar" active={working} />
          <div className="console-head-text">
            <strong>Brief agent</strong>
            <AnimatePresence mode="wait" initial={false}>
              <motion.small
                key={working ? 'busy' : nextPrompt || 'done'}
                initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.15, ease: ease.out }}
              >
                {working ? 'Capturing…' : nextPrompt ?? 'All eight stages complete'}
              </motion.small>
            </AnimatePresence>
          </div>
          <span className="console-count num" data-complete={captured === 8}>
            {captured}<i>/8</i>
          </span>
          <button className="console-close" onClick={onEdit} aria-label="Close and edit in workspace"><X /></button>
        </motion.header>

        <div className="console-body">
          <motion.div {...modalChoreography.content(1)} className="console-thread">{thread}</motion.div>

          <motion.aside {...modalChoreography.content(2)} className="console-pipe">
            <div className="console-pipe-head">
              <span className="t-overline">Capture pipeline</span>
              <span className="console-pipe-hint">Click a stage to correct it</span>
            </div>
            <Pipeline
              brief={brief}
              sensed={sensed}
              active={activeField}
              orientation="vertical"
              renderValue={value}
              openKey={openKey}
              onOpen={k => setOpenKey(openKey === k ? null : k)}
            />
          </motion.aside>
        </div>

        <motion.footer {...modalChoreography.content(3)} className="console-foot">
          <Button variant="ghost" size="sm" onClick={onEdit}><PanelRight />Edit in workspace</Button>
          <span className="console-foot-hint">
            {valid ? 'Checks audience, budget and evidence constraints.'
              : `${8 - captured} stage${8 - captured === 1 ? '' : 's'} remaining.`}
          </span>
          <Button
            onClick={onGenerate} disabled={!valid || working}
            data-armed={valid && !working ? 'true' : undefined}
            className="generate-button"
          >
            <FlybuysAgentMark />Generate recommendation
          </Button>
        </motion.footer>
      </DialogContent>
    </Dialog>
  );
}
