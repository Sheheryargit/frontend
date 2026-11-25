import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';
import type { Message } from '../../types';
import type { BriefKey } from '../../data';
import { briefFields } from '../../data';
import { ease, dur, stagger } from '../../lib/motion';
import { DETAIL } from './details';

type Props = {
  messages: Message[];
  /** the agent is composing a reply */
  thinking: boolean;
  /** details added by the turn in flight, shown as inline confirmations */
  added: BriefKey[];
  suggestions: string[];
  onSuggestion: (text: string) => void;
  composer: ReactNode;
};

/**
 * The conversation.
 *
 * In the canvas an answer is not a job — it is a sentence. So there is no
 * phase rail here and no activity log: the agent shows a typing indicator,
 * the detail lands on the board, and a small confirmation line says which one.
 * The long choreography belongs to first contact, where there is genuinely a
 * lot of work to watch.
 */
export function Thread({ messages, thinking, added, suggestions, onSuggestion, composer }: Props) {
  const still = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: still ? 'auto' : 'smooth' });
  }, [messages, thinking, added, still]);

  return (
    <>
      <div className="chat scroll-contain" ref={scrollRef} aria-live="polite">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            className={`msg msg--${m.role === 'assistant' ? 'agent' : 'you'}`}
            initial={{ opacity: 0, y: still ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur.base, ease: ease.signature }}
          >
            {m.role === 'assistant' && (
              <span className="msg-avatar"><Sparkles /></span>
            )}
            <div className="msg-body">
              {m.role === 'assistant' && <span className="msg-who">Brief agent</span>}
              <p>{m.text}</p>
            </div>
          </motion.div>
        ))}

        {/* what just landed on the board */}
        <AnimatePresence initial={false}>
          {added.map((key, i) => {
            const f = briefFields.find(x => x.key === key);
            const G = DETAIL[key].icon;
            return (
              <motion.div
                key={key}
                className="msg-added"
                style={{ ['--d-hue' as string]: String(DETAIL[key].hue) }}
                initial={{ opacity: 0, x: still ? 0 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: dur.base, ease: ease.signature, delay: stagger(i, 0.05, 4) }}
              >
                <span className="msg-added-mark"><Check /></span>
                <G />
                <span><strong>{f?.label}</strong> added to the brief</span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {thinking && (
            <motion.div
              className="msg msg--agent msg--typing"
              initial={{ opacity: 0, y: still ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: still ? 0 : -6 }}
              transition={{ duration: 0.2, ease: ease.out }}
            >
              <span className="msg-avatar"><Sparkles /></span>
              <div className="msg-body">
                <span className="typing" aria-label="Brief agent is typing">
                  <i /><i /><i />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {suggestions.length > 0 && !thinking && (
          <motion.div
            className="chat-replies"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: ease.signature }}
          >
            {suggestions.map((s, i) => (
              <motion.button
                key={s}
                onClick={() => onSuggestion(s)}
                initial={{ opacity: 0, y: still ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, ease: ease.signature, delay: i * 0.05 }}
                whileHover={still ? {} : { y: -1 }}
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="chat-foot">{composer}</div>
    </>
  );
}
