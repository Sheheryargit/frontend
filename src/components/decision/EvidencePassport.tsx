import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, CircleAlert, Database, FileWarning, ShieldCheck } from 'lucide-react';
import { audiences, offers } from '../../data';
import type { Workspace } from '../../types';
import type { SourceKey } from '../../services/campaign';
import { Source } from '../product/shared';
import { comparator, evidenceCounts } from '../../lib/discovery';
import { percent } from '../../model';

export function EvidencePassport({ workspace: ws, onSource }: { workspace: Workspace; onSource: (key: SourceKey) => void }) {
  const still = useReducedMotion();
  const audience = audiences.find(a=>a.id===ws.audienceId)!;
  const offer = offers.find(o=>o.id===ws.offerId)!;
  const counts = evidenceCounts(offer);
  const matched = [...counts.matched].sort((a,b)=>comparator(b,offer).points-comparator(a,offer).points);
  return <section className="passport" aria-label="Evidence passport">
    <header className="passport-head"><div><span className="t-overline">EVIDENCE PASSPORT · REVISION {String(ws.revision).padStart(2,'0')}</span><h3>What supports this direction</h3><p>The source, fit, and limitations travel with the recommendation.</p></div><span className="passport-seal"><ShieldCheck size={18}/> Partner A scope</span></header>
    <div className="passport-ribbon">
      <div><small>AUDIENCE SIGNAL</small><strong>{audience.granularity==='category'?'Category behaviour':'Partner-level fallback'}</strong><span>{audience.granularity==='category'?'Partner A category detail':'Category claims unavailable'}</span></div>
      <div><small>COMPARATORS</small><strong>{counts.matched.length} matched</strong><span>{counts.clean} without flagged defects</span></div>
      <div><small>FINANCIAL COVERAGE</small><strong>{counts.withRoi}/{counts.matched.length} with ROI</strong><span>Not enough for an offer ROI forecast</span></div>
      <div><small>DATA FRESHNESS</small><strong>Unconnected</strong><span>No live snapshot timestamp</span></div>
    </div>
    <div className="passport-body">
      <div className="passport-comparators"><div className="passport-section-title"><Database size={16}/><h4>Closest historical records</h4><Source source="history" compact onOpen={onSource}/></div>
        <p>Illustrative match rubric: same offer mechanic 45, same objective 35, no flagged defects 20. It is a sorting aid, not a quality score.</p>
        {matched.map((c,i)=>{const m=comparator(c,offer);return <motion.article className="passport-comparator" key={c.id}
          initial={{opacity:0,y:still?0:10}} animate={{opacity:1,y:0}} transition={{duration:still?0:.34,delay:still?0:i*.1}}>
          <div className="passport-comparator-top"><strong>{c.name}</strong><span>{m.label}</span></div>
          <small>{c.id} · {c.date} · {c.source}</small>
          <div className="passport-match" aria-label={`${m.points} of 100 illustrative match points`}>
            <i data-on={m.mechanic} style={{width:'45%'}}/><i data-on={m.objective} style={{width:'35%'}}/><i data-on={m.quality} style={{width:'20%'}}/>
          </div>
          <div className="passport-comparator-foot"><span>{percent(c.activation)} activation</span><span>{c.flags.length?c.flags.join(' · '):'No flagged defects'}</span></div>
        </motion.article>;})}
        {matched.length===0&&<p className="passport-empty">No matched campaigns for this offer. A forecast should be withheld.</p>}
        <div className="passport-rubric"><span><i/>Mechanic</span><span><i/>Objective</span><span><i/>Data quality</span></div>
      </div>
      <aside className="passport-limits"><div className="passport-section-title"><FileWarning size={16}/><h4>What still needs proof</h4></div>
        <ul>
          <li><CircleAlert size={14}/><span>Comparator matching and sample thresholds have not been validated.</span></li>
          <li><CircleAlert size={14}/><span>$0.005 per point is a demo costing assumption. Media and operating costs are excluded.</span></li>
          <li><CircleAlert size={14}/><span>Offer-level effects cannot be claimed from campaign-level rates.</span></li>
          <li><CircleAlert size={14}/><span>System A/B reconciliation and control-group flags need analyst confirmation.</span></li>
        </ul>
        <div className="passport-forecast"><small>FORECAST POLICY</small><strong>ROI unavailable</strong><p>Show an ROI only when finance inputs, comparison rules, and control evidence are approved. Missing is never treated as zero.</p></div>
        <div className="passport-sources"><button onClick={()=>onSource('audience')}>Inspect audience source <ArrowUpRight size={13}/></button><button onClick={()=>onSource('forecast')}>Inspect estimate contract <ArrowUpRight size={13}/></button></div>
      </aside>
    </div>
    <footer className="passport-foot">Read-only synthetic data · no individual customer details · no cross-partner product insight</footer>
  </section>;
}
