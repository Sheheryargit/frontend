import { motion, useReducedMotion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { ease, dur, stagger } from '../../lib/motion';

export type Check = { name: string; detail: string; pass: boolean };

/** The four constraint checks. A failure names itself and says why. */
export function CheckList({ checks }: { checks: Check[] }) {
  const still = useReducedMotion();
  const passed = checks.filter(c => c.pass).length;
  return (
    <div className="checks">
      <div className="checks-head">
        <span className="t-overline">Constraint checks</span>
        <span className="checks-count num" data-all={passed === checks.length || undefined}>
          {passed}<i>/{checks.length}</i>
        </span>
      </div>
      <ul>
        {checks.map((c, i) => (
          <motion.li
            key={c.name} data-pass={c.pass}
            initial={{ opacity: 0, x: still ? 0 : -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: dur.base, ease: ease.signature, delay: stagger(i, 0.05, 4) }}
          >
            <span className="checks-mark">{c.pass ? <Check /> : <X />}</span>
            <span><strong>{c.name}</strong><small>{c.detail}</small></span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
