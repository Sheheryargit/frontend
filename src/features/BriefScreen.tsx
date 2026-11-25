import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp, Check, ClipboardList, Loader2, MessageSquareText,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Source, Status, Notice } from '../components/product/shared';
import { briefFields } from '../data';
import type { BriefKey } from '../data';
import type { Message, Workspace } from '../types';
import { campaignService } from '../services/campaign';
import type { SourceKey } from '../services/campaign';
import { budgetValue } from '../model';
import { ease } from '../lib/motion';
import { classify, reply, assumptionFor, wait, detect } from './briefAgent';
import { hold, FIELD_DWELL, FIELD_DWELL_SAMPLE, READ_DWELL, SETTLE_DWELL } from './agentPhases';
import { ProcessingDialog } from '../components/brief/ProcessingDialog';
import { Handoff, HANDOFF_TIMING } from '../components/brief/Handoff';
import { BriefPanel } from '../components/brief/BriefPanel';
import { Thread } from '../components/brief/Thread';
import type { HandoffStyle } from '../components/brief/Handoff';
import type { FeedItem } from '../components/brief/ActivityFeed';
import { Landing } from '../components/brief/Landing';
import { landingScenarios } from '../components/brief/landingScenarios';
import type { LandingScenario } from '../components/brief/landingScenarios';

const sampleScenario = landingScenarios.find(scenario => scenario.id === 'sample')!;
const starter = sampleScenario.prompt;



type Props = {
  workspace: Workspace;
  onField: (key: BriefKey, value: string, origin?: 'agent' | 'edited') => void;
  onMessages: (messages: Message[]) => void;
  onGenerate: () => void;
  onSource: (key: SourceKey) => void;
  onNotify: (text: string) => void;
};

