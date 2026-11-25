import type { Brief, BriefKey } from './data';
export type Screen = 'brief' | 'recommendation' | 'review';
export type Message = { role: 'assistant' | 'user'; text: string };
export type DecisionRecord = { status: 'accepted' | 'rejected' | 'changes'; reason: string; note: string; time: string; revision: number; configVersion: number };
export type Workspace = { configVersion: number; generatedBrief: string; brief: Brief; screen: Screen; generated: boolean; audienceId: string; offerId: string; level: number; revision: number; decisions: DecisionRecord[]; messages: Message[]; fieldOrigins: Partial<Record<BriefKey,'agent'|'edited'>>; changeRequest: string; startedAt?: string; firstGeneratedAt?: string };
export const initialWorkspace = (): Workspace => ({ configVersion:0,generatedBrief:'',brief:{},screen:'brief',generated:false,audienceId:'a1',offerId:'v2',level:1,revision:0,decisions:[],messages:[{role:'assistant',text:'Tell me what you want the campaign to achieve. I’ll turn your request into an editable brief and ask for anything that’s missing.'}],fieldOrigins:{},changeRequest:'',startedAt:new Date().toISOString() });
