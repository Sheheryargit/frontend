import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingScenarioTicker } from './LandingScenarioTicker';

describe('landing idea channel', () => {
  it('lets a person pause, resume and select a scenario while keeping the selection visible', async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();
    const view = render(<LandingScenarioTicker selectedId={null} selectionPhase="" onChoose={onChoose}/>);
    const pause = screen.getByRole('button', { name: 'Pause moving suggestions' });
    await user.click(pause);
    expect(screen.getByRole('button', { name: 'Resume moving suggestions' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Resume moving suggestions' }));
    expect(screen.getByRole('button', { name: 'Pause moving suggestions' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('region', { name: 'Campaign starting points' })).toHaveAttribute('data-paused', 'false');
    await user.click(screen.getByRole('button', { name: /Re-engage lapsing shoppers/ }));
    expect(onChoose).toHaveBeenCalledWith(expect.objectContaining({ id: 'lapsing', kind: 'intent' }));
    view.rerender(<LandingScenarioTicker selectedId="lapsing" selectionPhase="Writing your starting point" onChoose={onChoose}/>);
    expect(screen.getByText('Writing your starting point')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Campaign starting points' })).toHaveAttribute('data-paused', 'true');
  });
});