export function BriefScreen({
  workspace: ws, onField, onMessages, onGenerate, onSource, onNotify,
}: Props) {
  const [draft, setDraft] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [suggestionPhase, setSuggestionPhase] = useState('');
  const [working, setWorking] = useState(false);
  const [activeField, setActiveField] = useState<BriefKey | null>(null);
  const [activity, setActivity] = useState<string[]>([]);
  const [phaseDetail, setPhaseDetail] = useState<string>('');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [handoff, setHandoff] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [handoffStyle, setHandoffStyle] = useState<HandoffStyle>('dissolve');
  const [justAdded, setJustAdded] = useState<BriefKey[]>([]);
  const [readyToRun, setReadyToRun] = useState(false);
  const readyRef = useRef(true);
  /* closeOut runs long after it was defined, so it must not read `ws.brief`
     from its own closure — by then that value predates the capture. */
  const briefRef = useRef(ws.brief);
  briefRef.current = ws.brief;
  const [processingPhase, setProcessingPhase] = useState(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Which detail changed most recently, so the row can acknowledge the edit.

  const captured = briefFields.filter(f => ws.brief[f.key]?.trim()).length;
  const next = campaignService.nextQuestion(ws.brief);
  const budget = budgetValue(ws.brief);
  const valid =
    captured === 8 && !!budget &&
    ws.brief.type === 'Repeat purchase' &&
    /partner\s*a/i.test(ws.brief.partner || '');

  type View = 'landing' | 'workbench';
  const [view, setView] = useState<View>(
    captured > 0 || ws.messages.length > 1 ? 'workbench' : 'landing',
  );
  const opening = view === 'landing';
  /** The long choreography belongs to first contact only. */
  const inCanvas = view !== 'landing';

  // "New campaign" resets the workspace but not this component, so the view has
  // to follow the workspace back to empty or the landing never returns.
  useEffect(() => {
    if (!working && captured === 0 && ws.messages.length <= 1) setView('landing');
  }, [captured, ws.messages.length, working]);

  /** First contact opens the console over the landing. */
  /** First contact hands off to the canvas. The capture then plays out there. */
  const advance = () => setView(v => (v === 'landing' ? 'workbench' : v));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [ws.messages, working, activity]);


  const capture = (key: BriefKey, value: string) => {
    if (!alive.current) return;
    const label = briefFields.find(f => f.key === key)?.label ?? key;
    setProcessingPhase(2);
    setActiveField(key);
    setPhaseDetail(`Adding ${label.toLowerCase()}`);
    setFeed(f => [
      ...f.map(i => ({ ...i, state: 'done' as const })),
      { id: `${key}-${f.length}`, key, label: `Adding ${label.toLowerCase()}`, state: 'adding' as const },
    ]);
    if (view !== 'landing') {
      setJustAdded(a => (a.includes(key) ? a : [...a, key]));
      window.setTimeout(() => setJustAdded(a => a.filter(k => k !== key)), 1600);
    }
    onField(key, value, 'agent');
    setActivity(a => [...a, `${label} captured`].slice(-3));
  };

  async function transmit(): Promise<boolean> {
    readyRef.current = true;
    const fromLanding = view === 'landing';
    setDraft('');
    setWorking(true);
    setProcessingPhase(0);
    setFeed([{ id: 'ingest', label: 'Ingesting your message', state: 'adding' }]);
    setActivity(['Preparing the campaign intent']);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    await wait(reduced ? 20 : fromLanding ? 380 : 120);
    if (!alive.current) return false;
    setActivity(['Opening the processing view']);
    await wait(reduced ? 20 : fromLanding ? 480 : 160);
    if (!alive.current) return false;
    if (!reduced) {
      setActivity(['Transmitting campaign intent']);
      await wait(340);
      if (!alive.current) return false;
    }
    setFeed(f => [
      ...f.map(i => ({ ...i, state: 'done' as const })),
      { id: 'read', label: 'Reading for intent and entities', state: 'adding' as const },
    ]);
    setProcessingPhase(1);
    return true;
  }

  async function send(text = draft) {
    if (!text.trim() || working) return;
    const value = text.trim();
    const messages = [...ws.messages, { role: 'user' as const, text: value }];
    if (!await transmit()) return;
    onMessages(messages);

    const turn = classify(value);

    // A question is answered, never filed as a field. The extractor assigns the
    // first message it sees to `objective`, so asking "why do you need a
    // budget?" would otherwise become the campaign objective.
    if (turn.kind === 'question') {
      setActivity(['Reading your question']);
      try {
        setProcessingPhase(1); setPhaseDetail('Reading your question');
        await hold(READ_DWELL);
        setProcessingPhase(3); setPhaseDetail('Checking what you asked');
        await hold(620);
        setProcessingPhase(4); setPhaseDetail('Composing an answer');
        await hold(640);
        if (!alive.current) return;
        setProcessingPhase(3);
        await wait(220);
        if (!alive.current) return;
        onMessages([...messages, { role: 'assistant', text: reply(turn, ws.brief) }]);
      } finally { if (alive.current) await closeOut(); }
      return;
    }

    // "You decide" is an answer too. Fill the pending detail and say what was
    // assumed, so an assumption never passes as something the user stated.
    if (turn.kind === 'defer' && next) {
      const assumed = assumptionFor(next.key);
      setActivity([`Assuming a ${briefFields.find(f => f.key === next.key)?.label.toLowerCase()}`]);
      try {
        setProcessingPhase(3); setPhaseDetail('Choosing a safe assumption');
        await hold(640);
        setProcessingPhase(4); setPhaseDetail('');
        await hold(420);
        if (!alive.current) return;
        if (assumed) {
          capture(next.key, assumed.value);
          const after = { ...ws.brief, [next.key]: assumed.value };
          const following = campaignService.nextQuestion(after);
          setProcessingPhase(3);
          await wait(220);
          if (!alive.current) return;
          onMessages([...messages, {
            role: 'assistant',
            text: `I've assumed ${assumed.value} — ${assumed.because}. Change it on the right if that's wrong.${following ? `\n\n${following.prompt}` : ' That completes the brief.'}`,
          }]);
        }
      } finally { if (alive.current) { setWorking(false); setPhaseDetail(''); advance(); setActiveField(null); } }
      return;
    }

    setActivity(['Reading campaign intent']);
    try {
      setProcessingPhase(1); setPhaseDetail('Reading for intent and entities');
      if (!inCanvas) await hold(READ_DWELL);
      setProcessingPhase(2); setPhaseDetail('Looking for details');
      if (!inCanvas) await hold(520);
      let extracted = await campaignService.extract(value, ws.brief, capture, inCanvas ? 0 : FIELD_DWELL);
      setFeed(f => f.map(i => ({ ...i, state: 'done' as const })));
      setPhaseDetail('Details mapped');
      if (!inCanvas) await hold(SETTLE_DWELL);
      if (!alive.current) return;
      if (
        Object.keys(ws.brief).length && next &&
        !Object.keys(extracted).some(k => extracted[k as BriefKey] !== ws.brief[k as BriefKey])
      ) {
        capture(next.key, value);
        extracted = { ...extracted, [next.key]: value };
      }
      setActiveField(null);
      setProcessingPhase(3); setPhaseDetail('Checking scope and constraints');
      await hold(inCanvas ? 220 : 680);
      setProcessingPhase(4); setPhaseDetail('');
      if (!inCanvas) await hold(540);
      const q = campaignService.nextQuestion(extracted);
      if (!alive.current) return;
      onMessages([...messages, {
        role: 'assistant',
        text: q
          ? `I’ve updated the brief. ${q.prompt}`
          : 'The brief is complete. Review the details, edit anything you need, then generate the recommendation.',
      }]);
    } finally {
      if (alive.current) { setActiveField(null); await closeOut(); }
    }
  }

  async function sample() {
    if (working) return;
    const messages = [...ws.messages, { role: 'user' as const, text: starter }];
    if (!await transmit()) return;
    onMessages(messages);
    setActivity(['Loading the sample campaign']);
    try {
      setProcessingPhase(1); setPhaseDetail('Reading the sample brief');
      await hold(READ_DWELL);
      setProcessingPhase(2); setPhaseDetail('Looking for details');
      await hold(460);
      await campaignService.sample(capture, FIELD_DWELL_SAMPLE);
      setFeed(f => f.map(i => ({ ...i, state: 'done' as const })));
      setPhaseDetail('Details mapped');
      if (!inCanvas) await hold(SETTLE_DWELL);
      setActiveField(null);
      setProcessingPhase(3); setPhaseDetail('Checking scope and constraints');
      await hold(640);
      setProcessingPhase(4); setPhaseDetail('');
      await hold(520);
      if (!alive.current) return;
      setProcessingPhase(3);
      await wait(260);
      if (!alive.current) return;
      onMessages([...messages, { role: 'assistant', text: 'Sample campaign loaded. All eight details are captured, and every one is editable before the decisioning run.' }]);
      onNotify('Sample brief captured. Review the details before generating.');
    } finally {
      if (alive.current) { setActiveField(null); await closeOut(); }
    }
  }

  const typing = useRef(false);

  /**
   * End of run: the dialog collapses into a point of light, the canvas mounts
   * behind it, and the light opens out. The view switches mid-bloom so the
   * workspace is already settling when the light clears.
   */
  async function closeOut() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPhaseDetail('');
    if (reduced || view !== 'landing') { setWorking(false); advance(); return; }
    const style = (document.documentElement.dataset.handoff as HandoffStyle)
      || (localStorage.getItem('spark-handoff') as HandoffStyle) || 'dissolve';
    const t = HANDOFF_TIMING[style] ?? HANDOFF_TIMING.dissolve;
    setHandoffStyle(style);
    /* If anything is still missing, hold on the resolved diagram: the amber
       branches routing to "your input required" are the point of that beat. */
    const incomplete = briefFields.some(f => !briefRef.current[f.key]?.trim());
    if (!incomplete) {
      // everything landed: hold on the assembled diagram and offer the run
      setReadyToRun(true);
      await wait(2600);
      if (!alive.current || !readyRef.current) return;
      setReadyToRun(false);
    } else {
      await wait(1500);
    }
    if (!alive.current) return;
    setCollapsing(true);
    await wait(380);
    if (!alive.current) return;
    setWorking(false);
    setHandoff(true);
    await wait(t.swap);
    advance();
    await wait(t.total - t.swap);
    if (!alive.current) return;
    setHandoff(false);
    setCollapsing(false);
  }

  /** Selection pauses the channel, then visibly composes before transmission. */
  async function typeAndSend(scenario: LandingScenario) {
    if (working || typing.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { scenario.kind === 'sample' ? sample() : send(scenario.prompt); return; }
    typing.current = true;
    setSelectedSuggestion(scenario.id);
    setSuggestionPhase('Selected · preparing the composer');
    setSuggesting(true);
    setDraft('');
    await hold(520);
    if (!alive.current) return;
    setSuggestionPhase('Writing your starting point');
    for (let i = 2; i <= scenario.prompt.length + 1; i += 2) {
      if (!alive.current) return;
      setDraft(scenario.prompt.slice(0, i));
      await wait(19);
    }
    if (!alive.current) return;
    setDraft(scenario.prompt);
    setSuggestionPhase('Ready · sending to the brief agent');
    await hold(600);
    if (!alive.current) return;
    typing.current = false;
    setSuggesting(false);
    setSelectedSuggestion(null);
    setSuggestionPhase('');
    if (scenario.kind === 'sample') sample(); else send(scenario.prompt);
  }

  /** What the agent can already see in the draft, before anything is sent. */
  const sensed = detect(draft);

  const composer = (
    <motion.div className="composer">
      <form onSubmit={e => { e.preventDefault(); send(); }}>
        <Textarea
          value={draft}
          onChange={e => { if (!suggesting) setDraft(e.target.value); }}
          onKeyDown={e => { if (suggesting) { e.preventDefault(); return; } if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={opening
            ? 'Describe the campaign you want to run…'
            : captured === 8 ? 'Add a clarification, or edit any detail…' : 'Answer, or add more detail…'}
          aria-label="Campaign message"
          readOnly={suggesting}
          disabled={working}
        />
        <div className="composer-bar">
          <span className="composer-hint"><kbd>Enter</kbd> to send · <kbd>Shift Enter</kbd> for a new line</span>
          <div className="composer-actions">
            {opening && (
              <Button type="button" variant="ghost" size="sm" onClick={() => typeAndSend(sampleScenario)} disabled={working || suggesting}>
                <ClipboardList />Load sample
              </Button>
            )}
            <Button
              size="icon-sm"
              aria-label="Send campaign message"
              data-state={working ? 'sending' : draft.trim() ? 'ready' : 'idle'}
              className="send-button"
              disabled={!draft.trim() || working || suggesting}
              type="submit"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={working ? 'sending' : 'idle'}
                  initial={{ opacity: 0, scale: 0.6, rotate: working ? -90 : 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.14, ease: ease.out }}
                >
                  {working ? <Loader2 className="animate-spin motion-keep" /> : <ArrowUp />}
                </motion.span>
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );

  /* ---- shared pieces: used by both the console and the workbench ---- */

  /* ---------------- landing ---------------- */
  if (opening) {
    return (
      <>
        <Landing
          brief={ws.brief}
          working={working}
          engaged={!!draft.trim() || suggesting || working}
          activity={activity}
          composer={composer}
          sensed={sensed}
          selectedSuggestion={selectedSuggestion}
          suggestionPhase={suggestionPhase}
          onStarter={typeAndSend}
        />
        <ProcessingDialog
          open={working || collapsing || readyToRun}
          collapsing={collapsing}
          phase={processingPhase}
          detail={phaseDetail}
          captured={captured}
          items={feed}
          brief={ws.brief}
          active={activeField}
          ready={readyToRun}
          onGenerate={() => {
            readyRef.current = false;
            setReadyToRun(false); setCollapsing(false); setWorking(false);
            advance(); onGenerate();
          }}
          onCancel={() => { alive.current = false; setWorking(false); setFeed([]); }}
        />
        <Handoff active={handoff} style={handoffStyle} />
      </>
    );
  }

  /* ---------------- workbench ---------------- */
  return (
    <>
      <Handoff active={handoff} style={handoffStyle} />
      <motion.div
        className="workbench"
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.52, ease: ease.signature }}
      >
        <motion.section
          className="chat-pane" data-tour="conversation"
          initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.46, ease: ease.signature, delay: 0.08 }}
        >
          <div className="chat-head">
            <h2><MessageSquareText />Brief agent</h2>
            <Status tone={working ? 'blue' : 'neutral'}>
              {working ? <><Loader2 size={12} className="animate-spin" />Thinking</> : <>Ready</>}
            </Status>
          </div>
          <Thread
            messages={ws.messages}
            thinking={working}
            added={justAdded}
            suggestions={next && captured > 0 && !working ? next.suggestions : []}
            onSuggestion={send}
            composer={
              <>
                {composer}
                <p className="chat-note">Local agent simulation. Your input stays in this browser.</p>
              </>
            }
          />
        </motion.section>

        <motion.section
          className="board-wrap"
          initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.46, ease: ease.signature, delay: 0.16 }}
        >
          <BriefPanel
            brief={ws.brief}
            fieldOrigins={ws.fieldOrigins}
            activeField={activeField}
            justAdded={justAdded}
            working={working}
            valid={valid}
            onField={(k, v) => onField(k, v)}
            onGenerate={onGenerate}
            onSample={sample}
            header={<Source source="brief" onOpen={onSource} compact />}
            notice={ws.changeRequest ? (
              <div className="board-notice">
                <Notice tone="blue"><strong>Changes requested</strong><p>{ws.changeRequest}</p></Notice>
              </div>
            ) : null}
          />
        </motion.section>
      </motion.div>

      <div className="brief-principles">
        <span><Check />Aggregated audiences</span>
        <span><Check />Partner scoped</span>
        <span><Check />Human decisions</span>
        <span>Read-only proof of concept</span>
      </div>
    </>
  );
}
