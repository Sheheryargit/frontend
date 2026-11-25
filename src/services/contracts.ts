import type { Brief, BriefKey } from '../data';

/** Transport-neutral events consumed by the frontend. A live implementation
 * may produce these from SSE, a socket or a queued job. */
export type AgentEvent = { id: string; label: string; detail: string };
export type RunEvent = { index: number; detail: string; progress: number };
export type SourceKey = 'audience' | 'offer' | 'forecast' | 'history' | 'brief';

export interface CampaignGateway {
  run(onEvent: (event: RunEvent) => void, signal: AbortSignal, fail?: boolean): Promise<void>;
  extract(text: string, brief: Brief, onField: (key: BriefKey, value: string) => void, pace?: number): Promise<Brief>;
  sample(onField: (key: BriefKey, value: string) => void, pace?: number): Promise<Brief>;
  nextQuestion(brief: Brief): { key: BriefKey; prompt: string; suggestions: string[] } | undefined;
}
