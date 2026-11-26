import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Source, EvidenceTag, Notice } from '../components/product/shared';
import { DecisionAtlas } from '../components/product/DecisionAtlas';
import { StatCard } from '../components/decision/StatCard';
import { RangeMeter } from '../components/decision/RangeMeter';
import { OptionPicker } from '../components/decision/OptionPicker';
import { ScenarioLab } from '../components/decision/ScenarioLab';
import { EvidencePassport } from '../components/decision/EvidencePassport';
import { SegmentLibrary } from '../components/decision/SegmentLibrary';
import { AskSpark } from '../components/decision/AskSpark';
import { DotRange } from '../components/product/InsightSignals';
import { audiences, campaigns, offers } from '../data';
import type { Campaign } from '../data';
import type { Workspace } from '../types';
import type { SourceKey } from '../services/campaign';
import { budgetValue, calculate, minimumAudience, money, number, percent } from '../model';
import { ease, dur } from '../lib/motion';

type Props = {
  workspace: Workspace;
  canAccept: boolean;
  onSelect: (a: string, o: string, l: number) => void;
  onSource: (key: SourceKey) => void;
  onReview: () => void;
};

const LEVELS = ['Narrow', 'Balanced', 'Broad'];

export function RecommendationScreen({ workspace: ws, canAccept, onSelect, onSource, onReview }: Props) {
  const still=useReducedMotion();
  const [tab, setTab] = useState('choose');
  const [pulse,setPulse]=useState('');
  const pulseTimers=useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(()=>()=>pulseTimers.current.forEach(clearTimeout),[]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState<{ key: keyof Campaign; dir: number }>({ key: 'sortDate', dir: -1 });
  const [page, setPage] = useState(0);
  const [record, setRecord] = useState<Campaign | null>(null);

  const a = audiences.find(x => x.id === ws.audienceId)!;
  const o = offers.find(x => x.id === ws.offerId)!;
  const r = calculate(a, o, ws.level, ws.brief);
  const budget = budgetValue(ws.brief);
  const minimum = minimumAudience(ws.brief);
  const stale = ws.generatedBrief !== JSON.stringify(ws.brief);

  const rows = useMemo(() => campaigns
    .filter(c => (filter === 'All' || c.objective === filter)
      && `${c.id} ${c.name} ${c.offer}`.toLowerCase().includes(query.toLowerCase()))
    .sort((x, y) => {
      const av = x[sort.key], bv = y[sort.key];
      return (typeof av === 'number' && typeof bv === 'number'
        ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''))) * sort.dir;
    }), [query, filter, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / 5));
  const safePage = Math.min(page, pages - 1);
  const objectives = ['All', ...new Set(campaigns.map(c => c.objective))];

  function selectWithPulse(audienceId:string,offerId:string,level:number){
    if(audienceId===ws.audienceId&&offerId===ws.offerId&&level===ws.level)return;
    pulseTimers.current.forEach(clearTimeout);
    if(still){onSelect(audienceId,offerId,level);return;}
    setPulse('Tracing the changed decision');
    pulseTimers.current=[
      setTimeout(()=>{onSelect(audienceId,offerId,level);setPulse('Refreshing the connected estimates');},520),
      setTimeout(()=>setPulse('Direction resolved'),1120),
      setTimeout(()=>setPulse(''),1770),
    ];
  }

  function exportRows() {
    const headers = ['ID', 'Campaign', 'Date', 'Audience', 'Activation', 'Qualification', 'Uplift', 'ROI', 'Flags'];
    const lines = rows.map(c => [c.id, c.name, c.date, c.audience, percent(c.activation),
      percent(c.qualification), c.uplift ?? 'MISSING', c.roi ?? 'MISSING', c.flags.join('; ')]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const url = URL.createObjectURL(new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'spark-historical-evidence.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const sortBy = (key: keyof Campaign) =>
    setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }));

  return (
    <div className="rec rec-layout">
      <div className="rec-assistant-rail">
        <AskSpark key={ws.revision} workspace={ws} onSelect={selectWithPulse} onSource={onSource} />
      </div>

      <div className="rec-main">
      {stale && (
        <Notice tone="warning">
          <strong>The brief has changed</strong>
          <p>Estimates reflect your edits, but a new decisioning run is needed before acceptance.</p>
        </Notice>
      )}

      {/* ---- the recommendation ---- */}
      <motion.section
        className="rec-hero" data-tour="summary"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur.screen, ease: ease.signature }}
      >
        <div className="rec-hero-head">
          <div>
            <span className="t-overline">Recommended combination · revision {String(ws.revision).padStart(2, '0')}</span>
            <h2>{a.name} <i>·</i> {o.name}</h2>
            <p>{LEVELS[ws.level]} criteria. {a.description} {o.rationale}</p>
          </div>
        </div>

        <div className="rec-viability" data-fit={r.fit==='within'&&r.size>=minimum&&r.evidence!=='insufficient'?'viable':'attention'}>
          <span>{r.fit==='within'&&r.size>=minimum&&r.evidence!=='insufficient'?'VIABLE WORKING DIRECTION':'CONSTRAINT NEEDS REVIEW'}</span>
          <strong>{r.size>=minimum?`${number(r.size)} members clear the ${number(minimum)} demo floor`:`Audience below the ${number(minimum)} demo floor`}</strong>
          <button onClick={() => {
            setTab('compare');
            document.getElementById('recommendation-exploration')?.scrollIntoView({
              block: 'start', behavior: still ? 'instant' : 'smooth',
            });
          }}>Explore trade-offs</button>
        </div>
        <AnimatePresence initial={false}>{pulse&&<motion.div className="selection-signal" role="status" initial={{opacity:0,height:0}} animate={{opacity:1,height:34}} exit={{opacity:0,height:0}} transition={{duration:.28}}><i/><span>{pulse}</span><b/></motion.div>}</AnimatePresence>

        <div className="rec-stats">
          <StatCard index={0} emphasis label="Eligible members" value={r.size} format={number}
            note={`${LEVELS[ws.level]} criteria · floor ${number(minimum)}`}
            tone={r.size >= minimum ? 'neutral' : 'bad'}
            source={<Source source="audience" compact onOpen={onSource} />} />
          <StatCard index={1} emphasis label="Reward cost estimate" value={r.cost[1]} format={money}
            range={`${money(r.cost[0])} – ${money(r.cost[2])}`}
            note={budget ? `against ${money(budget)} ceiling` : 'budget unconfirmed'}
            tone={r.fit === 'within' ? 'ok' : r.fit === 'risk' ? 'warn' : r.fit === 'over' ? 'bad' : 'neutral'}
            source={<Source source="offer" compact onOpen={onSource} />} />
          <StatCard index={2} label="Activation estimate" value={r.activation[1] * 100}
            format={n => `${n.toFixed(1)}%`}
            range={`${percent(r.activation[0])} – ${percent(r.activation[2])}`}
            note="illustrative range, not a forecast"
            source={<Source source="forecast" compact onOpen={onSource} />} />
          <StatCard index={3} label="Evidence quality"
            value={r.evidence === 'strong' ? 'Strong' : r.evidence === 'limited' ? 'Limited' : 'Insufficient'}
            note={`${o.comps.length} matched campaigns · validation needed`}
            tone={r.evidence === 'strong' ? 'ok' : r.evidence === 'limited' ? 'warn' : 'bad'}
            source={<Source source="history" compact onOpen={onSource} />} />
        </div>

        <div className="rec-meters">
          <RangeMeter label="Reward cost against the budget ceiling"
            low={r.cost[0]} mid={r.cost[1]} high={r.cost[2]} ceiling={budget} fit={r.fit} />
          <div className="rec-activation">
            <span className="meter-label">Activation range</span>
            <DotRange low={r.activation[0]} mid={r.activation[1]} high={r.activation[2]} />
            <p className="meter-verdict">
              Every lit dot is inside the illustrative interval. No probability is implied.
            </p>
          </div>
        </div>
      </motion.section>

      <DecisionAtlas
        workspace={ws}
        mode="explore"
        canAccept={canAccept}
        onSelect={selectWithPulse}
        onSource={onSource}
        onReview={onReview}
      />

      {/* ---- explore ---- */}
      <Tabs value={tab} onValueChange={setTab} className="rec-tabs" id="recommendation-exploration" data-tour="exploration">
        <div className="rec-tabbar">
          <TabsList variant="line">
            <TabsTrigger value="choose">Audience &amp; offer</TabsTrigger>
            <TabsTrigger value="compare">Scenario lab</TabsTrigger>
            <TabsTrigger value="evidence">Evidence passport <span className="tab-count">{campaigns.length}</span></TabsTrigger>
          </TabsList>
          <Source source={tab === 'evidence' ? 'history' : 'audience'} onOpen={onSource} />
        </div>

        <TabsContent value="choose">
          <SegmentLibrary selectedId={ws.audienceId} offerId={ws.offerId} onSelect={selectWithPulse}/>
          <OptionPicker
            brief={ws.brief}
            audienceId={ws.audienceId} offerId={ws.offerId} level={ws.level}
            onSelect={selectWithPulse}
          />
        </TabsContent>

        <TabsContent value="compare"><ScenarioLab workspace={ws} onSelect={selectWithPulse}/></TabsContent>

        <TabsContent value="evidence">
          <EvidencePassport workspace={ws} onSource={onSource}/>
          <div className="ev">
            <div className="ev-bar">
              <div className="ev-search">
                <Search size={14} />
                <Input value={query} placeholder="Search campaigns…"
                  aria-label="Search historical campaigns"
                  onChange={e => { setQuery(e.target.value); setPage(0); }} />
              </div>
              <div className="ev-filters" role="group" aria-label="Filter by objective">
                {objectives.map(obj => (
                  <button key={obj} data-on={filter === obj} aria-pressed={filter === obj}
                    onClick={() => { setFilter(obj); setPage(0); }}>{obj}</button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={exportRows}><Download />Export CSV</Button>
            </div>

            <div className="ev-scroll">
              <table className="ev-table">
                <thead>
                  <tr>
                    {([['id', 'Campaign'], ['sortDate', 'Date'], ['audience', 'Audience'],
                       ['activation', 'Activation'], ['qualification', 'Qualification'], ['roi', 'ROI']] as const)
                      .map(([key, label]) => (
                      <th key={key} className={key === 'id' ? '' : 'num'}
                        aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                        <button onClick={() => sortBy(key as keyof Campaign)}>
                          {label}{sort.key === key && (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(safePage * 5, safePage * 5 + 5).map(c => (
                    <tr key={c.id} onClick={() => setRecord(c)} tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter') setRecord(c); }}>
                      <td>
                        <strong>{c.name}</strong>
                        <small className="ident">{c.id} · {c.offer}</small>
                        {c.flags.length > 0 && <em className="ev-flag">{c.flags.length} data-quality flag{c.flags.length > 1 ? 's' : ''}</em>}
                      </td>
                      <td className="num">{c.date}</td>
                      <td className="num">{number(c.audience)}</td>
                      <td className="num">{percent(c.activation)}</td>
                      <td className="num">{percent(c.qualification)}</td>
                      <td className="num">
                        {c.roi === null ? <span className="missing-value">Missing</span> : `${c.roi.toFixed(1)}×`}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={6} className="ev-empty">
                      No campaigns match. <button onClick={() => { setQuery(''); setFilter('All'); }}>Reset filters</button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ev-foot">
              <span>Missing values are never treated as zero.</span>
              <div className="ev-page">
                <Button variant="ghost" size="icon-sm" aria-label="Previous page"
                  disabled={safePage === 0} onClick={() => setPage(p => Math.max(0, p - 1))}><ChevronLeft /></Button>
                <span className="num">{safePage + 1} / {pages}</span>
                <Button variant="ghost" size="icon-sm" aria-label="Next page"
                  disabled={safePage >= pages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight /></Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      </div>

      <Dialog open={record !== null} onOpenChange={open => { if (!open) setRecord(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{record?.name}</DialogTitle>
            <DialogDescription>{record?.id} · {record?.date} · {record?.offer}</DialogDescription>
          </DialogHeader>
          {record && (
            <>
              <div className="rec-record">
                <div><span>Audience</span><strong className="num">{number(record.audience)}</strong></div>
                <div><span>Activation</span><strong className="num">{percent(record.activation)}</strong></div>
                <div><span>Qualification</span><strong className="num">{percent(record.qualification)}</strong></div>
                <div><span>Uplift</span><strong className="num">{record.uplift === null ? <em className="missing-value">Missing</em> : percent(record.uplift)}</strong></div>
                <div><span>ROI</span><strong className="num">{record.roi === null ? <em className="missing-value">Missing</em> : `${record.roi.toFixed(1)}×`}</strong></div>
              </div>
              <div className="rec-record-flags">
                <span className="t-overline">Data quality</span>
                {record.flags.length
                  ? <ul>{record.flags.map(f => <li key={f}>{f}</li>)}</ul>
                  : <p>No flagged defects in this record.</p>}
              </div>
              <EvidenceTag evidence={r.evidence} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
