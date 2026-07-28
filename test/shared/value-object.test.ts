import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../src/shared/errors.js';
import { Guard } from '../../src/shared/guard.js';
import { ValueObject } from '../../src/shared/value-object.js';

interface CoordinatesProps {
  readonly latitude: number;
  readonly longitude: number;
}

class Coordinates extends ValueObject<CoordinatesProps> {
  static create(latitude: number, longitude: number): Coordinates {
    return new Coordinates({ latitude, longitude });
  }

  protected override validate(props: CoordinatesProps): void {
    Guard.isDefined(props.latitude, 'latitude');
    Guard.isDefined(props.longitude, 'longitude');
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get longitude(): number {
    return this.props.longitude;
  }
}

class Label extends ValueObject<{ text: string }> {
  static create(text: string): Label {
    return new Label({ text });
  }
}

describe('ValueObject', () => {
  it('exposes props via subclass accessors', () => {
    const point = Coordinates.create(12.9, 77.6);
    expect(point.latitude).toBe(12.9);
    expect(point.longitude).toBe(77.6);
  });

  it('freezes its underlying props', () => {
    const point = Coordinates.create(12.9, 77.6);
    expect(Object.isFrozen(point.toJSON())).toBe(true);
    // ES modules always run in strict mode, so writing to a frozen
    // property throws rather than silently failing.
    expect(() => {
      (point.toJSON() as { latitude: number }).latitude = 0;
    }).toThrow(TypeError);
    expect(point.latitude).toBe(12.9);
  });

  it('invokes the validate() hook during construction', () => {
    expect(() => Coordinates.create(undefined as unknown as number, 0)).toThrow(ValidationError);
  });

  it('does not throw when validate() is not overridden', () => {
    expect(() => Label.create('hello')).not.toThrow();
  });

  describe('equals', () => {
    it('returns true for two instances of the same subclass with equal props', () => {
      const a = Coordinates.create(1, 2);
      const b = Coordinates.create(1, 2);
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for instances with different props', () => {
      const a = Coordinates.create(1, 2);
      const b = Coordinates.create(3, 4);
      expect(a.equals(b)).toBe(false);
    });

    it('returns true for reference equality', () => {
      const a = Coordinates.create(1, 2);
      expect(a.equals(a)).toBe(true);
    });

    it('returns false when compared to null or undefined', () => {
      const a = Coordinates.create(1, 2);
      expect(a.equals(null)).toBe(false);
      // eslint-disable-next-line unicorn/no-useless-undefined -- argument is required
      expect(a.equals(undefined)).toBe(false);
    });

    it('returns false when compared to a different ValueObject subclass', () => {
      const a = Coordinates.create(1, 2);
      const b = Label.create('1');
      expect(a.equals(b as unknown as Coordinates)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('returns the underlying props', () => {
      const point = Coordinates.create(1, 2);
      expect(point.toJSON()).toEqual({ latitude: 1, longitude: 2 });
    });
  });
});
