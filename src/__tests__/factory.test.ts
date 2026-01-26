import { createByName, createByUrl } from '../factory';
import { Provider } from '../types';

const mockProvider: Provider = {
  id: 'mock',
  displayName: 'Mock',
  isUrlMatch: () => false,
  probeApi: async () => ({ matched: true }),
  determineBaseUrl: () => undefined
};

describe('factory', () => {
  it('createByName returns provider for valid name', () => {
    const match = createByName('mock', { providers: [mockProvider] });
    expect(match.provider.id).toBe('mock');
    expect(match.evidence.type).toBe('explicit');
  });

  it('createByName throws for invalid name', () => {
    expect(() => createByName('missing', { providers: [mockProvider] })).toThrow('Unsupported provider');
  });

  it('createByUrl prefers hostname match', async () => {
    const hostProvider: Provider = {
      ...mockProvider,
      id: 'host',
      isUrlMatch: url => url.hostname === 'example.com',
      probeApi: async () => ({ matched: false })
    };
    const match = await createByUrl('https://example.com/owner/repo', {
      providers: [hostProvider, mockProvider]
    });
    expect(match?.provider.id).toBe('host');
    expect(match?.evidence.type).toBe('hostname');
  });

  it('createByUrl falls back to probe when no hostname matches', async () => {
    const match = await createByUrl('https://unknown.local/owner/repo', {
      providers: [mockProvider]
    });
    expect(match?.provider.id).toBe('mock');
    expect(match?.evidence.type).toBe('probe');
  });
});
