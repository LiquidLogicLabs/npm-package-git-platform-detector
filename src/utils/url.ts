import { Logger } from '../types';

export type CandidateUrlOptions = {
  repositoryUrl?: string;
  originUrl?: string;
  env?: Record<string, string | undefined>;
  extraUrls?: string[];
};

function normalizeUrlString(input: string): string {
  return input.trim();
}

export function toUrl(input: string): URL | undefined {
  const trimmed = normalizeUrlString(input);
  if (!trimmed) return undefined;

  if (trimmed.includes('://')) {
    try {
      return new URL(trimmed);
    } catch {
      return undefined;
    }
  }

  if (trimmed.startsWith('git@')) {
    const withoutPrefix = trimmed.replace(/^git@/, '');
    const [hostPart, pathPart] = withoutPrefix.split(':');
    if (!hostPart || !pathPart) return undefined;
    const path = pathPart.replace(/\.git$/, '');
    return new URL(`https://${hostPart}/${path}`);
  }

  return undefined;
}

export function parseOwnerRepo(url: URL): { owner?: string; repo?: string } {
  const parts = url.pathname.replace(/^\/+/, '').replace(/\.git$/, '').split('/');
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  return {};
}

export function collectCandidateUrls(options: CandidateUrlOptions, logger?: Logger): string[] {
  const urls: string[] = [];
  const pushUnique = (value: string | undefined): void => {
    if (!value) return;
    const normalized = normalizeUrlString(value);
    if (!normalized) return;
    if (!urls.includes(normalized)) {
      urls.push(normalized);
      logger?.debug(`Added candidate URL: ${normalized}`);
    }
  };

  pushUnique(options.repositoryUrl);
  pushUnique(options.originUrl);

  const env = options.env || process.env;
  const envUrls = [
    env.GITHUB_SERVER_URL,
    env.GITHUB_API_URL,
    env.GITEA_SERVER_URL,
    env.GITEA_API_URL,
    env.BITBUCKET_SERVER_URL,
    env.BITBUCKET_API_URL
  ];
  for (const envUrl of envUrls) {
    pushUnique(envUrl);
  }

  for (const extraUrl of options.extraUrls || []) {
    pushUnique(extraUrl);
  }

  return urls;
}
