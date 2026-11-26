import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sampleBrief } from '../../data';
import { initialWorkspace } from '../../types';
import { AskSpark } from './AskSpark';

describe('recommendation assistant', () => {
  it('answers from the visible panel and keeps prior answers when the direction changes', async () => {
    const user = userEvent.setup();
    const workspace = { ...initialWorkspace(), brief: sampleBrief };
    const onSource = vi.fn();
    const onSelect = vi.fn();
    const view = render(<AskSpark workspace={workspace} onSelect={onSelect} onSource={onSource} />);

    const launcher = screen.getByRole('button', { name: 'Ask Spark' });
    expect(launcher).toHaveAttribute('aria-expanded', 'false');

    await user.hover(launcher);
    expect(launcher).toHaveAttribute('aria-expanded', 'true');
    await user.unhover(launcher);
    expect(launcher).toHaveAttribute('aria-expanded', 'false');

    await user.click(launcher);
    await user.unhover(launcher);
    expect(launcher).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('complementary', { name: 'Ask Spark' });
    expect(within(panel).getByRole('textbox', { name: 'Ask Spark a question' })).toBeVisible();
    await user.click(within(panel).getByRole('button', { name: 'How could we lower cost?' }));

    const action = await within(panel).findByRole('button', { name: 'Compare the lower-cost offer' });
    await user.click(action);
    expect(onSelect).toHaveBeenCalledWith(workspace.audienceId, 'v1', workspace.level);
    await user.click(within(panel).getByRole('button', { name: 'Inspect source' }));
    expect(onSource).toHaveBeenCalledWith('offer');

    view.rerender(
      <AskSpark workspace={{ ...workspace, offerId: 'v1', configVersion: 1 }} onSelect={onSelect} onSource={onSource} />,
    );
    expect(within(panel).getByText('Based on a previous direction')).toBeVisible();
    expect(within(panel).queryByRole('button', { name: 'Compare the lower-cost offer' })).not.toBeInTheDocument();

    await user.type(within(panel).getByRole('textbox', { name: 'Ask Spark a question' }), 'Why is ROI unavailable?{Enter}');
    expect(await within(panel).findByText(/cannot give a defensible ROI forecast/)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(launcher).toHaveFocus();
    expect(launcher).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('{Enter}');
    expect(within(panel).getByText('How could we lower cost?')).toBeVisible();
  });
});
