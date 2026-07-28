/**
 * The {@link Customer} entity.
 */
import { Entity, Guard, ValidationError } from '../shared/index.js';

import type { CustomerId } from './identifiers.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The plain-object shape produced by {@link Customer.serialize}. */
export interface CustomerDTO {
  readonly id: string;
  readonly email: string;
  readonly name: string | undefined;
}

/** Parameters accepted by {@link Customer.create}. */
export interface CustomerCreateParams {
  readonly id: CustomerId;
  readonly email: string;
  readonly name?: string;
}

/**
 * The party a {@link Payment} is collected from. `Customer` is a
 * lightweight reference entity within the Payment Domain — it models only
 * the attributes payments actually need (a contact email and an optional
 * display name), not a full CRM profile.
 */
export class Customer extends Entity<CustomerId> {
  private _email: string;
  private _name: string | undefined;

  private constructor(id: CustomerId, email: string, name: string | undefined) {
    super(id);
    this._email = email;
    this._name = name;
  }

  /**
   * Creates a new {@link Customer}.
   *
   * @throws `ValidationError` if `params.email` is blank or not a
   * syntactically valid email address.
   */
  static create(params: CustomerCreateParams): Customer {
    assertValidEmail(params.email);
    return new Customer(params.id, params.email, params.name);
  }

  /** The customer's contact email address. */
  get email(): string {
    return this._email;
  }

  /** The customer's display name, if known. */
  get name(): string | undefined {
    return this._name;
  }

  /**
   * Updates the customer's contact email address.
   *
   * @throws `ValidationError` if `email` is blank or not a syntactically
   * valid email address.
   */
  updateEmail(email: string): void {
    assertValidEmail(email);
    this._email = email;
  }

  /** Updates the customer's display name. */
  rename(name: string | undefined): void {
    this._name = name;
  }

  /** Serializes to a plain, JSON-safe DTO suitable for persistence or API responses. */
  serialize(): CustomerDTO {
    return { id: this.id.value, email: this._email, name: this._name };
  }
}

function assertValidEmail(email: string): void {
  Guard.notBlank(email, 'email');
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError(`"${email}" is not a valid email address.`, { metadata: { email } });
  }
}
