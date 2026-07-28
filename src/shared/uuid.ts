/**
 * An injectable abstraction over UUID generation, so domain and application
 * code never calls a concrete UUID library directly and stays deterministic
 * under test.
 */
import { randomUUID } from 'node:crypto';

/** Generates unique identifier strings. */
export interface UuidGenerator {
  /** Returns a new, unique identifier string. */
  generate(): string;
}

/**
 * The production {@link UuidGenerator}, backed by Node.js's built-in
 * cryptographically strong UUID (v4) generator.
 */
export class CryptoUuidGenerator implements UuidGenerator {
  generate(): string {
    return randomUUID();
  }
}

/**
 * A deterministic {@link UuidGenerator} for tests. Without arguments it
 * produces a predictable, strictly increasing sequence of UUID-shaped
 * strings; with `fixedValues`, it cycles through them in order.
 *
 * @example
 * ```ts
 * const uuids = new MockUuidGenerator(['11111111-1111-4111-8111-111111111111']);
 * uuids.generate(); // '11111111-1111-4111-8111-111111111111'
 * ```
 */
export class MockUuidGenerator implements UuidGenerator {
  private sequence = 0;

  constructor(private readonly fixedValues: readonly string[] = []) {}

  generate(): string {
    if (this.fixedValues.length > 0) {
      const index = this.sequence % this.fixedValues.length;
      const value = this.fixedValues[index];
      this.sequence += 1;
      // `index` is always within bounds given the check above; the guard
      // below exists only to satisfy `noUncheckedIndexedAccess`.
      if (value !== undefined) {
        return value;
      }
    }
    this.sequence += 1;
    const suffix = this.sequence.toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${suffix}`;
  }

  /** Resets the internal counter back to the start of the sequence. */
  reset(): void {
    this.sequence = 0;
  }
}
