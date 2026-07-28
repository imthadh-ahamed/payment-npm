/**
 * Foundational, domain-agnostic TypeScript types shared across every layer
 * of the package.
 *
 * Nothing in this module may depend on any other module in the package —
 * it sits at the very bottom of the dependency graph.
 */

/**
 * A value that may be `null`.
 *
 * @example
 * ```ts
 * function findById(id: string): Nullable<string> {
 *   return id === 'known' ? 'found' : null;
 * }
 * ```
 */
export type Nullable<T> = T | null;

/**
 * A value that may be `undefined`.
 *
 * @example
 * ```ts
 * function firstOf<T>(items: readonly T[]): Optional<T> {
 *   return items[0];
 * }
 * ```
 */
export type Optional<T> = T | undefined;

/** The set of JavaScript primitive value types. */
export type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * A plain, string-keyed object map.
 *
 * @example
 * ```ts
 * const scores: Dictionary<number> = { alice: 10, bob: 7 };
 * ```
 */
export type Dictionary<TValue = unknown> = Record<string, TValue>;

/** A JSON-serializable primitive value. */
export type JsonPrimitive = string | number | boolean | null;

/** A JSON-serializable object, keyed by string. */
export interface JsonObject {
  readonly [key: string]: JsonValue;
}

/** A JSON-serializable array. */
export type JsonArray = readonly JsonValue[];

/** Any value that can be represented as JSON: a primitive, object, or array thereof. */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Recursively applies `readonly` to every property of `T`, including nested
 * objects and array elements. Functions are passed through unchanged.
 *
 * @example
 * ```ts
 * interface Point { coords: { x: number; y: number } }
 * type ReadonlyPoint = DeepReadonly<Point>;
 * // { readonly coords: { readonly x: number; readonly y: number } }
 * ```
 */
export type DeepReadonly<T> = T extends readonly (infer TItem)[]
  ? readonly DeepReadonly<TItem>[]
  : T extends (...args: never[]) => unknown
    ? T
    : T extends object
      ? { readonly [TKey in keyof T]: DeepReadonly<T[TKey]> }
      : T;

/**
 * An array that is statically guaranteed to contain at least one element.
 *
 * @example
 * ```ts
 * function first<T>(items: NonEmptyArray<T>): T {
 *   return items[0]; // Safe — no `undefined` possible.
 * }
 * ```
 */
export type NonEmptyArray<T> = readonly [T, ...T[]];

declare const BRAND: unique symbol;

/**
 * Produces a nominally-typed variant of `TBase` tagged with `TBrand`, so
 * that structurally identical types cannot be accidentally substituted for
 * one another at compile time.
 *
 * @example
 * ```ts
 * type UserId = Brand<string, 'UserId'>;
 * type ProductId = Brand<string, 'ProductId'>;
 *
 * const userId = 'abc' as UserId;
 * const productId: ProductId = userId; // Type error — brands differ.
 * ```
 */
export type Brand<TBase, TBrand extends string> = TBase & {
  readonly [BRAND]: TBrand;
};
