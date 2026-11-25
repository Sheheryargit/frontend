import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewIntelligence } from './ReviewIntelligence';
import { initialWorkspace } from '../../types';
import { sampleBrief } from '../../data';

describe('review workspace', () => {
  it('keeps follow-ups local and labels unmeasured outcomes honestly', async () => {
    const user = userEvent.setup();
    const workspace = { ...initialWorkspace(), brief: sampleBrief, revision: 1, firstGeneratedAt: new Date().toISOString() };
    render(<ReviewIntelligence workspace={workspace}/>);
    await user.click(screen.getByRole('tab', { name: /Validation tasks/ }));
    await user.click(screen.getByRole('button', { name: /Add Approve the audience floor to follow-up plan/ }));
    expect(screen.getByRole('tab', { name: /Validation tasks 1/ })).toBeVisible();
    expect(localStorage.getItem(`spark-validation-plan-v1-${workspace.startedAt}-1`)).toContain('"queued":true');
    await user.click(screen.getByRole('tab', { name: 'POC scorecard' }));
    expect(screen.getByText('Analyst agreement')).toBeInTheDocument();
    expect(screen.getByText('Not measured')).toBeInTheDocument();
  });
});
