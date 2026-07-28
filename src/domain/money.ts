/**
 * The {@link Money} value object.
 */
import { Guard, ValidationError, ValueObject } from '../shared/index.js';

import type { Currency } from './currency.js';
import { CurrencyMismatchError } from './errors.js';

/** The plain-object shape produced by {@link Money.serialize}. */
export interface MoneyDTO {
  readonly amountMinorUnits: number;
  readonly currency: string;
}

interface MoneyProps {
  readonly amountMinorUnits: number;
  readonly currency: Currency;
}

/**
 * An amount of money in a specific {@link Currency}, stored as an integer
 * number of minor units (e.g. cents) so that arithmetic never accumulates
 * floating-point error the way `amount: number` in major units would.
 *
 * All arithmetic operations are currency-checked: combining two `Money`
 * values in different currencies throws {@link CurrencyMismatchError}
 * immediately, since mixing currencies is always a programming error, never
 * an expected business outcome.
 *
 * @example
 * ```ts
 * const usd = Currency.create('USD');
 * const price = Money.fromMajor(19.99, usd);
 * const tax = Money.fromMinor(160, usd); // $1.60
 * const total = price.add(tax); // $21.59, exactly — no float drift
 * ```
 */
export class Money extends ValueObject<MoneyProps> {
  /** Creates a {@link Money} directly from an integer amount of minor units. */
  static fromMinor(amountMinorUnits: number, currency: Currency): Money {
    return new Money({ amountMinorUnits, currency });
  }

  /**
   * Creates a {@link Money} from a decimal amount in the currency's major
   * unit (e.g. dollars, not cents), rounding to the nearest minor unit.
   *
   * @example
   * ```ts
   * Money.fromMajor(19.99, Currency.create('USD')); // 1999 minor units
   * ```
   */
  static fromMajor(amountMajor: number, currency: Currency): Money {
    if (!Number.isFinite(amountMajor)) {
      throw new ValidationError('amountMajor must be a finite number.', {
        metadata: { amountMajor },
      });
    }
    const factor = 10 ** currency.minorUnitExponent;
    return new Money({ amountMinorUnits: Math.round(amountMajor * factor), currency });
  }

  /** Creates a zero-value {@link Money} in the given currency. */
  static zero(currency: Currency): Money {
    return new Money({ amountMinorUnits: 0, currency });
  }

  protected override validate(props: MoneyProps): void {
    Guard.notNull(props.currency, 'currency');
    Guard.isInteger(props.amountMinorUnits, 'amountMinorUnits');
  }

  /** The integer amount in the currency's minor unit (e.g. cents). */
  get amountMinorUnits(): number {
    return this.props.amountMinorUnits;
  }

  /** The currency this amount is denominated in. */
  get currency(): Currency {
    return this.props.currency;
  }

  /** The amount expressed in the currency's major unit (e.g. dollars), as a decimal. */
  get amountMajor(): number {
    const factor = 10 ** this.props.currency.minorUnitExponent;
    return this.props.amountMinorUnits / factor;
  }

  /** Adds `other` to this amount. Throws {@link CurrencyMismatchError} if currencies differ. */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromMinor(this.amountMinorUnits + other.amountMinorUnits, this.currency);
  }

  /** Subtracts `other` from this amount. Throws {@link CurrencyMismatchError} if currencies differ. */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromMinor(this.amountMinorUnits - other.amountMinorUnits, this.currency);
  }

  /** Multiplies this amount by `factor`, rounding to the nearest minor unit. */
  multiply(factor: number): Money {
    if (!Number.isFinite(factor)) {
      throw new ValidationError('factor must be a finite number.', { metadata: { factor } });
    }
    return Money.fromMinor(Math.round(this.amountMinorUnits * factor), this.currency);
  }

  /** Returns `true` if this amount is strictly greater than `other`. Throws on currency mismatch. */
  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amountMinorUnits > other.amountMinorUnits;
  }

  /** Returns `true` if this amount is strictly less than `other`. Throws on currency mismatch. */
  lessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amountMinorUnits < other.amountMinorUnits;
  }

  /** Returns `true` if this amount is exactly zero. */
  isZero(): boolean {
    return this.amountMinorUnits === 0;
  }

  /** Returns `true` if this amount is strictly greater than zero. */
  isPositive(): boolean {
    return this.amountMinorUnits > 0;
  }

  /** Returns `true` if this amount is strictly less than zero. */
  isNegative(): boolean {
    return this.amountMinorUnits < 0;
  }

  private assertSameCurrency(other: Money): void {
    if (!this.currency.equals(other.currency)) {
      throw new CurrencyMismatchError(this.currency.code, other.currency.code);
    }
  }

  /**
   * Serializes to a plain, JSON-safe DTO suitable for persistence or API
   * responses.
   *
   * Note: this is distinct from the inherited `toJSON()`, which (per the
   * Shared Kernel's `ValueObject` contract) returns the frozen `props`
   * object rather than a bespoke shape — `override`ing it here with an
   * incompatible return type is not type-safe, so `serialize()` is the
   * supported way to get a flat, JSON-safe value.
   */
  serialize(): MoneyDTO {
    return { amountMinorUnits: this.amountMinorUnits, currency: this.currency.code };
  }
}
