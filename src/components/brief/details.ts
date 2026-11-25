import {
  CalendarDays, Gift, Repeat2, Shield, Store, Target, Users, Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BriefKey } from '../../data';

/**
 * Each detail carries its own hue, emoji and glyph. The hue is reused by the
 * floating chip, the landing list and the field row, so a detail is
 * recognisable by colour wherever it appears. Chroma stays low (0.06–0.09) —
 * eight saturated hues would read as a toy.
 */
export const DETAIL: Record<BriefKey, {
  icon: LucideIcon; emoji: string; short: string; hue: number; blurb: string;
}> = {
  partner:     { icon: Store,        emoji: '🏪', short: 'Partner',    hue: 288, blurb: 'Whose campaign this is' },
  type:        { icon: Repeat2,      emoji: '🔁', short: 'Type',       hue: 320, blurb: 'What kind of campaign' },
  objective:   { icon: Target,       emoji: '🎯', short: 'Objective',  hue: 25,  blurb: 'What it should change' },
  target:      { icon: Users,        emoji: '👥', short: 'Audience',   hue: 205, blurb: 'Who it should reach' },
  timing:      { icon: CalendarDays, emoji: '🗓️', short: 'Timing',     hue: 158, blurb: 'When it runs' },
  budget:      { icon: Wallet,       emoji: '💰', short: 'Budget',     hue: 85,  blurb: 'The hard ceiling' },
  offerPref:   { icon: Gift,         emoji: '🎁', short: 'Offer',      hue: 345, blurb: 'The reward mechanic' },
  constraints: { icon: Shield,       emoji: '🛡️', short: 'Limits',     hue: 235, blurb: 'Floors and exclusions' },
};

export const detailVars = (key: BriefKey) => ({
  '--d-hue': String(DETAIL[key].hue),
} as React.CSSProperties);
