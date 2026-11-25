import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScenarioLab } from './ScenarioLab';
import { initialWorkspace } from '../../types';
import { sampleBrief } from '../../data';

describe('scenario comparison', () => {
  it('shows the reach and cost trade-off before applying a direction', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ScenarioLab workspace={{ ...initialWorkspace(), brief: sampleBrief }} onSelect={onSelect}/>);
    await user.click(screen.getByRole('button', { name: /More reach/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'More reach' })).toBeVisible());
    expect(screen.getByText(/Cost or budget needs review/)).toBeVisible();
    expect(onSelect).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /Use this direction/ }));
    expect(onSelect).toHaveBeenCalledWith('a1', 'v2', 2);
  });
});
