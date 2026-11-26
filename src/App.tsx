import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ArrowUpRight, Check, ChevronDown, CircleAlert, CircleHelp, Command, Database, FileText, FlaskConical, LayoutGrid, Moon, Plus, Search, ShieldCheck, SlidersHorizontal, Sun, X } from 'lucide-react';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Progress } from './components/ui/progress';
import { Input } from './components/ui/input';
import { Status } from './components/product/shared';
import { RunSignal } from './components/product/RunSignal';
import { FlybuysAgentMark } from './components/product/FlybuysAgentMark';
import { BriefScreen } from './features/BriefScreen';
const loadRecommendation = () => import('./features/RecommendationScreen').then(module => ({ default: module.RecommendationScreen }));
const RecommendationScreen = lazy(loadRecommendation);
import { ReviewScreen } from './features/ReviewScreen';
import { FeedbackDialog } from './features/FeedbackDialog';
import { campaignService, runSteps, sourceCatalog } from './services/campaign';
import type { SourceKey } from './services/campaign';
import type { BriefKey } from './data';
import { audiences, briefFields, offers } from './data';
import { budgetValue, calculate, minimumAudience } from './model';
import { initialWorkspace } from './types';
import { Settings, useAppearance } from './components/shell/Settings';
import { Sidebar } from './components/shell/Sidebar';
import { screenTransition } from './lib/motion';
import type { Screen, Workspace } from './types';

