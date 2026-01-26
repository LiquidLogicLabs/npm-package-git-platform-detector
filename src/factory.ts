import { DetectionEvidence, FactoryOptions, Provider } from './types';
import { getLogger } from './logger';
import { getBuiltInProviders, getProviderById } from './providers';
import { toUrl } from './utils/url';

export type ProviderMatch = {
  provider: Provider;
  evidence: DetectionEvidence;
};

function normalizeProviders(options?: FactoryOptions): Provider[] {
  return options?.providers && options.providers.length > 0 ? options.providers : getBuiltInProviders();
}

export function createByName(
  name: string,
  options?: FactoryOptions
): ProviderMatch {
  const providers = normalizeProviders(options);
  const provider = getProviderById(name, providers);
  if (!provider) {
    throw new Error(`Unsupported provider: ${name}`);
  }
  return {
    provider,
    evidence: {
      type: 'explicit',
      providerId: provider.id,
      detail: `Provider explicitly requested: ${name}`
    }
  };
}

export async function createByUrl(
  urlInput: string,
  options?: FactoryOptions & { fallbackToGeneric?: boolean }
): Promise<ProviderMatch | undefined> {
  const providers = normalizeProviders(options);
  const logger = getLogger(options?.logger);
  const url = toUrl(urlInput);
  if (!url) {
    logger.debug(`Could not parse URL: ${urlInput}`);
    return undefined;
  }

  const probeContext = {
    credentials: options?.credentials,
    timeoutMs: options?.timeoutMs,
    allowInsecure: options?.allowInsecure
  };

  for (const provider of providers) {
    if (provider.id === 'generic') {
      continue;
    }
    if (provider.isUrlMatch(url)) {
      logger.debug(`Provider ${provider.id} matched by hostname for ${urlInput}`);
      return {
        provider,
        evidence: {
          type: 'hostname',
          providerId: provider.id,
          url: urlInput,
          detail: `Hostname match for ${url.hostname}`
        }
      };
    }
  }

  for (const provider of providers) {
    if (provider.id === 'generic') {
      continue;
    }
    const probe = await provider.probeApi(url, probeContext, logger);
    if (probe.matched) {
      logger.debug(`Provider ${provider.id} matched by API probe for ${urlInput}`);
      return {
        provider,
        evidence: {
          type: 'probe',
          providerId: provider.id,
          url: urlInput,
          detail: probe.detail
        }
      };
    }
  }

  if (options?.fallbackToGeneric === false) {
    return undefined;
  }

  const generic = providers.find(provider => provider.id === 'generic');
  if (generic) {
    return {
      provider: generic,
      evidence: {
        type: 'fallback',
        providerId: generic.id,
        url: urlInput,
        detail: 'No provider matched; falling back to generic'
      }
    };
  }

  return undefined;
}
