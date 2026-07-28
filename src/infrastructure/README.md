# infrastructure

Concrete implementations of domain ports that talk to the outside world:
HTTP clients, storage adapters, logging adapters, clock implementations, etc.

This layer depends on `domain` (to implement its ports) and external
packages. Nothing outside `infrastructure` should depend on the specific
libraries used here — only on the ports they implement.

No implementation exists yet. This file is a placeholder for Phase 1.
