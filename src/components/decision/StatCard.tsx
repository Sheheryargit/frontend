import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AnimatedValue } from '../product/InsightSignals';
import { ease, dur } from '../../lib/motion';

type Props = {
  label: string;
  value: number | string;
  format?: (n: number) => string;
  /** low–high framing, never dropped when the model provides it */
  range?: string;
  note?: string;
  tone?: 'neutral' | 'ok' | 'warn' | 'bad';
  source?: ReactNode;
  emphasis?: boolean;
  index?: number;
};

/** A figure that keeps its uncertainty and names where it came from. */
export function StatCard({
  label, value, format, range, note, tone = 'neutral', source, emphasis, index = 0,
}: Props) {
  const still = useReducedMotion();
  return (
    <motion.div
      className="statcard" data-tone={tone} data-emphasis={emphasis || undefined}
      initial={{ opacity: 0, y: still ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.panel, ease: ease.signature, delay: still ? 0 : index * 0.06 }}
    >
      <span className="statcard-label">{label}{source}</span>
      <strong className="statcard-value num">
        {typeof value === 'number' && format
          ? <AnimatedValue value={value} format={format} />
          : value}
      </strong>
      {range && <span className="statcard-range num">{range}</span>}
      {note && <span className="statcard-note">{note}</span>}
    </motion.div>
  );
}
