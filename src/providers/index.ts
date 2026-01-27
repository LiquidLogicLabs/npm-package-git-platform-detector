import { Provider } from '../types';
import { bitbucketProvider } from './bitbucket';
import { genericProvider } from './generic';
import { githubProvider } from './github';
import { giteaProvider } from './gitea';

const builtInProviders: Provider[] = [
  giteaProvider,
  githubProvider,
  bitbucketProvider,
  genericProvider
];

export function getBuiltInProviders(): Provider[] {
  return [...builtInProviders];
}

/**
 * Provider aliases - these all map to the 'generic' provider
 * 'git', 'local', and 'generic' are equivalent aliases for local Git CLI operations
 */
const GENERIC_ALIASES = ['git', 'local', 'generic'];

export function getProviderById(id: string, providers: Provider[] = builtInProviders): Provider | undefined {
  // Normalize aliases to 'generic'
  const normalizedId = GENERIC_ALIASES.includes(id.toLowerCase()) ? 'generic' : id;
  return providers.find(provider => provider.id === normalizedId);
}
