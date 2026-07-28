# application

Use cases and application services that orchestrate domain objects to fulfil
a specific workflow (e.g. "create a payment order", "verify a webhook").

This layer depends on `domain` only, via ports/interfaces. It must never
depend on a concrete provider SDK or infrastructure implementation — those
are supplied through dependency injection at the composition root.

No implementation exists yet. This file is a placeholder for Phase 1.
