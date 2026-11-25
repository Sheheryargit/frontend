# Agent interaction and backend contract

The current agent experience is scripted locally. It calls no model or campaign backend. UI states and data boundaries are designed to accept real services without tying components to SSE, sockets or polling.

## Frontend seam

`src/services/contracts.ts` defines `CampaignGateway` with `extract(text, brief, onField, pace?)`, `sample(onField, pace?)`, `nextQuestion(brief)` and `run(onEvent, signal, fail?)`. The app imports `campaignService` from `src/services/campaign.ts`, which binds `mockCampaignService` today. Put a live implementation in a separate module and switch that binding. `sourceCatalog` and `runSteps` are demo presentation metadata also exported by the facade; replace them when real sources and stages are approved. Optional `pace` and `fail` inputs are simulation controls.

`extract` emits each captured field through `onField(key, value)` and resolves to the complete brief. `run` emits `{ index, detail, progress }`, respects `AbortSignal`, and resolves only after all stages finish. Failures surface in the run dialog; cancellation keeps the brief intact. A real adapter may map server events to these shapes.

## Conversation rules

`features/briefAgent.ts` classifies before extraction. Questions are answered as questions. A deferral such as “you decide” creates a visible assumption and labels its origin. Other statements reach the extractor. Live pre-send detection must not claim a field that extraction cannot capture. Every captured field stays editable before generation.

Landing scenarios in `components/brief/landingScenarios.ts` are entry points, not shortcuts. Selection pauses the channel, visibly writes a draft, waits before transmission, then starts the capture sequence. Sample data loads field by field.

## Event-driven behavior

First-contact capture displays receive → read → extract → check → reply, with a named event for each field. Local dwell times live in `features/agentPhases.ts`; reduced-motion mode compresses them. A connected agent should emit genuine phase and field events; use those to advance UI and remove artificial waiting once the server owns progress. Ten local decisioning substeps map to five visible stages. Do not show complete before a successful terminal event.

Backend responses should include source ID, snapshot time, partner scope, eligibility rules, estimate range, evidence quality, limitations and validation status. Missing measures remain missing. Never calculate a real offer cost from synthetic `model.ts` assumptions.

## Production integration sequence

1. Define authenticated campaign, brief, source and decision APIs with server-side partner isolation.
2. Add a live `CampaignGateway` adapter; normalize progress, cancellation and errors there.
3. Replace demo source metadata and illustrative calculations with versioned, validated responses.
4. Persist decisions server-side with actor, timestamp and input snapshot; retain append-only history.
5. Keep “working direction” language until a separate approval and activation workflow exists.

The local app has no authentication, permissions, partner isolation, real queries or campaign activation.
