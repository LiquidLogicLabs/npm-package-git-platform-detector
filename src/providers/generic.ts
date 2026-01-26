import { Provider, ProbeResult } from '../types';
import { parseOwnerRepo } from '../utils/url';

export const genericProvider: Provider = {
  id: 'generic',
  displayName: 'Generic Git',
  isUrlMatch(): boolean {
    return false;
  },
  async probeApi(): Promise<ProbeResult> {
    return { matched: false };
  },
  determineBaseUrl(urls: string[]): string | undefined {
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
