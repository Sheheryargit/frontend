# Contributing

## Setup

```bash
nvm use          # Node 20.19+
npm install
npm run dev
```

## Before opening a PR

```bash
npm run typecheck   # must exit 0
npm test            # must pass
npm run build       # must succeed
```

CI runs all three checks.

## Conventions

**TypeScript** — `strict`, `noUnusedLocals` and `noUnusedParameters` are on. No `any`; if a
third-party type fights you, narrow it rather than casting through `unknown`.

**Styling** — CSS files under `src/styles/`, one per area, imported in order by `styles.css`.
Use tokens; do not introduce raw colour, easing or duration values. If you need a new token,
add it to `tokens.css` with a comment explaining the role it plays.

**Motion** — import from `lib/motion.ts`. Animate `transform` and `opacity` only; never
`width`, `height`, `box-shadow` or `top`/`left`. Every decorative animation needs a
`prefers-reduced-motion` path.

**Comments** — explain *why*, not *what*. The useful comments in this codebase record the
defect a piece of code prevents. Match that.

## Known traps

These cost time once already:

- Motion's exported `stagger()` returns `DynamicOption<number>` and **does not typecheck** in a
  JSX `transition.delay`. Use the helpers in `lib/motion.ts`.
- `AnimatePresence` silently skips exit animations when its subtree contains no registered
  motion component — the direct child must be a `motion.*` element.
- Recharts' `Tooltip` is **not generic**; `TooltipContentProps<number,string>` fails to compile.
- Animating an element's `transform` overrides any `transform` set in CSS on the same element.
- Functions that `await` for seconds must not read state from their own closure. Use a ref —
  see `briefRef` in `BriefScreen.tsx`.

## Testing

Vitest and Testing Library cover the decision network geometry, landing scenario controls,
recommendation scenario selection and review follow-up state. Add tests for user-visible
behaviour and domain invariants, especially when changing a flow. Avoid tests that merely
repeat static markup. Use `npm run test:watch` while developing.

## Design changes

Read [`AGENTS.md`](AGENTS.md), [`docs/DESIGN.md`](docs/DESIGN.md) and [`docs/DECISIONS.md`](docs/DECISIONS.md) first. Several UI behaviours encode product
commitments about honesty and governance; a change that looks cosmetic can quietly break one.
