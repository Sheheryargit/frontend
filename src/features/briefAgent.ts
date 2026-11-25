/**
 * Brief agent — conversational layer.
 *
 * `campaignService.extract` is a field extractor: it assigns the first message
 * it sees to `objective` and pattern-matches the rest. That makes the agent
 * unable to hold a conversation — ask it "why do you need a budget?" and the
 * question itself gets filed as your campaign objective.
 *
 * This layer classifies the turn first. Questions get answered, vague answers
 * get a stated assumption, and only genuine statements reach the extractor.
 * Every reply is scripted — there is no model behind this.
 */
import type { Brief, BriefKey } from '../data';
import { briefFields, questions } from '../data';

export type Turn =
  | { kind: 'question'; topic: Topic; field?: BriefKey }
  | { kind: 'defer' }
  | { kind: 'statement' };

type Topic =
  | 'capability' | 'process' | 'status' | 'scope' | 'data'
  | 'budget' | 'target' | 'offer' | 'evidence' | 'timing'
  | 'constraints' | 'partner' | 'objective' | 'general';

const QUESTION_OPENERS =
  /^(what|why|how|who|when|which|where|can|could|do|does|did|is|are|should|would|will|tell me|explain|help)\b/i;

const DEFERRALS =
  /^(you (decide|choose|pick)|whatever you|your call|up to you|not sure|no idea|dunno|don'?t know|suggest( something)?|you suggest|let (spark|you) suggest|any(thing)?( is fine)?|no preference|skip|pass|i don'?t mind)\b/i;

