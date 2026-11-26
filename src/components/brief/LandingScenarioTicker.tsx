import { useState } from 'react';
import { ArrowUpRight, ClipboardList, MessageCircle, Pause, Play, Radio, Target } from 'lucide-react';
import { landingScenarios } from './landingScenarios';
import type { LandingScenario } from './landingScenarios';

type Props = {
  selectedId: string | null;
  selectionPhase: string;
  onChoose: (scenario: LandingScenario) => void;
};

export function LandingScenarioTicker({ selectedId, selectionPhase, onChoose }: Props) {
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const paused = manuallyPaused || pointerInside || focusInside || Boolean(selectedId);
  return <section className="front-channel" aria-label="Campaign starting points" data-paused={paused} data-selected={Boolean(selectedId)}
    onFocusCapture={event => setFocusInside(!(event.target instanceof Element && event.target.closest('[data-channel-control]')))}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false); }}>
    <div className="front-channel-head">
      <span className="front-channel-title"><Radio size={13}/><strong>IDEA CHANNEL</strong><i/> {selectedId ? selectionPhase : 'Choose a starting point or write your own'}</span>
      <button type="button" data-channel-control onClick={() => setManuallyPaused(value => !value)} aria-pressed={manuallyPaused}
        aria-label={manuallyPaused ? 'Resume moving suggestions' : 'Pause moving suggestions'} disabled={Boolean(selectedId)}>
        {manuallyPaused ? <Play size={12}/> : <Pause size={12}/>} {manuallyPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
    <div className="front-channel-window" onMouseEnter={() => setPointerInside(true)} onMouseLeave={() => setPointerInside(false)}>
      <div className="front-channel-track" aria-label="Starting points">
        {[...landingScenarios, ...landingScenarios].map((scenario, index) => <button
          type="button" key={`${scenario.id}-${index}`} className="front-channel-item"
          aria-hidden={index >= landingScenarios.length ? true : undefined}
          tabIndex={index >= landingScenarios.length ? -1 : 0}
          data-active={selectedId === scenario.id}
          disabled={Boolean(selectedId)}
          onClick={() => onChoose(scenario)}>
          <span className="front-channel-icon" aria-hidden="true">
            {scenario.kind === 'sample' ? <ClipboardList size={16} /> : scenario.kind === 'question' ? <MessageCircle size={16} /> : <Target size={16} />}
          </span>
          <span className="front-channel-copy"><strong>{scenario.label}</strong><small>{scenario.context}</small></span>
          <ArrowUpRight size={13}/>
        </button>)}
      </div>
    </div>
    <div className="front-channel-progress" aria-hidden="true"><span/></div>
  </section>;
}
