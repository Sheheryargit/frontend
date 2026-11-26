import { FlybuysAgentMark } from '../product/FlybuysAgentMark';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Check, Info, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { briefFields } from '../../data';
import type { Brief, BriefKey } from '../../data';
import { assumptionFor } from '../../features/briefAgent';
import { ease, dur } from '../../lib/motion';
import { DETAIL } from './details';
import { statusOf, reasonFor } from './briefStatus';

const HELP: Partial<Record<BriefKey, string>> = {
  partner:     'Only Partner A has data wired up in this demonstration.',
  type:        'Repeat purchase is the only type with validated evidence behind it.',
  objective:   'The more specific this is, the better the historical matches.',
  target:      'Three audiences can be sized: lapsing regulars, infrequent shoppers, new members.',
  timing:      'A start date and a duration are enough. "Not decided" is recorded as unconfirmed.',
  budget:      'A hard ceiling. The high estimate is checked against it, not the midpoint.',
  offerPref:   'Single-shop bonus, multi-visit spend & get, or a weekly streak.',
  constraints: 'Without a stated minimum the demo assumes a 2,500-member floor.',
};

type Props = {
  field: BriefKey;
  brief: Brief;
  onCommit: (key: BriefKey, value: string) => void;
  onClose: () => void;
};

/**
 * One detail, edited properly.
 *
 * The previous pattern expanded a control inside a 380px scrolling column,
 * which left every editor cramped and inconsistently sized. This takes the
 * whole panel for one detail: a control at a usable size, the reason it
 * matters, and a visible validation pass on save rather than a silent commit.
 */
export function DetailEditor({ field, brief, onCommit, onClose }: Props) {
  const still = useReducedMotion();
  const f = briefFields.find(x => x.key === field)!;
  const D = DETAIL[field];
  const [value, setValue] = useState(brief[field] || '');
  const [checking, setChecking] = useState(false);
  const [filling, setFilling] = useState(false);
  const firstRef = useRef<HTMLDivElement>(null);
  const dirty = (brief[field] || '') !== value;
  const suggestion = assumptionFor(field);

  useEffect(() => {
    firstRef.current?.querySelector<HTMLElement>('input, textarea, [role="combobox"]')?.focus();
  }, []);

  /* The agent's value is not silently pre-selected — it is typed in, so you
     see what it chose before you accept it. */
  async function suggest() {
    if (!suggestion || filling) return;
    setFilling(true);
    if (still) { setValue(suggestion.value); setFilling(false); return; }
    setValue('');
    for (let i = 1; i <= suggestion.value.length; i++) {
      setValue(suggestion.value.slice(0, i));
      await new Promise(r => setTimeout(r, 14));
    }
    setFilling(false);
  }

  async function save() {
    if (checking) return;
    setChecking(true);
    await new Promise(r => setTimeout(r, still ? 60 : 760));
    onCommit(field, value.trim());
    setChecking(false);
    onClose();
  }

  /* status the value would resolve to, previewed live */
  const preview = statusOf(field, { ...brief, [field]: value });
  const previewReason = reasonFor(field, { ...brief, [field]: value });

  const control = () => {
    if (field === 'type') return (
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="Campaign type" className="editor-control">
          <SelectValue placeholder="Select a campaign type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Repeat purchase">Repeat purchase</SelectItem>
          <SelectItem value="Basket build">Basket build · needs evidence</SelectItem>
          <SelectItem value="Win-back">Win-back · needs evidence</SelectItem>
        </SelectContent>
      </Select>
    );
    if (field === 'partner') return (
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger aria-label="Partner" className="editor-control">
          <SelectValue placeholder="Select partner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Partner A (supermarket)">Partner A (supermarket)</SelectItem>
          <SelectItem value="Partner B" disabled>Partner B · unavailable</SelectItem>
        </SelectContent>
      </Select>
    );
    if (field === 'objective' || field === 'constraints') return (
      <Textarea
        className="editor-control" aria-label={f.label} value={value} rows={5}
        placeholder={f.placeholder} onChange={e => setValue(e.target.value)}
      />
    );
    return (
      <Input
        className="editor-control" aria-label={f.label} value={value}
        placeholder={f.placeholder} onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); }}
      />
    );
  };

  return (
    <motion.div
      className="editor"
      style={{ ['--d-hue' as string]: String(D.hue) }}
      initial={{ opacity: 0, x: still ? 0 : 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: still ? 0 : 28 }}
      transition={{ duration: dur.panel, ease: ease.signature }}
    >
      <button className="editor-back" onClick={onClose}>
        <ArrowLeft />Back to the brief
      </button>

      <header className="editor-head">
        <span className="editor-glyph"><D.icon /></span>
        <div>
          <h3>{f.label}</h3>
          <p>{D.blurb}</p>
        </div>
      </header>

      <div className="editor-field" ref={firstRef}>
        {control()}
        {filling && <span className="editor-caret" aria-hidden="true" />}
      </div>

      {suggestion && (
        <button className="editor-suggest" onClick={suggest} disabled={filling}>
          <FlybuysAgentMark />
          {filling ? 'Filling…' : 'Let the agent suggest a value'}
        </button>
      )}

      {HELP[field] && (
        <p className="editor-help"><Info />{HELP[field]}</p>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {value.trim() && (
          <motion.div
            key={preview}
            className="editor-preview" data-status={preview}
            initial={{ opacity: 0, y: still ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: ease.out }}
          >
            <span className="editor-preview-dot" />
            {preview === 'ready'
              ? 'In scope — this can be used'
              : previewReason ?? 'Needs a second look'}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="editor-foot">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={checking}>Cancel</Button>
        <Button onClick={save} disabled={!dirty || checking || !value.trim()}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={checking ? 'checking' : 'idle'}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: ease.out }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
            >
              {checking
                ? <><Loader2 className="animate-spin motion-keep" />Checking scope…</>
                : <><Check />Save detail</>}
            </motion.span>
          </AnimatePresence>
        </Button>
      </footer>
    </motion.div>
  );
}
