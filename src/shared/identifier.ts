/**
 * A generic, type-safe identifier abstraction usable by any entity in any
 * domain.
 */
import { Guard } from './guard.js';
import type { UuidGenerator } from './uuid.js';

/**
 * An immutable, comparable, serializable identifier value, nominally typed
 * by the kind of thing it identifies via the `T` phantom type parameter.
 *
 * @example
 * ```ts
 * type UserId = Identifier<'User'>;
 * type ProductId = Identifier<'Product'>;
 *
 * const userId = Identifier.generate<'User'>(uuidGenerator);
 * const productId = Identifier.create<'Product'>('11111111-1111-4111-8111-111111111111');
 *
 * userId.equals(productId); // Type error — `T` differs.
 * ```
 */
export class Identifier<T> {
  // Phantom marker, never assigned — keeps `Identifier<A>` and
  // `Identifier<B>` structurally distinct for a given TypeScript checker.
  declare private readonly _brand: T;
  private readonly _value: string;

  protected constructor(value: string) {
    this._value = value;
  }

  /** Wraps an existing, non-blank string value as an `Identifier<T>`. */
  static create<T>(value: string): Identifier<T> {
    Guard.notBlank(value, 'Identifier value');
    return new Identifier<T>(value);
  }

  /** Generates a new `Identifier<T>` using the given {@link UuidGenerator}. */
  static generate<T>(uuidGenerator: UuidGenerator): Identifier<T> {
    return new Identifier<T>(uuidGenerator.generate());
  }

  /** The underlying string value. */
  get value(): string {
    return this._value;
  }

  /** Compares two identifiers by value. */
  equals(other: Identifier<T> | null | undefined): boolean {
    if (other == null) {
      return false;
    }
    if (!(other instanceof Identifier)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  /** Serializes to the underlying string value. */
  toJSON(): string {
    return this._value;
  }
}
