import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { ease, dur } from '../../lib/motion';
import { DETAIL } from './details';
import type { BriefKey } from '../../data';

export type FeedItem = {
  id: string;
  key?: BriefKey;
  label: string;
  state: 'adding' | 'done';
};

/**
 * The running record of what the agent is doing, one line at a time:
 * "Adding partner…" → done, "Adding campaign type…" → done.
 *
 * Each line owns a spinner while it is live and flips to a tick when it
 * settles, so the work reads as a sequence of completed acts rather than one
 * long indeterminate wait. The list scrolls itself.
 */
export function ActivityFeed({ items, compact = false }: { items: FeedItem[]; compact?: boolean }) {
  const still = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: still ? 'auto' : 'smooth' });
  }, [items, still]);

  return (
    <div className={`feed ${compact ? 'feed--compact' : ''} scroll-contain`} ref={ref} aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map(item => {
          const Glyph = item.key ? DETAIL[item.key].icon : null;
          return (
            <motion.div
              key={item.id}
              className="feed-row"
              data-state={item.state}
              style={item.key ? ({ ['--d-hue' as string]: String(DETAIL[item.key].hue) }) : undefined}
              initial={{ opacity: 0, y: still ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur.base, ease: ease.signature }}
              layout={!still}
            >
              <span className="feed-mark">
                <AnimatePresence mode="wait" initial={false}>
                  {item.state === 'adding' ? (
                    <motion.span
                      key="spin" className="feed-spinner"
                      initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.16, ease: ease.out }}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <circle className="feed-track" cx="10" cy="10" r="8" />
                        <circle className="feed-arc" cx="10" cy="10" r="8" />
                      </svg>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="done" className="feed-tick"
                      initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                    >
                      <Check />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              {Glyph && <Glyph className="feed-glyph" />}
              <span className="feed-label">{item.label}</span>
              <span className="feed-state">{item.state === 'adding' ? 'adding' : 'done'}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
