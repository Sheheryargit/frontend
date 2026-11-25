import { motion, useReducedMotion } from 'motion/react';
import {
  Calculator, Database, FileText, Route, TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Source } from '../product/shared';
import { audiences, briefFields, campaigns, offers } from '../../data';
import type { Workspace } from '../../types';
import type { SourceKey } from '../../services/campaign';
import { calculate, money, number, percent } from '../../model';
import { ease, dur } from '../../lib/motion';

type Props = {
  workspace: Workspace;
  onSource: (key: SourceKey) => void;
  onBrief: () => void;
};

const ASSUMPTIONS = [
  { title: 'Comparator quality', body: 'Matching rules and minimum sample thresholds have not been validated. Two matched campaigns is a small base.' },
  { title: 'Reward costing', body: '$0.005 per point is a placeholder, not an approved financial rule. Media and operating costs are excluded entirely.' },
  { title: 'Offer-level rates', body: 'Activation and qualification may be recorded at campaign level, which cannot establish individual offer performance.' },
  { title: 'No ROI forecast', body: 'Missing financial inputs are reported as missing. No ROI is modelled, and none is inferred from incomplete records.' },
];

/**
 * How the recommendation was arrived at.
 *
 * Four panels of reasoning, plus the arithmetic itself. The derivation matters:
 * a strategist asked to accept a figure should be able to see the chain that
 * produced it — size → activation → qualification → reward cost — with the real
 * numbers substituted, not just the result.
 */
