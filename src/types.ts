export type BuiltInProviderId = 'github' | 'gitea' | 'bitbucket' | 'generic';
export type ProviderId = BuiltInProviderId | (string & { readonly __providerId?: never });

export type CredentialSet = {
  username?: string;
  password?: string;
  token?: string;
};

export type ProbeContext = {
  credentials?: CredentialSet;
  timeoutMs?: number;
  allowInsecure?: boolean;
};

export type ProbeResult = {
  matched: boolean;
  baseUrl?: string;
  detail?: string;
};

export type DetectionEvidence = {
  type: 'explicit' | 'hostname' | 'probe' | 'fallback';
  providerId: ProviderId;
  url?: string;
  detail?: string;
};

export type DetectionResult = {
  providerId: ProviderId;
  baseUrl?: string;
  owner?: string;
  repo?: string;
  confidence: number;
  evidence: DetectionEvidence[];
};

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  debug(message: string): void;
}

export interface Provider {
  id: ProviderId;
  displayName: string;
  isUrlMatch(url: URL): boolean;
  probeApi(url: URL, context: ProbeContext, logger: Logger): Promise<ProbeResult>;
  determineBaseUrl(urls: string[]): string | undefined;
  parseRepoUrl?(url: URL): { owner?: string; repo?: string };
}

export type FactoryOptions = {
  providers?: Provider[];
  credentials?: CredentialSet;
  timeoutMs?: number;
  allowInsecure?: boolean;
  logger?: Logger;
};
