/**
 * @company/payment-platform
 *
 * Public entry point for the package.
 *
 * Phase 3 note: the Shared Kernel and the Payment Domain (business
 * entities, value objects, and domain events — no provider, framework, or
 * infrastructure code) are exported so far. Application and provider
 * exports will be added incrementally in later phases.
 */

export * from './shared/index.js';
export * from './domain/index.js';
