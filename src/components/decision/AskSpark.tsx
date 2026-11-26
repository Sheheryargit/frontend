import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUp, ArrowUpRight, Database, Maximize2, Users, Wallet } from 'lucide-react';
import { FlybuysAgentMark } from '../product/FlybuysAgentMark';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { audiences, offers } from '../../data';
import type { Workspace } from '../../types';
import type { SourceKey } from '../../services/campaign';
import { budgetValue, calculate, minimumAudience, money, number } from '../../model';
import { ease } from '../../lib/motion';

type Answer={text:string; action?:{label:string; audienceId:string; offerId:string; level:number}; source?:SourceKey};
function answer(question:string,ws:Workspace):Answer {
  const q=question.toLowerCase();const a=audiences.find(x=>x.id===ws.audienceId)!;const o=offers.find(x=>x.id===ws.offerId)!;const r=calculate(a,o,ws.level,ws.brief);const floor=minimumAudience(ws.brief);
  if(/new member|why not|first grocery/.test(q)){const x=audiences[2];return {text:`New members have ${number(x.sizes[1])} eligible at balanced criteria, below the ${number(floor)} demo floor. Their lifecycle classification also needs validation. A broader definition reaches ${number(x.sizes[2])}, but it should not be accepted until that rule is approved.`,source:'audience'};}
  if(/cost|budget|cheaper|reward/.test(q)){const alt=offers[0],next=calculate(a,alt,ws.level,ws.brief);return {text:o.id==='v1'?`This is already the lowest reward-cost offer in the current demo. Its high estimate is ${money(r.cost[2])} against ${budgetValue(ws.brief)?money(budgetValue(ws.brief)!):'an unconfirmed ceiling'}. Media and operating costs remain excluded.`:`The single-shop offer lowers the central reward estimate from ${money(r.cost[1])} to ${money(next.cost[1])}. It rewards one visit rather than a repeat habit, so the trade-off is commercial as well as financial.`,action:o.id==='v1'?undefined:{label:'Compare the lower-cost offer',audienceId:a.id,offerId:alt.id,level:ws.level},source:'offer'};}
  if(/reach|broader|size|volume/.test(q)){const next=calculate(a,o,2,ws.brief);return {text:`Broad criteria would reach ${number(next.size)} members versus ${number(r.size)} now. The high reward estimate becomes ${money(next.cost[2])}. ${next.fit==='within'?'It remains inside the current budget.':'It may exceed the current budget.'} Evidence quality must also be checked at the broader breadth.`,action:ws.level===2?undefined:{label:'Inspect the broader scenario',audienceId:a.id,offerId:o.id,level:2},source:'audience'};}
  if(/roi|forecast|predict|performance/.test(q))return {text:'Spark cannot give a defensible ROI forecast from this sample. Financial inputs are incomplete, offer-level effects are not established, and comparator rules need approval. The activation interval is illustrative, not a predictive model.',source:'forecast'};
  if(/propensity|churn|lifetime|model/.test(q))return {text:'The churn-risk and lifetime-value fields are blank in the prototype. The current audience uses observed purchase cadence and category activity only. It does not claim to predict churn or propensity.',source:'audience'};
  if(/partner|cross|privacy/.test(q))return {text:'This prototype is scoped to Partner A. It does not expose another partner’s product-level insights, and the permission rule for using cross-partner signals internally still needs stakeholder confirmation.',source:'audience'};
  return {text:`The current direction reaches ${number(r.size)} members with a ${money(r.cost[1])} central reward estimate. The recommendation uses observed Partner A behaviour and ${o.comps.length} matched campaign examples. Historical evidence is limited, so a strategist should review the assumptions before accepting it.`,source:'history'};
}

const prompts = [
  { label: 'Why this audience?', Icon: Users },
  { label: 'What if we need more reach?', Icon: Maximize2 },
  { label: 'How could we lower cost?', Icon: Wallet },
  { label: 'Why is ROI unavailable?', Icon: Database },
];

type Turn = {
  id: number;
  question: string;
  version: number;
  response: Answer;
};

type Props = {
  workspace: Workspace;
  onSelect: (audienceId: string, offerId: string, level: number) => void;
  onSource: (key: SourceKey) => void;
};

