import { act, fireEvent, render, screen } from '@testing-library/react';
import { PracticeCard } from './PracticeCard';

const startRecordingMock = vi.fn();
const stopRecordingMock = vi.fn();
const recognizeSpeechMock = vi.fn();
const audioUrlMock = vi.fn((word: string, options?: { dialect?: string; voice?: string }) =>
  options?.dialect
    ? `/api/audio/${word}?dialect=${options.dialect}&voice=${options.voice ?? 'default'}`
    : `/api/audio/${word}`,
);

vi.mock('../hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({
    startRecording: startRecordingMock,
    stopRecording: stopRecordingMock,
  }),
}));

vi.mock('../lib/api', () => ({
  recognizeSpeech: (audioBlob: Blob, options?: unknown) => recognizeSpeechMock(audioBlob, options),
  audioUrl: (word: string, options?: { dialect?: string; voice?: string }) => audioUrlMock(word, options),
}));

function createRecordingResult(overrides?: Record<string, unknown>) {
  return {
    blob: new Blob(['audio'], { type: 'audio/webm' }),
    objectUrl: 'blob:debug-recording',
    mimeType: 'audio/webm',
    metrics: {
      durationMs: 3000,
      averageLevel: 0.12,
      peakLevel: 0.42,
      activityRatio: 0.58,
      speechStartMs: 220,
      speechEndMs: 2140,
      leadingSilenceMs: 220,
      trailingSilenceMs: 860,
      likelyIssue: null,
    },
    ...overrides,
  };
}

