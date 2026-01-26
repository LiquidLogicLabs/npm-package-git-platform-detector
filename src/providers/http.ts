import { CredentialSet } from '../types';

export type FetchOptions = {
  timeoutMs?: number;
  headers?: Record<string, string>;
};

export async function fetchWithTimeout(
  url: string,
  options: FetchOptions
): Promise<Response> {
  const controller = new AbortController();
  const timeout = options.timeoutMs ?? 5000;
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      method: 'GET',
      headers: options.headers,
      signal: controller.signal
    });
  } finally {
    clearTimeout(id);
  }
}

export function buildBasicAuthHeader(username: string, password: string): string {
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${token}`;
}

export function buildTokenHeader(token: string, scheme: 'token' | 'bearer' = 'bearer'): string {
  return scheme === 'token' ? `token ${token}` : `Bearer ${token}`;
}

export function buildAuthHeaders(
  credentials?: CredentialSet,
  scheme: 'token' | 'bearer' = 'bearer'
): Record<string, string> {
  if (!credentials) return {};

  if (credentials.username && credentials.password) {
    return { Authorization: buildBasicAuthHeader(credentials.username, credentials.password) };
  }

  if (credentials.token) {
    return { Authorization: buildTokenHeader(credentials.token, scheme) };
  }

  return {};
}
