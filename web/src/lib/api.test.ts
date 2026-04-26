import { recognizeSpeech } from './api';

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
