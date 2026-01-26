import { Provider, ProbeContext, ProbeResult } from '../types';
import { buildAuthHeaders, fetchWithTimeout } from './http';
import { parseOwnerRepo } from '../utils/url';

export const giteaProvider: Provider = {
  id: 'gitea',
  displayName: 'Gitea',
  isUrlMatch(url: URL): boolean {
    return url.hostname.endsWith('.gitea.io') || url.hostname.includes('gitea');
  },
  async probeApi(url: URL, context: ProbeContext): Promise<ProbeResult> {
    const apiBase = `${url.origin}/api/v1`;
    const headers = {
      Accept: 'application/json',
      'User-Agent': 'git-platform-detector',
      ...buildAuthHeaders(context.credentials, 'token')
    };
    try {
      const response = await fetchWithTimeout(`${apiBase}/version`, {
        timeoutMs: context.timeoutMs,
        headers
      });
      if (response.ok) {
        return { matched: true, baseUrl: url.origin };
      }
      return { matched: false, detail: `Gitea probe status: ${response.status}` };
    } catch (error) {
      return { matched: false, detail: `Gitea probe failed: ${String(error)}` };
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
