/**
 * A generic Entity base class usable by any domain.
 */
import type { Identifier } from './identifier.js';

/**
 * Base class for entities: objects defined by a persistent identity (their
 * {@link Identifier}) rather than by the value of their attributes, which
 * may change over the entity's lifetime.
 *
 * @example
 * ```ts
 * type UserId = Identifier<'User'>;
 *
 * class User extends Entity<UserId> {
 *   private constructor(id: UserId, private displayName: string) {
 *     super(id);
 *   }
 *
 *   static create(id: UserId, displayName: string): User {
 *     return new User(id, displayName);
 *   }
 * }
 * ```
 */
export abstract class Entity<TId extends Identifier<unknown>> {
  protected constructor(protected readonly _id: TId) {}

  /** The entity's persistent identity. */
  get id(): TId {
    return this._id;
  }

  /** Identity equality: two entities are equal iff they are the same concrete type with equal identifiers. */
  equals(other: Entity<TId> | null | undefined): boolean {
    if (other == null) {
      return false;
    }
    if (this === other) {
      return true;
    }
    if (other.constructor !== this.constructor) {
      return false;
    }
    return this._id.equals(other._id);
  }
}