export function AskSpark({ workspace, onSelect, onSource }: Props) {
  const still = useReducedMotion();
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<Turn | null>(null);
  const [phase, setPhase] = useState('');
  const [showJump, setShowJump] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const composer = useRef<HTMLFormElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    const element = composer.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setShowJump(!entry.isIntersecting),
      { rootMargin: '-60px 0px -16px 0px', threshold: 0.6 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stream = transcript.current;
    if (stream) stream.scrollTop = stream.scrollHeight;
  }, [turns, pending]);

  function ask(value: string) {
    const question = value.trim();
    if (!question || pending) return;
    const turn = {
      id: ++sequence.current,
      question,
      version: workspace.configVersion,
      response: answer(question, workspace),
    };
    setDraft('');
    setPending(turn);
    setPhase('Tracing the recommendation');
    const step = still ? 70 : 420;
    timers.current = [
      setTimeout(() => setPhase('Checking the evidence'), step),
      setTimeout(() => {
        setTurns(history => [...history, turn]);
        setPending(null);
        setPhase('');
      }, step * 2),
    ];
  }

  return (
    <aside className="spark-assistant" data-tour="assistant" aria-labelledby="spark-assistant-title">
      <header className="spark-assistant-head">
        <FlybuysAgentMark size="orbit" active={Boolean(pending)} />
        <div>
          <h2 id="spark-assistant-title">Ask Spark</h2>
          <p>Recommendation assistant</p>
        </div>
        <span className="spark-assistant-scope">Demo evidence</span>
      </header>

      {(turns.length > 0 || pending) ? (
        <div className="spark-assistant-stream" role="log" aria-label="Questions and answers"
          tabIndex={0} ref={transcript}>
          {turns.map(({ id, question, version, response }) => (
            <div className="spark-assistant-turn" key={id}>
              <p className="spark-assistant-question">{question}</p>
              <motion.div className="spark-assistant-answer"
                initial={still ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: ease.out }}>
                <p>{response.text}</p>
                {version !== workspace.configVersion && (
                  <small className="spark-assistant-context">Based on a previous direction</small>
                )}
                <div className="spark-assistant-actions">
                  {response.action && version === workspace.configVersion && (
                    <Button variant="outline" size="sm"
                      onClick={() => onSelect(response.action!.audienceId, response.action!.offerId, response.action!.level)}>
                      {response.action.label}<ArrowUpRight size={14} />
                    </Button>
                  )}
                  {response.source && (
                    <Button variant="ghost" size="sm" onClick={() => onSource(response.source!)}>
                      <Database size={14} />Inspect source
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          ))}
          {pending && (
            <div className="spark-assistant-turn">
              <p className="spark-assistant-question">{pending.question}</p>
              <div className="spark-assistant-activity">
                <FlybuysAgentMark size="avatar" active />
                <span role="status">{phase}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="spark-assistant-intro">
          <p>Ask about this audience, the reward cost, or the evidence behind the recommendation.</p>
          <div className="spark-assistant-prompts" aria-label="Suggested questions">
            {prompts.map(({ label, Icon }) => (
              <button type="button" key={label} onClick={() => ask(label)}>
                <Icon size={15} aria-hidden="true" />
                <span>{label}</span>
                <ArrowUpRight size={13} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}

      <form ref={composer} className="spark-assistant-form"
        onSubmit={event => { event.preventDefault(); ask(draft); }}>
        <Input id="spark-recommendation-question" value={draft}
          onChange={event => setDraft(event.target.value)} aria-label="Ask Spark a question"
          placeholder={turns.length ? 'Ask a follow-up…' : 'Ask about this recommendation…'} />
        <Button size="icon-sm" aria-label="Send question" type="submit" disabled={!draft.trim() || Boolean(pending)}>
          <ArrowUp size={17} />
        </Button>
      </form>
      {showJump && createPortal(
        <Button className="spark-assistant-jump" onClick={() => {
          const question = composer.current?.querySelector('input');
          question?.focus({ preventScroll: true });
          question?.scrollIntoView({ block: 'center', behavior: still ? 'instant' : 'smooth' });
        }}>
          <FlybuysAgentMark />Ask Spark
        </Button>,
        document.body,
      )}
    </aside>
  );
}