describe('PracticeCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    startRecordingMock.mockResolvedValue(undefined);
    stopRecordingMock.mockResolvedValue(createRecordingResult());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('uses the provided audio dialect for listen playback', () => {
    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
        audioDialect="en-GB"
      />,
    );

    fireEvent.click(screen.getByTestId('practice-listen-button'));

    expect(audioUrlMock).toHaveBeenCalledWith('ship', { dialect: 'en-GB', voice: 'default' });
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

  it('shows a starting-mic state until the recorder is actually ready', async () => {
    let resolveStart!: () => void;
    startRecordingMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveStart = resolve;
      }),
    );

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

    expect(screen.getByTestId('practice-status-label')).toHaveTextContent(/starting mic/i);

    await act(async () => {
      resolveStart();
      await Promise.resolve();
    });

    expect(screen.getByTestId('practice-status-label')).toHaveTextContent(/listening/i);
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

    expect(screen.getByTestId('practice-status-label')).toHaveTextContent(/try again/i);
    const heardLabel = screen.getByText(/heard:/i);
    const transcriptPill = heardLabel.closest('div');
    expect(transcriptPill?.className).toContain('ui-practice-state-incorrect');

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
    expect(record.className).toContain('ui-practice-state-idle');
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
    expect(inactiveWord.className).toContain('text-[34px]');
    expect(inactiveWord.className).toContain('md:text-[48px]');
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
    expect(heading.className).toContain('text-[40px]');
    expect(heading.className).toContain('md:text-[56px]');
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
    expect(heading.className).toContain('text-[40px]');
    expect(heading.className).toContain('md:text-[56px]');
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

    expect(record.className).toContain('ui-practice-state-recording');
    expect(status.className).toContain('text-[color:var(--color-state-recording)]');
    expect(ring.className).toContain('border-[color:var(--color-state-recording-bg)]');
    expect(ringProgress.getAttribute('stroke')).toBe('var(--color-state-recording)');
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

    expect(record.className).toContain('ui-practice-state-processing');
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

    expect(record.className).toContain('ui-practice-state-correct');
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

    expect(record.className).toContain('ui-practice-state-incorrect');
    expect(status.className).toContain('text-[color:var(--color-state-incorrect)]');
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

  it('shows targeted hint label when frame_sentence no_match has a transcript', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: 'cat',
      matchType: 'no_match',
      matchedWord: null,
      debug: null,
    });

    render(
      <PracticeCard
        word="cat"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="cut"
        experimentMode="frame_sentence"
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

    expect(screen.getByTestId('practice-status-label')).toHaveTextContent('Try: "The word is cat"');
  });

  it('shows generic Didn\'t catch that for no_match with empty transcript in frame_sentence', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: '',
      matchType: 'no_match',
      matchedWord: null,
      debug: null,
    });

    render(
      <PracticeCard
        word="cat"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="cut"
        experimentMode="frame_sentence"
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

    expect(screen.getByTestId('practice-status-label')).toHaveTextContent("Didn't catch that");
    expect(screen.queryByTestId('practice-frame-tip')).not.toBeInTheDocument();
  });

  it('shows a contextual frame tip in the feedback area when the frame phrase is missed', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: 'cat',
      matchType: 'no_match',
      matchedWord: null,
      debug: null,
    });

    render(
      <PracticeCard
        word="cat"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="cut"
        experimentMode="frame_sentence"
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

    expect(screen.getByTestId('practice-frame-tip')).toHaveTextContent('Try the full sentence');
    expect(screen.getByTestId('practice-frame-tip')).toHaveTextContent('The word is cat');
  });

  it('shows a development debug panel with recorded audio and raw ai details', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: 'ship',
      matchType: 'exact',
      matchedWord: 'ship',
      debug: {
        rawTranscript: 'Ship',
        normalizedTranscript: 'ship',
      },
    });

    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
        debugEnabled={true}
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

    expect(screen.getByTestId('practice-debug-panel')).toBeInTheDocument();
    expect(screen.getByText(/raw ai transcript/i)).toBeInTheDocument();
    expect(screen.getByTestId('practice-debug-raw-transcript')).toHaveTextContent('Ship');
    expect(screen.getByTestId('practice-debug-audio')).toHaveAttribute('src', 'blob:debug-recording');
    expect(screen.getByText(/normalized transcript/i)).toBeInTheDocument();
    expect(screen.getByText(/prompt used/i)).toBeInTheDocument();
    expect(screen.getByText(/raw ai response/i)).toBeInTheDocument();
  });

  it('hides the development debug panel when debug mode is disabled', async () => {
    recognizeSpeechMock.mockResolvedValue({
      transcript: 'ship',
      matchType: 'exact',
      matchedWord: 'ship',
      debug: {
        rawTranscript: 'Ship',
        normalizedTranscript: 'ship',
      },
    });

    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
        debugEnabled={false}
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

    expect(screen.queryByTestId('practice-debug-panel')).not.toBeInTheDocument();
  });

  it('offers send-anyway and retry controls for low-signal debug sessions', async () => {
    stopRecordingMock.mockResolvedValue(
      createRecordingResult({
        metrics: {
          durationMs: 3000,
          averageLevel: 0.002,
          peakLevel: 0.006,
          activityRatio: 0.01,
          speechStartMs: null,
          speechEndMs: null,
          leadingSilenceMs: 3000,
          trailingSilenceMs: 3000,
          likelyIssue: 'low_signal',
        },
      }),
    );

    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
        debugEnabled={true}
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

    expect(screen.getByRole('button', { name: /send anyway/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('labels noise-skipped debug captures accurately', async () => {
    stopRecordingMock.mockResolvedValue(
      createRecordingResult({
        metrics: {
          durationMs: 3000,
          averageLevel: 0.08,
          peakLevel: 0.1,
          activityRatio: 0.98,
          speechStartMs: 0,
          speechEndMs: 3000,
          leadingSilenceMs: 0,
          trailingSilenceMs: 0,
          likelyIssue: 'possible_noise',
        },
      }),
    );

    render(
      <PracticeCard
        word="ship"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="sheep"
        debugEnabled={true}
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

    expect(screen.getByText(/noise skipped/i)).toBeInTheDocument();
  });
});

describe('frame_sentence first-use tip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the tip on first render in frame_sentence mode', () => {
    render(
      <PracticeCard
        word="cat"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="cut"
        experimentMode="frame_sentence"
      />,
    );
    expect(screen.getByTestId('frame-tip')).toBeInTheDocument();
  });

  it('hides tip after clicking Got it and sets localStorage flag', async () => {
    render(
      <PracticeCard
        word="cat"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="cut"
        experimentMode="frame_sentence"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /got it/i }));
    });

    expect(screen.queryByTestId('frame-tip')).not.toBeInTheDocument();
    expect(localStorage.getItem('phonetiq:seenFrameTip')).toBe('1');
  });

  it('does not show tip when localStorage flag is already set', () => {
    localStorage.setItem('phonetiq:seenFrameTip', '1');

    render(
      <PracticeCard
        word="cat"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="cut"
        experimentMode="frame_sentence"
      />,
    );

    expect(screen.queryByTestId('frame-tip')).not.toBeInTheDocument();
  });

  it('does not show tip in standard mode', () => {
    render(
      <PracticeCard
        word="cat"
        isActive={true}
        onSuccess={vi.fn()}
        isFirstWord={true}
        partnerWord="cut"
      />,
    );

    expect(screen.queryByTestId('frame-tip')).not.toBeInTheDocument();
  });
});
