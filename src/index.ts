export { detectPlatform } from './detector';
export { createByName, createByUrl } from './factory';
export { collectCandidateUrls, isGiteaActionsEnvironment, parseOwnerRepo, toUrl } from './utils/url';
export { getBuiltInProviders, getProviderById } from './providers';
export { ConsoleLogger, NoopLogger } from './logger';
export type {
  BuiltInProviderId,
  ProviderId,
  CredentialSet,
  ProbeContext,
  ProbeResult,
  DetectionEvidence,
  DetectionResult,
  Logger,
  Provider,
  FactoryOptions
} from './types';