export function Reasoning({ workspace: ws, onSource, onBrief }: Props) {
  const still = useReducedMotion();
  const a = audiences.find(x => x.id === ws.audienceId)!;
  const o = offers.find(x => x.id === ws.offerId)!;
  const r = calculate(a, o, ws.level, ws.brief);
  const matched = campaigns.filter(c => o.comps.includes(c.id));
  const captured = briefFields.filter(f => ws.brief[f.key]?.trim()).length;

  const panels: {
    id: string; title: string; subtitle: string; Icon: LucideIcon;
    badge?: { text: string; tone: 'ok' | 'warn' | 'bad' };
    body: React.ReactNode;
  }[] = [
    {
      id: 'derivation', title: 'How these figures are calculated', Icon: Calculator,
      subtitle: 'Every step, with the real numbers',
      body: (
        <>
          <p className="reason-lead">
            Each figure below is derived from the one above it. No step is modelled or inferred.
          </p>
          <ol className="derive">
            <li>
              <span className="derive-step">1</span>
              <div>
                <strong>Eligible members</strong>
                <small>The audience at {['narrow', 'balanced', 'broad'][ws.level]} criteria.</small>
                <code className="num">{number(r.size)} members</code>
              </div>
            </li>
            <li>
              <span className="derive-step">2</span>
              <div>
                <strong>Activation rate</strong>
                <small>Offer activation × this audience's responsiveness factor ({a.activationFactor}).</small>
                <code className="num">{percent(r.activation[0])} – {percent(r.activation[2])}, central {percent(r.activation[1])}</code>
              </div>
            </li>
            <li>
              <span className="derive-step">3</span>
              <div>
                <strong>Members activated</strong>
                <small>Eligible members × activation rate.</small>
                <code className="num">{number(r.activated[0])} – {number(r.activated[2])}</code>
              </div>
            </li>
            <li>
              <span className="derive-step">4</span>
              <div>
                <strong>Members qualified</strong>
                <small>Activated × the share that completes the offer mechanic.</small>
                <code className="num">{number(r.qualified[0])} – {number(r.qualified[2])}</code>
              </div>
            </li>
            <li data-emphasis>
              <span className="derive-step">5</span>
              <div>
                <strong>Reward cost</strong>
                <small>Qualified members × {number(o.reward)} points × $0.005 per point.</small>
                <code className="num">{money(r.cost[0])} – {money(r.cost[2])}, central {money(r.cost[1])}</code>
              </div>
            </li>
          </ol>
          <p className="reason-caveat">
            <TriangleAlert />
            The per-point rate is an unvalidated assumption. Media and operating costs are not included,
            so this is a reward cost, not a campaign cost.
          </p>
          <Source source="offer" onOpen={onSource} />
        </>
      ),
    },
    {
      id: 'rationale', title: 'Why this audience and offer', Icon: Route,
      subtitle: 'Rationale and targeting rules',
      body: (
        <>
          <p>{a.description} {o.rationale}</p>
          <span className="reason-label">Targeting criteria applied</span>
          <ul className="reason-list">
            {a.criteria(ws.level).map(c => <li key={c}>{c}</li>)}
          </ul>
          <p className="reason-caveat"><TriangleAlert />{a.caveat}</p>
          <Source source="audience" onOpen={onSource} />
        </>
      ),
    },
    {
      id: 'warnings', title: 'Evidence limits and assumptions', Icon: TriangleAlert,
      subtitle: `${ASSUMPTIONS.length} items to validate before this is relied on`,
      badge: { text: `${ASSUMPTIONS.length} to validate`, tone: 'warn' },
      body: (
        <ul className="reason-assume">
          {ASSUMPTIONS.map(x => (
            <li key={x.title}><strong>{x.title}</strong><span>{x.body}</span></li>
          ))}
        </ul>
      ),
    },
    {
      id: 'history', title: 'Historical comparables', Icon: Database,
      subtitle: `${matched.length} matched example${matched.length === 1 ? '' : 's'}`,
      badge: { text: `${matched.length} matched`, tone: matched.length > 2 ? 'ok' : 'warn' },
      body: (
        <>
          {matched.map(c => (
            <div key={c.id} className="reason-comp">
              <div>
                <strong>{c.name}</strong>
                <small className="ident">{c.id} · {c.date} · {c.offer}</small>
              </div>
              <dl>
                <div><dt>Activation</dt><dd className="num">{percent(c.activation)}</dd></div>
                <div><dt>Qualification</dt><dd className="num">{percent(c.qualification)}</dd></div>
                <div><dt>ROI</dt><dd className="num">{c.roi === null ? <em className="missing-value">Missing</em> : `${c.roi.toFixed(1)}×`}</dd></div>
              </dl>
              <em>{c.flags.length ? c.flags.join(' · ') : 'No flagged defects in this record'}</em>
            </div>
          ))}
          <Source source="history" onOpen={onSource} />
        </>
      ),
    },
    {
      id: 'brief', title: 'The brief behind this revision', Icon: FileText,
      subtitle: `${captured} of ${briefFields.length} details captured`,
      badge: { text: `${captured}/${briefFields.length}`, tone: captured === briefFields.length ? 'ok' : 'warn' },
      body: (
        <>
          <dl className="reason-brief">
            {briefFields.map(f => (
              <div key={f.key}>
                <dt>{f.label}</dt>
                <dd>{ws.brief[f.key] || <span className="missing-value">Not captured</span>}</dd>
              </div>
            ))}
          </dl>
          <Button variant="outline" size="sm" onClick={onBrief}>Edit the brief</Button>
        </>
      ),
    },
  ];

  return (
    <motion.section
      className="reason"
      initial={{ opacity: 0, y: still ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.screen, ease: ease.signature }}
    >
      <div className="reason-head">
        <span className="t-overline">How this recommendation was reached</span>
        <span className="reason-hint">Open any section for the working behind it</span>
      </div>

      <Accordion type="multiple" defaultValue={['warnings']} className="reason-acc">
        {panels.map(p => (
          <AccordionItem value={p.id} key={p.id}>
            <AccordionTrigger>
              <span className="reason-trigger">
                <span className="reason-icon"><p.Icon /></span>
                <span className="reason-text">
                  <strong>{p.title}</strong>
                  <small>{p.subtitle}</small>
                </span>
                {p.badge && (
                  <span className="reason-badge" data-tone={p.badge.tone}>{p.badge.text}</span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="reason-body">{p.body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.section>
  );
}
