# Spark frontend experience plan

## Implemented in this iteration

- The brief now shows a live, scope-aware viability preflight and keeps every extracted field editable.
- The decisioning adapter emits two visible substeps per stage. The run shows a live detail line,
  travelling network state, progress and a short resolved handoff before opening the recommendation.
- Recommendation exploration now includes reusable segment recipes, a live reach/reward-cost
  scenario plot, an evidence passport, and a local contextual question dialog.
- Review now puts the human decision directly below the network, adds an exportable JSON packet,
  local validation follow-ups, and a proof-of-concept scorecard that avoids invented benchmarks.
- The new surfaces preserve missing financial values, unvalidated comparator rules, partner scope,
  and the distinction between refinement acceptance and campaign activation.

The remaining design opportunities below are background for later refinement, not a claim that
these systems or real backend agents have been delivered.

## Current design review

This review covers the local desktop brief, recommendation, and governance screens, the prompt-to-capture and decisioning runs, and the request-changes loop. The React build passes. The screen hierarchy and motion still need a dedicated narrow-viewport and keyboard pass before release.

### What is working

- The near-black teal system, dotted field, light composer, and restrained gold selection make the product recognisable.
- The six-node decision network links choices to the same figures shown in the recommendation. The connections and active packet give a useful sense of data movement.
- Brief extraction resolves fields progressively, keeps them editable, and exposes source placeholders.
- Review separates a working recommendation from campaign activation. Feedback can rerun decisioning or return to a prefilled brief.

### Highest-impact issues

1. **Brief density.** Eight field rows use similar visual weight and repeat icons, green rails, and checkmarks. Keep the active field prominent, compress completed fields into a quiet summary, and expand only the selected field.
2. **Decision prominence.** On governance, the actual accept/change/reject controls sit below the network and specification. Add a compact persistent decision dock with the current eligibility state and one clear primary action; detailed evidence stays in the scroll flow.
3. **Selection continuity.** Changing an audience or offer updates data, but the graph, value, range, and rationale should appear to transfer together. Coordinate these updates through one transition keyed to the decision revision and selection.
4. **Loading truthfulness.** The local agent currently advances through scripted waits. The UI should render discrete event objects now, then consume real streamed events later. Never show a completed source check before its event has resolved.
5. **Evidence clarity.** “Ready” means ready for strategist review, while limited evidence still needs validation. Use explicit wording such as “Reviewable · limited evidence” and keep that distinction consistent on the network and governance screen.
6. **Small text.** Node units, source captions, and some status metadata are below comfortable daily-use sizes. Lift core secondary text to 11–12px and verify contrast in both themes.

## Interaction system to build next

### 1. Agentic composer and capture

Create a `CampaignComposer` with four visual states: idle, sensing, sending, and responding. While typing, the composer expands, suggestions recede, and a subtle intent line appears. On send, a single `SignalPacket` moves from the send control into the conversation. The `CaptureStage` component then resolves one field at a time with source, confidence, and edit affordances. Completed stages condense into a small progress line. A user can interrupt, edit, or skip without waiting for a fixed animation.

### 2. Decisioning run

Create a `RunConductor` that consumes `{stage, status, detail, timestamp, source}` events from the existing frontend service adapter. `StageNode` handles waiting, running, resolved, and error states. `SignalLink` draws a travelling packet only while a stage is active. Show a readable activity log beside the network and hold the resolved state briefly before the screen handoff. A failed stage branches into a retry action without restarting the full run.

### 3. Recommendation exploration

Create a `DecisionTransition` coordinator so a choice highlights the selected node, carries a packet to the dependent estimate, then morphs the affected values and range meter. Keep the total update below roughly 500ms. The rationale updates in the same sequence and names which choice changed. Use an animated `RangeBand` for the cost and activation intervals; avoid animating any values without showing their new exact figures.

### 4. Human review

Create a `DecisionDock` that stays visible at the bottom of the governance workspace and reflects eligibility, unresolved evidence, and the selected action. Request changes opens the existing dialog with the related issue preselected. A revision should visibly travel back through the affected nodes; unchanged stages remain resolved. Acceptance should end with a clear local record, not a launch-like celebration.

## Motion rules

- Immediate button feedback: 80–120ms. Panel change: 180–260ms. Network transfer: 350–600ms. Stage dwell depends on the event and minimum readable time, not a global delay.
- Animate position, opacity, line reveal, and numeric interpolation. Use glow only on the active stage. Never pulse every node at once.
- One dominant moving element per scene. Ambient movement stays slow and low contrast.
- Reduced-motion mode shows the same state and order without travelling packets or count-up.

## Delivery order

1. Compact the brief rail and add the persistent governance decision dock.
2. Build the shared `SignalPacket`, `StageNode`, `SignalLink`, and event-driven `RunConductor` components.
3. Coordinate selection changes across network, metrics, and rationale.
4. Refine typography, focus states, keyboard flow, and 1024/768px layouts.
5. Capture each state in the browser and compare motion, legibility, and perceived latency against this plan.
