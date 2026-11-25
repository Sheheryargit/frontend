import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, GitCompareArrows, TriangleAlert } from 'lucide-react';
import { Button } from '../ui/button';
import type { Workspace } from '../../types';
import { budgetValue, money, number, percent } from '../../model';
import { scenarioSet } from '../../lib/discovery';

export function ScenarioLab({ workspace: ws, onSelect }: { workspace: Workspace; onSelect: (a: string, o: string, l: number) => void }) {
  const still = useReducedMotion();
  const [selectedId, setSelectedId] = useState('current');
  useEffect(() => setSelectedId('current'), [ws.audienceId, ws.offerId, ws.level]);
  const scenarios = scenarioSet(ws.brief, ws.audienceId, ws.offerId, ws.level);
  const current = scenarios[0];
  const selected = scenarios.find(s => s.id === selectedId) ?? scenarios[1] ?? current;
  const budget = budgetValue(ws.brief);
  const xMax = Math.max(budget ? budget * 1.16 : 0, ...scenarios.map(s => s.result.cost[2] * 1.08));
  const yMax = Math.max(...scenarios.map(s => s.result.size)) * 1.12;
  const x = (n: number) => 48 + (n / xMax) * 532;
  const y = (n: number) => 252 - (n / yMax) * 213;
  const delta = (a: number, b: number, formatter: (n: number) => string) => `${a >= b ? '+' : '−'}${formatter(Math.abs(a - b))}`;
  return <section className="scenario-lab" aria-label="Scenario comparison">
    <header className="scenario-head"><div><span className="t-overline">DECISION LAB · LIVE COMPARISON</span><h3>Explore the trade-off</h3><p>Compare viable directions before changing the recommendation. Every point uses the same illustrative model.</p></div><GitCompareArrows size={21}/></header>
    <div className="scenario-main">
      <div className="scenario-chart" role="img" aria-label="Scenarios plotted by high reward cost on the horizontal axis and eligible members on the vertical axis">
        <div className="scenario-chart-head"><strong>Reach / reward cost</strong><span>{budget ? `${money(budget)} ceiling` : 'Budget unconfirmed'}</span></div>
        <svg viewBox="0 0 640 300" preserveAspectRatio="none" aria-hidden="true">
          {[0, 1, 2, 3].map(i => <g key={i}><line x1="48" x2="584" y1={252-i*67} y2={252-i*67} className="scenario-gridline"/><text x="9" y={256-i*67} className="scenario-axis">{number(Math.round(yMax*i/3))}</text></g>)}
          <line x1="48" x2="584" y1="252" y2="252" className="scenario-axisline"/>
          {budget && <g><line x1={x(budget)} x2={x(budget)} y1="26" y2="252" className="scenario-budgetline"/><text x={Math.min(x(budget)+5,546)} y="29" className="scenario-budgetlabel">BUDGET</text></g>}
          {scenarios.map((s,i) => <g key={s.id} onClick={() => setSelectedId(s.id)} className="scenario-svg-choice">
            <motion.line x1={x(s.result.cost[0])} x2={x(s.result.cost[2])} y1={y(s.result.size)} y2={y(s.result.size)} className={selected.id===s.id?'scenario-range selected':'scenario-range'}
              initial={false} animate={{opacity:selected.id===s.id?1:.55}} transition={{duration:still?0:.28}}/>
            <motion.circle cx={x(s.result.cost[1])} cy={y(s.result.size)} r={selected.id===s.id?8:5} className={s.id==='current'?'scenario-point current':selected.id===s.id?'scenario-point selected':'scenario-point'}
              initial={false} animate={{cx:x(s.result.cost[1]),cy:y(s.result.size),r:selected.id===s.id?8:5,opacity:1}}
              transition={{duration:still?0:.55,ease:[.19,1,.22,1]}}/>
            <text x={x(s.result.cost[1])+12} y={y(s.result.size)+(i===3?-11:i===0?15:4)} className="scenario-point-label">{i===0?'CURRENT':s.label.toUpperCase()}</text>
          </g>)}
          <text x="48" y="284" className="scenario-axis">$0</text><text x="542" y="284" className="scenario-axis">HIGH REWARD COST →</text>
        </svg>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={selected.id} className="scenario-reading"
          initial={{opacity:0,y:still?0:9}} animate={{opacity:1,y:0}} exit={{opacity:0,y:still?0:-8}}
          transition={{duration:still?0:.32,ease:[.19,1,.22,1]}}>
          <span className="t-overline">SELECTED DIRECTION</span><h4>{selected.label}</h4><p>{selected.explanation}</p>
          <dl><div><dt>Eligible members</dt><dd className="num">{number(selected.result.size)}<small>{delta(selected.result.size,current.result.size,number)} vs current</small></dd></div>
          <div><dt>High reward cost</dt><dd className="num">{money(selected.result.cost[2])}<small>{delta(selected.result.cost[2],current.result.cost[2],money)} vs current</small></dd></div>
          <div><dt>Activation range</dt><dd className="num">{percent(selected.result.activation[0])}–{percent(selected.result.activation[2])}</dd></div></dl>
          <p className="scenario-fit" data-fit={selected.result.fit}>{selected.result.fit==='within'?<Check size={14}/>:<TriangleAlert size={14}/>} {selected.result.fit==='within'?'High estimate within budget':'Cost or budget needs review'}</p>
          <Button size="sm" onClick={()=>onSelect(selected.audience.id,selected.offer.id,selected.level)} disabled={selected.id==='current'}>Use this direction <ArrowUpRight size={14}/></Button>
        </motion.div>
      </AnimatePresence>
    </div>
    <div className="scenario-options" role="group" aria-label="Choose scenario to inspect">
      {scenarios.map(s=><motion.button key={s.id} type="button" className="scenario-option" data-selected={selected.id===s.id}
        onClick={()=>setSelectedId(s.id)} aria-pressed={selected.id===s.id} whileTap={still?{}:{scale:.985}}>
        <span>{s.label}</span><strong className="num">{number(s.result.size)} <small>members</small></strong><em className="num">{money(s.result.cost[2])} high</em>
      </motion.button>)}
    </div>
    <p className="scenario-footnote">Reward cost excludes media and operating costs. Activation ranges are illustrative, not predictive forecasts.</p>
  </section>;
}
