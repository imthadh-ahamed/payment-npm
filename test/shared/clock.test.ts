import { describe, expect, it, vi } from 'vitest';

import { MockClock, SystemClock } from '../../src/shared/clock.js';

describe('SystemClock', () => {
  it('now() returns a Date close to the real current time', () => {
    const clock = new SystemClock();
    const before = Date.now();
    const now = clock.now();
    const after = Date.now();
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(after);
  });

  it('timestamp() delegates to Date.now()', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-01T00:00:00.000Z'));
    const clock = new SystemClock();
    expect(clock.timestamp()).toBe(new Date('2024-06-01T00:00:00.000Z').getTime());
    vi.useRealTimers();
  });
});

describe('MockClock', () => {
  it('defaults to the Unix epoch when constructed without an argument', () => {
    const clock = new MockClock();
    expect(clock.timestamp()).toBe(0);
  });

  it('starts at the provided initial time', () => {
    const initial = new Date('2024-01-01T00:00:00.000Z');
    const clock = new MockClock(initial);
    expect(clock.now()).toEqual(initial);
  });

  it('now() returns a new Date instance, not the internal reference', () => {
    const initial = new Date('2024-01-01T00:00:00.000Z');
    const clock = new MockClock(initial);
    const first = clock.now();
    first.setFullYear(2000);
    expect(clock.now().getFullYear()).toBe(2024);
  });

  it('setTo() moves the clock to an arbitrary point in time', () => {
    const clock = new MockClock();
    const target = new Date('2030-05-05T05:05:05.000Z');
    clock.setTo(target);
    expect(clock.now()).toEqual(target);
  });

  it('advanceBy() moves the clock forward by the given milliseconds', () => {
    const clock = new MockClock(new Date('2024-01-01T00:00:00.000Z'));
    clock.advanceBy(60_000);
    expect(clock.now()).toEqual(new Date('2024-01-01T00:01:00.000Z'));
  });

  it('advanceBy() accepts negative values to move backward', () => {
    const clock = new MockClock(new Date('2024-01-01T00:01:00.000Z'));
    clock.advanceBy(-60_000);
    expect(clock.now()).toEqual(new Date('2024-01-01T00:00:00.000Z'));
  });
});