const TOPIC_PATTERNS: [Topic, RegExp][] = [
  ['capability',  /\b(what can you|what do you do|who are you|what are you|your (job|role)|capabilit)/i],
  ['process',     /\b(what happens|next step|then what|how does (this|it) work|what will you do|after (this|that))\b/i],
  ['status',      /\b(what('s| is) (left|missing|outstanding)|what do you (still )?need|how (much|many) (more|left)|am i done|anything else)\b/i],
  ['scope',       /\b(scope|limitation|can'?t you|cannot|other partner|partner b|win.?back|basket build|other campaign type)\b/i],
  ['data',        /\b(data|source|real|live|synthetic|demo|where (does|do) (the|these) (number|figure)|accurate|made up|fake)\b/i],
  ['budget',      /\b(budget|spend|cost|money|dollar|cap|ceiling|afford)\b/i],
  ['target',      /\b(target|audience|customer|member|segment|who should|reach|lapsing|shopper)\b/i],
  ['offer',       /\b(offer|mechanic|reward|incentive|points|multi.?visit|spend & get|spend and get)\b/i],
  ['evidence',     /\b(evidence|confidence|proof|reliab|trust|historical|comparable|past campaign)\b/i],
  ['timing',      /\b(timing|when|duration|how long|week|date|start|launch|schedule)\b/i],
  ['constraints', /\b(constraint|exclusion|minimum|floor|opt.?out|opted.out|limit|rule)\b/i],
  ['partner',     /\b(partner|flybuys|retailer|brand|supermarket)\b/i],
  ['objective',   /\b(objective|goal|outcome|aim|purpose)\b/i],
];

/** A deferral or a question must be recognised before extraction runs. */
export function classify(text: string): Turn {
  const t = text.trim();
  if (DEFERRALS.test(t)) return { kind: 'defer' };

  const looksLikeQuestion = t.endsWith('?') || QUESTION_OPENERS.test(t);
  if (!looksLikeQuestion) return { kind: 'statement' };

  for (const [topic, pattern] of TOPIC_PATTERNS) {
    if (pattern.test(t)) {
      const field = briefFields.find(f => topic === f.key)?.key;
      return { kind: 'question', topic, field };
    }
  }
  return { kind: 'question', topic: 'general' };
}

const ANSWERS: Record<Topic, string> = {
  capability:
    'I turn a campaign description into a structured brief. I capture eight details, check them against the evidence available in this demo, then hand the brief to the decisioning agent, which picks an audience, a criteria breadth and an offer that fit your budget.',
  process:
    'Once the eight details are complete, you generate a recommendation. The decisioning agent validates the brief, sizes eligible audiences, compares offer structures, inspects historical evidence, then prepares a specification for your review. You can cancel the run at any point, and nothing launches.',
  status: '',          // composed from the live brief
  scope:
    'This demonstration is calibrated for Partner A repeat purchase campaigns only. Basket build and win-back need validated evidence before I would estimate them, and other partners are out of scope — cross-partner signals are excluded deliberately.',
  data:
    'Everything here is synthetic. The audience counts come from a 50,000-member demo universe, no query has been run, and nothing is written back to a source system. Every figure carries a chip you can click to see which table it would come from and what still needs validating.',
  budget:
    'The budget sets a hard ceiling. I compare it against the high end of each estimate, not the midpoint — so an option whose central cost fits but whose upper range does not is treated as at risk. Reward cost only; media and operating costs are excluded.',
  target:
    'The target customer decides which audience I can size. Three are supported: lapsing grocery regulars, infrequent grocery shoppers, and new members. New members carry a warning — there is not enough evidence to accept a campaign against them without validation.',
  offer:
    'Three mechanics are available: single-shop bonus points, multi-visit spend & get, and a weekly streak. Multi-visit usually activates more members per dollar, but it qualifies fewer of them. I will show the trade-off rather than pick for you.',
  evidence:
    'Evidence quality is rated strong, limited or insufficient, based on how many comparable past campaigns match on partner, objective and mechanic. Insufficient evidence blocks acceptance outright — I would rather stop than give you a number I cannot stand behind.',
  timing:
    'Timing affects which historical campaigns count as comparable and how long the audience stays eligible. A start date and a duration are enough; "Q1 2027" or "not decided" is fine, and I will record it as unconfirmed.',
  constraints:
    'Constraints are the floor and the exclusions. If you give a minimum audience size I will enforce it; if you do not, I assume 2,500 members, which is a demo assumption pending approval. Opted-out members are always excluded.',
  partner:
    'Partner A is a supermarket, and the only partner with data wired up in this demonstration. Partner B appears in the list but is unavailable.',
  objective:
    'The objective is what you want to change — more repeat visits, bigger baskets, reactivated shoppers. I use it to match comparable historical campaigns, so the more specific it is, the better the evidence I can find.',
  general:
    'I can explain any part of the brief — the budget ceiling, how audiences are sized, which offers are available, or how evidence quality is judged. Ask, or just tell me about your campaign and I will structure it.',
};

/** Sensible, clearly-labelled assumptions for when the user defers to the agent. */
const ASSUMPTIONS: Partial<Record<BriefKey, { value: string; because: string }>> = {
  partner:     { value: 'Partner A (supermarket)', because: 'the only partner with data available here' },
  type:        { value: 'Repeat purchase',         because: 'the only campaign type with validated evidence in this demo' },
  target:      { value: 'Lapsing grocery shoppers', because: 'the audience with the clearest repeat-purchase signal' },
  timing:      { value: '4 weeks from 3 Feb 2027', because: 'a standard four-week window' },
  budget:      { value: '$15,000',                 because: 'a mid-range budget for this audience size' },
  offerPref:   { value: 'Multi-visit spend & get', because: 'it activates the most members per dollar for repeat purchase' },
  constraints: { value: 'Min. audience 2,500; exclude opted-out members', because: 'the default floor and the standard exclusion' },
  objective:   { value: 'Increase repeat purchase frequency among lapsing grocery shoppers', because: 'the most common objective for this audience' },
};

export const assumptionFor = (key: BriefKey) => ASSUMPTIONS[key];

/** Answer, then return to the pending question so the thread keeps moving. */
export function reply(turn: Turn, brief: Brief): string {
  const missing = briefFields.filter(f => !brief[f.key]?.trim());
  const next = questions.find(q => !brief[q.key]?.trim());

  let body: string;
  if (turn.kind === 'question' && turn.topic === 'status') {
    body = missing.length
      ? `There ${missing.length === 1 ? 'is' : 'are'} ${missing.length} detail${missing.length === 1 ? '' : 's'} outstanding: ${missing.map(f => f.label.toLowerCase()).join(', ')}.`
      : 'Nothing is outstanding — all eight details are captured. You can edit any of them, or generate the recommendation.';
  } else if (turn.kind === 'question') {
    body = ANSWERS[turn.topic] || ANSWERS.general;
  } else {
    body = '';
  }

  if (!next) {
    return `${body} Everything is captured, so you can generate the recommendation whenever you are ready.`.trim();
  }
  if (turn.kind === 'question' && turn.topic === 'status') return body;
  return `${body}\n\n${next.prompt}`.trim();
}

export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/* ---------------------------------------------------------------------------
   Live intent detection.

   Runs against the draft on every keystroke, before anything is sent, so the
   agent can show what it has already recognised. This mirrors what
   `campaignService.extract` will actually capture — it must never claim to see
   something the extractor would then miss, or the UI is lying.
   ------------------------------------------------------------------------- */

const SIGNALS: [BriefKey, RegExp][] = [
  ['partner',     /partner\s*a|supermarket|flybuys/i],
  ['type',        /repeat|win.?back|basket build|basket.building/i],
  ['target',      /lapsing|lapsed|slowed|infrequent|occasional|new member|first grocery|shopper|customer/i],
  ['budget',      /\$\s?[\d,]+|\b\d+\s?k\b|budget/i],
  ['timing',      /\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\b\d+\s*weeks?\b|q[1-4]\s*20\d\d|from\s+\d/i],
  ['offerPref',   /three.shop|multi.?visit|spend\s*&?\s*get|single.shop|bonus points|weekly streak|streak/i],
  ['constraints', /opted.?out|opt.?out|exclude|minimum|min\.?\s*\d|at least \d/i],
];

/** Which details the draft already contains. Objective is implied by any prose. */
export function detect(text: string): BriefKey[] {
  const t = text.trim();
  if (t.length < 12) return [];
  const found = SIGNALS.filter(([, re]) => re.test(t)).map(([k]) => k);
  if (t.split(/\s+/).length >= 6) found.push('objective');
  return found;
}
