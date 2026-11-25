# Frontend architecture

Project Spark is a React 18, TypeScript and Vite frontend. It uses synthetic data and browser-local persistence today. Presentation, workflow orchestration, domain rules and future network transport are kept separate.

## Module boundaries

- `src/App.tsx`: shell, navigation, run dialog, source inspector, search and notifications.
- `src/features/`: capture, recommendation, review and feedback orchestration.
- `src/components/brief/`: landing, composer, scenario channel, pipeline, conversation and editable brief.
- `src/components/decision/`: scenarios, evidence, comparisons and review intelligence.
- `src/components/product/`: shared domain visualizations, source chips and decision network.
- `src/components/ui/`: shadcn-derived primitives. Keep domain rules out.
- `src/services/contracts.ts`: transport-neutral gateway and event types.
- `src/services/campaign.ts`: composition point binding the UI to a service implementation.
- `src/services/mockCampaignService.ts`: scripted local implementation and demo source metadata.
- `src/data.ts`, `src/model.ts`: synthetic fixtures and illustrative calculations.
- `src/types.ts`: persisted workspace, messages and decision records.
- `src/lib/`: formatting, motion and shared utilities.
- `src/styles/`: ordered CSS layers, imported by `src/styles.css`.

Keep feature state in its component until it must survive navigation or reload. Put shared campaign state in `Workspace`. Do not add transport calls, model prompts or financial calculations to JSX.

## State and flow

`Workspace` persists to `localStorage['spark-studio-v3']`; appearance preferences use separate keys. A selected landing scenario visibly composes a draft, pauses before sending, then uses the same capture path as typed input. Capture moves through named receive, read, extract, check and reply phases. Users edit the brief before requesting a recommendation.

`generatedBrief` stores the brief snapshot used for a run. A later edit makes the recommendation stale and blocks acceptance. `configVersion` advances on material selection changes. Decisions append until New campaign. Review records a working direction, never a launch.

`CampaignGateway` owns capture and decisioning progress. `briefAgent.ts` classifies questions and deferrals before extraction. `agentPhases.ts` defines local choreography. A real backend should drive visible progress with actual events.

## Decision network geometry

`components/product/decisionAtlasGeometry.ts` owns node positions, core radii and dependencies. `DecisionAtlas.tsx` measures its network and draws SVG paths in that same coordinate system. Each line leaves the source core's right edge and enters the target core's left edge. CSS centers a stable wrapper separately from the animated button so hover scale cannot move anchors. Update geometry, visual core sizes and geometry tests together.

## Styling order

`styles.css` imports tokens and palettes, legacy compatibility, primitives, shell, feature layers, then the current dark visual identity in `control.css`, `discovery.css` and `landingTicker.css`. Later layers intentionally override earlier ones. Add feature CSS once in `styles.css`; use semantic variables instead of a second isolated theme.

## Backend integration path

1. Implement `CampaignGateway` in a new service module and switch the binding in `services/campaign.ts`.
2. Replace demo `sourceCatalog` and `runSteps` in the facade when real endpoints and progress stages exist.
3. Return validated, source-linked estimates from the backend; replace illustrative `model.ts` calculations before using live data.
4. Add authenticated persistence, authorization and partner isolation server-side. Browser storage is a prototype convenience.
5. Keep event shapes and UI labels stable during transport changes. See [Agent integration](AGENT.md).

## Current debt

`styles/legacy.css` and `styles/compat.css` still support older areas. New work should use feature CSS and tokens. The default dark identity also has hardcoded values in `control.css`; consolidate those as a focused design-system change after visual review.
