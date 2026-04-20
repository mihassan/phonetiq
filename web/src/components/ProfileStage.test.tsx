import { fireEvent, render, screen } from '@testing-library/react';
import { ProfileStage } from './ProfileStage';
import type { ProfileSummary } from '../lib/types';

const summary: ProfileSummary = {
  totalAttempts: 42,
  totalCorrect: 30,
  accuracy: 71,
  completedPairs: 9,
  currentStreak: 3,
  bestStreak: 8,
  sessionsCount: 6,
  lastPracticedAt: '2026-04-20T12:00:00.000Z',
  weakPairs: [
    {
      pair: {
        id: 2,
        word1: 'thin',
        word2: 'tin',
        phoneme_type: 'fricative',
        target_sounds: '/θ/ vs /t/',
        dialect_filter: 'all',
        difficulty_level: 1,
      },
      attempts: 8,
      accuracy: 25,
      weaknessScore: 92,
    },
  ],
  weakCategories: [
    {
      category: 'fricative',
      attempts: 16,
      accuracy: 31,
    },
  ],
};

describe('ProfileStage', () => {
  it('renders core profile stats and weak sections', () => {
    render(
      <ProfileStage
        summary={summary}
        onPracticeWeakPairs={vi.fn()}
        onResetProgress={vi.fn()}
      />,
    );

    expect(screen.getByText(/overall accuracy/i)).toBeInTheDocument();
    expect(screen.getByText('71%')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /weak pairs/i })).toBeInTheDocument();
    expect(screen.getByText(/thin vs tin/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /weak categories/i })).toBeInTheDocument();
    expect(screen.getByText(/fricative/i)).toBeInTheDocument();
  });

  it('fires profile actions', () => {
    const onPracticeWeakPairs = vi.fn();
    const onResetProgress = vi.fn();

    render(
      <ProfileStage
        summary={summary}
        onPracticeWeakPairs={onPracticeWeakPairs}
        onResetProgress={onResetProgress}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /practice weak pairs/i }));
    fireEvent.click(screen.getByRole('button', { name: /reset progress/i }));

    expect(onPracticeWeakPairs).toHaveBeenCalledTimes(1);
    expect(onResetProgress).toHaveBeenCalledTimes(1);
  });
});