const KEY='spark-studio-v3';
const navigation=[{id:'brief' as Screen,label:'Campaign brief',icon:FileText},{id:'recommendation' as Screen,label:'Recommendation',icon:LayoutGrid},{id:'review' as Screen,label:'Review & governance',icon:ShieldCheck}];
function getWorkspace():Workspace {try {const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s?.brief&&s?.messages)return {...initialWorkspace(),...s};}catch{}return initialWorkspace();}
export default function App(){
 const [ws,setWs]=useState<Workspace>(getWorkspace);
 const [briefSession,setBriefSession]=useState(0);
 const [theme,setTheme]=useState(()=>localStorage.getItem('spark-theme-v4')||'light');
 const [settings,setSettings]=useState(false);
 const appearance=useAppearance();
 const [dataMap,setDataMap]=useState(false);
 const [source,setSource]=useState<SourceKey|null>(null);
 const [run,setRun]=useState<{step:number;error:string|null;active:boolean;detail:string;progress:number}|null>(null);
 const [failNext,setFailNext]=useState(false);
 const [feedback,setFeedback]=useState<'changes'|'rejected'|null>(null);
 const [search,setSearch]=useState(false);const [query,setQuery]=useState('');
 const [toast,setToast]=useState('');const toastTimer=useRef<ReturnType<typeof setTimeout>>();
 const [tour,setTour]=useState<number|null>(null);const [spot,setSpot]=useState<DOMRect|null>(null);
 const abortRef=useRef<AbortController|null>(null);
 const audience=audiences.find(a=>a.id===ws.audienceId)||audiences[0];const offer=offers.find(o=>o.id===ws.offerId)||offers[1];
 const result=calculate(audience,offer,ws.level,ws.brief);
 const notify=(message:string)=>{setToast(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),3200);};
 const update=(patch:Partial<Workspace>)=>setWs(s=>({...s,...patch}));
 const go=(screen:Screen)=>{if(screen!=='brief'&&!ws.generated)return;update({screen});setTour(null);setSearch(false);window.scrollTo({top:0,behavior:'instant'});};
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(ws));},[ws]);
 useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.dataset.theme=theme;localStorage.setItem('spark-theme-v4',theme);},[theme]);
 useEffect(()=>{const listener=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setSearch(true);setQuery('');}};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);},[]);
 const tourItems=ws.screen==='brief'?[['[data-tour="conversation"]','Start with intent','Describe the outcome in your own words. The brief agent captures explicit details and asks for missing information.'],['[data-tour="brief-details"]','Review what the agent captured','Fields appear as they are extracted. Edit any field directly before generating.'],['[data-tour="generate"]','Generate with a complete brief','The run checks constraints, sizes audiences, compares offers and assembles evidence in visible stages.']]:ws.screen==='recommendation'?[['[data-tour="atlas"]','Follow the decision network','Select a node to inspect how the brief, audience, offer, evidence and estimate connect.'],['[data-tour="assistant"]','Ask Spark about the recommendation','Open Ask Spark from the side button to question an audience, compare reward costs, or inspect the evidence.'],['[data-tour="exploration"]','Compare and inspect','Use audience recipes, the scenario lab and evidence passport to understand reach, cost and historical fit.'],['[data-tour="review-action"]','Move to human review','Review the selected specification, assumptions and unresolved validation before deciding.']]:[['[data-tour="atlas"]','Trace the decision','The trace preserves the path from campaign intent to human review.'],['[data-tour="decision"]','Make a decision','Accept for refinement, request changes or reject with a reason. Decisions stay in this browser.'],['[data-tour="review-spec"]','Inspect the specification','Review the audience, incentive, costs and evidence.'],['[data-tour="guardrails"]','Check the limitations','Unvalidated assumptions and data quality issues remain visible.'],['[data-tour="review-workspace"]','Carry the work forward','Download a review packet, queue local validation tasks and inspect the POC scorecard.']];
 useEffect(()=>{if(tour===null){setSpot(null);return;}const el=document.querySelector(tourItems[tour][0]);el?.scrollIntoView({block:'center',behavior:'smooth'});const timer=setTimeout(()=>setSpot(el?.getBoundingClientRect()||null),280);return()=>clearTimeout(timer);},[tour,ws.screen]);
 async function generate(nextBrief=ws.brief,revision=false){
  const missing=briefFields.filter(f=>!nextBrief[f.key]?.trim());if(missing.length){notify(`Complete ${missing.map(f=>f.label.toLowerCase()).join(', ')} first.`);return;}
  const b=budgetValue(nextBrief);if(!b||b<=0){notify('Enter a confirmed positive budget before generating.');return;}
  if(!/partner\s*a/i.test(nextBrief.partner||'')){notify('This demo supports Partner A only. Other partner data is not available.');return;}
  if(nextBrief.type!=='Repeat purchase'){notify('This demo is calibrated for Repeat purchase. Other campaign types need validated evidence.');return;}
  void loadRecommendation().catch(() => { /* The lazy screen retries on navigation. */ });
  const controller=new AbortController();abortRef.current=controller;setRun({step:0,error:null,active:true,detail:'Preparing the brief trace',progress:1});
  try{await campaignService.run(event=>setRun({step:event.index,error:null,active:true,detail:event.detail,progress:event.progress}),controller.signal,failNext);setFailNext(false);
   const targetText=(nextBrief.target||'').toLowerCase();
   const targetId=/infrequent|occasional/.test(targetText)?'a2':/new member|first grocery/.test(targetText)?'a3':/lapsing|lapsed|regular|suggest/.test(targetText)?'a1':null;
   if(!targetId)throw new Error('This demo supports lapsing regulars, infrequent grocery shoppers or new members. Refine the target customer in the brief.');
   const preferred=offers.find(o=>/single/i.test(nextBrief.offerPref||'')?o.id==='v1':/weekly/i.test(nextBrief.offerPref||'')?o.id==='v3':o.id==='v2')||offers[1];
   const fits=audiences.flatMap(a=>[1,0,2].map(level=>({a,level,c:calculate(a,preferred,level,nextBrief)}))).find(x=>x.a.id===targetId&&x.c.cost[2]<=b&&x.c.size>=minimumAudience(nextBrief));
   const recommended=fits||audiences.flatMap(a=>[1,0,2].map(level=>({a,level,c:calculate(a,offers[0],level,nextBrief)}))).find(x=>x.a.id===targetId&&x.c.cost[2]<=b&&x.c.size>=minimumAudience(nextBrief));
   if(!recommended)throw new Error('No supported combination meets both the budget ceiling and minimum audience. Adjust those constraints in the brief.');
   setRun({step:4,error:null,active:false,detail:'Recommendation assembled',progress:100});
   await new Promise(resolve=>setTimeout(resolve,window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180));
   if(controller.signal.aborted)throw new DOMException('Run cancelled','AbortError');
   setWs(s=>({...s,brief:nextBrief,generated:true,screen:'recommendation',revision:s.revision+1,configVersion:s.configVersion+1,generatedBrief:JSON.stringify(nextBrief),audienceId:recommended.a.id,level:recommended.level,offerId:fits?preferred.id:'v1',changeRequest:revision?s.changeRequest:'',firstGeneratedAt:s.firstGeneratedAt??new Date().toISOString()}));
   setRun(null);window.scrollTo({top:0});notify(revision?'Revised recommendation is ready for review.':'Recommendation ready. Inspect the evidence before deciding.');
  }catch(e){if(controller.signal.aborted){setRun(null);notify('Run cancelled. Your brief is saved.');}else{setFailNext(false);setRun(s=>({...s!,active:false,error:e instanceof Error?e.message:'The run could not complete. Retry to continue.'}));}}
 }
 function field(key:BriefKey,value:string,origin:'agent'|'edited'='edited'){setWs(s=>({...s,brief:{...s.brief,[key]:value},configVersion:s.configVersion+1,fieldOrigins:{...s.fieldOrigins,[key]:origin}}));}
 function reset(){abortRef.current?.abort();setBriefSession(n=>n+1);setWs(initialWorkspace());setTour(null);notify('New campaign brief created.');}
 function record(status:'accepted'|'changes'|'rejected',reason:string,note:string){setWs(s=>({...s,decisions:[...s.decisions,{status,reason,note,time:new Date().toISOString(),revision:s.revision,configVersion:s.configVersion}]}));}
 const lastDecision=[...ws.decisions].reverse().find(d=>d.revision===ws.revision&&d.configVersion===ws.configVersion);
 const canAccept=ws.generatedBrief===JSON.stringify(ws.brief)&&result.fit==='within'&&result.size>=minimumAudience(ws.brief)&&audience.id!=='a3'&&result.evidence!=='insufficient';
 return <MotionConfig reducedMotion="user"><TooltipProvider delayDuration={220}><div className={`studio ${dataMap?'data-map-on':''}`}>
  <Sidebar
    workspace={ws}
    theme={theme}
    dataMap={dataMap}
    busy={run!==null&&run.active}
    busyLabel={run?.active?`Decisioning · stage ${(run.step||0)+1} of 5`:undefined}
    decided={!!lastDecision}
    onGo={go}
    onSearch={()=>{setSearch(true);setQuery('');}}
    onTour={()=>setTour(0)}
    onDataMap={()=>setDataMap(!dataMap)}
    onSettings={()=>setSettings(true)}
    onTheme={()=>setTheme(theme==='dark'?'light':'dark')}
  />
  <div className="app-main" data-screen={ws.screen}><header className="app-header"><div className="breadcrumbs"><strong>{ws.generated?'Grocery re-engagement':'New campaign'}</strong><Status tone={ws.generated?'neutral':'blue'}>{ws.generated?`v${ws.revision}.0`:'Draft'}</Status></div><div className="header-actions"><span className="simulation-label"><span/>Simulation</span><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label="Toggle theme">{theme==='dark'?<Sun/>:<Moon/>}</Button></TooltipTrigger><TooltipContent>Switch appearance</TooltipContent></Tooltip><Button variant="outline" size="sm" onClick={reset}><Plus/>New campaign</Button></div></header>
   <AnimatePresence mode="wait"><motion.div key={ws.screen} className="screen-header" {...screenTransition}><div className="screen-title-row"><div><h1>{ws.screen==='brief'?'Campaign brief':ws.screen==='recommendation'?'Recommendation':'Review & governance'}</h1><p>{ws.screen==='brief'?'Turn campaign intent into a clear, actionable brief.':ws.screen==='recommendation'?'Find the right balance between reach, reward and evidence.':'Make an informed decision. Keep the reasoning on record.'}</p></div><div className="screen-title-actions"><Button variant="ghost" size="sm" onClick={()=>setTour(0)}><CircleHelp/>Walkthrough</Button>{ws.screen==='recommendation'&&<Button data-tour="review-action" onClick={()=>go('review')}><ShieldCheck/>Review specification</Button>}</div></div></motion.div></AnimatePresence>
   <main><AnimatePresence mode="wait"><motion.div key={ws.screen} {...screenTransition}>
   {ws.screen==='brief'&&<BriefScreen key={briefSession} workspace={ws} onField={field} onMessages={messages=>update({messages})} onGenerate={()=>generate()} onSource={setSource} onNotify={notify} />}
   {ws.screen==='recommendation'&&<Suspense fallback={<div className="screen-loading"><FlybuysAgentMark size="avatar" active />Loading the decision workspace…</div>}><RecommendationScreen workspace={ws} canAccept={canAccept} onSelect={(audienceId,offerId,level)=>setWs(s=>({...s,audienceId,offerId,level,configVersion:s.configVersion+(s.audienceId===audienceId&&s.offerId===offerId&&s.level===level?0:1)}))} onSource={setSource} onReview={()=>go('review')} /></Suspense>}
   {ws.screen==='review'&&<ReviewScreen workspace={ws} onSource={setSource} canAccept={canAccept} onAccept={()=>{record('accepted','Accepted for further refinement','');notify('Accepted for refinement. This is not a campaign launch approval.');}} onFeedback={setFeedback} onRefine={()=>go('recommendation')} onBrief={()=>go('brief')} />}
   </motion.div></AnimatePresence></main>
   <footer className="workspace-footer"><span><FlaskConical size={13}/> Synthetic data · no live integrations</span><div><DropdownMenu><DropdownMenuTrigger asChild><button className="simulation-options"><SlidersHorizontal size={13}/>Simulation controls<ChevronDown size={12}/></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={()=>{setFailNext(!failNext);notify(!failNext?'Next run will demonstrate a recoverable source error.':'Error simulation disabled.');}}><CircleAlert/>{failNext?'Disable':'Simulate'} source error on next run</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem onSelect={()=>{setDataMap(!dataMap);}}><Database/>{dataMap?'Hide':'Show'} data placeholders</DropdownMenuItem></DropdownMenuContent></DropdownMenu><span>Saved in this browser</span></div></footer>
  </div>
  <Dialog open={source!==null} onOpenChange={open=>{if(!open)setSource(null);}}><DialogContent className="source-dialog"><DialogHeader><div className="dialog-eyebrow"><Database size={15}/>DATA CONNECTION</div><DialogTitle>{source&&sourceCatalog[source].title}</DialogTitle><DialogDescription>Inspect the placeholder, assumptions and future backend contract.</DialogDescription></DialogHeader>{source&&<><Status tone="warning">Demo data · connection not configured</Status><div className="source-section"><label>Future source</label><code>{sourceCatalog[source].table}</code></div><div className="source-section"><label>What this section needs</label><p>{sourceCatalog[source].description}</p></div><div className="source-section source-section--warning"><label>Current limitation</label><p>{sourceCatalog[source].limitation}</p></div><div className="source-section"><label>Suggested API contract</label><code>{sourceCatalog[source].endpoint}</code></div><div className="source-dialog-footer"><ShieldCheck size={15}/>Read-only · aggregated data · partner scoped</div></>}</DialogContent></Dialog>
  <Dialog open={run!==null} onOpenChange={open=>{if(!open){abortRef.current?.abort();setRun(null);}}}><DialogContent className="run-dialog" showCloseButton={false}><DialogHeader><div className="dialog-eyebrow"><FlybuysAgentMark />DECISIONING AGENT</div><DialogTitle>{run?.error?'The run needs attention':run && !run.active?'Recommendation ready':'Building your recommendation'}</DialogTitle><DialogDescription>{run?.error?'Your brief and selections are safe. Resolve the issue or retry.':run && !run.active?'The decision network and evidence are opening.':'Following the brief, checking constraints and assembling evidence.'}</DialogDescription></DialogHeader><RunSignal step={run?.step||0} error={!!run?.error} complete={!!run && !run.active && !run.error} detail={run?.detail}/><div className="sr-only" role="status">{run?.detail}</div><Progress value={run?.progress||0} className="run-progress"/><div className="run-steps" aria-live="polite">{runSteps.map((s,i)=><div key={s.id} className={`run-step ${run?.active&&i===(run?.step||0)?'running':''} ${run&&!run.active&&!run.error||i<(run?.step||0)?'complete':''}`}><span>{i<(run?.step||0)?<Check size={15}/>:i===run?.step?run.error?<CircleAlert size={15}/>:<FlybuysAgentMark active />:<span className="run-pending-dot"/>}</span><div><strong>{s.label}</strong><small>{s.detail}</small></div>{i<(run?.step||0)&&<span className="run-done-label">Complete</span>}</div>)}</div>{run?.error&&<div role="alert" className="run-error"><CircleAlert size={17}/><p>{run.error}</p></div>}<DialogFooter><span className="run-simulation"><FlaskConical size={13}/>Simulated processing</span><Button variant="outline" onClick={()=>{abortRef.current?.abort();if(run?.error)go('brief');setRun(null);}}> {run?.error?'Return to brief':'Cancel run'}</Button>{run?.error&&<Button onClick={()=>generate(ws.brief,ws.revision>0)}>Retry run</Button>}</DialogFooter></DialogContent></Dialog>
  <FeedbackDialog mode={feedback} brief={ws.brief} onClose={()=>setFeedback(null)} onSubmit={(mode,reason,note,destination,changes)=>{record(mode,reason,note);setFeedback(null);if(mode==='rejected'){notify('Rejection recorded with your feedback.');return;}const next={...ws.brief,...changes};setWs(s=>({...s,brief:next,configVersion:s.configVersion+1,changeRequest:note,fieldOrigins:{...s.fieldOrigins,...Object.fromEntries(Object.keys(changes).map(key=>[key,'edited']))}}));if(destination==='brief'){update({screen:'brief'});window.scrollTo({top:0});notify('Requested changes prefilled. Review the brief before rerunning.');}else{generate(next,true);}}}/>
  <Dialog open={search} onOpenChange={setSearch}><DialogContent className="command-dialog" showCloseButton={false}><DialogTitle className="sr-only">Search workspace</DialogTitle><DialogDescription className="sr-only">Navigate to a screen or inspect a data source.</DialogDescription><div className="command-input"><Search size={18}/><Input autoFocus placeholder="Search screens and data connections…" value={query} onChange={e=>setQuery(e.target.value)}/><kbd>esc</kbd></div><div className="command-list">{[...navigation.filter(n=>ws.generated||n.id==='brief').map(n=>({label:n.label,icon:n.icon,action:()=>go(n.id)})),...Object.entries(sourceCatalog).map(([key,s])=>({label:s.title+' · data source',icon:Database,action:()=>{setSearch(false);setSource(key as SourceKey);}}))].filter(n=>n.label.toLowerCase().includes(query.toLowerCase())).map(n=><button key={n.label} onClick={n.action}><n.icon size={16}/><span>{n.label}</span><ArrowUpRight size={14}/></button>)}</div><div className="command-footer"><Command size={12}/>Quick navigation · {navigation.find(n=>n.id===ws.screen)?.label}</div></DialogContent></Dialog>
  {tour!==null&&<>{spot&&<div className="tour-spotlight" style={{top:Math.max(8,spot.top-6),left:Math.max(8,spot.left-6),width:spot.width+12,height:Math.min(spot.height+12,window.innerHeight-16)}}/>}<Dialog open onOpenChange={open=>{if(!open)setTour(null);}}><DialogContent className="tour-card" showCloseButton={false}><span className="eyebrow">SCREEN WALKTHROUGH · {tour+1} OF {tourItems.length}</span><DialogTitle>{tourItems[tour][1]}</DialogTitle><DialogDescription>{tourItems[tour][2]}</DialogDescription><div><Button variant="ghost" size="sm" onClick={()=>setTour(null)}>Skip tour</Button><Button size="sm" onClick={()=>setTour(tour===tourItems.length-1?null:tour+1)}>{tour===tourItems.length-1?'Finish':'Next'}</Button></div></DialogContent></Dialog></>}
  <Settings open={settings} onOpenChange={setSettings} theme={theme} onTheme={setTheme} appearance={appearance}/>
  <AnimatePresence>{toast&&<motion.div className="toast" role="status" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:5}}><Check size={16}/>{toast}<button aria-label="Dismiss notification" onClick={()=>setToast('')}><X size={14}/></button></motion.div>}</AnimatePresence>
 </div></TooltipProvider></MotionConfig>;
}
