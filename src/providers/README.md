# providers

Payment provider adapters (Razorpay, Stripe, PayPal, etc.). Each provider
implements the domain's `PaymentProvider`-style ports and is responsible for
translating between the provider's SDK/API and the package's domain model.

Business logic must never live here — only translation and provider-specific
protocol details (request signing, payload shape, webhook verification
mechanics for that provider).

No provider implementation exists yet. This file is a placeholder for Phase 1.
