# domain

The innermost layer: entities, value objects, domain events, domain errors,
and ports (interfaces) that describe payment concepts independent of any
provider, framework, or transport.

This layer must have zero dependencies on any other layer in this package and
zero dependencies on Node.js built-ins, HTTP clients, or third-party SDKs.
Everything here is pure TypeScript.

No implementation exists yet. This file is a placeholder for Phase 1.
