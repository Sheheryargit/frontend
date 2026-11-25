import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';
import { briefFields } from '../../data';
import type { Brief, BriefKey } from '../../data';
import { ease, dur } from '../../lib/motion';
import { Pipeline } from './Pipeline';
import { LandingScenarioTicker } from './LandingScenarioTicker';
import type { LandingScenario } from './landingScenarios';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

type Props = {
  brief: Brief;
  working: boolean;
  engaged: boolean;
  activity: string[];
  composer: ReactNode;
  /** What the agent can already see in the draft, before anything is sent. */
  sensed: BriefKey[];
  selectedSuggestion: string | null;
  suggestionPhase: string;
  onStarter: (scenario: LandingScenario) => void;
};

/**
 * The front door.
 *
 * One column with the composer as the hero and a moving scenario channel
 * below it. The eight details the agent needs are a quiet line until capture
 * starts. The channel gives ideas without competing with the input.
 */
export function Landing({ brief, working, engaged, activity, composer, sensed, selectedSuggestion, suggestionPhase, onStarter }: Props) {
  const still = useReducedMotion();
  const captured = briefFields.filter(f => brief[f.key]?.trim()).length;
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: still ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: dur.screen, ease: ease.signature, delay },
  });

  return (
    <div className="front" data-engaged={engaged || undefined} data-departing={working || undefined}>
      <div className="front-inner">
        <motion.div className="front-mark" {...rise(0)} aria-hidden="true">
          <span />
        </motion.div>

        <motion.h1 className="front-greeting" {...rise(0.06)}>
          {greeting()}.
          <em>What should this campaign achieve?</em>
        </motion.h1>

        <motion.div className="front-composer" data-busy={working} {...rise(0.14)}>
          {composer}
        </motion.div>

        <AnimatePresence initial={false}>
          {engaged && !working && (
            <motion.div className="front-sensing"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.34, ease: ease.signature }}
            ><span className="front-sensing-light" />
              <span>{sensed.length ? `${sensed.length} brief ${sensed.length === 1 ? 'signal' : 'signals'} detected` : 'Listening for campaign intent'}</span>
              <span className="front-sensing-wave" aria-hidden="true"><i/><i/><i/><i/><i/></span>
            </motion.div>
          )}
        </AnimatePresence>

        {working ? (
          <motion.div
            className="front-working"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: dur.base, ease: ease.out }}
          >
            <span className="front-working-head">
              <Loader2 className="animate-spin motion-keep" />
              {captured > 0 ? `${captured} of 8 captured` : 'Reading your brief'}
            </span>
            {activity.slice(-1).map(a => (
              <span key={a} className="front-working-line"><Check />{a}</span>
            ))}
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
          {(!engaged || selectedSuggestion) && <motion.div className="front-suggestions" {...rise(0.2)}
            exit={{
              opacity: 0, height: 0, marginTop: 0,
              transition: { duration: 0.46, ease: ease.signature, delay: still ? 0 : 0.3 },
            }}
            style={{ overflow: 'hidden' }}
          >
            <LandingScenarioTicker selectedId={selectedSuggestion} selectionPhase={suggestionPhase} onChoose={onStarter}/>
          </motion.div>}
          </AnimatePresence>
        )}

        <motion.div className="front-foot" {...rise(0.34)}
          animate={{ opacity: engaged ? 0.25 : 1, y: engaged ? 12 : 0 }}
          transition={{ duration: 0.8, ease: ease.signature, delay: engaged ? 0.12 : 0 }}>
          <div className="front-foot-top">
            <span className="front-foot-label">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={captured ? 'captured' : sensed.length ? 'sensing' : 'idle'}
                  initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15, ease: ease.out }}
                >
                  {captured ? `${captured} of 8 captured`
                    : sensed.length ? `I can already see ${sensed.length}`
                    : 'Capture pipeline'}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="front-foot-note">Synthetic data · nothing leaves this browser</span>
          </div>
          <Pipeline brief={brief} sensed={sensed} orientation="horizontal" />
        </motion.div>
      </div>
    </div>
  );
}
