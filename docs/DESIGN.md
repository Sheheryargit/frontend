# Project Spark design language

This is the visual contract for the current product: a dark, calm decision workspace with a deep blue-green canvas, fine dotted field, mint for live system activity, pale gold for selected focus, and restrained violet for a distinct dependency. Brief, recommendation and review share this language.

## Sources of truth

- `src/styles/tokens.css`: semantic surfaces, ink, borders, radius, elevation and spacing.
- `src/styles/palettes.css`: optional appearance variations.
- `src/styles/control.css`: current dark identity, composer, processing and decision network.
- `src/styles/discovery.css`: recommendation and review detail surfaces.
- `src/styles/landingTicker.css`: moving scenario channel.
- `src/lib/motion.ts`: shared easing, springs and durations.
- `src/components/ui/`: accessible shadcn-derived primitives, restyled for Spark.

The default experience is dark. Check every new component in that theme and at least one light palette. Mint means active or completed data flow; gold means current focus or a decision. Warning and error colors keep their semantic meaning. Never rely on color alone.

## Composition and type

The composer is the landing focal point. Supporting scenarios travel in one horizontal idea channel. On focus or selection, surrounding material recedes and the composer expands. The channel pauses on hover, keyboard focus, explicit pause or selection, and selection shows a progress line before transmission.

Inter is the body face; Instrument Serif is an editorial display option; Geist Mono carries technical labels. Preserve the type ramp and numeric alignment in `base.css`. Use tabular numerals for changing or comparable figures. Keep copy short and operational.

Use the existing 4/8px spacing rhythm, fine borders and measured depth. The dotted field belongs on the application canvas and selected data scenes, not every card. Avoid repetitive floating cards, colored icon tiles, heavy glass, decorative gradients and unrelated palettes.

## Motion

Motion explains transfer and state. Input is received, intent is read, details land one by one, constraints are checked and a reply appears. Recommendation generation shows named stages and substeps. Use `lib/motion.ts` and `features/agentPhases.ts`. Reduced-motion mode removes travel and loops while keeping labels, progress and final states. A generic spinner should not replace a known, named operation.

Network links must visibly leave and enter node cores. Change `decisionAtlasGeometry.ts` and its test when positions, sizes or topology change. The text inspector and accessible node buttons remain available if motion is off.

## State and evidence

- Interactive controls need clear hover, focus, busy and disabled states where applicable.
- The brief uses ready, to check and missing. Unsupported populated values are to check with an explanation.
- Decision surfaces keep low, central and high estimate values. Budget comparisons use exact dollars; chart axes may use compact units.
- Source chips identify synthetic and future connections. Never imply a live model, query or launch.
- Empty, loading and error states explain what happened and what the user can do next.

## Visual review

Inspect landing, capture, recommendation and review at desktop width. Check scenario selection, typed prompt, interrupted run, missing detail, stale brief and reduced motion. At compact widths, verify the channel remains usable and network links meet core edges. Run `CONTRIBUTING.md` checks and include a screenshot for visual changes.
