import { sampleBrief, questions, briefFields } from '../data';
import type { Brief, BriefKey } from '../data';
import type { AgentEvent, CampaignGateway, RunEvent, SourceKey } from './contracts';
export const sourceCatalog = {
  audience: { title: 'Audience sizing', table: 'MEMBER_SCORING_TABLE + CATEGORY_AFFINITY_TABLE', description: 'Aggregated eligibility query scoped to Partner A. Count distinct eligible members after contact and opt-out exclusions.', limitation: 'Illustrative counts within a 50,000-member synthetic universe. No query has been executed. The default 2,500-member floor is a demo assumption pending approval.', endpoint: 'GET /campaigns/:id/audiences' },
  offer: { title: 'Offer economics', table: 'OFFER_PERFORMANCE_TABLE', description: 'Offer mechanics, activation and qualification ranges, with an approved points costing rule.', limitation: '$0.005 per point is an unvalidated costing assumption. Rates may be recorded at campaign level, not offer level. Media and operating costs are excluded.', endpoint: 'GET /campaigns/:id/offers' },
  forecast: { title: 'Performance estimate', table: 'CAMPAIGN_PERFORMANCE_TABLE', description: 'Comparable campaigns matched by partner, objective and mechanic, with minimum evidence requirements.', limitation: 'Demonstration ranges, not a predictive model. Comparator quality and minimum sample rules still require validation. No ROI is forecast.', endpoint: 'GET /campaigns/:id/forecast' },
  history: { title: 'Historical evidence', table: 'CAMPAIGN_UNIFIED_VIEW', description: 'System A and System B records reconciled with decoded treatment codes, control-group flags and deduplication.', limitation: 'Six illustrative campaign records. The decoded mapping and duplicate reconciliation must be validated before relying on them.', endpoint: 'GET /campaigns/:id/evidence' },
  brief: { title: 'Campaign brief', table: 'Brief agent · structured response', description: 'Validated extraction of the partner, objective, audience, timing, budget, offer preference and constraints from the conversation.', limitation: 'Local scripted simulation. Only explicit input is captured; every field remains editable. No model or API is connected.', endpoint: 'POST /campaigns/brief/extract' },
} satisfies Record<SourceKey, { title: string; table: string; description: string; limitation: string; endpoint: string }>;
export const runSteps: AgentEvent[] = [
 { id:'brief', label:'Validate the brief', detail:'Required fields · campaign scope · budget' },
 { id:'members', label:'Size eligible audiences', detail:'Member scoring + category affinity' },
 { id:'offers', label:'Compare offer structures', detail:'Reward assumptions · budget ceiling' },
 { id:'evidence', label:'Inspect historical evidence', detail:'Comparable campaigns · missing values' },
 { id:'review', label:'Prepare the recommendation', detail:'Rationale · limitations · human review' },
];
const runPulses: [string,string][] = [
 ['Reading the intent and editable fields','Checking Partner A scope, timing and budget'],
 ['Mapping the audience definitions','Sizing eligibility after contact exclusions'],
 ['Evaluating offer mechanics','Testing high reward cost against the ceiling'],
 ['Linking comparable campaigns','Flagging missing financial and control evidence'],
 ['Writing the rationale and caveats','Preparing the human review packet'],
];
const delay = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal?.aborted) return reject(new DOMException('Cancelled', 'AbortError'));
  const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
  const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
  signal?.addEventListener('abort', abort, { once: true });
});
/** Replace this adapter with SSE or your API. Screens consume structured fields and run events. */
export const mockCampaignService: CampaignGateway = {
  async run(onEvent: (event: RunEvent) => void, signal: AbortSignal, fail = false) {
    for (let i=0; i<runSteps.length; i++) {
      onEvent({index:i,detail:runPulses[i][0],progress:i*20+3});
      await delay(1150,signal);
      onEvent({index:i,detail:runPulses[i][1],progress:i*20+12});
      await delay(1150,signal);
      if(fail && i===2) throw new Error('The offer data source did not respond. Your brief has been saved. Retry this simulation to continue.');
    }
    onEvent({index:4,detail:'Resolving the decision network',progress:100});
  },
  async extract(text: string, brief: Brief, onField: (key: BriefKey, value: string) => void, pace = 240) {
    const found: Brief = {};
    if (!brief.objective) {
      const sentence = text.split(/(?<=[.!?])\s+/).find(part => /\b(reach|re-engage|encourage|increase|grow|bring|drive|win back)\b/i.test(part));
      const intent = sentence?.replace(/^.*?\b(?=reach|re-engage|encourage|increase|grow|bring|drive|win back)\b/i, '')
        .split(/\b(?:with (?:a |an )?\$|running for|on a budget|minimum \d|exclude opted)/i)[0]
        .trim().replace(/[\s,.]+$/, '');
      found.objective = intent && intent.length >= 18 ? `${intent}.` : text.split(/[.!?]/)[0].trim().slice(0, 180);
    }
    if (/partner\s*a/i.test(text)) found.partner = 'Partner A (supermarket)';
    if (/repeat/i.test(text)) found.type = 'Repeat purchase';
    if (/win.?back/i.test(text)) found.type = 'Win-back';
    if (/basket/i.test(text)) found.type = 'Basket build';
    if (/lapsing|lapsed|slowed/i.test(text)) found.target = 'Lapsing grocery shoppers';
    const budget = text.match(/\$[\d,]+(?:\.\d+)?\s*k?/i); if (budget) found.budget = budget[0];
    const timing = text.match(/(?:\d+ weeks? from |from )\d{1,2}\s+[A-Za-z]+\s+\d{4}/i); if(timing) found.timing=timing[0];
    if (/three.shop|multi.visit|three times/i.test(text)) found.offerPref = 'Multi-visit spend & get';
    if (/opted.out|opt.out/i.test(text)) found.constraints = 'Min. audience 2,500; exclude opted-out members';
    for(const [key,value] of Object.entries(found)) { await delay(pace); onField(key as BriefKey,value!); }
    return { ...brief, ...found };
  },
  async sample(onField: (key: BriefKey, value: string) => void, pace = 380) { for(const field of briefFields) { await delay(pace); onField(field.key,sampleBrief[field.key]!); } return {...sampleBrief}; },
  nextQuestion(brief: Brief) { return questions.find(q=>!brief[q.key]?.trim()); },
};
