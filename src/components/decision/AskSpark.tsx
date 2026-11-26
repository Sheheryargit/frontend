import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUp, CircleHelp, Database } from 'lucide-react';
import { FlybuysAgentMark } from '../product/FlybuysAgentMark';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { audiences, offers } from '../../data';
import type { Workspace } from '../../types';
import type { SourceKey } from '../../services/campaign';
import { budgetValue, calculate, minimumAudience, money, number } from '../../model';

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

const prompts=['Why this audience?','What if we need more reach?','How could we lower cost?','Why is ROI unavailable?'];
export function AskSpark({workspace:ws,onSelect,onSource}:{workspace:Workspace;onSelect:(a:string,o:string,l:number)=>void;onSource:(key:SourceKey)=>void}) {
  const still=useReducedMotion();const [open,setOpen]=useState(false);const [draft,setDraft]=useState('');const [asked,setAsked]=useState('');const [result,setResult]=useState<Answer|null>(null);const [phase,setPhase]=useState('');const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
  function ask(value:string){if(!value.trim()||phase)return;timers.current.forEach(clearTimeout);const q=value.trim();setDraft('');setAsked(q);setResult(null);setPhase('Tracing the decision');
    const p=still?70:850;timers.current=[setTimeout(()=>setPhase('Checking the evidence'),p),setTimeout(()=>{setResult(answer(q,ws));setPhase('');},p+(still?70:900))];}
  return <><Button variant="outline" size="sm" className="ask-spark-trigger" onClick={()=>setOpen(true)}><FlybuysAgentMark />Ask Spark</Button>
    <Dialog open={open} onOpenChange={v=>{setOpen(v);if(!v){timers.current.forEach(clearTimeout);setPhase('');}}}><DialogContent className="ask-spark-dialog"><DialogHeader><span className="t-overline">DECISION ASSISTANT · LOCAL SIMULATION</span><DialogTitle>Challenge the recommendation</DialogTitle><DialogDescription>Ask why a direction was chosen, what changes with another choice, or which claims the evidence cannot support.</DialogDescription></DialogHeader>
      <div className="ask-spark-scene" aria-live="polite">
        {!asked&&<div className="ask-spark-intro"><FlybuysAgentMark size="orbit" /><strong>Start with a question</strong><p>Every answer traces the current scenario and its limitations.</p></div>}
        {asked&&<motion.div className="ask-spark-question" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>{asked}</motion.div>}
        <AnimatePresence mode="wait">{phase&&<motion.div key="thinking" className="ask-spark-thinking" initial={{opacity:0,y:7}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-7}}><FlybuysAgentMark size="avatar" active /><div><strong>{phase}</strong><small>Following audience, offer, and source links</small></div><i/><i/><i/></motion.div>}
          {result&&!phase&&<motion.div key={asked+'answer'} className="ask-spark-answer" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}><div className="ask-spark-answer-label"><FlybuysAgentMark />SPARK ANALYSIS</div><p>{result.text}</p><div className="ask-spark-answer-actions">{result.action&&<Button size="sm" onClick={()=>{onSelect(result.action!.audienceId,result.action!.offerId,result.action!.level);setOpen(false);}}>{result.action.label}</Button>}{result.source&&<Button size="sm" variant="ghost" onClick={()=>{onSource(result.source!);setOpen(false);}}><Database size={14}/>Inspect source</Button>}</div></motion.div>}
        </AnimatePresence>
      </div>
      <div className="ask-spark-prompts">{prompts.map(p=><button key={p} onClick={()=>ask(p)} disabled={!!phase}>{p}</button>)}</div>
      <form className="ask-spark-composer" onSubmit={e=>{e.preventDefault();ask(draft);}}><CircleHelp size={17}/><Input value={draft} onChange={e=>setDraft(e.target.value)} aria-label="Ask Spark a question" placeholder="Ask about this recommendation…" disabled={!!phase}/><Button size="icon-sm" aria-label="Send question" type="submit" disabled={!draft.trim()||!!phase}><ArrowUp size={16}/></Button></form>
    </DialogContent></Dialog></>;
}
