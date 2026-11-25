export type BriefKey = 'objective' | 'partner' | 'type' | 'target' | 'timing' | 'budget' | 'offerPref' | 'constraints';
export type Brief = Partial<Record<BriefKey, string>>;
export type Evidence = 'strong' | 'limited' | 'insufficient';
export type Audience = {
  id: string; letter: string; name: string; granularity: 'category' | 'partner'; sizes: [number, number, number];
  evidence: [Evidence, Evidence, Evidence]; activationFactor: number; salesAvailable: boolean;
  description: string; caveat: string; sources: string; criteria: (level: number) => string[];
};
export type Offer = {
  id: string; code: string; name: string; mechanic: string; reward: number;
  activation: [number, number, number]; qualification: [number, number, number]; uplift: [number, number, number];
  comps: string[]; evidence: Evidence; rationale: string; caveat: string;
};
export type Campaign = {
  id: string; name: string; date: string; sortDate: number; objective: string; offer: string;
  mechanic: string | null; audience: number; activation: number; qualification: number;
  uplift: number | null; roi: number | null; source: string; flags: string[];
};

export const briefFields: { key: BriefKey; label: string; placeholder: string }[] = [
  { key: 'partner', label: 'Partner', placeholder: 'e.g. Partner A' },
  { key: 'type', label: 'Campaign type', placeholder: 'e.g. Repeat purchase' },
  { key: 'objective', label: 'Objective', placeholder: 'What should this campaign change?' },
  { key: 'target', label: 'Target customer', placeholder: 'Who should be reached?' },
  { key: 'timing', label: 'Timing', placeholder: 'When will it run?' },
  { key: 'budget', label: 'Budget', placeholder: 'e.g. $150,000' },
  { key: 'offerPref', label: 'Offer preference', placeholder: 'e.g. Multi-visit spend & get' },
  { key: 'constraints', label: 'Constraints', placeholder: 'Minimum size, exclusions…' },
];

export const questions: { key: BriefKey; prompt: string; suggestions: string[] }[] = [
  { key: 'partner', prompt: 'Which partner is this campaign for?', suggestions: ['Partner A (supermarket)'] },
  { key: 'type', prompt: 'What kind of campaign are you planning?', suggestions: ['Repeat purchase', 'Basket build', 'Win-back'] },
  { key: 'target', prompt: 'Who is the target customer?', suggestions: ['Lapsing grocery shoppers', 'Infrequent shoppers', 'Let Spark suggest'] },
  { key: 'timing', prompt: 'When will it run?', suggestions: ['4 weeks from 3 Feb 2027', 'Sometime in Q1 2027', 'Not decided yet'] },
  { key: 'budget', prompt: 'What is the total campaign budget?', suggestions: ['$150,000', 'Not confirmed yet'] },
  { key: 'offerPref', prompt: 'Any offer preference?', suggestions: ['Multi-visit spend & get', 'Single-shop bonus points', 'No preference'] },
  { key: 'constraints', prompt: 'Any minimum audience or exclusions?', suggestions: ['Min. audience 2,500; exclude opted-out members', 'No constraints'] },
];

export const audiences: Audience[] = [
  {
    id: 'a1', letter: 'A', name: 'Lapsing grocery regulars', granularity: 'category',
    sizes: [3840, 8620, 15490], evidence: ['limited', 'limited', 'limited'], activationFactor: 1, salesAvailable: true,
    description: 'Regular grocery shoppers with a recent break in their usual purchase pattern.',
    caveat: 'A lapse is observed, not predicted. The churn-risk field is blank and is not used.',
    sources: 'MEMBER_SCORING_TABLE · CATEGORY_AFFINITY_TABLE',
    criteria: level => [`${[4, 3, 2][level]}+ Partner A grocery purchases in the prior 26 weeks`, `None in the last ${[6, 4, 3][level]} weeks`, 'Opted-out members excluded'],
  },
  {
    id: 'a2', letter: 'B', name: 'Infrequent grocery shoppers', granularity: 'category',
    sizes: [6100, 14250, 26830], evidence: ['limited', 'limited', 'insufficient'], activationFactor: .75, salesAvailable: false,
    description: 'Occasional Partner A grocery shoppers with fewer purchases in the category.',
    caveat: 'Lower purchase frequency does not establish churn risk. Category signals remain scoped to Partner A.',
    sources: 'MEMBER_SCORING_TABLE · CATEGORY_AFFINITY_TABLE',
    criteria: level => [`${[1, 2, 3][level]} Partner A grocery purchase${level===0?'':'s'} in the last 26 weeks`, 'Below regular-shopper frequency', 'Opted-out members excluded'],
  },
  {
    id: 'a3', letter: 'C', name: 'New members, first grocery shop', granularity: 'category',
    sizes: [980, 2460, 4710], evidence: ['insufficient', 'insufficient', 'limited'], activationFactor: 1.1, salesAvailable: true,
    description: 'Recent members who have made their first Partner A grocery purchase.',
    caveat: 'Lifecycle classification must be validated before this audience can be approved.',
    sources: 'MEMBER_SCORING_TABLE · CATEGORY_AFFINITY_TABLE',
    criteria: level => [`Joined within ${[60, 90, 180][level]} days`, '1+ Partner A grocery purchase', 'Opted-out members excluded'],
  },
];

