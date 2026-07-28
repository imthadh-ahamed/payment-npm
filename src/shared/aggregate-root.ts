/**
 * A generic Aggregate Root base class usable by any domain.
 */
import type { DomainEvent } from './domain-event.js';
import { Entity } from './entity.js';
import type { Identifier } from './identifier.js';

/**
 * Base class for aggregate roots: the single entry point of an aggregate,
 * responsible for enforcing its invariants and recording the domain events
 * that result from state changes.
 *
 * @example
 * ```ts
 * class ShoppingCart extends AggregateRoot<CartId> {
 *   addItem(item: CartItem): void {
 *     // ...mutate state...
 *     this.raiseEvent(new ItemAddedToCart({ ... }));
 *   }
 * }
 *
 * const cart = ShoppingCart.create(...);
 * cart.addItem(item);
 * const events = cart.getDomainEvents();
 * cart.clearEvents();
 * ```
 */
export abstract class AggregateRoot<TId extends Identifier<unknown>> extends Entity<TId> {
  private events: DomainEvent[] = [];

  /** Records a domain event raised by this aggregate. */
  protected raiseEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  /** Returns a snapshot of the domain events recorded so far. */
  getDomainEvents(): readonly DomainEvent[] {
    return [...this.events];
  }

  /** Discards all recorded domain events, typically after they have been dispatched. */
  clearEvents(): void {
    this.events = [];
  }
}
