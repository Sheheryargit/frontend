export const FLYBUYS_WORDMARK = `${import.meta.env.BASE_URL}brand/flybuys.svg`;

type Props = {
  size?: 'inline' | 'avatar' | 'hero' | 'orbit';
  active?: boolean;
  className?: string;
};

/** A decorative wordmark. The surrounding status or control provides its name. */
export function FlybuysAgentMark({ size = 'inline', active = false, className = '' }: Props) {
  return (
    <span
      className={`flybuys-agent-mark flybuys-agent-mark--${size} ${className}`.trim()}
      data-agent-active={active ? 'true' : undefined}
      aria-hidden="true"
    >
      <span className="flybuys-agent-wordmark" />
    </span>
  );
}