export const offers: Offer[] = [
  {
    id: 'v1', code: 'V1', name: 'Single-shop bonus', mechanic: 'Spend $60 in one shop, get 1,000 bonus points', reward: 5,
    activation: [.18, .21, .24], qualification: [.38, .42, .46], uplift: [12, 14, 16], comps: ['C-2240', 'C-2153'], evidence: 'limited',
    rationale: 'Lowest reward cost, but it rewards one visit rather than a repeat habit.',
    caveat: 'One comparable is a merged duplicate with no control group.',
  },
  {
    id: 'v2', code: 'V2', name: 'Three-shop repeat', mechanic: 'Spend $80 three times in four weeks, get 3,000 bonus points', reward: 15,
    activation: [.16, .19, .22], qualification: [.24, .28, .32], uplift: [21, 24, 26], comps: ['C-2291', 'C-2077'], evidence: 'limited',
    rationale: 'Directly rewards the repeat purchase behaviour in the brief.',
    caveat: 'Two Partner A campaigns use the same mechanic and have transaction-level results.',
  },
  {
    id: 'v3', code: 'V3', name: 'Weekly streak', mechanic: 'Spend $40 each week for four weeks, get 4,000 bonus points', reward: 20,
    activation: [.14, .17, .20], qualification: [.15, .19, .23], uplift: [20, 22, 24], comps: ['C-2102'], evidence: 'limited',
    rationale: 'Strong habit signal with the highest reward cost per qualifier.',
    caveat: 'Only one comparable, flagged for low volume.',
  },
];

export const campaigns: Campaign[] = [
  { id: 'C-2291', name: 'Summer repeat grocery', date: 'Jan 2026', sortDate: 202601, objective: 'Repeat purchase', offer: 'Spend $80 ×3, get 3,000', mechanic: 'v2', audience: 74100, activation: .198, qualification: .275, uplift: 26, roi: 2.1, source: 'System A', flags: [] },
  { id: 'C-2240', name: 'Back-to-school top-up', date: 'Feb 2026', sortDate: 202602, objective: 'Repeat purchase', offer: 'Spend $60, get 1,000', mechanic: 'v1', audience: 91300, activation: .224, qualification: .441, uplift: 14, roi: null, source: 'System B', flags: ['Cost data missing'] },
  { id: 'C-2187', name: 'Winter basket builder', date: 'Jul 2025', sortDate: 202507, objective: 'Basket build', offer: 'Spend $100, get 2,000', mechanic: null, audience: 65800, activation: .152, qualification: .310, uplift: 31, roi: 1.6, source: 'System A', flags: [] },
  { id: 'C-2153', name: 'Lapsed win-back', date: 'May 2025', sortDate: 202505, objective: 'Win-back', offer: 'Spend $50, get 1,500', mechanic: 'v1', audience: 52400, activation: .179, qualification: .362, uplift: null, roi: null, source: 'System B', flags: ['Duplicate merged', 'No control group'] },
  { id: 'C-2102', name: 'Weekly shop streak', date: 'Mar 2025', sortDate: 202503, objective: 'Repeat purchase', offer: 'Spend $40 weekly ×4, get 4,000', mechanic: 'v3', audience: 48900, activation: .161, qualification: .187, uplift: 22, roi: 1.3, source: 'System A', flags: ['Low-volume flag'] },
  { id: 'C-2077', name: 'Easter repeat', date: 'Apr 2025', sortDate: 202504, objective: 'Repeat purchase', offer: 'Spend $80 ×3, get 3,000', mechanic: 'v2', audience: 70200, activation: .172, qualification: .294, uplift: 21, roi: null, source: 'System B', flags: ['Treatment code decoded', 'ROI missing'] },
];

export const sampleBrief: Brief = {
  objective: 'Encourage repeat grocery purchases from customers whose usual shopping cadence has slowed.',
  partner: 'Partner A (supermarket)', type: 'Repeat purchase', target: 'Lapsing grocery shoppers',
  timing: '4 weeks from 3 Feb 2027', budget: '$15,000', offerPref: 'Multi-visit spend & get',
  constraints: 'Min. audience 2,500; exclude opted-out members',
};
