import { audioUrl, recognizeSpeech } from './api';

describe('audioUrl', () => {
  it('builds a legacy flat audio path when no options are provided', () => {
    expect(audioUrl("who'd there")).toBe('http://localhost:3000/api/audio/whod-there');
  });

  it('adds dialect and voice query params for dialect-aware assets', () => {
    expect(audioUrl("who'd", { dialect: 'en-AU', voice: 'default' })).toBe(
      'http://localhost:3000/api/audio/whod?dialect=en-AU&voice=default',
    );
  });
});

describe('recognizeSpeech', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves debug details from non-OK recognition responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'Speech recognition failed',
            debug: {
              rawTranscript: '',
              normalizedTranscript: '',
              prompt: 'The speaker will say one short English word.',
              rawResult: {
                error: {
                  name: 'InferenceUpstreamError',
                  message: 'error code: 1031',
                },
              },
            },
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    await expect(recognizeSpeech(new Blob(['audio']))).rejects.toMatchObject({
      message: 'Speech recognition failed',
      status: 500,
      debug: {
        prompt: 'The speaker will say one short English word.',
        rawResult: {
          error: {
            name: 'InferenceUpstreamError',
            message: 'error code: 1031',
          },
        },
      },
    });
  });
});
