# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial monorepo scaffold: Python SDK+CLI (`packages/tracebloom`) and Vite+React dashboard (`packages/dashboard`).
- CI workflows for Python and dashboard.
- Locked design tokens (`docs/design-tokens.md`).
- Governance, security, and contribution documents.

### Blocking TODO
- **PyPI trusted publishing setup** must be configured in the PyPI web UI before the first `release.yml` run. See ROADMAP.md "Phase 2 blockers".
