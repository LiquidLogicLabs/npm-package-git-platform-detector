import { createByName, createByUrl } from './factory';
import { getLogger } from './logger';
import { getBuiltInProviders } from './providers';
import {
  CredentialSet,
  DetectionEvidence,
  DetectionResult,
  FactoryOptions,
  Provider,
  ProviderId
} from './types';
import { collectCandidateUrls, isGiteaActionsEnvironment, parseOwnerRepo, toUrl } from './utils/url';

export type DetectOptions = {
  requestedProvider?: string;
  repositoryUrl?: string;
  originUrl?: string;
  extraUrls?: string[];
  env?: NodeJS.ProcessEnv;
  providers?: Provider[];
  credentials?: CredentialSet;
  timeoutMs?: number;
  allowInsecure?: boolean;
  logger?: FactoryOptions['logger'];
};

function scoreEvidence(type: DetectionEvidence['type'], providerId: ProviderId): number {
  if (type === 'explicit') return 1.0;
  if (type === 'hostname') return providerId === 'generic' ? 0.2 : 0.8;
  if (type === 'probe') return providerId === 'generic' ? 0.2 : 0.6;
  return providerId === 'generic' ? 0.1 : 0.3;
}

function resolveRepoInfo(urlInput?: string, provider?: Provider): { owner?: string; repo?: string } {
  if (!urlInput) return {};
  const url = toUrl(urlInput);
  if (!url) return {};
  if (provider?.parseRepoUrl) {
    return provider.parseRepoUrl(url);
  }
  return parseOwnerRepo(url);
}

export async function detectPlatform(options: DetectOptions): Promise<DetectionResult> {
  const logger = getLogger(options.logger);
  const providers = options.providers && options.providers.length > 0 ? options.providers : getBuiltInProviders();

  // Early detection: if we're in Gitea Actions environment, prefer Gitea provider
  const env = options.env || process.env;
  const isGiteaEnv = isGiteaActionsEnvironment(env);
  if (isGiteaEnv) {
    logger.debug('Gitea Actions environment detected - will prefer Gitea provider');
  }

  const candidateUrls = collectCandidateUrls(
    {
      repositoryUrl: options.repositoryUrl,
      originUrl: options.originUrl,
      extraUrls: options.extraUrls,
      env: options.env
    },
    logger
  );

  if (options.requestedProvider) {
    const match = createByName(options.requestedProvider, { providers });
    const baseUrl = match.provider.determineBaseUrl(candidateUrls);
    const repoInfo = resolveRepoInfo(options.repositoryUrl || candidateUrls[0], match.provider);
    return {
      providerId: match.provider.id,
      baseUrl,
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      confidence: scoreEvidence(match.evidence.type, match.provider.id),
      evidence: [match.evidence]
    };
  }

  let fallbackMatch: { provider: Provider; evidence: DetectionEvidence } | undefined;
  const allEvidence: DetectionEvidence[] = [];

  for (const url of candidateUrls) {
    const match = await createByUrl(url, {
      providers,
      credentials: options.credentials,
      timeoutMs: options.timeoutMs,
      allowInsecure: options.allowInsecure,
      logger
    });
    if (!match) {
      continue;
    }
    allEvidence.push(match.evidence);
    if (match.provider.id !== 'generic') {
      const baseUrl = match.provider.determineBaseUrl(candidateUrls);
      const repoInfo = resolveRepoInfo(url, match.provider);
      return {
        providerId: match.provider.id,
        baseUrl,
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        confidence: scoreEvidence(match.evidence.type, match.provider.id),
        evidence: allEvidence
      };
    }
    fallbackMatch = match;
  }

  // If we detected Gitea Actions environment but no specific provider matched,
  // fall back to Gitea provider instead of generic
  if (isGiteaEnv && (!fallbackMatch || fallbackMatch.provider.id === 'generic')) {
    const giteaProvider = providers.find(provider => provider.id === 'gitea');
    if (giteaProvider) {
      logger.debug('Falling back to Gitea provider based on environment detection');
      const baseUrl = giteaProvider.determineBaseUrl(candidateUrls) || env.GITHUB_SERVER_URL || env.GITEA_SERVER_URL;
      const repoInfo = resolveRepoInfo(candidateUrls[0], giteaProvider);
      return {
        providerId: giteaProvider.id,
        baseUrl,
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        confidence: 0.7, // High confidence from environment detection
        evidence: [
          ...allEvidence,
          {
            type: 'fallback',
            providerId: giteaProvider.id,
            detail: 'Gitea Actions environment detected (GITEA_ACTIONS, GITEA_WORKSPACE, or non-GitHub GITHUB_SERVER_URL)'
          }
        ]
      };
    }
  }

  if (fallbackMatch) {
    const baseUrl = fallbackMatch.provider.determineBaseUrl(candidateUrls);
    const repoInfo = resolveRepoInfo(candidateUrls[0], fallbackMatch.provider);
    return {
      providerId: fallbackMatch.provider.id,
      baseUrl,
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      confidence: scoreEvidence(fallbackMatch.evidence.type, fallbackMatch.provider.id),
      evidence: allEvidence
    };
  }

  const generic = providers.find(provider => provider.id === 'generic');
  if (!generic) {
    throw new Error('No providers available for detection');
  }

  const baseUrl = generic.determineBaseUrl(candidateUrls);
  const repoInfo = resolveRepoInfo(candidateUrls[0], generic);
  return {
    providerId: generic.id,
    baseUrl,
    owner: repoInfo.owner,
    repo: repoInfo.repo,
    confidence: scoreEvidence('fallback', generic.id),
    evidence: [
      {
        type: 'fallback',
        providerId: generic.id,
        detail: 'No URL candidates or providers matched'
      }
    ]
  };
}
