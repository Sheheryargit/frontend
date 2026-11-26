import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp, Check, ClipboardList,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { FlybuysAgentMark } from '../components/product/FlybuysAgentMark';
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
import { hold, pace, PHASES, FIELD_DWELL, FIELD_DWELL_SAMPLE, READ_DWELL } from './agentPhases';
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
  const operation = useRef<AbortController | null>(null);
  const typing = useRef(false);
  /* closeOut runs long after it was defined, so it must not read `ws.brief`
     from its own closure — by then that value predates the capture. */
  const briefRef = useRef(ws.brief);
  briefRef.current = ws.brief;
  const [processingPhase, setProcessingPhase] = useState(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; operation.current?.abort(); };
  }, []);
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

  // The controller marks ownership of the UI while its local capture is in flight.
  // A late mock field event after cancellation must not update a newer brief.
  function beginCapture() {
    if (operation.current || typing.current || handoff) return;
    const controller = new AbortController();
    operation.current = controller;
    setWorking(true);
    setActiveField(null);
    setPhaseDetail('');
    setProcessingPhase(0);
    setFeed([]);
    setActivity(['Receiving your message']);
    return controller;
  }

  function stopCapture() {
    operation.current?.abort();
    operation.current = null;
    setReadyToRun(false);
    setWorking(false);
    setActiveField(null);
    setPhaseDetail('');
    setCollapsing(false);
  }

  async function closeOut(controller: AbortController) {
    setPhaseDetail('');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || inCanvas) {
      stopCapture();
      advance();
      return;
    }

    const style = (localStorage.getItem('spark-handoff') as HandoffStyle) || 'dissolve';
    const timing = HANDOFF_TIMING[style] ?? HANDOFF_TIMING.dissolve;
    const brief = briefRef.current;
    const canGenerate = briefFields.every(field => brief[field.key]?.trim())
      && budgetValue(brief) !== null && brief.type === 'Repeat purchase'
      && /partner\s*a/i.test(brief.partner || '');

    setReadyToRun(canGenerate);
    await hold(canGenerate ? 800 : 200);
    if (controller.signal.aborted) return;
    setReadyToRun(false);
    setHandoffStyle(style);
    setCollapsing(true);
    setHandoff(true);
    await wait(timing.swap);
    if (controller.signal.aborted) return;
    setWorking(false);
    setCollapsing(false);
    advance();
    await wait(timing.total - timing.swap);
    if (controller.signal.aborted) return;
    setHandoff(false);
    operation.current = null;
  }

  async function processMessage(text: string, loadSample = false) {
    const value = text.trim();
    if (!value) return;
    const controller = beginCapture();
    if (!controller) return;
    const { signal } = controller;
    const messages: Message[] = [...ws.messages, { role: 'user', text: value }];
    const captureField = (key: BriefKey, entry: string) => {
      if (!signal.aborted) capture(key, entry);
    };

    try {
      await hold(opening ? PHASES[0].ms : 90);
      if (signal.aborted) return;
      setDraft('');
      onMessages(messages);
      const turn = classify(value);
      setProcessingPhase(1);
      setPhaseDetail(loadSample ? 'Reading the sample brief' : turn.kind === 'question'
        ? 'Reading your question' : 'Reading for intent and entities');
      await hold(inCanvas ? 90 : READ_DWELL);
      if (signal.aborted) return;

      const assumed = !loadSample && turn.kind === 'defer' && next ? assumptionFor(next.key) : undefined;
      let answer: string;
      if (!loadSample && turn.kind === 'question') {
        answer = reply(turn, ws.brief);
      } else if (assumed && next) {
        captureField(next.key, assumed.value);
        const following = campaignService.nextQuestion({ ...ws.brief, [next.key]: assumed.value });
        answer = `I've assumed ${assumed.value} — ${assumed.because}. Change it on the right if that's wrong.${following ? `\n\n${following.prompt}` : ' That completes the brief.'}`;
      } else {
        setProcessingPhase(2);
        setPhaseDetail('Looking for details');
        const fieldDelay = pace(inCanvas ? 55 : loadSample ? FIELD_DWELL_SAMPLE : FIELD_DWELL);
        let extracted = loadSample
          ? await campaignService.sample(captureField, fieldDelay)
          : await campaignService.extract(value, ws.brief, captureField, fieldDelay);
        if (signal.aborted) return;

        if (!loadSample && Object.keys(ws.brief).length && next
          && !Object.keys(extracted).some(key => extracted[key as BriefKey] !== ws.brief[key as BriefKey])) {
          captureField(next.key, value);
          extracted = { ...extracted, [next.key]: value };
        }
        const question = campaignService.nextQuestion(extracted);
        answer = loadSample
          ? 'Sample campaign loaded. All eight details are captured, and every one is editable before the decisioning run.'
          : question ? `I’ve updated the brief. ${question.prompt}`
            : 'The brief is complete. Review the details, edit anything you need, then generate the recommendation.';
      }

      setActiveField(null);
      setFeed(items => items.map(item => ({ ...item, state: 'done' })));
      setProcessingPhase(3);
      setPhaseDetail('Checking scope and constraints');
      await hold(inCanvas ? 120 : PHASES[3].ms);
      if (signal.aborted) return;
      setProcessingPhase(4);
      setPhaseDetail('');
      await hold(inCanvas ? 90 : PHASES[4].ms);
      if (signal.aborted) return;
      onMessages([...messages, { role: 'assistant', text: answer }]);
      if (loadSample && inCanvas) onNotify('Sample brief captured. Review the details before generating.');
      await closeOut(controller);
    } catch {
      if (signal.aborted) return;
      stopCapture();
      setDraft(value);
      onNotify('The brief could not be captured. You can try sending the message again.');
    }
  }

  const send = (text = draft) => processMessage(text);
  const sample = () => processMessage(starter, true);

  /** Selection pauses the channel, then visibly composes before transmission. */
  async function typeAndSend(scenario: LandingScenario) {
    if (operation.current || typing.current || handoff) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { scenario.kind === 'sample' ? sample() : send(scenario.prompt); return; }
    typing.current = true;
    setSelectedSuggestion(scenario.id);
    setSuggestionPhase('Selected · preparing the composer');
    setSuggesting(true);
    setDraft('');
    await hold(140);
    if (!alive.current) return;
    setSuggestionPhase('Writing your starting point');
    const chunkSize = Math.ceil(scenario.prompt.length / 12);
    for (let i = chunkSize; i < scenario.prompt.length; i += chunkSize) {
      if (!alive.current) return;
      setDraft(scenario.prompt.slice(0, i));
      await hold(22);
    }
    if (!alive.current) return;
    setDraft(scenario.prompt);
    setSuggestionPhase('Ready · sending to the brief agent');
    await hold(110);
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
                  {working ? <FlybuysAgentMark active /> : <ArrowUp />}
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
  return (
    <>
      <Handoff active={handoff} style={handoffStyle} />
      {opening ? <>
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
            stopCapture();
            advance();
            onGenerate();
          }}
          onCancel={() => {
            if (collapsing) return;
            stopCapture();
            setFeed([]);
            if (readyToRun || ws.messages.length > 1 || captured > 0) advance();
          }}
        />
      </> : <>
      <motion.div
        className="workbench"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: ease.signature }}
      >
        <motion.section
          className="chat-pane" data-tour="conversation"
          initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.26, ease: ease.signature, delay: 0.025 }}
        >
          <div className="chat-head">
            <h2><FlybuysAgentMark />Brief agent</h2>
            <Status tone={working ? 'blue' : 'neutral'}>
              {working ? <><FlybuysAgentMark active />Thinking</> : <>Ready</>}
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
          transition={{ duration: 0.26, ease: ease.signature, delay: 0.05 }}
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
      </>}
    </>
  );
}
