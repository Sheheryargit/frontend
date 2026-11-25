/** Frontend composition point. Replace only this binding when a live service
 * implements CampaignGateway; components keep their transport-neutral props. */
import type { CampaignGateway } from './contracts';
import { mockCampaignService } from './mockCampaignService';

export type { AgentEvent, RunEvent, SourceKey, CampaignGateway } from './contracts';
export { runSteps, sourceCatalog } from './mockCampaignService';
export const campaignService: CampaignGateway = mockCampaignService;
