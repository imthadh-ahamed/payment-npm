/**
 * @company/payment-platform
 *
 * Public entry point for the package.
 *
 * Phase 2 note: only the Shared Kernel (domain-agnostic primitives such as
 * `Result`, the error hierarchy, `Identifier`, `Clock`, and the DDD base
 * classes) is exported so far. Domain, application, and provider exports
 * will be added incrementally in later phases.
 */

export * from './shared/index.js';
