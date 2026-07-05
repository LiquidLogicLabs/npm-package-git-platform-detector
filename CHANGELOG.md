## [1.1.6](https://git.ravenwolf.org/liquidlogiclabs/npm-package-git-platfom-detector/compare/v1.1.5...v1.1.6) (2026-07-05)
# Changelog

All notable changes to the `git-platform-detector` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No consumer-facing changes. Dev-environment updates only (devcontainer + file-based secrets).

## [1.1.4] - 2026-02-16

### Changed
- Standardized CI workflows and package scripts with the rest of the actions monorepo
- Documentation updated to use kebab-case throughout; added Permissions section to README
- Synced action best-practices rules from the monorepo canonical playbook
- Release workflow updates for reliability

## [1.1.3] - 2026-01-28

### Fixed
- Republish to resolve registry publication issue. No code changes from 1.1.2.

## [1.1.2] - 2026-01-28

### Fixed
- Republish to resolve registry publication issue. No code changes from 1.1.1.

## [1.1.1] - 2026-01-28

### Fixed
- Republish to resolve registry publication issue. No code changes from 1.1.0.

## [1.1.0] - 2026-01-28

### Added
- Provider aliases for the generic provider (accept synonyms when resolving platform type)
- Gitea Actions environment detection improvements
- Reusable-workflow concurrency documentation

### Changed
- Standardized CI workflows and act configuration
- Switched publishing to `JS-DevTools/npm-publish` action for custom registry support
- Registry auth refactored to use `_authToken` format for Gitea npm registry

## [1.0.0] - 2026-01-26

### Added
- Initial release
- Platform detection for GitHub, Gitea, Bitbucket, and generic git hosts
- `detectPlatform()`, `createByName()`, `createByUrl()` factory functions
- `PlatformClient` abstraction with shared interface
- Provider probe / detection result types
- Logger abstraction (`ConsoleLogger`, `NoopLogger`)
