import { Provider, ProbeContext, ProbeResult } from '../types';
import { buildAuthHeaders, fetchWithTimeout } from './http';
import { parseOwnerRepo } from '../utils/url';

function getApiBase(url: URL): string {
  if (url.hostname === 'api.github.com') {
    return 'https://api.github.com';
  }
  if (url.hostname === 'github.com' || url.hostname.endsWith('.github.com')) {
    return 'https://api.github.com';
  }
  return `${url.origin}/api/v3`;
}

export const githubProvider: Provider = {
  id: 'github',
  displayName: 'GitHub',
  isUrlMatch(url: URL): boolean {
    return url.hostname === 'github.com' || url.hostname === 'api.github.com' || url.hostname.endsWith('.github.com');
  },
  async probeApi(url: URL, context: ProbeContext): Promise<ProbeResult> {
    const apiBase = getApiBase(url);
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'git-platform-detector',
      ...buildAuthHeaders(context.credentials, 'token')
    };
    try {
      const response = await fetchWithTimeout(`${apiBase}/rate_limit`, {
        timeoutMs: context.timeoutMs,
        headers
      });
      if (response.ok) {
        return { matched: true, baseUrl: url.origin };
      }
      return { matched: false, detail: `GitHub probe status: ${response.status}` };
    } catch (error) {
      return { matched: false, detail: `GitHub probe failed: ${String(error)}` };
    }
  },
  determineBaseUrl(urls: string[]): string | undefined {
    for (const urlStr of urls) {
      try {
        const url = new URL(urlStr);
        if (this.isUrlMatch(url)) {
          return url.hostname === 'api.github.com' ? 'https://github.com' : url.origin;
        }
      } catch {
        continue;
      }
    }
    for (const urlStr of urls) {
      try {
        return new URL(urlStr).origin;
      } catch {
        continue;
      }
    }
    return undefined;
  },
  parseRepoUrl(url: URL): { owner?: string; repo?: string } {
    return parseOwnerRepo(url);
  }
};
