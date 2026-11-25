import { motion, useReducedMotion } from 'motion/react';
import { Check, TriangleAlert } from 'lucide-react';
import { audiences, offers } from '../../data';
import type { Brief } from '../../data';
import { calculate, minimumAudience, money, number } from '../../model';
import { ease, dur, stagger } from '../../lib/motion';

const LEVELS = ['Narrow', 'Balanced', 'Broad'];

type Props = {
  brief: Brief;
  audienceId: string; offerId: string; level: number;
  onSelect: (audienceId: string, offerId: string, level: number) => void;
};

/**
 * The actual question: which audience, at which breadth, with which offer.
 *
 * Every option recomputes live against the brief, so the trade-off is read
 * from the options themselves rather than from a chart beside them. Options
 * that breach a constraint say so on the option, not after you pick it.
 */
export function OptionPicker({ brief, audienceId, offerId, level, onSelect }: Props) {
  const still = useReducedMotion();
  const minimum = minimumAudience(brief);
  const offer = offers.find(o => o.id === offerId)!;
  const audience = audiences.find(a => a.id === audienceId)!;

  return (
    <div className="picker">
      {/* audience */}
      <div className="picker-group">
        <span className="t-overline">Audience</span>
        <div className="picker-rows">
          {audiences.map((a, i) => {
            const c = calculate(a, offer, level, brief);
            const on = a.id === audienceId;
            const below = c.size < minimum;
            return (
              <motion.button
                key={a.id} className="opt" data-on={on} aria-pressed={on}
                onClick={() => onSelect(a.id, offerId, level)}
                initial={{ opacity: 0, y: still ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: dur.base, ease: ease.signature, delay: stagger(i, 0.04, 4) }}
              >
                <span className="opt-mark">{on && <Check />}</span>
                <span className="opt-body">
                  <strong>{a.name}</strong>
                  <small className="num">{number(c.size)} eligible · {money(c.cost[1])} central</small>
                  {below && <em className="opt-flag"><TriangleAlert />Below the {number(minimum)} minimum</em>}
                  {a.id === 'a3' && <em className="opt-flag"><TriangleAlert />Targeting needs validation</em>}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* breadth */}
      <div className="picker-group">
        <span className="t-overline">Criteria breadth</span>
        <div className="seg" role="group" aria-label="Criteria breadth">
          {LEVELS.map((name, i) => {
            const c = calculate(audience, offer, i, brief);
            const on = i === level;
            return (
              <button key={name} data-on={on} aria-pressed={on} onClick={() => onSelect(audienceId, offerId, i)}>
                <strong>{name}</strong>
                <small className="num">{number(c.size)}</small>
              </button>
            );
          })}
        </div>
      </div>

      {/* offer */}
      <div className="picker-group">
        <span className="t-overline">Offer mechanic</span>
        <div className="picker-rows">
          {offers.map((o, i) => {
            const c = calculate(audience, o, level, brief);
            const on = o.id === offerId;
            return (
              <motion.button
                key={o.id} className="opt" data-on={on} data-fit={c.fit} aria-pressed={on}
                onClick={() => onSelect(audienceId, o.id, level)}
                initial={{ opacity: 0, y: still ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: dur.base, ease: ease.signature, delay: stagger(i, 0.04, 4) }}
              >
                <span className="opt-mark">{on && <Check />}</span>
                <span className="opt-body">
                  <strong>{o.name}</strong>
                  <small className="num">{money(c.cost[1])} central · {money(c.cost[2])} high</small>
                  <em className={`opt-fit opt-fit--${c.fit}`}>
                    {c.fit === 'within' ? 'High estimate within budget'
                      : c.fit === 'risk' ? 'High estimate crosses the ceiling'
                      : c.fit === 'over' ? 'Over the ceiling'
                      : 'Budget unconfirmed'}
                  </em>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
