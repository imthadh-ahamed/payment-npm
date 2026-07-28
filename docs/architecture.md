# Architecture

This document explains the architectural approach for
`@company/payment-platform` and the responsibilities of each layer. It is a
living document — expect it to grow as later phases add domain, application,
and provider code.

## Why Clean / Hexagonal Architecture

This package must eventually support multiple payment providers (Razorpay,
Stripe, PayPal, PayU, Cashfree, PhonePe, and others) without rewriting
business logic each time a provider is added or swapped. The only way to
guarantee that is to keep business rules (what a payment is, what states it
can be in, how a refund is validated) completely independent of _how_ any
particular provider implements those concepts.

Clean Architecture and Hexagonal (Ports & Adapters) Architecture both express
the same core idea, which this project adopts as its foundation:

> Business logic should not depend on frameworks, databases, HTTP clients, or
> third-party SDKs. Those things should depend on business logic — never the
> other way around.

## The Dependency Rule

Source code dependencies may only point **inward**. Outer layers may depend
on inner layers; inner layers must never depend on outer layers.

```
        infrastructure ─┐
        providers ───────┼──▶ application ──▶ domain
        core ────────────┘
```

- `domain` depends on nothing else in this package.
- `application` depends only on `domain` (through its ports/interfaces).
- `infrastructure` and `providers` depend on `domain` to _implement_ its
  ports, and may freely depend on external packages (HTTP clients, provider
  SDKs, etc.).
- `core` composes `domain` and `application` together with whichever
  `infrastructure`/`providers` implementations are injected by the consuming
  application — it is the only layer allowed to "see" everything.

If a change to a payment provider's SDK ever forces a change inside
`domain` or `application`, that is an architecture violation to be fixed, not
a limitation to work around.

## Folder Responsibilities

| Folder               | Responsibility                                                                     | May depend on                |
| -------------------- | ---------------------------------------------------------------------------------- | ---------------------------- |
| `src/domain`         | Entities, value objects, domain events, domain errors, and ports (interfaces)      | Nothing else in this package |
| `src/application`    | Use cases orchestrating domain objects through ports                               | `domain`                     |
| `src/infrastructure` | Concrete implementations of domain ports (HTTP, storage, logging, clock, etc.)     | `domain`, external packages  |
| `src/providers`      | Payment provider adapters (Razorpay, Stripe, ...) implementing provider ports      | `domain`, provider SDKs      |
| `src/core`           | Composition root / orchestration wiring domain + application together              | `domain`, `application`      |
| `src/shared`         | Small cross-cutting primitives with no business meaning (base errors, Result type) | Nothing else in this package |
| `src/config`         | Configuration schemas and validation for package consumers                         | `shared`, `types`            |
| `src/utils`          | Pure, dependency-free helper functions                                             | Nothing else in this package |
| `src/types`          | Shared TypeScript types and type-only utilities                                    | Nothing else in this package |

## Package Goals

- **Reusable** — one package, many consuming applications, no copy-pasted
  payment logic.
- **Provider-agnostic** — adding a provider means implementing a port, not
  modifying business rules.
- **Framework-agnostic** — no hard dependency on Express, Fastify, NestJS, or
  any other framework. Framework integration, where offered, is an optional
  adapter layered on top.
- **Testable in isolation** — because `domain` and `application` have no
  external dependencies, they can be fully unit-tested without mocking HTTP,
  databases, or provider SDKs.

## Design Principles Applied

- **SOLID** — in particular the Dependency Inversion Principle (inner layers
  define interfaces; outer layers implement them) and the Interface
  Segregation Principle (small, focused ports rather than one large
  "provider" interface).
- **Composition over inheritance** — behavior is assembled by injecting
  implementations of ports, not by extending base classes.
- **Immutability where practical** — domain value objects (e.g. money,
  identifiers) are designed to be immutable once introduced in later phases.
- **Explicitness over magic** — no implicit global state, no hidden
  singletons; dependencies are passed in explicitly.

## Future Package Structure

As the package matures, expect:

- A formal `PaymentProvider`-style port in `domain`, with `src/providers/razorpay`
  as its first implementation.
- A composition entry point in `src/core` (e.g. a `PaymentPlatform` facade)
  that consuming applications construct once, providing their own
  infrastructure implementations (storage, logging) and provider credentials.
- Optional framework adapter packages/subpaths (e.g. an Express middleware
  for webhook verification) layered strictly on top of the framework-agnostic
  core — never required to use the package.
- Contract tests that any new provider adapter must pass before it can be
  considered a conforming implementation of the provider port.

None of the above exists yet. This document describes direction, not current
state — see the [README](../README.md) roadmap for what has actually shipped.
