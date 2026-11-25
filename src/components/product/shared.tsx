import type { ReactNode } from 'react';
import { Database, Info, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { sourceCatalog } from '../../services/campaign';
import type { SourceKey } from '../../services/campaign';
import type { Evidence } from '../../data';
export function Source({source,onOpen,compact=false}: {source:SourceKey;onOpen:(key:SourceKey)=>void;compact?:boolean}) {
 const s=sourceCatalog[source]; return <Tooltip><TooltipTrigger asChild><button className={`source-chip ${compact?'source-chip--compact':''}`} onClick={()=>onOpen(source)} aria-label={`Inspect data source: ${s.title}`}><Database size={12}/>{!compact&&'Demo data'}<span className="source-chip__dot"/></button></TooltipTrigger><TooltipContent side="top" sideOffset={8} className="source-tooltip"><span className="eyebrow">DATA CONNECTION PLACEHOLDER</span><strong>{s.title}</strong><code>{s.table}</code><p>{s.limitation}</p><small>Click to inspect the future connection</small></TooltipContent></Tooltip>;
}
export function EvidenceTag({evidence}: {evidence:Evidence}) {return <span className={`evidence-tag evidence-tag--${evidence}`}><ShieldCheck size={13}/>{evidence==='strong'?'Strong evidence':evidence==='limited'?'Limited evidence':'Insufficient evidence'}</span>}
export function SectionTitle({title,description,action}: {title:string;description?:string;action?:ReactNode}) {return <div className="section-title"><div><h2>{title}</h2>{description&&<p>{description}</p>}</div>{action}</div>}
export function Status({children,tone='neutral'}:{children:ReactNode;tone?:'neutral'|'success'|'warning'|'danger'|'blue'}) {return <Badge variant="outline" className={`status status--${tone}`}>{children}</Badge>}
export function Notice({children,tone='neutral'}:{children:ReactNode;tone?:'neutral'|'warning'|'danger'|'blue'}) {return <div className={`notice notice--${tone}`}><Info size={16}/><div>{children}</div></div>}
