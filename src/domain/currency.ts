/**
 * The {@link Currency} value object.
 */
import { Guard, ValidationError, ValueObject } from '../shared/index.js';

/**
 * ISO 4217 currencies with zero decimal places (their smallest unit *is*
 * the major unit — there is no "cents" equivalent).
 */
const ZERO_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

/** ISO 4217 currencies with three decimal places instead of the usual two. */
const THREE_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set([
  'BHD',
  'IQD',
  'JOD',
  'KWD',
  'LYD',
  'OMR',
  'TND',
]);

const ISO_4217_ALPHABETIC_CODE_PATTERN = /^[A-Z]{3}$/;

interface CurrencyProps {
  readonly code: string;
}

/**
 * An ISO 4217 currency, identified by its three-letter alphabetic code
 * (e.g. `"USD"`, `"INR"`, `"JPY"`).
 *
 * Knows its own {@link Currency.minorUnitExponent} — the number of decimal
 * places between its major unit and minor unit — so that {@link Money} can
 * convert between them without hardcoding currency-specific assumptions.
 *
 * @example
 * ```ts
 * const usd = Currency.create('USD');
 * usd.minorUnitExponent; // 2 (100 cents = $1)
 *
 * const jpy = Currency.create('JPY');
 * jpy.minorUnitExponent; // 0 (JPY has no minor unit)
 * ```
 */
export class Currency extends ValueObject<CurrencyProps> {
  /** Creates a {@link Currency} from a three-letter ISO 4217 alphabetic code (case-insensitive). */
  static create(code: string): Currency {
    Guard.notBlank(code, 'currency code');
    return new Currency({ code: code.toUpperCase() });
  }

  protected override validate(props: CurrencyProps): void {
    if (!ISO_4217_ALPHABETIC_CODE_PATTERN.test(props.code)) {
      throw new ValidationError(`"${props.code}" is not a valid ISO 4217 currency code.`, {
        metadata: { code: props.code },
      });
    }
  }

  /** The three-letter ISO 4217 alphabetic code (e.g. `"USD"`). */
  get code(): string {
    return this.props.code;
  }

  /**
   * The number of decimal places between this currency's major unit and its
   * minor unit (e.g. `2` for USD, `0` for JPY, `3` for KWD). Defaults to `2`
   * for any ISO 4217 code not in the zero- or three-decimal exception lists.
   */
  get minorUnitExponent(): number {
    if (ZERO_DECIMAL_CURRENCIES.has(this.props.code)) {
      return 0;
    }
    if (THREE_DECIMAL_CURRENCIES.has(this.props.code)) {
      return 3;
    }
    return 2;
  }

  /**
   * Serializes to the underlying ISO 4217 code string.
   *
   * Note: this is distinct from the inherited `toJSON()`, which (per the
   * Shared Kernel's `ValueObject` contract) returns the frozen `props`
   * object rather than a bespoke shape — `override`ing it here with an
   * incompatible return type is not type-safe, so `serialize()` is the
   * supported way to get a flat, JSON-safe value.
   */
  serialize(): string {
    return this.props.code;
  }
}
