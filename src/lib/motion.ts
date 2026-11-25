/**
 * Spark — motion system.
 *
 * One signature curve carries most of the product. Delta Cafes uses a single
 * easing on 73 of ~110 transitions; that shared physics is why the page reads
 * as one object rather than a pile of components. Reach for a different curve
 * only when purpose demands it (exit, on-screen move, progress).
 *
 * Spring configs are given as stiffness/damping/mass, which every Motion
 * version accepts. `visualDuration`/`bounce` is the nicer authoring form where
 * available; the equivalent is noted per entry.
 *
 * Law: damping ratio >= 1.0 for anything carrying information — layout,
 * numbers, charts. Overshoot on a figure makes the reader distrust it.
 */

/* ---- easings (cubic-bezier control points, Motion's array form) -------- */
export const ease = {
  /** SIGNATURE. easeOutExpo. The default for almost everything. */
  signature: [0.19, 1, 0.22, 1],
  /** Enter: things arriving on screen. */
  out: [0.22, 1, 0.36, 1],
  /** Exit, but only when leaving the viewport entirely. */
  in: [0.55, 0, 1, 0.45],
  /** On-screen A->B, morphs, reorders. Symmetric travel, symmetric curve. */
  inOut: [0.65, 0, 0.35, 1],
  /** Sheets and drawers that traverse the viewport. */
  ios: [0.32, 0.72, 0, 1],
} as const;

/* ---- durations (seconds, for Motion) ---------------------------------- */
export const dur = {
  tick: 0.08,
  press: 0.12,
  enter: 0.16,
  base: 0.2,
  panel: 0.26,
  screen: 0.32,
  morph: 0.45,
  sheet: 0.5,
  count: 0.65,
} as const;

/** Exit is always 0.6-0.75x its enter. A slow dismissal feels broken. */
export const exitOf = (enter: number) => Math.round(enter * 0.68 * 1000) / 1000;

/**
 * Duration from travel distance. Scales with sqrt, not linearly: linear
 * scaling makes long travel sluggish and short travel abrupt.
 */
export const durFor = (distancePx: number) =>
  Math.min(0.42, Math.max(0.12, (90 + 9 * Math.sqrt(Math.abs(distancePx))) / 1000));

/* ---- springs ----------------------------------------------------------- */
export const spring = {
  /** Layout reflow, reorder, resize. Zero overshoot or rows collide. */
  layout: { type: 'spring', stiffness: 320, damping: 32, mass: 1 },
  /** Shared-element morph, row -> detail panel. ~visualDuration .42 / bounce .04 */
  morph: { type: 'spring', stiffness: 260, damping: 28, mass: 1 },
  /** Hover and press. */
  press: { type: 'spring', stiffness: 520, damping: 30, mass: 0.7 },
  /** Modal and dialog entry. ~visualDuration .28 / bounce .02 */
  modal: { type: 'spring', stiffness: 380, damping: 34, mass: 1 },
  /** The one place a little bounce is earned. */
  toast: { type: 'spring', stiffness: 400, damping: 32, mass: 1 },
  /** Smoothing a scroll-linked value. */
  scroll: { type: 'spring', stiffness: 180, damping: 28, mass: 0.6 },
} as const;

/* ---- tweens ------------------------------------------------------------ */
export const tween = {
  enter: { duration: dur.enter, ease: ease.out },
  exit: { duration: exitOf(dur.enter), ease: ease.out },
  base: { duration: dur.base, ease: ease.signature },
  move: { duration: dur.base, ease: ease.inOut },
  /** Opacity never outlasts transform — Delta holds this throughout. */
  fade: { duration: dur.press, ease: 'linear' },
  /** Counters: a tween, never a spring. Springs make digits jitter. */
  count: { duration: dur.count, ease: [0.16, 1, 0.3, 1] },
} as const;

/* ---- stagger -----------------------------------------------------------
   Decaying, so long lists never crawl. Total delay is capped: no reveal
   should spend more than ~0.4s waiting to begin.                          */
export const stagger = (i: number, base = 0.032, k = 5) =>
  Math.min(0.4, base * (1 - Math.exp(-i / k)) * k);

/** Flat stagger with a hard item cap — correct for short, known lists. */
export const staggerCapped = (i: number, step = 0.04, cap = 6) =>
  Math.min(i, cap) * step;

/* ---- reveal variants ---------------------------------------------------
   Content follows its container, never leads it. The container establishes
   the space; content arriving first has nowhere to be.                     */
export const revealUp = {
  hidden: { opacity: 0, y: 8 },
  shown: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: dur.press, ease: 'linear', delay: stagger(i) },
      y: { duration: dur.base, ease: ease.signature, delay: stagger(i) },
    },
  }),
} as const;

export const revealIn = {
  hidden: { opacity: 0, scale: 0.98 },
  shown: { opacity: 1, scale: 1, transition: tween.enter },
  gone: { opacity: 0, scale: 0.985, transition: tween.exit },
} as const;

/**
 * Screen transition. The old build used opacity .85->1 / y 3->0 over 120ms,
 * which reads as a flicker rather than a transition, and its exit kept y:0 so
 * the motion had no direction. This one has a direction and an honest length.
 */
export const screenTransition = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.16, ease: 'linear' },
      y: { duration: dur.screen, ease: ease.signature },
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.14, ease: ease.out },
  },
} as const;

/**
 * Modal choreography. One spine (the container) plus dependents that overlap
 * it by 40-60%. Nothing animates after the spine settles, and the close is a
 * single stage — the user already decided.
 */
export const modalChoreography = {
  scrim: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.18, ease: 'linear' } },
    exit: { opacity: 0, transition: { duration: 0.15, ease: 'linear' } },
  },
  container: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { ...spring.modal, opacity: { duration: 0.14, ease: ease.out } },
    },
    exit: {
      opacity: 0,
      scale: 0.985,
      transition: { duration: 0.12, ease: ease.out },
    },
  },
  /** delay <= 40% of the spine, or it reads as two separate events */
  content: (i = 0) => ({
    initial: { opacity: 0, y: 4 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.18, ease: ease.out, delay: 0.06 + i * 0.03 },
    },
  }),
} as const;
