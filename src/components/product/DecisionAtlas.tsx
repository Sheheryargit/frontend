import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight, CircleAlert, Database, FileText, GitBranch, Layers3,
  ShieldCheck, MousePointer2, TriangleAlert, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { audiences, briefFields, offers } from '../../data';
import type { Workspace } from '../../types';
import type { SourceKey } from '../../services/campaign';
import { budgetValue, calculate, minimumAudience, money, number, percent } from '../../model';
import { ease, dur } from '../../lib/motion';
import { ATLAS_LINKS, ATLAS_NODES, ATLAS_VIEWBOX, edgePath } from './decisionAtlasGeometry';
import type { AtlasFocus } from './decisionAtlasGeometry';

type Focus = AtlasFocus;
type NodeState = 'ok' | 'warn' | 'bad' | 'idle';

const nodeContent: Record<Focus, { label: string; step: string; Icon: LucideIcon }> = {
  brief: { label: 'Brief', step: '01 · INTENT', Icon: FileText },
  audience: { label: 'Audience', step: '02 · DISCOVER', Icon: Users },
  offer: { label: 'Offer', step: '03 · DESIGN', Icon: Layers3 },
  evidence: { label: 'Evidence', step: '04 · VERIFY', Icon: Database },
  estimate: { label: 'Estimate', step: '05 · MODEL', Icon: GitBranch },
  review: { label: 'Review', step: '06 · DECIDE', Icon: ShieldCheck },
};
const GEOM = ATLAS_NODES.map(node => ({ ...node, ...nodeContent[node.id] }));
const LINKS = ATLAS_LINKS;

type Props = {
  workspace: Workspace;
  mode?: 'explore' | 'review';
  canAccept?: boolean;
  onSelect?: (audienceId: string, offerId: string, level: number) => void;
  onSource: (key: SourceKey) => void;
  onReview?: () => void;
  onRefine?: () => void;
  onBrief?: () => void;
};

/**
 * The decision network.
 *
 * Six stages from intent to decision. Every node carries the live figure it is
 * responsible for and a state derived from the real constraint — so the map is
 * a status readout of the whole decision, not an illustration of the process.
 * Selecting a node explains that stage and offers the action that belongs to it.
 */
