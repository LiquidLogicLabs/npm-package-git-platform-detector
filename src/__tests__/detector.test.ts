import { detectPlatform } from '../detector';
import { Provider } from '../types';

const genericProvider: Provider = {
  id: 'generic',
  displayName: 'Generic',
  isUrlMatch: () => false,
  probeApi: async () => ({ matched: false }),
  determineBaseUrl: urls => (urls[0] ? new URL(urls[0]).origin : undefined)
};

describe('detectPlatform', () => {
  it('returns explicit provider when requested', async () => {
    const providers: Provider[] = [
      {
        id: 'github',
        displayName: 'GitHub',
        isUrlMatch: () => false,
        probeApi: async () => ({ matched: false }),
        determineBaseUrl: () => undefined
      },
      genericProvider
    ];

    const result = await detectPlatform({
      requestedProvider: 'github',
      providers,
      repositoryUrl: 'https://github.com/octo/repo'
    });

    expect(result.providerId).toBe('github');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('uses hostname match when available', async () => {
    const providers: Provider[] = [
      {
        id: 'custom',
        displayName: 'Custom',
        isUrlMatch: url => url.hostname === 'example.com',
        probeApi: async () => ({ matched: false }),
        determineBaseUrl: () => 'https://example.com'
      },
      genericProvider
    ];

    const result = await detectPlatform({
      providers,
      repositoryUrl: 'https://example.com/acme/app'
    });

    expect(result.providerId).toBe('custom');
    expect(result.evidence[0]?.type).toBe('hostname');
  });

  it('falls back to generic when no candidates match', async () => {
    const result = await detectPlatform({
      providers: [genericProvider]
    });

    expect(result.providerId).toBe('generic');
    expect(result.evidence[0]?.type).toBe('fallback');
  });
});
