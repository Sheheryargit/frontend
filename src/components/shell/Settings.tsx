import { useEffect, useState } from 'react';
import { Check, Gauge, Moon, Sun, Type, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

export const PALETTES = [
  // blues and cyans
  { id: 'ice-blue',   name: 'Ice Blue',    note: 'Pale blue on cool slate', group: 'Blues' },
  { id: 'azure',      name: 'Azure',       note: 'Deeper blue, high clarity', group: 'Blues' },
  { id: 'cyan',       name: 'Cyan',        note: 'Blue-leaning aqua', group: 'Blues' },
  { id: 'steel',      name: 'Steel',       note: 'Muted blue-grey, restrained', group: 'Blues' },
  // violets
  { id: 'periwinkle', name: 'Periwinkle',  note: 'Soft blue-violet', group: 'Violets' },
  { id: 'indigo',     name: 'Indigo',      note: 'Deep violet-blue', group: 'Violets' },
  { id: 'violet',     name: 'Violet',      note: 'True violet', group: 'Violets' },
  { id: 'lavender',   name: 'Lavender',    note: 'Desaturated violet', group: 'Violets' },
  // pinks
  { id: 'orchid',     name: 'Orchid',      note: 'Pink-violet', group: 'Pinks' },
  { id: 'magenta',    name: 'Magenta',     note: 'Vivid pink', group: 'Pinks' },
  { id: 'plum',       name: 'Plum',        note: 'Muted wine pink', group: 'Pinks' },
  // reds
  { id: 'rose',       name: 'Rose',        note: 'Cool red', group: 'Reds' },
  { id: 'coral',      name: 'Coral',       note: 'Warm red-orange', group: 'Reds' },
  { id: 'terracotta', name: 'Terracotta',  note: 'Earthy clay', group: 'Reds' },
  // ambers
  { id: 'amber',      name: 'Amber',       note: 'Warm yellow-orange', group: 'Ambers' },
  { id: 'gold',       name: 'Gold',        note: 'Lifted yellow', group: 'Ambers' },
  { id: 'copper',     name: 'Copper',      note: 'Burnt orange', group: 'Ambers' },
  { id: 'bone-clay',  name: 'Bone & Clay', note: 'Warm neutral, clay accent', group: 'Ambers' },
  // near-neutral
  { id: 'graphite',   name: 'Graphite',    note: 'Almost monochrome', group: 'Neutrals' },
  { id: 'slate-ice',  name: 'Slate Ice',   note: 'Grey ground, cold accent', group: 'Neutrals' },
] as const;

export const TYPES = [
  { id: 'editorial', name: 'Editorial', note: 'Serif display · Inter body' },
  { id: 'grotesk',   name: 'Grotesk',   note: 'Inter throughout, tight' },
  { id: 'mono-tech', name: 'Mono',      note: 'Monospace display · Inter body' },
] as const;

const DENSITIES = [
  { id: 'compact',     name: 'Compact' },
  { id: 'default',     name: 'Default' },
  { id: 'comfortable', name: 'Comfortable' },
] as const;

const KEY = { palette: 'spark-palette-flybuys-v1', type: 'spark-type-flybuys-v1', density: 'spark-density', pace: 'spark-pace', handoff: 'spark-handoff' };

export const HANDOFFS = [
  { id: 'dissolve', name: 'Dissolve', note: 'Neutral field, held, then lifted' },
  { id: 'aperture', name: 'Aperture', note: 'Light gathers, shutter opens' },
  { id: 'wipe',     name: 'Wipe',     note: 'A soft band crosses the screen' },
  { id: 'bloom',    name: 'Bloom',    note: 'Outward burst from a point' },
] as const;

const PACES = [
  { id: 'relaxed',  name: 'Relaxed',  note: 'Every stage dwells' },
  { id: 'standard', name: 'Standard', note: 'Balanced' },
  { id: 'brisk',    name: 'Brisk',    note: 'Minimal pauses' },
] as const;

/** Applied to <html> so every token, in both themes, follows. */
export function useAppearance() {
  const [palette, setPalette] = useState(() => localStorage.getItem(KEY.palette) || 'ice-blue');
  const [type, setType] = useState(() => localStorage.getItem(KEY.type) || 'grotesk');
  const [density, setDensity] = useState(() => localStorage.getItem(KEY.density) || 'default');
  const [tempo, setTempo] = useState(() => localStorage.getItem(KEY.pace) || 'standard');
  const [handoff, setHandoff] = useState(() => localStorage.getItem(KEY.handoff) || 'dissolve');

  // Adopt the new visual defaults once; later personal choices remain intact.
  useEffect(() => {
    if (!localStorage.getItem('spark-flybuys-brand-v1')) {
      setPalette('ice-blue');
      setType('grotesk');
      localStorage.setItem('spark-flybuys-brand-v1', '1');
    }
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.palette = palette; localStorage.setItem(KEY.palette, palette);
    el.dataset.type = type;       localStorage.setItem(KEY.type, type);
    el.dataset.density = density; localStorage.setItem(KEY.density, density);
    el.dataset.pace = tempo;      localStorage.setItem(KEY.pace, tempo);
    localStorage.setItem(KEY.handoff, handoff);
  }, [palette, type, density, tempo, handoff]);

  return { palette, setPalette, type, setType, density, setDensity, tempo, setTempo, handoff, setHandoff };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: string;
  onTheme: (t: string) => void;
  appearance: ReturnType<typeof useAppearance>;
};

export function Settings({ open, onOpenChange, theme, onTheme, appearance }: Props) {
  const { palette, setPalette, type, setType, density, setDensity, tempo, setTempo, handoff, setHandoff } = appearance;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="settings">
        <DialogHeader>
          <DialogTitle>Appearance</DialogTitle>
          <DialogDescription>
            Palettes change every surface, border and accent in both light and dark.
          </DialogDescription>
        </DialogHeader>

        <section className="settings-section">
          <span className="t-overline">Mode</span>
          <div className="settings-row">
            {[{ id: 'light', name: 'Light', Icon: Sun }, { id: 'dark', name: 'Dark', Icon: Moon }].map(m => (
              <button key={m.id} className="settings-chip" data-on={theme === m.id} onClick={() => onTheme(m.id)} aria-pressed={theme === m.id}>
                <m.Icon />{m.name}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <span className="t-overline">Palette</span>
          <div className="palette-groups">
          {[...new Set(PALETTES.map(p => p.group))].map(group => (
          <div key={group} className="palette-group">
            <span className="palette-group-name">{group}</span>
            <div className="palette-grid">
            {PALETTES.filter(p => p.group === group).map(p => (
              <button
                key={p.id}
                className="palette-card"
                data-palette={p.id}
                data-on={palette === p.id}
                onClick={() => setPalette(p.id)}
                aria-pressed={palette === p.id}
              >
                <span className="palette-swatches" aria-hidden="true">
                  <i style={{ background: 'var(--sw-bg)' }} />
                  <i style={{ background: 'var(--sw-raise)' }} />
                  <i style={{ background: 'var(--sw-ink)' }} />
                  <i style={{ background: 'var(--sw-accent)' }} />
                </span>
                <span className="palette-text">
                  <strong>{p.name}</strong><small>{p.note}</small>
                </span>
                {palette === p.id && <span className="palette-tick"><Check /></span>}
              </button>
            ))}
            </div>
          </div>
          ))}
          </div>
        </section>

        <section className="settings-section">
          <span className="t-overline">Typeface</span>
          <div className="settings-row">
            {TYPES.map(t => (
              <button key={t.id} className="settings-chip settings-chip--wide" data-on={type === t.id} onClick={() => setType(t.id)} aria-pressed={type === t.id}>
                <Type /><span><strong>{t.name}</strong><small>{t.note}</small></span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <span className="t-overline">Agent pace</span>
          <div className="settings-row">
            {PACES.map(p => (
              <button key={p.id} className="settings-chip settings-chip--wide" data-on={tempo === p.id} onClick={() => setTempo(p.id)} aria-pressed={tempo === p.id}>
                <Gauge /><span><strong>{p.name}</strong><small>{p.note}</small></span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <span className="t-overline">Screen transition</span>
          <div className="settings-row">
            {HANDOFFS.map(h => (
              <button key={h.id} className="settings-chip settings-chip--wide" data-on={handoff === h.id} onClick={() => setHandoff(h.id)} aria-pressed={handoff === h.id}>
                <Wand2 /><span><strong>{h.name}</strong><small>{h.note}</small></span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <span className="t-overline">Density</span>
          <div className="settings-row">
            {DENSITIES.map(d => (
              <button key={d.id} className="settings-chip" data-on={density === d.id} onClick={() => setDensity(d.id)} aria-pressed={density === d.id}>
                {d.name}
              </button>
            ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
