/**
 * A generic, immutable Value Object base class usable by any domain.
 */
import { deepFreeze, objectEquals } from './utils.js';

/**
 * Base class for immutable value objects: objects defined entirely by the
 * value of their properties, with no conceptual identity of their own.
 *
 * Subclasses should expose intention-revealing accessors over `props`
 * rather than exposing `props` directly, and may override
 * {@link ValueObject.validate} to reject invalid construction.
 *
 * @example
 * ```ts
 * interface CoordinatesProps {
 *   readonly latitude: number;
 *   readonly longitude: number;
 * }
 *
 * class Coordinates extends ValueObject<CoordinatesProps> {
 *   static create(latitude: number, longitude: number): Coordinates {
 *     return new Coordinates({ latitude, longitude });
 *   }
 *
 *   protected override validate(props: CoordinatesProps): void {
 *     Guard.isDefined(props.latitude, 'latitude');
 *     Guard.isDefined(props.longitude, 'longitude');
 *   }
 *
 *   get latitude(): number {
 *     return this.props.latitude;
 *   }
 * }
 * ```
 */
export abstract class ValueObject<TProps extends object> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.validate(props);
    this.props = deepFreeze({ ...props });
  }

  /**
   * Validation hook, invoked once during construction with the raw
   * (not-yet-frozen) props. Override to throw when `props` are invalid.
   * No-op by default.
   */
  protected validate(_props: TProps): void {
    // Intentionally empty — override in subclasses that need validation.
  }

  /** Structural equality: two value objects are equal iff they are the same concrete type with equal props. */
  equals(other: ValueObject<TProps> | null | undefined): boolean {
    if (other == null) {
      return false;
    }
    if (this === other) {
      return true;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    return objectEquals(this.props, other.props);
  }

  /** Serializes this value object to its underlying plain properties. */
  toJSON(): Readonly<TProps> {
    return this.props;
  }
}
