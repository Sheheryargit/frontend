import { audiences, campaigns, offers } from '../data';
import type { Audience, Brief, Campaign, Offer } from '../data';
import { budgetValue, calculate, minimumAudience } from '../model';

export type Scenario = {
  id: string;
  label: string;
  explanation: string;
  audience: Audience;
  offer: Offer;
  level: number;
  result: ReturnType<typeof calculate>;
};

export function scenarioSet(brief: Brief, audienceId: string, offerId: string, level: number): Scenario[] {
  const a = audiences.find(x => x.id === audienceId) ?? audiences[0];
  const o = offers.find(x => x.id === offerId) ?? offers[0];
  const raw = [
    { id: 'current', label: 'Current direction', explanation: 'The selection on your decision map.', audience: a, offer: o, level },
    { id: 'reach', label: 'More reach', explanation: 'Broader eligibility with the same offer.', audience: a, offer: o, level: Math.min(2, level + 1) },
    { id: 'precision', label: 'More precision', explanation: 'Tighter eligibility with the same offer.', audience: a, offer: o, level: Math.max(0, level - 1) },
    { id: 'lower-cost', label: 'Lower reward cost', explanation: 'The same audience with a single-shop reward.', audience: a, offer: offers[0], level },
  ];
  const seen = new Set<string>();
  return raw.filter(x => {
    const signature = `${x.audience.id}:${x.offer.id}:${x.level}`;
    if (seen.has(signature)) return false;
    seen.add(signature); return true;
  }).map(x => ({ ...x, result: calculate(x.audience, x.offer, x.level, brief) }));
}

export function viability(brief: Brief) {
  const target = (brief.target || '').toLowerCase();
  const supportedTarget = /infrequent|occasional|new member|first grocery|lapsing|lapsed|regular|suggest/.test(target);
  const audience = /infrequent|occasional/.test(target) ? audiences[1]
    : /new member|first grocery/.test(target) ? audiences[2] : audiences[0];
  const floor = minimumAudience(brief);
  const budget = budgetValue(brief);
  const possibilities = offers.flatMap(offer => [0, 1, 2].map(level => ({
    offer, level, result: calculate(audience, offer, level, brief),
  })));
  const supported = /partner\s*a/i.test(brief.partner || '') && brief.type === 'Repeat purchase';
  const viable = possibilities.filter(x => x.result.size >= floor && x.result.fit === 'within'
    && x.result.evidence !== 'insufficient' && audience.id !== 'a3');
  return { audience, floor, budget, supported, supportedTarget, viable, possibilities,
    verdict: !supported || !supportedTarget ? 'scope' : !budget ? 'budget' : viable.length ? 'viable' : 'constraints' } as const;
}

/** Transparent, illustrative matching rubric. No learned similarity score. */
export function comparator(campaign: Campaign, offer: Offer) {
  const mechanic = campaign.mechanic === offer.id;
  const objective = campaign.objective === 'Repeat purchase';
  const quality = campaign.flags.length === 0;
  const points = (mechanic ? 45 : 0) + (objective ? 35 : 0) + (quality ? 20 : 0);
  return { mechanic, objective, quality, points,
    label: mechanic && objective ? 'Closer comparison' : objective ? 'Context only' : 'Different objective' };
}

export function evidenceCounts(offer: Offer) {
  const matched = campaigns.filter(c => offer.comps.includes(c.id));
  return { matched, clean: matched.filter(c => !c.flags.length).length,
    withRoi: matched.filter(c => c.roi !== null).length };
}
