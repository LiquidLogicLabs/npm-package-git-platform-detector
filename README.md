 # Git Platform Detector

[![CI](https://github.com/LiquidLogicLabs/npm-package-git-platform-detector/actions/workflows/ci.yml/badge.svg)](https://github.com/LiquidLogicLabs/npm-package-git-platform-detector/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@liquidlogiclabs/git-platform-detector.svg)](https://www.npmjs.com/package/@liquidlogiclabs/git-platform-detector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Lightweight platform detection for Git hosting providers. Designed for GitHub Actions and self-hosted Gitea, with easy extensibility for additional platforms.

## Features

- Hostname matching followed by API probing for unknown hosts
- Explicit provider override when required
- Clean provider factory with validation and credentials support
- Simple extension model for new platforms
- Node.js 20 compatible

## Detection flow

```mermaid
flowchart TD
  Start[Start] --> Explicit{ExplicitProvider?}
  Explicit -->|Yes| Validate[createByName]
  Explicit -->|No| Candidates[CollectCandidateUrls]
  Candidates --> HostMatch[createByUrl hostname match]
  HostMatch -->|Matched| Done[Result]
  HostMatch -->|No match| Probe[API probing]
  Probe -->|Matched| Done
  Probe -->|No match| Fallback[Generic fallback]
```

## Installation

```bash
npm install @liquidlogiclabs/git-platform-detector
```

The package is published publicly to npmjs and installs with no authentication.

## Basic usage

```ts
import { detectPlatform } from '@liquidlogiclabs/git-platform-detector';

const result = await detectPlatform({
  repositoryUrl: 'https://gitea.example.com/org/repo',
  credentials: { token: process.env.GITEA_TOKEN }
});

console.log(result.providerId);
console.log(result.baseUrl);
```

## Explicit provider

```ts
import { detectPlatform } from '@liquidlogiclabs/git-platform-detector';

const result = await detectPlatform({
  requestedProvider: 'gitea',
  repositoryUrl: 'https://gitea.example.com/org/repo'
});
```

## Factory usage

```ts
import { createByName, createByUrl } from '@liquidlogiclabs/git-platform-detector';

const explicit = createByName('github');

const auto = await createByUrl('https://github.com/octo/repo', {
  credentials: { token: process.env.GITHUB_TOKEN }
});
```

## API reference

### `detectPlatform(options)`

Returns a `DetectionResult`:

- `providerId`: detected provider id
- `baseUrl`: normalized base URL (if available)
- `owner`, `repo`: parsed owner/repo (when available)
- `confidence`: numeric confidence score
- `evidence`: detection evidence list

### `createByName(name, options)`

Validates and returns a provider by name. No hostname matching or probing is performed.

**Provider Aliases**: The following aliases are supported for the generic provider:
- `generic` (canonical name)
- `git` (alias for generic - local Git CLI operations)
- `local` (alias for generic - local Git CLI operations)

All aliases are case-insensitive and map to the `generic` provider.

### `createByUrl(url, options)`

Runs hostname matching first, then API probing. Returns a provider match or falls back to generic.

### `collectCandidateUrls(options)`

Collects URLs from explicit inputs and environment variables.

## Supported providers

- GitHub
- Gitea
- Bitbucket
- Generic (fallback)

## Extending with a new provider

1. Implement the `Provider` interface in `src/providers/<provider>.ts`.
2. Register the provider in `src/providers/index.ts`.
3. Add unit tests for hostname matching and probe behavior.

Example provider structure:

```ts
import { Provider } from '../types';

export const myProvider: Provider = {
  id: 'my-platform',
  displayName: 'My Platform',
  isUrlMatch: (url) => url.hostname.endsWith('example.com'),
  probeApi: async () => ({ matched: false }),
  determineBaseUrl: (urls) => urls[0]
};
```

## Security

- Tokens can be passed via `credentials` for API probing.
- Use environment variables or secrets for tokens in CI.
- Avoid logging tokens; the library never logs credentials.

## Publishing (CI)

The release workflow supports publishing to any npm-compatible registry when these variables are set:

- `NPM_REGISTRY_URL`
- `NPM_REGISTRY_USERNAME`
- `NPM_REGISTRY_TOKEN`

Point the URL to your Gitea package registry or the public npm registry.

## License

MIT

