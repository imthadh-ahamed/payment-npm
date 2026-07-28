# Contributing

Thank you for contributing to `@company/payment-platform`. This document
describes the expected workflow, conventions, and review checklist.

## Development Workflow

1. Fork or branch from `main`.
2. Install dependencies with `pnpm install` (pnpm is required — see
   `packageManager` in `package.json`).
3. Make your change within the architectural boundaries described in
   [architecture.md](./architecture.md). If you're unsure which layer a
   change belongs in, ask before writing code.
4. Run the full local check suite before opening a pull request:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm format:check
   pnpm test
   pnpm build
   ```
5. Open a pull request against `main`.

Git hooks enforce steps 4a (lint, typecheck) and commit message format
automatically on every commit — see below.

## Branch Naming

Use a short, descriptive, kebab-case branch name prefixed with the change
type:

```
feat/razorpay-webhook-verification
fix/refund-amount-rounding
docs/architecture-diagram
chore/upgrade-typescript
```

## Commit Convention

This repository enforces [Conventional Commits](https://www.conventionalcommits.org/)
via commitlint on every commit (`.husky/commit-msg`).

```
<type>(<optional scope>): <short summary>

[optional body]

[optional footer(s)]
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`,
`ci`, `perf`.

Examples:

```
feat(domain): add Money value object with currency-safe arithmetic
fix(razorpay): correct signature verification for refund webhooks
docs(architecture): document the dependency rule
```

## Pull Request Guidelines

- Keep pull requests scoped to a single milestone or concern — avoid mixing
  unrelated changes.
- Describe _why_ the change is needed, not just what changed.
- Call out any architectural decisions or trade-offs explicitly in the PR
  description.
- Link to the relevant milestone/phase if this repository is being built
  incrementally.
- Ensure CI is green (lint, typecheck, format check, tests, build) before
  requesting review.

## Code Style

- Formatting is enforced by Prettier (`pnpm format:check`) — do not
  hand-format code that Prettier would reformat.
- Linting is enforced by ESLint (`pnpm lint`) using strict, type-aware rules.
- Prefer `type` imports for type-only imports (enforced by
  `@typescript-eslint/consistent-type-imports`).
- No `any` — use `unknown` and narrow, or define a proper type.
- Follow the dependency rule in [architecture.md](./architecture.md): inner
  layers (`domain`, `application`) must never import from outer layers
  (`infrastructure`, `providers`, `core`).

## Review Checklist

Before approving a pull request, confirm:

- [ ] Change respects the dependency rule (no inward layer imports an outer
      layer)
- [ ] No secrets, credentials, or sensitive payloads are logged
- [ ] Public API additions have TSDoc comments
- [ ] New logic has corresponding unit tests
- [ ] No unnecessary new runtime dependencies were introduced without
      justification
- [ ] Commit messages follow Conventional Commits
- [ ] Lint, typecheck, format check, tests, and build all pass locally/CI
