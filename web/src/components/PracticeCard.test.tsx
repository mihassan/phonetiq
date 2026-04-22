import { act, fireEvent, render, screen } from '@testing-library/react';
import { PracticeCard } from './PracticeCard';

const startRecordingMock = vi.fn();
const stopRecordingMock = vi.fn();
const recognizeSpeechMock = vi.fn();

vi.mock('../hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({
    startRecording: startRecordingMock,
    stopRecording: stopRecordingMock,
  }),
}));

vi.mock('../lib/api', () => ({
  recognizeSpeech: (...args: unknown[]) => recognizeSpeechMock(...args),
  audioUrl: (word: string) => `/api/audio/${word}`,
}));

describe('PracticeCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    startRecordingMock.mockResolvedValue(undefined);
    stopRecordingMock.mockResolvedValue(new Blob(['audio'], { type: 'audio/webm' }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('records, recognizes a correct transcript, and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    recognizeSpeechMock.mockResolvedValue('ship');

    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={onSuccess}
        isFirstWord={true}
        partnerWord="sheep"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /record pronunciation/i }));
      await Promise.resolve();
    });

    expect(startRecordingMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/listening/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(stopRecordingMock).toHaveBeenCalledTimes(1);
    expect(recognizeSpeechMock).toHaveBeenCalledTimes(1);

    expect(screen.getByText(/correct!/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows try again for incorrect transcript and returns to idle state', async () => {
    recognizeSpeechMock.mockResolvedValue('shape');

    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={false}
        partnerWord="sheep"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /record pronunciation/i }));
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(/try again/i)).toBeInTheDocument();
    const heardLabel = screen.getByText(/heard:/i);
    const transcriptPill = heardLabel.closest('div');
    expect(transcriptPill?.className).toContain('bg-[#3d1414]');
    expect(transcriptPill?.className).toContain('border-[#ff6b6b]/30');

    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText(/tap to speak/i)).toBeInTheDocument();
  });

  it('uses themed active-card, heading, and listen styles', () => {
    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
      />,
    );

    const card = screen.getByTestId('practice-card-active');
    const heading = screen.getByTestId('practice-card-heading');
    const listen = screen.getByTestId('practice-listen-button');
    const status = screen.getByTestId('practice-status-label');
    const record = screen.getByRole('button', { name: /record pronunciation/i });

    expect(card.className).toContain('ui-divider-border');
    expect(heading.className).toContain('w-full');
    expect(heading.className).toContain('text-center');
    expect(heading.className).toContain('min-h-[104px]');
    expect(listen.className).toContain('ui-link');
    expect(status.className).toContain('ui-muted');
    expect(record.className).toContain('ui-btn-primary');
    expect(card.className).toContain('px-8');
  });

  it('keeps inactive word layout centered and width-constrained for balance', () => {
    render(
      <PracticeCard
        word="internationalization"
        isActive={false}
        onSuccess={vi.fn()}
        isFirstWord={false}
        partnerWord="ship"
      />,
    );

    const inactiveWord = screen.getByText(/internationalization/i);
    expect(inactiveWord.className).toContain('w-full');
    expect(inactiveWord.className).toContain('text-center');
    expect(inactiveWord.className).toContain('min-h-[104px]');
    expect(inactiveWord.className).toContain('text-[38px]');
    expect(inactiveWord.className).toContain('md:text-[52px]');
  });

  it('keeps inactive practice card with balanced placeholder slot', () => {
    render(
      <PracticeCard
        word="sheep"
        isActive={false}
        onSuccess={vi.fn()}
        isFirstWord={false}
        partnerWord="ship"
      />,
    );

    expect(screen.getByTestId('practice-inactive-slot')).toBeInTheDocument();
  });

  it('reduces heading size for medium-length active words', () => {
    render(
      <PracticeCard
        word="tongue"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="ton"
      />,
    );

    const heading = screen.getByTestId('practice-card-heading');
    expect(heading.className).toContain('text-[44px]');
    expect(heading.className).toContain('md:text-[60px]');
  });

  it('uses partner-word length so both practice sides stay visually aligned', () => {
    render(
      <PracticeCard
        word="ton"
        partnerWord="tongue"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
      />,
    );

    const heading = screen.getByTestId('practice-card-heading');
    expect(heading.className).toContain('text-[44px]');
    expect(heading.className).toContain('md:text-[60px]');
  });

  it('uses themed recording-state colors', async () => {
    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /record pronunciation/i }));
      await Promise.resolve();
    });

    const record = screen.getByRole('button', { name: /record pronunciation/i });
    const status = screen.getByTestId('practice-status-label');
    const ring = screen.getByTestId('practice-recording-ring');
    const ringProgress = screen.getByTestId('practice-recording-ring-progress');

    expect(record.className).toContain('bg-[#ff6b6b]');
    expect(status.className).toContain('text-[#ffb3b3]');
    expect(ring.className).toContain('border-[#ff6b6b]/30');
    expect(ringProgress.getAttribute('stroke')).toBe('#ff6b6b');
  });

  it('uses themed processing-state colors', async () => {
    recognizeSpeechMock.mockImplementation(() => new Promise<string>(() => {}));

    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /record pronunciation/i }));
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(screen.getByText(/processing/i)).toBeInTheDocument();
    const record = screen.getByRole('button', { name: /record pronunciation/i });
    const status = screen.getByTestId('practice-status-label');

    expect(record.className).toContain('ui-btn-secondary');
    expect(status.className).toContain('text-[color:var(--color-primary)]');
  });

  it('uses themed correct-state colors', async () => {
    recognizeSpeechMock.mockResolvedValue('ship');

    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /record pronunciation/i }));
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    const record = screen.getByRole('button', { name: /record pronunciation/i });
    const status = screen.getByTestId('practice-status-label');

    expect(record.className).toContain('ui-btn-secondary');
    expect(status.className).toContain('text-[color:var(--color-primary)]');
  });

  it('uses themed incorrect-state colors', async () => {
    recognizeSpeechMock.mockResolvedValue('shape');

    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /record pronunciation/i }));
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    const record = screen.getByRole('button', { name: /record pronunciation/i });
    const status = screen.getByTestId('practice-status-label');

    expect(record.className).toContain('bg-[#3d1414]');
    expect(record.className).toContain('border-[#ff6b6b]/30');
    expect(status.className).toContain('text-[#ffb3b3]');
  });

  it('shows a no-match retry state when speech is unrelated', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: 'bonjour',
      matchType: 'no_match',
      matchedWord: null,
    });

    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /record pronunciation/i }));
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(/didn't catch that/i)).toBeInTheDocument();
    expect(screen.getByText(/bonjour/i)).toBeInTheDocument();
  });
});
