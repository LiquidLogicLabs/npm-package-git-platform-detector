import { Provider, ProbeContext, ProbeResult } from '../types';
import { buildAuthHeaders, fetchWithTimeout } from './http';
import { parseOwnerRepo } from '../utils/url';

export const bitbucketProvider: Provider = {
  id: 'bitbucket',
  displayName: 'Bitbucket',
  isUrlMatch(url: URL): boolean {
    return url.hostname === 'bitbucket.org' || url.hostname.endsWith('.bitbucket.org');
  },
  async probeApi(url: URL, context: ProbeContext): Promise<ProbeResult> {
    const origin = url.origin;
    const headers = {
      Accept: 'application/json',
      'User-Agent': 'git-platform-detector',
      ...buildAuthHeaders(context.credentials, 'bearer')
    };
    try {
      const response = await fetchWithTimeout(`${origin}/rest/api/1.0/application-properties`, {
        timeoutMs: context.timeoutMs,
        headers
      });
      if (response.ok) {
        return { matched: true, baseUrl: origin };
      }
      return { matched: false, detail: `Bitbucket probe status: ${response.status}` };
    } catch (error) {
      return { matched: false, detail: `Bitbucket probe failed: ${String(error)}` };
    }
  },
  determineBaseUrl(urls: string[]): string | undefined {
    for (const urlStr of urls) {
      try {
        const url = new URL(urlStr);
        if (this.isUrlMatch(url)) {
          return url.origin;
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
