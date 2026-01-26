import { detectPlatform } from '../detector';
import { isGiteaActionsEnvironment } from '../utils/url';
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

  it('detects Gitea when GITEA_ACTIONS is set', async () => {
    const giteaProvider: Provider = {
      id: 'gitea',
      displayName: 'Gitea',
      isUrlMatch: () => false,
      probeApi: async () => ({ matched: false }),
      determineBaseUrl: () => 'http://gitea:3000'
    };

    const result = await detectPlatform({
      providers: [giteaProvider, genericProvider],
      env: {
        GITEA_ACTIONS: 'true',
        GITHUB_SERVER_URL: 'http://gitea:3000'
      }
    });

    expect(result.providerId).toBe('gitea');
  });

  it('detects Gitea when GITHUB_SERVER_URL points to non-GitHub', async () => {
    const giteaProvider: Provider = {
      id: 'gitea',
      displayName: 'Gitea',
      isUrlMatch: () => false,
      probeApi: async () => ({ matched: false }),
      determineBaseUrl: () => 'https://git.example.com'
    };

    const result = await detectPlatform({
      providers: [giteaProvider, genericProvider],
      env: {
        GITHUB_SERVER_URL: 'https://git.example.com'
      }
    });

    expect(result.providerId).toBe('gitea');
  });
});

describe('isGiteaActionsEnvironment', () => {
  it('returns true when GITEA_ACTIONS is set', () => {
    expect(isGiteaActionsEnvironment({ GITEA_ACTIONS: 'true' })).toBe(true);
    expect(isGiteaActionsEnvironment({ GITEA_ACTIONS: '1' })).toBe(true);
  });

  it('returns true when GITEA_WORKSPACE is set', () => {
    expect(isGiteaActionsEnvironment({ GITEA_WORKSPACE: '/workspace' })).toBe(true);
  });

  it('returns true when GITHUB_SERVER_URL is non-GitHub', () => {
    expect(isGiteaActionsEnvironment({ GITHUB_SERVER_URL: 'http://gitea:3000' })).toBe(true);
    expect(isGiteaActionsEnvironment({ GITHUB_SERVER_URL: 'https://git.example.com' })).toBe(true);
  });

  it('returns false when GITHUB_SERVER_URL is GitHub', () => {
    expect(isGiteaActionsEnvironment({ GITHUB_SERVER_URL: 'https://github.com' })).toBe(false);
    expect(isGiteaActionsEnvironment({ GITHUB_SERVER_URL: 'https://api.github.com' })).toBe(false);
  });

  it('returns false when no Gitea indicators present', () => {
    expect(isGiteaActionsEnvironment({})).toBe(false);
    expect(isGiteaActionsEnvironment({ SOME_VAR: 'value' })).toBe(false);
  });
});
