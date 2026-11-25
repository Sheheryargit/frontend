# Product decisions

Rules the UI encodes. Breaking one changes what the product claims, so each is written down
with the reason.

## Honesty

**Absence is never zero.** Missing ROI renders as *Missing*, forecast ROI as *Not available*,
CSV writes `MISSING`. Never `0`, never an empty cell, never red — a gap in evidence is not a
failure state, and red would make it read as one.

**Captured ≠ usable.** The brief board has three states, not two. A campaign type of
*Basket build* is captured successfully **and** out of scope; it shows amber with the reason
*"Needs validated evidence before it can be estimated."* Without that distinction a brief can
reach the decisioning run carrying a value the product cannot support, and the user only finds
out when the Generate button silently stays disabled.

**The agent does not guess.** Deferral (*"you decide"*) fills a value but states the assumption
in the reply and marks the field. An assumption never passes as something the user said.

**Three-point estimates keep their range.** `cost[0]–cost[2]` is shown alongside `cost[1]`
everywhere a decision is made. The underlying model computes low/central/high; collapsing that
to one number hides the uncertainty the copy insists on.

## Precision

**Money keeps its digits where it matters.** Compact notation belongs on chart axis ticks and
nowhere else.

`model.ts` re-exports the exact-dollar formatter from `lib/format.ts`. Keep that path for
decision figures. Use `moneyAxis()` only for compact chart ticks.

## Governance

**Accepting is not launching.** The decision records a working direction. The footnote
*"This records a working direction. It does not approve or launch a campaign."* must survive
any redesign of the review screen.

**Acceptance is blocked** when the brief has changed since generation, the budget ceiling is
exceeded, the audience is under its floor, the audience is `a3` (new members — insufficient
evidence), or evidence quality is `insufficient`. The blocking reason is always stated.

**Decisions are append-only** and survive reloads. Cleared only by *New campaign*.

## Scope

Partner A, repeat purchase. Other partners and campaign types are **refused with an
explanation**, not estimated. The 2,500-member audience floor is a demo assumption and is
labelled as one wherever it is applied.

## Interaction

**The long choreography is for first contact only.** A landing scenario pauses, composes and
transmits visibly before capture. A one-word answer in the canvas uses a shorter confirmation
without replaying the full ingest pipeline.

**Motion reports state.** Pipeline branches only connect to the brief once a detail is
genuinely captured; unfilled branches route to *your input required* in amber. The diagram is
a readout, not an ornament.

**Reduced motion degrades, never deletes.** Opacity and colour still carry state; travel,
scale and looping decoration are removed.
