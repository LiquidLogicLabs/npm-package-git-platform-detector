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

/**
 * Check if we're running in Gitea Actions environment
 * Gitea Actions sets GITEA_ACTIONS=true or uses GITHUB_* vars with non-GitHub URLs
 */
export function isGiteaActionsEnvironment(env?: Record<string, string | undefined>): boolean {
  const e = env || process.env;
  // Explicit Gitea indicator
  if (e.GITEA_ACTIONS === 'true' || e.GITEA_ACTIONS === '1') {
    return true;
  }
  // Gitea-specific workspace
  if (e.GITEA_WORKSPACE) {
    return true;
  }
  // GITHUB_SERVER_URL pointing to non-GitHub (Gitea compatibility mode)
  const serverUrl = e.GITHUB_SERVER_URL;
  if (serverUrl) {
    try {
      const url = new URL(serverUrl);
      // If GITHUB_SERVER_URL doesn't point to github.com, it's likely Gitea
      if (!url.hostname.includes('github.com') && !url.hostname.includes('github.io')) {
        return true;
      }
    } catch {
      // Invalid URL, can't determine
    }
  }
  return false;
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

  // If we detect Gitea Actions environment, prioritize Gitea URLs
  const isGitea = isGiteaActionsEnvironment(env);
  if (isGitea) {
    logger?.debug('Detected Gitea Actions environment');
    // Add Gitea URLs first for priority
    pushUnique(env.GITEA_SERVER_URL);
    pushUnique(env.GITEA_API_URL);
    // In Gitea, GITHUB_SERVER_URL points to the Gitea server
    pushUnique(env.GITHUB_SERVER_URL);
    pushUnique(env.GITHUB_API_URL);
  } else {
    // Standard order
    pushUnique(env.GITHUB_SERVER_URL);
    pushUnique(env.GITHUB_API_URL);
    pushUnique(env.GITEA_SERVER_URL);
    pushUnique(env.GITEA_API_URL);
  }

  pushUnique(env.BITBUCKET_SERVER_URL);
  pushUnique(env.BITBUCKET_API_URL);

  for (const extraUrl of options.extraUrls || []) {
    pushUnique(extraUrl);
  }

  return urls;
}
