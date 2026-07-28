import { describe, expect, it } from 'vitest';

import { DomainEvent, type DomainEventProps } from '../../src/shared/domain-event.js';

class WidgetCreated extends DomainEvent {
  readonly widgetName: string;

  constructor(props: DomainEventProps, widgetName: string) {
    super(props);
    this.widgetName = widgetName;
  }

  override readonly eventName = 'WidgetCreated';
}

describe('DomainEvent', () => {
  const baseProps: DomainEventProps = {
    eventId: 'event-1',
    occurredAt: new Date('2024-01-01T00:00:00.000Z'),
    aggregateId: 'widget-1',
  };

  it('exposes eventId, occurredAt, and aggregateId from props', () => {
    const event = new WidgetCreated(baseProps, 'Sprocket');
    expect(event.eventId).toBe('event-1');
    expect(event.occurredAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(event.aggregateId).toBe('widget-1');
  });

  it('exposes the subclass-defined eventName', () => {
    const event = new WidgetCreated(baseProps, 'Sprocket');
    expect(event.eventName).toBe('WidgetCreated');
  });

  it('defaults metadata to an empty object when omitted', () => {
    const event = new WidgetCreated(baseProps, 'Sprocket');
    expect(event.metadata).toEqual({});
  });

  it('stores provided metadata', () => {
    const event = new WidgetCreated({ ...baseProps, metadata: { source: 'test' } }, 'Sprocket');
    expect(event.metadata).toEqual({ source: 'test' });
  });

  it('carries subclass-specific fields', () => {
    const event = new WidgetCreated(baseProps, 'Sprocket');
    expect(event.widgetName).toBe('Sprocket');
  });
});
