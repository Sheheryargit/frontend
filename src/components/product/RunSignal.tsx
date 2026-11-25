import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, CircleAlert, FileText, GitBranch, Layers3, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { runSteps } from '../../services/campaign';

const icons = [FileText, Users, Layers3, GitBranch, ShieldCheck];
const names = ['Brief', 'Audience', 'Offer', 'Evidence', 'Decision'];
const cues = [
  'Reading the brief and its boundaries',
  'Finding eligible member groups',
  'Balancing incentive and budget',
  'Connecting historical evidence',
  'Assembling the human review',
];

/** A live visual trace of the scripted adapter's five events. Replace its
 * event index with backend SSE progress without changing the presentation. */
export function RunSignal({ step, error, complete = false, detail }: { step: number; error: boolean; complete?: boolean; detail?: string }) {
  const still = useReducedMotion();
  return <div className="run-signal" data-complete={complete} role="img" aria-label={complete ? 'Decisioning complete. Recommendation ready.' : `Decisioning stage ${step + 1} of 5: ${runSteps[step]?.label || 'Preparing recommendation'}${error ? ', error' : ''}`}>
    <div className="run-signal-grid" />
    <div className="run-conductor" aria-hidden="true">
      <span className="run-conductor-orb"><Sparkles size={19} /><i/><b/></span>
      <span className="run-conductor-text"><strong>SPARK AGENT</strong>
        <AnimatePresence mode="wait" initial={false}>
          <motion.small key={complete ? 'complete' : error ? 'error' : detail || step}
            initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }}
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}>
            {complete ? 'All connections resolved' : error ? 'A source needs attention' : detail || cues[step]}
          </motion.small>
        </AnimatePresence>
      </span>
      <span className="run-conductor-index">{complete ? 'READY' : `${String(step + 1).padStart(2,'0')} · 05`}</span>
    </div>
    <div className="run-signal-trail" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => <span key={i} className={complete || i < step ? 'done' : i === step && !error ? 'current' : ''}>{i === step && !error && !complete && !still && <i />}</span>)}
    </div>
    <div className="run-signal-nodes">
      {names.map((name, i) => { const Icon = icons[i]; const state = complete || i < step ? 'done' : i === step ? error ? 'error' : 'active' : 'waiting'; return <motion.div className={`run-signal-node run-signal-node--${state}`} key={name}
        initial={{ opacity: still ? 1 : 0, y: still ? 0 : 15, scale: still ? 1 : .8 }}
        animate={{ opacity: state === 'waiting' ? .42 : 1, y: 0, scale: state === 'waiting' ? .86 : 1 }}
        transition={{ duration: still ? 0 : .65, ease: [0.19, 1, 0.22, 1], delay: still ? 0 : i * .075 }}>
        <span>{state === 'done' ? <Check size={19} /> : state === 'error' ? <CircleAlert size={19} /> : <Icon size={19} />}</span>
        <strong>{name}</strong><small>{state === 'done' ? 'Complete' : state === 'active' ? 'Processing' : state === 'error' ? 'Needs attention' : 'Waiting'}</small>
      </motion.div>; })}
    </div>
    <div className="run-signal-caption"><span className="run-signal-bloom" /><div><strong>{complete ? 'Recommendation assembled' : error ? 'Source connection interrupted' : runSteps[step]?.label}</strong><small>{complete ? 'Opening the decision network and evidence.' : error ? 'The brief and completed work are retained locally.' : detail || runSteps[step]?.detail}</small></div><span className="run-signal-count">{String(step + 1).padStart(2, '0')} / 05</span></div>
  </div>;
}
