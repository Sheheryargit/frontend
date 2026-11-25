import { motion } from 'motion/react';
import { FilePenLine, History, RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Source, Notice, EvidenceTag } from '../components/product/shared';
import { DecisionAtlas } from '../components/product/DecisionAtlas';
import { Reasoning } from '../components/decision/Reasoning';
import { CheckList } from '../components/decision/CheckList';
import type { Check } from '../components/decision/CheckList';
import { DecisionBar } from '../components/decision/DecisionBar';
import { RangeMeter } from '../components/decision/RangeMeter';
import { ReviewIntelligence } from '../components/decision/ReviewIntelligence';
import { audiences, offers } from '../data';
import type { Workspace } from '../types';
import type { SourceKey } from '../services/campaign';
import { budgetValue, calculate, minimumAudience, money, number, percent } from '../model';
import { dateTime } from '../lib/format';
import { ease, dur } from '../lib/motion';

const LEVELS = ['Narrow', 'Balanced', 'Broad'];


type Props = {
  workspace: Workspace;
  onSource: (key: SourceKey) => void;
  canAccept: boolean;
  onAccept: () => void;
  onFeedback: (mode: 'changes' | 'rejected') => void;
  onRefine: () => void;
  onBrief: () => void;
};

export function ReviewScreen({
  workspace: ws, onSource, canAccept, onAccept, onFeedback, onRefine, onBrief,
}: Props) {
  const a = audiences.find(x => x.id === ws.audienceId)!;
  const o = offers.find(x => x.id === ws.offerId)!;
  const r = calculate(a, o, ws.level, ws.brief);
  const budget = budgetValue(ws.brief);
  const minimum = minimumAudience(ws.brief);
  const stale = ws.generatedBrief !== JSON.stringify(ws.brief);

  const decision = [...ws.decisions].reverse()
    .find(d => d.revision === ws.revision && d.configVersion === ws.configVersion);

  const checks: Check[] = [
    { name: 'Partner separation', pass: true,
      detail: 'Partner A only. Cross-partner signals are excluded pending approval.' },
    { name: 'Audience minimum', pass: r.size >= minimum,
      detail: `${number(r.size)} members against a ${number(minimum)} minimum.` },
    { name: 'Budget ceiling', pass: r.fit === 'within',
      detail: `${money(r.cost[2])} high estimate against ${budget ? money(budget) : 'an unconfirmed'} budget.` },
    { name: 'Targeting rule validation', pass: a.id !== 'a3',
      detail: a.id === 'a3'
        ? 'Lifecycle classification is not validated for this audience.'
        : 'Observed purchase behaviour; no predictive targeting fields used.' },
  ];

  /* The blocking reason is stated, never implied by a disabled button. */
  const blocked =
    stale ? 'The brief changed after this run. Regenerate before accepting.'
    : r.fit !== 'within' ? 'The high cost estimate exceeds the budget ceiling.'
    : r.size < minimum ? `The audience is below the ${number(minimum)}-member minimum.`
    : a.id === 'a3' ? 'This audience needs targeting validation before acceptance.'
    : r.evidence === 'insufficient' ? 'Evidence quality is insufficient to accept.'
    : null;

  return (
    <div className="rev">
      {stale && (
        <Notice tone="warning">
          <strong>The brief has changed</strong>
          <p>This specification reflects the previous run.</p>
          <Button variant="outline" size="sm" onClick={onBrief}><FilePenLine />Review updated brief</Button>
        </Notice>
      )}

      <DecisionAtlas
        workspace={ws}
        mode="review"
        canAccept={canAccept}
        onSource={onSource}
        onRefine={onRefine}
        onBrief={onBrief}
      />

      <div className="rev-decision-dock" data-tour="decision">
        <DecisionBar
          canAccept={canAccept}
          blockedReason={blocked}
          accepted={decision?.status === 'accepted'}
          onAccept={onAccept}
          onChanges={() => onFeedback('changes')}
          onReject={() => onFeedback('rejected')}
        />
      </div>

      <div className="rev-grid">
        {/* ---- the specification being judged ---- */}
        <motion.section className="rev-spec" data-tour="review-spec"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.screen, ease: ease.signature }}>
          <header>
            <span className="t-overline">Specification · revision {String(ws.revision).padStart(2, '0')}</span>
            <h2>{a.name} <i>·</i> {o.name}</h2>
            <p>{LEVELS[ws.level]} criteria · {o.mechanic}</p>
          </header>

          <dl className="rev-figures">
            <div><dt>Eligible members <Source source="audience" compact onOpen={onSource} /></dt>
              <dd className="num">{number(r.size)}<small>floor {number(minimum)}</small></dd></div>
            <div><dt>Reward cost <Source source="offer" compact onOpen={onSource} /></dt>
              <dd className="num">{money(r.cost[1])}<small>{money(r.cost[0])} – {money(r.cost[2])}</small></dd></div>
            <div><dt>Activation <Source source="forecast" compact onOpen={onSource} /></dt>
              <dd className="num">{percent(r.activation[1])}<small>{percent(r.activation[0])} – {percent(r.activation[2])}</small></dd></div>
            <div><dt>Evidence <Source source="history" compact onOpen={onSource} /></dt>
              <dd><EvidenceTag evidence={r.evidence} /></dd></div>
          </dl>

          <RangeMeter label="Reward cost against the budget ceiling"
            low={r.cost[0]} mid={r.cost[1]} high={r.cost[2]} ceiling={budget} fit={r.fit} />

          <div className="rev-criteria">
            <span className="t-overline">Targeting criteria</span>
            <ul>{a.criteria(ws.level).map(c => <li key={c}>{c}</li>)}</ul>
            <p className="rev-caveat"><TriangleAlert />{a.caveat}</p>
          </div>
        </motion.section>

        {/* ---- the judgment ---- */}
        <motion.aside className="rev-checks" data-tour="guardrails"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: dur.screen, ease: ease.signature, delay: 0.08 }}>
          <CheckList checks={checks} />

        </motion.aside>
      </div>

      <Reasoning workspace={ws} onSource={onSource} onBrief={onBrief} />

      <ReviewIntelligence workspace={ws} />

      <div className="rev-refine">
        <Button variant="ghost" size="sm" onClick={onRefine}><RotateCcw />Back to the recommendation</Button>
      </div>

      {/* ---- what has been decided ---- */}
      {ws.decisions.length > 0 && (
        <section className="rev-history">
          <span className="t-overline"><History />Decision history</span>
          <ol>
            {[...ws.decisions].reverse().map((d, i) => (
              <li key={`${d.time}-${i}`} data-status={d.status}>
                <span className="rev-history-dot" />
                <div>
                  <strong>
                    {d.status === 'accepted' ? 'Accepted for refinement'
                      : d.status === 'changes' ? 'Changes requested' : 'Rejected'}
                  </strong>
                  <small>{d.reason}{d.note ? ` — ${d.note}` : ''}</small>
                  <em className="num">
                    Revision {String(d.revision).padStart(2, '0')} · {dateTime(d.time)}
                  </em>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
