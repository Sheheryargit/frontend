import type { Audience, Brief, Evidence, Offer } from './data';

/* Formatting lives in lib/format.ts. These re-export it so every existing
   call site gets exact dollars: `money()` previously compacted to $8.6k, which
   on a budget-ceiling comparison turned $15,049 into "$15k" — reading as at
   budget when it is over. Compact notation is now axis-ticks only. */
export { money, count as number, moneyAxis, countAxis } from './lib/format';
export const percent = (n: number) => `${(n * 100).toFixed(1)}%`;
export const evidenceLabel = (e: Evidence) => e === 'strong' ? 'Strong evidence' : e === 'limited' ? 'Limited evidence' : 'Insufficient evidence';
export const budgetValue = (brief: Brief) => {
  if (/-\s*\$|\$\s*-|^\s*-/.test(brief.budget || '')) return null;
  const match = (brief.budget || '').replace(/,/g, '').match(/(-?\d+(?:\.\d+)?)\s*(k)?/i);
  return match && Number(match[1]) > 0 ? Number(match[1]) * (match[2] ? 1000 : 1) : null;
};
export const minimumAudience = (brief: Brief) => { const match=(brief.constraints || '').match(/(?:min(?:imum)?[.\s]*(?:audience)?[.\s:]*)?([\d,]+)\s*(?:members)?/i); return match ? Number(match[1].replace(/,/g,'')) : 2500; };
export function calculate(audience: Audience, offer: Offer, level: number, brief: Brief) {
  const size = audience.sizes[level];
  const activation = offer.activation.map(v => v * audience.activationFactor);
  const activated = activation.map(v => size * v);
  const qualified = activation.map((v, i) => size * v * offer.qualification[i]);
  const cost = qualified.map(v => v * offer.reward);
  const sales = audience.salesAvailable ? qualified.map((v, i) => v * offer.uplift[i]) : null;
  const budget = budgetValue(brief);
  const fit: 'unknown' | 'within' | 'risk' | 'over' =
    budget === null ? 'unknown' : cost[2] <= budget ? 'within' : cost[1] <= budget ? 'risk' : 'over';
  const ranks = { insufficient: 0, limited: 1, strong: 2 };
  const evidence = (['insufficient', 'limited', 'strong'] as Evidence[])[Math.min(ranks[audience.evidence[level]], ranks[offer.evidence], audience.granularity === 'partner' ? 1 : 2)];
  return { size, activation, activated, qualified, cost, sales, fit, evidence };
}
