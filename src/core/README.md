# core

Framework-agnostic orchestration primitives that wire the domain and application
layers together (e.g. the future `PaymentPlatform` composition root/facade).

This layer depends on `domain` and `application` only. It must never import
from `infrastructure` or `providers` directly — those are injected as
implementations of ports defined in `domain`.

No implementation exists yet. This file is a placeholder for Phase 1.
