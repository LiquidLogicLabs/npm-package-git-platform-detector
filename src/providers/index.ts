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

export function getProviderById(id: string, providers: Provider[] = builtInProviders): Provider | undefined {
  return providers.find(provider => provider.id === id);
}
