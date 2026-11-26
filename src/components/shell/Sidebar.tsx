import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Check, CircleHelp, Database, FileText, LayoutGrid, Search,
  ShieldCheck, SlidersHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FLYBUYS_WORDMARK, FlybuysAgentMark } from '../product/FlybuysAgentMark';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { briefFields } from '../../data';
import type { Screen, Workspace } from '../../types';
import { ease, dur, stagger } from '../../lib/motion';

type Stage = { id: Screen; label: string; icon: LucideIcon; step: string };

const STAGES: Stage[] = [
  { id: 'brief',          label: 'Campaign brief',     icon: FileText,   step: '01' },
  { id: 'recommendation', label: 'Recommendation',     icon: LayoutGrid, step: '02' },
  { id: 'review',         label: 'Review & governance',icon: ShieldCheck,step: '03' },
];

type Props = {
  workspace: Workspace;
  theme: string;
  dataMap: boolean;
  busy: boolean;
  busyLabel?: string;
  decided: boolean;
  onGo: (screen: Screen) => void;
  onSearch: () => void;
  onTour: () => void;
  onDataMap: () => void;
  onSettings: () => void;
  onTheme: () => void;
};

/**
 * The rail.
 *
 * It carries three things that were previously static text: where the agent is
 * right now, how far the campaign has travelled, and what each stage is
 * waiting on. The active marker is a single element that slides between items
 * rather than three that fade, so the rail reads as one object.
 */
export function Sidebar({
  workspace: ws, theme, dataMap, busy, busyLabel, decided,
  onGo, onSearch, onTour, onDataMap, onSettings, onTheme,
}: Props) {
  const still = useReducedMotion();
  const captured = briefFields.filter(f => ws.brief[f.key]?.trim()).length;

  const reached: Record<Screen, boolean> = {
    brief: true,
    recommendation: ws.generated,
    review: ws.generated,
  };
  const done: Record<Screen, boolean> = {
    brief: captured === briefFields.length,
    recommendation: ws.generated,
    review: decided,
  };
  const progress = (Number(done.brief) + Number(done.recommendation) + Number(done.review)) / 3;

  const status = busy
    ? { title: busyLabel ?? 'Working…', note: 'The agent is processing' }
    : ws.generated
      ? { title: decided ? 'Decision recorded' : 'Recommendation ready', note: `Revision ${String(ws.revision).padStart(2, '0')}` }
      : captured === briefFields.length
        ? { title: 'Brief complete', note: 'Ready to generate' }
        : { title: 'Awaiting your brief', note: `${captured} of ${briefFields.length} captured` };

  return (
    <aside className="rail">
      <div className="rail-top">
        <span className="rail-logo"><img src={FLYBUYS_WORDMARK} alt="Flybuys" /></span>
        <span className="rail-word">Spark<i>workspace</i></span>
      </div>

      {/* ---- what the agent is doing ---- */}
      <motion.div className="rail-agent" data-busy={busy || undefined} layout={!still}>
        <FlybuysAgentMark size="avatar" active={busy} />
        <span className="rail-agent-text">
          <AnimatePresence mode="wait" initial={false}>
            <motion.strong
              key={status.title}
              initial={{ opacity: 0, y: still ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: still ? 0 : -6 }}
              transition={{ duration: 0.2, ease: ease.out }}
            >{status.title}</motion.strong>
          </AnimatePresence>
          <small>{status.note}</small>
        </span>
      </motion.div>

      <button className="rail-search" onClick={onSearch}>
        <Search /><span>Search workspace</span><kbd>⌘K</kbd>
      </button>

      {/* ---- the journey ---- */}
      <nav className="rail-nav" aria-label="Campaign workflow">
        <div className="rail-progress" aria-hidden="true">
          <motion.i
            animate={{ scaleY: progress || 0.001 }}
            transition={{ duration: 0.7, ease: ease.signature }}
          />
        </div>

        {STAGES.map((s, i) => {
          const on = ws.screen === s.id;
          const open = reached[s.id];
          return (
            <motion.button
              key={s.id}
              className="rail-item"
              data-on={on} data-done={done[s.id] || undefined}
              disabled={!open}
              onClick={() => onGo(s.id)}
              aria-current={on ? 'page' : undefined}
              initial={{ opacity: 0, x: still ? 0 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: dur.base, ease: ease.signature, delay: stagger(i, 0.05, 3) }}
            >
              {on && !still && (
                <motion.span className="rail-item-bg" layoutId="rail-active"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
              )}
              {on && still && <span className="rail-item-bg" />}
              <span className="rail-node">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={done[s.id] ? 'done' : 'open'}
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                  >
                    {done[s.id] ? <Check /> : <s.icon />}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="rail-item-text">
                <small>{s.step}</small>
                <strong>{s.label}</strong>
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* ---- the campaign ---- */}
      <div className="rail-campaign">
        <span className="t-overline">Current campaign</span>
        <div className="rail-campaign-card">
          <strong>{ws.generated ? 'Grocery re-engagement' : 'Untitled campaign'}</strong>
          <span className="rail-chip" data-tone={ws.generated ? 'on' : 'off'}>
            {ws.generated ? `v${ws.revision}.0` : 'Draft'}
          </span>
          <div className="rail-meter" aria-hidden="true">
            <motion.i
              animate={{ width: `${(captured / briefFields.length) * 100}%` }}
              transition={{ duration: 0.6, ease: ease.signature }}
            />
          </div>
          <small className="num">{captured} of {briefFields.length} details captured</small>
        </div>
      </div>

      {/* ---- controls ---- */}
      <div className="rail-foot">
        <button onClick={onTour}><CircleHelp /><span>Walk through this screen</span></button>
        <button onClick={onDataMap} aria-pressed={dataMap}>
          <Database /><span>Data connection map</span>
          <span className="rail-switch" data-on={dataMap || undefined} />
        </button>
        <div className="rail-person">
          <span className="rail-avatar">SK</span>
          <span><strong>Campaign strategist</strong><small>Local demo workspace</small></span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Appearance settings"><SlidersHorizontal size={15} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end">
              <DropdownMenuItem onSelect={onSettings}><SlidersHorizontal />Appearance &amp; palette</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onTheme}>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
