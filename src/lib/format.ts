/**
 * Spark — number and date formatting.
 *
 * The product's whole claim is that its figures are trustworthy, so the
 * formatting layer has two jobs beyond looking tidy:
 *
 *  1. NEVER lose precision that the user is about to make a decision on.
 *     The previous build rendered every dollar figure through a compact
 *     formatter, so $8,643 displayed as "$8.6k" — in a product whose core
 *     check is "is this under the ceiling", that rounding is the difference
 *     between within budget and over it. Compact notation is now confined to
 *     chart axis ticks, where no decision is read off the label.
 *
 *  2. NEVER let absence become zero. A missing value formats as a word, is
 *     styled grey, and exports as MISSING. It is not 0, not "-", not "N/A"
 *     inside a numeric column where it could be mistaken for a quantity.
 */

const LOCALE = 'en-AU';
const TZ = 'Australia/Sydney';

export const MISSING = 'Missing' as const;
export const UNAVAILABLE = 'Not available' as const;

export type Maybe = number | null | undefined;

const absent = (v: Maybe): v is null | undefined =>
  v === null || v === undefined || Number.isNaN(v);

/* ---- money ------------------------------------------------------------- */

const money0 = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'AUD',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

const money2 = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'AUD',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Exact dollars: $8,643. Use everywhere a budget decision is read. */
export const money = (v: Maybe, fallback: string = MISSING) =>
  absent(v) ? fallback : money0.format(v);

/** Cents only where cents are the unit, e.g. cost per member. */
export const moneyPrecise = (v: Maybe, fallback: string = MISSING) =>
  absent(v) ? fallback : money2.format(v);

/**
 * Compact money — CHART AXIS TICKS ONLY.
 * Never use this for a figure the user compares against a limit.
 */
export const moneyAxis = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `$${trim(v / 1_000_000)}m`;
  if (a >= 1_000) return `$${trim(v / 1_000)}k`;
  return `$${Math.round(v)}`;
};

const trim = (n: number) => {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

/* ---- counts and percentages ------------------------------------------- */

const int = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** Member counts, row counts: 8,620. Always exact. */
export const count = (v: Maybe, fallback: string = MISSING) =>
  absent(v) ? fallback : int.format(Math.round(v));

export const countAxis = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${trim(v / 1_000_000)}m`;
  if (a >= 1_000) return `${trim(v / 1_000)}k`;
  return String(Math.round(v));
};

/**
 * Percentages carry one decimal below 10% and none above — significant
 * digits, not a fixed width. 3.4% and 24% both read as deliberate; 3% and
 * 24.0% both read as careless.
 */
export const percent = (v: Maybe, fallback: string = MISSING) => {
  if (absent(v)) return fallback;
  const p = v <= 1 && v !== 0 ? v * 100 : v;
  return `${Math.abs(p) < 10 ? trim(p) : Math.round(p)}%`;
};

/** A multiplier, for ROI-style figures: 2.4x */
export const multiple = (v: Maybe, fallback: string = UNAVAILABLE) =>
  absent(v) ? fallback : `${trim(v)}×`;

/* ---- ranges and deltas ------------------------------------------------- */

/**
 * Three-point estimates keep their low-central-high framing everywhere.
 * The product computes low/high already; the previous charts discarded them,
 * which hid the uncertainty the copy insists on.
 */
export const range = (
  low: Maybe,
  high: Maybe,
  fmt: (v: Maybe) => string = money,
) => (absent(low) || absent(high) ? MISSING : `${fmt(low)}–${fmt(high)}`);

/** A delta is meaningless without its baseline, so the caller must name it. */
export const delta = (
  v: Maybe,
  opts: { baseline: string; fmt?: (v: Maybe) => string } = { baseline: '' },
) => {
  if (absent(v)) return { text: MISSING, sign: 0 as const, baseline: opts.baseline };
  const fmt = opts.fmt ?? percent;
  const sign = v > 0 ? (1 as const) : v < 0 ? (-1 as const) : (0 as const);
  const glyph = sign > 0 ? '▲' : sign < 0 ? '▼' : '–';
  return {
    // glyph as well as colour: hue alone must never encode state
    text: `${glyph} ${fmt(Math.abs(v))}`,
    sign,
    baseline: opts.baseline,
  };
};

/** Share of a whole, for the audience distribution bars. */
export const share = (part: Maybe, whole: Maybe) =>
  absent(part) || absent(whole) || whole === 0 ? MISSING : percent((part / whole) * 100);

/* ---- dates ------------------------------------------------------------- */

const stamp = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dayOnly = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TZ,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export const dateTime = (iso: string | number | Date) => stamp.format(new Date(iso));
export const dateOnly = (iso: string | number | Date) => dayOnly.format(new Date(iso));

/** Relative time for decision history, falling back to an absolute stamp. */
export const ago = (iso: string | number | Date) => {
  const then = new Date(iso).getTime();
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 45) return 'just now';
  if (secs < 90) return 'a minute ago';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  return dateTime(iso);
};

/* ---- export ------------------------------------------------------------ */

/** CSV cells write MISSING, never an empty cell that reads as zero. */
export const csvCell = (v: Maybe | string) => {
  if (typeof v === 'string') return v.includes('"') || v.includes(',') || v.includes('\n')
    ? `"${v.replace(/"/g, '""')}"`
    : v;
  return absent(v) ? 'MISSING' : String(v);
};

/** Revision labels: v3.0 in the header, Revision 03 in the rails. */
export const revisionLabel = (n: number) => `v${n}.0`;
export const revisionLong = (n: number) => `Revision ${String(n).padStart(2, '0')}`;
