import { describe, expect, it } from 'vitest';

import { AggregateRoot } from '../../src/shared/aggregate-root.js';
import { DomainEvent, type DomainEventProps } from '../../src/shared/domain-event.js';
import { Identifier } from '../../src/shared/identifier.js';

type CartId = Identifier<'Cart'>;

class ItemAdded extends DomainEvent {
  constructor(
    props: DomainEventProps,
    readonly sku: string,
  ) {
    super(props);
  }

  override readonly eventName = 'ItemAdded';
}

class ShoppingCart extends AggregateRoot<CartId> {
  private items: string[] = [];

  public constructor(id: CartId) {
    super(id);
  }

  addItem(sku: string): void {
    this.items.push(sku);
    this.raiseEvent(
      new ItemAdded(
        { eventId: `evt-${sku}`, occurredAt: new Date(0), aggregateId: this.id.value },
        sku,
      ),
    );
  }

  get itemCount(): number {
    return this.items.length;
  }
}

describe('AggregateRoot', () => {
  it('starts with no recorded domain events', () => {
    const cart = new ShoppingCart(Identifier.create<'Cart'>('cart-1'));
    expect(cart.getDomainEvents()).toEqual([]);
  });

  it('records events raised via raiseEvent()', () => {
    const cart = new ShoppingCart(Identifier.create<'Cart'>('cart-1'));
    cart.addItem('sku-1');
    cart.addItem('sku-2');

    const events = cart.getDomainEvents();
    expect(events).toHaveLength(2);
    expect(events.map((event) => (event as ItemAdded).sku)).toEqual(['sku-1', 'sku-2']);
  });

  it('returns a defensive copy from getDomainEvents()', () => {
    const cart = new ShoppingCart(Identifier.create<'Cart'>('cart-1'));
    cart.addItem('sku-1');

    const events = cart.getDomainEvents() as ItemAdded[];
    events.push(
      new ItemAdded(
        { eventId: 'fake', occurredAt: new Date(0), aggregateId: 'cart-1' },
        'fake-sku',
      ),
    );

    expect(cart.getDomainEvents()).toHaveLength(1);
  });

  it('discards all recorded events on clearEvents()', () => {
    const cart = new ShoppingCart(Identifier.create<'Cart'>('cart-1'));
    cart.addItem('sku-1');
    cart.clearEvents();
    expect(cart.getDomainEvents()).toEqual([]);
  });

  it('inherits Entity identity semantics', () => {
    const id = Identifier.create<'Cart'>('cart-1');
    const a = new ShoppingCart(id);
    const b = new ShoppingCart(id);
    expect(a.equals(b)).toBe(true);
  });
});
