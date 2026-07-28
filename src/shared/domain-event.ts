/**
 * A generic Domain Event abstraction usable by any domain.
 */
import type { Dictionary } from './types.js';

/**
 * Constructor props for a {@link DomainEvent}. `eventId` and `occurredAt`
 * are supplied by the caller (typically generated via an injected
 * {@link UuidGenerator} and {@link Clock}) rather than computed internally,
 * so `DomainEvent` itself has no hidden dependencies and stays trivially
 * testable.
 */
export interface DomainEventProps {
  /** A unique identifier for this specific occurrence of the event. */
  readonly eventId: string;
  /** When the event occurred. */
  readonly occurredAt: Date;
  /** The identifier of the aggregate that raised this event. */
  readonly aggregateId: string;
  /** Structured, JSON-serializable context about the event. */
  readonly metadata?: Readonly<Dictionary>;
}

/**
 * Base class for domain events: immutable records of something meaningful
 * that happened to an aggregate.
 *
 * @example
 * ```ts
 * class UserRegistered extends DomainEvent {
 *   readonly eventName = 'UserRegistered';
 *
 *   constructor(props: DomainEventProps, readonly email: string) {
 *     super(props);
 *   }
 * }
 * ```
 */
export abstract class DomainEvent {
  /** A unique identifier for this specific occurrence of the event. */
  readonly eventId: string;
  /** When the event occurred. */
  readonly occurredAt: Date;
  /** The identifier of the aggregate that raised this event. */
  readonly aggregateId: string;
  /** Structured, JSON-serializable context about the event. */
  readonly metadata: Readonly<Dictionary>;

  protected constructor(props: DomainEventProps) {
    this.eventId = props.eventId;
    this.occurredAt = props.occurredAt;
    this.aggregateId = props.aggregateId;
    this.metadata = props.metadata ?? {};
  }

  /** A stable, human-readable name identifying this event's type. */
  abstract get eventName(): string;
}
