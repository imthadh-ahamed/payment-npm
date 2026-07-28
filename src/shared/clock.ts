/**
 * An injectable abstraction over the passage of time. No code outside this
 * module should call `Date.now()` or `new Date()` directly — doing so makes
 * time-dependent logic impossible to test deterministically.
 */

/** A source of the current time. */
export interface Clock {
  /** Returns the current time as a `Date`. */
  now(): Date;
  /** Returns the current time as milliseconds since the Unix epoch. */
  timestamp(): number;
}

/** The production {@link Clock}, backed by the system clock. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }

  timestamp(): number {
    return Date.now();
  }
}

/**
 * A controllable {@link Clock} for tests, allowing time to be fixed or
 * advanced deterministically.
 *
 * @example
 * ```ts
 * const clock = new MockClock(new Date('2024-01-01T00:00:00.000Z'));
 * clock.advanceBy(60_000);
 * clock.now(); // 2024-01-01T00:01:00.000Z
 * ```
 */
export class MockClock implements Clock {
  private current: Date;

  constructor(initial: Date = new Date(0)) {
    this.current = initial;
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  timestamp(): number {
    return this.current.getTime();
  }

  /** Sets the clock to a specific point in time. */
  setTo(date: Date): void {
    this.current = date;
  }

  /** Moves the clock forward (or backward, given a negative value) by `milliseconds`. */
  advanceBy(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}
