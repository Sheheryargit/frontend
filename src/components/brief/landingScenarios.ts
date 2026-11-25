export type LandingScenario = {
  id: string;
  label: string;
  context: string;
  kind: 'intent' | 'sample' | 'question';
  prompt: string;
};

/** Browseable starting points. A scenario pre-fills the composer; it never
 * bypasses capture, validation or the user's chance to edit the brief. */
export const landingScenarios: LandingScenario[] = [
  { id: 'lapsing', label: 'Re-engage lapsing shoppers', context: 'Repeat purchase · Partner A', kind: 'intent', prompt: 'We want to bring lapsing grocery shoppers back to Partner A and encourage repeat purchases.' },
  { id: 'basket', label: 'Grow basket size', context: 'Infrequent shoppers · four weeks', kind: 'intent', prompt: 'Increase basket size for infrequent grocery shoppers at Partner A over four weeks.' },
  { id: 'sample', label: 'Start from a sample brief', context: 'Eight details · ready to edit', kind: 'sample', prompt: 'Create a repeat purchase campaign for Partner A. Reach lapsing grocery shoppers with a $15,000 budget, running for 4 weeks from 3 Feb 2027. Prefer a multi-visit offer. Minimum 2,500 members; exclude opted-out members.' },
  { id: 'capabilities', label: 'What can you do?', context: 'Ask Spark before starting', kind: 'question', prompt: 'What can you do?' },
  { id: 'occasional', label: 'Reach occasional shoppers', context: 'Audience discovery', kind: 'intent', prompt: 'Create a repeat purchase campaign for Partner A aimed at infrequent grocery shoppers.' },
  { id: 'streak', label: 'Build a weekly habit', context: 'Offer exploration', kind: 'intent', prompt: 'I want a repeat purchase campaign for Partner A using a weekly streak offer for lapsing grocery shoppers.' },
  { id: 'cost', label: 'Keep rewards under budget', context: 'Cost discipline', kind: 'intent', prompt: 'Plan a repeat purchase campaign for Partner A to bring back lapsing grocery shoppers, keeping reward costs below $10,000.' },
  { id: 'new', label: 'Explore new members', context: 'Validation required', kind: 'intent', prompt: 'Could we run a repeat purchase campaign for new Partner A members after their first grocery shop?' },
  { id: 'evidence', label: 'What evidence is available?', context: 'Ask about the data', kind: 'question', prompt: 'What evidence is available for recommendations?' },
  { id: 'precision', label: 'Start with a precise audience', context: 'Reach versus relevance', kind: 'intent', prompt: 'Create a repeat purchase campaign for Partner A with a narrow audience of lapsing grocery regulars.' },
];
