import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleAlert, Lock, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { Button } from '../ui/button';
import { ease, dur } from '../../lib/motion';

type Props = {
  canAccept: boolean;
  blockedReason: string | null;
  accepted: boolean;
  onAccept: () => void;
  onChanges: () => void;
  onReject: () => void;
};

/**
 * The decision.
 *
 * The most consequential interaction in the product, previously three equal
 * buttons. Accept is explicitly *not* launch, so the weight goes on the
 * distinction rather than on the button: the blocking reason is stated above
 * the control, and the footnote survives any restyle.
 */
export function DecisionBar({
  canAccept, blockedReason, accepted, onAccept, onChanges, onReject,
}: Props) {
  const still = useReducedMotion();
  return (
    <section className="decide" data-state={accepted ? 'done' : canAccept ? 'open' : 'blocked'}>
      <AnimatePresence mode="wait" initial={false}>
        {blockedReason && !accepted && (
          <motion.p
            key="blocked" className="decide-blocked"
            initial={{ opacity: 0, y: still ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: dur.base, ease: ease.signature }}
          >
            <Lock />{blockedReason}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="decide-row">
        <div className="decide-lead">
          <strong>{accepted ? 'Accepted for refinement' : 'Record a decision'}</strong>
          <small>This records a working direction. It does not approve or launch a campaign.</small>
        </div>

        <div className="decide-actions">
          <Button variant="ghost" size="sm" onClick={onReject}><X />Reject</Button>
          <Button variant="outline" size="sm" onClick={onChanges}><RotateCcw />Request changes</Button>
          <Button
            onClick={onAccept} disabled={!canAccept || accepted}
            data-armed={canAccept && !accepted ? 'true' : undefined}
            className="generate-button"
          >
            <ShieldCheck />{accepted ? 'Accepted for refinement' : 'Accept for refinement'}
          </Button>
        </div>
      </div>

      {!canAccept && !blockedReason && !accepted && (
        <p className="decide-hint"><CircleAlert />Resolve the outstanding checks to accept.</p>
      )}
    </section>
  );
}
