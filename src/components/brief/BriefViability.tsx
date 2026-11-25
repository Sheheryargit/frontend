import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, CircleAlert, ScanSearch, Sparkles } from 'lucide-react';
import type { Brief } from '../../data';
import { money, number } from '../../model';
import { viability } from '../../lib/discovery';

export function BriefViability({ brief }: { brief: Brief }) {
  const still = useReducedMotion();
  const enough = !!(brief.partner && brief.type && brief.target && brief.budget);
  const result = viability(brief);
  const message = result.verdict === 'viable'
    ? `${result.viable.length} audience and offer combinations pass the current floor and reward ceiling.`
    : result.verdict === 'scope' ? result.supportedTarget ? 'This demo can evaluate Partner A repeat-purchase campaigns.' : 'This demo supports lapsing regulars, infrequent shoppers, or new members. Refine the target customer.'
    : result.verdict === 'budget' ? 'Confirm a positive budget to check viability.'
    : 'No supported combination satisfies the audience floor and reward ceiling together.';
  return <AnimatePresence initial={false}>
    {enough && <motion.div className="brief-viability" data-verdict={result.verdict}
      initial={{ opacity: 0, height: 0, y: still ? 0 : -8 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: still ? 0 : -8 }}
      transition={{ duration: still ? 0 : .42, ease: [0.19, 1, 0.22, 1] }}>
      <span className="brief-viability-icon">{result.verdict === 'viable' ? <Sparkles size={17}/> : <CircleAlert size={17}/>}</span>
      <div><small><ScanSearch size={11}/> LIVE VIABILITY PREFLIGHT · DEMO RULES</small>
        <strong>{result.verdict === 'viable' ? 'An audience is possible' : 'A constraint needs attention'}</strong>
        <p>{message}</p>
        {result.verdict === 'viable' && <span>{number(result.audience.sizes[1])} balanced members <ArrowUpRight size={11}/> {result.budget ? money(result.budget) : 'Budget unconfirmed'} ceiling</span>}
      </div>
    </motion.div>}
  </AnimatePresence>;
}