export function DecisionAtlas({
  workspace: ws, mode = 'explore', canAccept = false,
  onSelect, onSource, onReview, onRefine, onBrief,
}: Props) {
  const still = useReducedMotion();
  const [focus, setFocus] = useState<Focus>(mode === 'review' ? 'review' : 'audience');
  const networkRef = useRef<HTMLDivElement>(null);
  const [networkSize, setNetworkSize] = useState<{ width: number; height: number }>({ ...ATLAS_VIEWBOX });
  useLayoutEffect(() => {
    const element = networkRef.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width && height) setNetworkSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const audience = audiences.find(a => a.id === ws.audienceId) || audiences[0];
  const offer = offers.find(o => o.id === ws.offerId) || offers[1];
  const r = calculate(audience, offer, ws.level, ws.brief);
  const budget = budgetValue(ws.brief);
  const minimum = minimumAudience(ws.brief);
  const captured = briefFields.filter(f => ws.brief[f.key]?.trim()).length;
  const stale = ws.generatedBrief !== JSON.stringify(ws.brief);

  /* Each node reports its own figure and its own verdict. */
  const DATA: Record<Focus, { value: string; unit?: string; state: NodeState; title: string; body: string; issue?: string }> = {
    brief: {
      value: `${captured}/8`, state: stale ? 'warn' : captured === 8 ? 'ok' : 'warn',
      issue: stale ? 'Brief changed after this run' : captured < 8 ? `${8 - captured} details missing` : undefined,
      title: 'One intent, structured',
      body: stale
        ? 'The brief changed after this run. Regenerate before accepting.'
        : 'The decision starts with the campaign details you approved.',
    },
    audience: {
      value: number(r.size), unit: 'members',
      state: r.size < minimum ? 'bad' : audience.id === 'a3' ? 'warn' : 'ok',
      issue: r.size < minimum ? `Below the ${number(minimum)} minimum`
        : audience.id === 'a3' ? 'Targeting needs validation' : undefined,
      title: 'Find the people',
      body: `${audience.name}. Counts change with the audience and the criteria breadth.`,
    },
    offer: {
      value: money(r.cost[1]), unit: 'central cost',
      state: r.fit === 'within' ? 'ok' : r.fit === 'risk' ? 'warn' : r.fit === 'over' ? 'bad' : 'idle',
      issue: r.fit === 'risk' ? 'High estimate crosses the ceiling'
        : r.fit === 'over' ? 'Over the budget ceiling'
        : r.fit === 'unknown' ? 'Budget unconfirmed' : undefined,
      title: 'Shape the incentive',
      body: `${offer.name}. Three mechanics are compared against the same audience.`,
    },
    evidence: {
      value: String(offer.comps.length), unit: 'comparables',
      state: r.evidence === 'strong' ? 'ok' : r.evidence === 'limited' ? 'warn' : 'bad',
      issue: r.evidence === 'insufficient' ? 'Insufficient evidence to accept'
        : r.evidence === 'limited' ? 'Limited evidence — validate first' : undefined,
      title: 'Inspect the evidence',
      body: 'Historical records inform the recommendation. Their limitations stay attached.',
    },
    estimate: {
      value: percent(r.activation[1]), unit: 'activation',
      state: r.fit === 'within' ? 'ok' : r.fit === 'unknown' ? 'idle' : 'warn',
      issue: r.fit !== 'within' && r.fit !== 'unknown' ? 'Cost range breaches the ceiling' : undefined,
      title: 'See the trade-off',
      body: `Reward cost ranges ${money(r.cost[0])} to ${money(r.cost[2])} against ${budget ? money(budget) : 'an unconfirmed budget'}.`,
    },
    review: {
      value: canAccept ? 'Ready' : 'Blocked', state: canAccept ? 'ok' : 'warn',
      issue: canAccept ? undefined : 'Blocked — resolve the flagged stages',
      title: 'Human judgment',
      body: 'The recommendation ends in a recorded strategist decision, never an automatic launch.',
    },
  };

  const active = LINKS.filter(l => l.from === focus || l.to === focus);
  const node = GEOM.find(n => n.id === focus)!;
  const d = DATA[focus];

  return (
    <section className="atlas atlas--live" aria-label="Decision network" data-tour="atlas">
      <div className="atlas-header">
        <div>
          <span className="atlas-eyebrow">
            <span className="atlas-live-dot" /> DECISION NETWORK · REVISION {String(ws.revision).padStart(2, '0')}
          </span>
          <h2>Follow the reasoning.</h2>
        </div>
        <span className="atlas-hint"><MousePointer2 size={14} /> Select a stage to inspect it</span>
      </div>

      {(() => {
        const issues = GEOM
          .map(n => ({ n, d: DATA[n.id] }))
          .filter(x => x.d.issue && (x.d.state === 'warn' || x.d.state === 'bad'));
        if (!issues.length) return (
          <div className="atlas-alerts" data-clear>
            <span className="atlas-alert-pill" data-state="ok"><ShieldCheck />Every stage clear</span>
          </div>
        );
        return (
          <div className="atlas-alerts" role="list" aria-label="Stages needing attention">
            {issues.map(({ n, d }) => (
              <motion.button
                key={n.id} role="listitem" className="atlas-alert-pill" data-state={d.state}
                onClick={() => setFocus(n.id)}
                initial={{ opacity: 0, y: still ? 0 : 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: dur.base, ease: ease.signature }}
              >
                {d.state === 'bad' ? <CircleAlert /> : <TriangleAlert />}
                <strong>{n.label}</strong>{d.issue}
              </motion.button>
            ))}
          </div>
        );
      })()}

      <div className="atlas-body">
        <div className="atlas-network" ref={networkRef}>
          <div className="atlas-grid" aria-hidden="true" />
          <svg className="atlas-links" viewBox={`0 0 ${networkSize.width} ${networkSize.height}`} preserveAspectRatio="none" aria-hidden="true">
            <defs><filter id="atlas-glow"><feGaussianBlur stdDeviation="4" /></filter></defs>
            {LINKS.map(l => {
              const path = edgePath(l.from, l.to, networkSize.width, networkSize.height);
              return (
              <g key={l.id} className={`atlas-link atlas-link--${l.tone} ${active.includes(l) ? 'atlas-link--active' : ''}`}>
                <path d={path} className="atlas-link-halo" filter="url(#atlas-glow)" />
                <path d={path} className="atlas-link-line" />
                {!still && active.includes(l) && (
                  <circle key={`${focus}-${l.id}`} r="2.6" className="atlas-packet">
                    <animateMotion dur="1.3s" repeatCount="indefinite" path={path} />
                  </circle>
                )}
              </g>
            );})}
          </svg>

          {GEOM.map((n, i) => {
            const nd = DATA[n.id];
            return (
              <div key={n.id} className="atlas-node-anchor" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
              <motion.button
                type="button"
                className={`atlas-node atlas-node--${n.id} ${focus === n.id ? 'atlas-node--focused' : ''}`}
                data-state={nd.state}
                onClick={() => setFocus(n.id)}
                aria-pressed={focus === n.id}
                aria-label={`${n.label}: ${nd.value} ${nd.unit ?? ''}`}
                initial={{ opacity: still ? 1 : 0.64 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: still ? 0 : 0.2, ease: ease.out, delay: still ? 0 : i * 0.018 }}
                whileHover={still ? {} : { scale: 1.04 }}
              >
                <span className="atlas-node-core"><n.Icon size={19} strokeWidth={1.7} /></span>
                {(nd.state === 'warn' || nd.state === 'bad') && (
                  <motion.span
                    className="atlas-node-alert" data-state={nd.state}
                    initial={{ scale: still ? 1 : 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 480, damping: 24, delay: still ? 0 : 0.08 + i * 0.018 }}
                  >
                    {nd.state === 'bad' ? <CircleAlert /> : <TriangleAlert />}
                  </motion.span>
                )}
                <span className="atlas-node-label">{n.label}</span>
                <span className="atlas-node-value num">{nd.value}{nd.unit && <i>{nd.unit}</i>}</span>
              </motion.button>
              </div>
            );
          })}

          <span className="atlas-network-caption">SYNTHETIC DATA · READ ONLY · PARTNER A</span>
        </div>

        <div className="atlas-inspector">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={focus}
              initial={{ opacity: 0, y: still ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: still ? 0 : -8 }}
              transition={{ duration: dur.base, ease: ease.signature }}
            >
              <div className="atlas-inspector-top">
                <span>{node.step}</span>
                <span className="atlas-inspector-index num">
                  {String(GEOM.findIndex(n => n.id === focus) + 1).padStart(2, '0')} / 06
                </span>
              </div>

              <h3>{d.title}</h3>
              <p>{d.body}</p>
              {d.issue && (
                <p className="atlas-issue" data-state={d.state}>
                  {d.state === 'bad' ? <CircleAlert size={14} /> : <TriangleAlert size={14} />}
                  {d.issue}
                </p>
              )}

              <div className="atlas-reading" data-state={d.state}>
                <strong className="num">{d.value}</strong>
                {d.unit && <span>{d.unit}</span>}
              </div>

              <div className="atlas-inspector-content">
                {focus === 'brief' && (
                  <>
                    <div className="atlas-data-line"><span>Target</span><strong>{ws.brief.target || 'Not captured'}</strong></div>
                    <div className="atlas-data-line"><span>Budget</span><strong className="num">{budget ? money(budget) : 'Unconfirmed'}</strong></div>
                    {onBrief && <Button variant="outline" size="sm" className="atlas-action" onClick={onBrief}>Edit the brief <ArrowRight size={14} /></Button>}
                  </>
                )}

                {focus === 'audience' && (mode === 'explore' && onSelect ? (
                  <div className="atlas-choice-list">
                    {audiences.map(a => {
                      const c = calculate(a, offer, ws.level, ws.brief);
                      return (
                        <button key={a.id} className={a.id === audience.id ? 'selected' : ''}
                          aria-pressed={a.id === audience.id}
                          onClick={() => onSelect(a.id, offer.id, ws.level)}>
                          <span>
                            {a.name}
                            <small className="num">{number(c.size)} eligible</small>
                            {c.size < minimum && <em className="atlas-flag">Below the {number(minimum)} minimum</em>}
                            {a.id === 'a3' && <em className="atlas-flag">Targeting needs validation</em>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="atlas-data-line"><span>Selected</span><strong>{audience.name}</strong></div>
                    <div className="atlas-data-line"><span>Eligible</span><strong className="num">{number(r.size)} members</strong></div>
                    {onRefine && <Button variant="outline" size="sm" className="atlas-action" onClick={onRefine}>Refine the audience <ArrowRight size={14} /></Button>}
                  </>
                ))}

                {focus === 'offer' && (mode === 'explore' && onSelect ? (
                  <div className="atlas-choice-list">
                    {offers.map(o => {
                      const c = calculate(audience, o, ws.level, ws.brief);
                      return (
                        <button key={o.id} className={o.id === offer.id ? 'selected' : ''}
                          aria-pressed={o.id === offer.id}
                          onClick={() => onSelect(audience.id, o.id, ws.level)}>
                          <span>
                            {o.name}
                            <small className="num">{money(c.cost[1])} central · {money(c.cost[2])} high</small>
                            <em className={c.fit === 'within' ? 'atlas-fit' : 'atlas-flag'}>
                              {c.fit === 'within' ? 'High estimate within budget'
                                : c.fit === 'unknown' ? 'Budget unconfirmed'
                                : 'Budget ceiling at risk'}
                            </em>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="atlas-data-line"><span>Selected</span><strong>{offer.name}</strong></div>
                    <div className="atlas-data-line"><span>Reward cost</span><strong className="num">{money(r.cost[1])}</strong></div>
                    {onRefine && <Button variant="outline" size="sm" className="atlas-action" onClick={onRefine}>Refine the offer <ArrowRight size={14} /></Button>}
                  </>
                ))}

                {focus === 'evidence' && (
                  <>
                    <div className="atlas-data-line"><span>Quality</span><strong>{r.evidence === 'strong' ? 'Strong' : r.evidence === 'limited' ? 'Limited' : 'Insufficient'}</strong></div>
                    <div className="atlas-data-line"><span>Matched</span><strong className="num">{offer.comps.length} campaigns</strong></div>
                    <p className="atlas-caution"><CircleAlert size={14} /> Comparator quality requires validation.</p>
                    <button className="atlas-source" onClick={() => onSource('history')}>
                      <Database size={13} />Inspect historical evidence<ArrowRight size={13} />
                    </button>
                  </>
                )}

                {focus === 'estimate' && (
                  <>
                    <div className="atlas-data-line"><span>Activation</span><strong className="num">{percent(r.activation[0])} – {percent(r.activation[2])}</strong></div>
                    <div className="atlas-data-line"><span>Reward cost</span><strong className="num">{money(r.cost[0])} – {money(r.cost[2])}</strong></div>
                    <div className="atlas-data-line"><span>Ceiling</span><strong className="num">{budget ? money(budget) : 'Unconfirmed'}</strong></div>
                    <p className="atlas-caution"><CircleAlert size={14} /> Illustrative ranges, not a predictive model.</p>
                  </>
                )}

                {focus === 'review' && (
                  <>
                    <div className="atlas-data-line"><span>Audience</span><strong>{audience.name}</strong></div>
                    <div className="atlas-data-line"><span>Offer</span><strong>{offer.name}</strong></div>
                    <p className="atlas-caution"><ShieldCheck size={14} /> Human approval is required before any activation.</p>
                    {mode === 'explore' && onReview
                      ? <Button className="atlas-action" onClick={onReview}>Review specification <ArrowRight size={14} /></Button>
                      : onRefine && <Button variant="outline" size="sm" className="atlas-action" onClick={onRefine}>Back to the recommendation <ArrowRight size={14} /></Button>}
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
