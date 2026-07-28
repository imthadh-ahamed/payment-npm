# @company/payment-platform

> Enterprise-grade, framework-agnostic, provider-agnostic payment platform for
> Node.js applications.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Status

**Phase 1 — Project Foundation.** This repository currently contains only the
project scaffold (tooling, configuration, and architectural boundaries). No
domain logic, application logic, or payment provider integrations have been
implemented yet. Do not consume this package in an application until a
tagged release with real functionality is published.

## Project Overview

`@company/payment-platform` is designed to be the single, reusable payment
integration layer for backend Node.js applications across the organization,
replacing ad-hoc, per-application payment integrations. Applications depend
on this package's stable, provider-agnostic API instead of talking to a
payment provider's SDK directly.

## Features

Planned for upcoming phases (none implemented yet):

- Provider-agnostic domain model for payments, refunds, and webhooks
- Razorpay as the first supported provider, with a provider interface that
  allows additional providers (Stripe, PayPal, PayU, Cashfree, PhonePe, ...)
  to be added without changing application code
- Framework-agnostic core, usable from Express, Fastify, NestJS, Hono,
  serverless functions, and background workers
- Strict TypeScript types across the public API
- Secure-by-default handling of secrets, webhooks, and idempotency

## Architecture

This package follows Clean Architecture / Hexagonal Architecture: business
rules live in the domain layer and never depend on frameworks, HTTP clients,
or provider SDKs. See [docs/architecture.md](./docs/architecture.md) for the
full explanation of layers, the dependency rule, and folder responsibilities.

## Installation

Not yet published. Once released:

```bash
npm install @company/payment-platform
```

```bash
pnpm add @company/payment-platform
```

## Usage

Not yet available — the public API will be documented here once the first
domain and provider implementations land.

## Development

This project uses [pnpm](https://pnpm.io) as its package manager.

```bash
# Install dependencies
pnpm install

# Type-check without emitting output
pnpm typecheck

# Lint
pnpm lint

# Lint and auto-fix
pnpm lint:fix

# Format
pnpm format

# Check formatting without writing changes
pnpm format:check

# Run the test suite
pnpm test

# Build the package to dist/
pnpm build

# Remove build artifacts
pnpm clean
```

Git hooks (via Husky) run linting, type-checking, and commit message
validation automatically — see
[docs/contributing.md](./docs/contributing.md) for the full workflow.

## Folder Structure

```
src/
├── core/            Composition root / orchestration, depends only on domain + application
├── domain/           Entities, value objects, domain errors, ports — zero external dependencies
├── application/      Use cases orchestrating domain objects via ports
├── infrastructure/   Concrete adapters implementing domain ports (HTTP, storage, logging, ...)
├── providers/         Payment provider adapters (Razorpay, Stripe, ...)
├── shared/            Small cross-cutting primitives (result types, base errors)
├── config/            Configuration schemas and validation
├── utils/            Pure, dependency-free helper functions
├── types/            Shared TypeScript types
└── index.ts          Public package entry point
```

See [docs/architecture.md](./docs/architecture.md) for what belongs in each
layer and the dependency rule that governs imports between them.

## Scripts

| Script              | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `pnpm build`        | Compile `src/` to `dist/` with type declarations |
| `pnpm clean`        | Remove `dist/`, coverage, and TS build info      |
| `pnpm lint`         | Lint the repository with ESLint                  |
| `pnpm lint:fix`     | Lint and auto-fix                                |
| `pnpm typecheck`    | Type-check without emitting output               |
| `pnpm format`       | Format the repository with Prettier              |
| `pnpm format:check` | Verify formatting without writing changes        |
| `pnpm test`         | Run the test suite once                          |
| `pnpm test:watch`   | Run the test suite in watch mode                 |

## Roadmap

- [x] Phase 1 — Project foundation (tooling, configuration, folder structure)
- [ ] Phase 2 — Core domain primitives (Money, error hierarchy, payment lifecycle state machine, ports)
- [ ] Phase 3 — Application layer use cases
- [ ] Phase 4 — Razorpay provider adapter
- [ ] Phase 5 — Public API surface, framework adapters, and examples
- [ ] Phase 6 — Additional providers

## License

[MIT](./LICENSE)
