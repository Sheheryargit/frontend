import { briefFields } from '../../data';
import type { Brief, BriefKey } from '../../data';
import { budgetValue } from '../../model';

export type Status = 'ready' | 'check' | 'missing';

/**
 * Three states, and each one has to earn its colour.
 *
 *   ready   (green)  captured and inside what this demo can actually evidence
 *   check   (amber)  captured, but the agent is not confident — out of scope,
 *                    unparseable, or a default it assumed on your behalf
 *   missing (red)    nothing captured; the agent will not invent it
 *
 * Amber is the important one: a value being present is not the same as a value
 * being usable, and collapsing those two into "captured" is how a brief gets
 * accepted with a campaign type the product cannot support.
 */
export function statusOf(key: BriefKey, brief: Brief): Status {
  const value = brief[key]?.trim();
  if (!value) return 'missing';

  switch (key) {
    case 'partner':
      return /partner\s*a/i.test(value) ? 'ready' : 'check';
    case 'type':
      return value === 'Repeat purchase' ? 'ready' : 'check';
    case 'budget':
      return budgetValue(brief) ? 'ready' : 'check';
    case 'constraints':
      // no explicit floor means the 2,500 demo default is doing the work
      return /\d/.test(value) ? 'ready' : 'check';
    case 'target':
      return /lapsing|lapsed|infrequent|occasional|new member|first grocery/i.test(value)
        ? 'ready' : 'check';
    default:
      return 'ready';
  }
}

/** Why a field is amber, in the user's words. */
export function reasonFor(key: BriefKey, brief: Brief): string | null {
  if (statusOf(key, brief) !== 'check') return null;
  switch (key) {
    case 'partner':     return 'Only Partner A has data in this demo';
    case 'type':        return 'Needs validated evidence before it can be estimated';
    case 'budget':      return 'Could not read a positive amount';
    case 'constraints': return 'No minimum given — assuming the 2,500 default';
    case 'target':      return 'Not one of the three audiences that can be sized';
    default:            return 'Needs a second look';
  }
}

export function tally(brief: Brief) {
  const all = briefFields.map(f => statusOf(f.key, brief));
  return {
    ready: all.filter(s => s === 'ready').length,
    check: all.filter(s => s === 'check').length,
    missing: all.filter(s => s === 'missing').length,
    total: all.length,
  };
}
