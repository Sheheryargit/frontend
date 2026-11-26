# Project Spark contributor instructions

These rules apply to any coding agent or editor working in this repository.

## Read first

Read `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/AGENT.md` and `docs/DECISIONS.md` before changing a screen, data flow or visual style. Follow root `design.me` for the Flybuys visual identity: verified blue, Public Sans, original wordmark, blue-tinted surfaces and purposeful motion across brief, recommendation and review. The user-authorized rebrand supersedes the former mineral palette.

## Boundaries

- Keep React presentation in `src/components/`, screen orchestration in `src/features/`, service transport in `src/services/`, domain calculations in `src/model.ts`, and synthetic fixtures in `src/data.ts`.
- Import the campaign service through `src/services/campaign.ts`. Extend `CampaignGateway` in `src/services/contracts.ts` for new backend capabilities; keep mock and live implementations separate.
- Use semantic style variables and the existing feature CSS layers. Do not add raw colors, a second component theme, or default shadcn styling to a new screen. Add new CSS once through `src/styles.css`.
- Use shared motion settings and named agent stages. Every wait, loading state and progress animation must describe a real or explicitly simulated operation. Respect reduced motion.
- Preserve evidence and governance language: synthetic data stays labeled, missing is never zero, budget comparisons use exact dollars, estimate ranges remain visible, acceptance is a working direction and never a launch.
- Keep the decision network's SVG endpoints on node-core edges. Update `decisionAtlasGeometry.ts` and its test with any node size or position change.

## Completion gates

Run `npm run typecheck`, `npm test` and `npm run build`. For visual changes, inspect the rendered app at desktop size and one compact width, including focus, loading, error and reduced-motion behavior where relevant. Fix failures before handing work back.

Do not rewrite unrelated screens to add a feature. If a change must cross a boundary, explain why in the PR and update the corresponding document. No backend, model or real campaign execution exists in this prototype.
