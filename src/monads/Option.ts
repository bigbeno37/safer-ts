import { Err, Ok, Result } from './Result';
import type { SafeMap } from '../datastructures';

type OptionHelpers<T> = {
	/**
	 * Returns whether this Option is a Some, containing an inner value.
	 */
	isSome: () => boolean,

	/**
	 * Returns whether this Option is a None, containing no value.
	 */
	isNone: () => boolean,

	/**
	 * Maps this Option's inner value if it is a Some, otherwise returning this Option, allowing for chaining.
	 *
	 * @param mapper The mapper to be called if this is a Some.
	 */
	map: <U>(mapper: (data: T) => U) => Option<U>,

	/**
	 * Maps this Option's inner value into a new Option if it is a Some, allowing for multiple Options to be
	 * chained together without massive indenting.
	 *
	 * @param chainer The function that will be called to map this Option's data if it is a Some.
	 */
	andThen: <U>(chainer: (data: T) => Option<U>) => Option<U>,

	/**
	 * Maps this Option into a new Option if this is None, otherwise returning this Option.
	 *
	 * @param chainer The function that will be called to map into a new Option if this is a None.
	 */
	orElse: <U>(chainer: () => Option<U>) => Option<U>,

	/**
	 * Unwraps this Option's inner value if it is a Some, OTHERWISE THROWS AN ERROR!
	 *
	 * NOTE: This is an escape hatch for imperative code; be sure to check that this is a Some before calling this!
	 * It is recommended to make use of {@link Option#map}, {@link Option#andThen}, and {@link Option#inspect} instead.
	 */
	unwrap: () => T,

	/**
	 * Calls the given function with this Option's data if this is a Some, otherwise does nothing and returns this Option.
	 *
	 * @param fn The function that will be called if this is a Some.
	 */
	inspect: (fn: (data: T) => void) => Option<T>,

	/**
	 * Converts this Option into a {@link Result}. If this is a Some, this will be converted into an Ok, whereas
	 * if this is a None, this will be converted into an Err of the given error.
	 *
	 * @param error The error to be used if this is a None during conversion into a Result.
	 */
	okOr: <E>(error: E) => Result<T, E>,

	/**
	 * Calls either Some or None based on whether this Option is a Some or a None.
	 *
	 * @param matcher An object containing what to be returned based on the type of this Option.
	 */
	match: <U>(matcher: { Some: (data: T) => U, None: () => U }) => U,

	caseOf: <U>(cases: { Some: (data: T) => U, None: () => U }) => U
};

/**
 * Represents an optional value, effectively null on steroids. This can be used to represent the absence of a value,
 * such as retrieving a value based on a key in a {@link SafeMap}, while preventing null pointer exceptions outright.
 */
export type Option<T> = ({ type: 'some', data: T } | { type: 'none' }) & OptionHelpers<T>;

/**
 * Returns whether the given {@link Option} is a Some, and provides type narrowing, which may be preferable over
 * {@link Option#isSome}.
 *
 * @param option The option to be checked.
 */
export const isSome = <T>(option: Option<T>): option is Option<T> & { type: 'some', data: T } => {
	return option.type === 'some';
};

/**
 * Returns whether the given {@link Option} is a None, and provides type narrowing, which may be preferable over
 * {@link Option#isNone}.
 *
 * @param option The option to be checked.
 */
export const isNone = <T>(option: Option<T>): option is Option<T> & { type: 'none' } => {
	return option.type === 'none';
};

const createOption = <T>(obj: { type: 'some', data: T } | { type: 'none' }): Option<T> => ({
	...obj,
	isSome() {
		return isSome(this);
	},
	isNone() {
		return isNone(this);
	},
	map<U>(mapper: (data: T) => U) {
		return isSome(this) ? Some(mapper(this.data)) : this as unknown as Option<U>;
	},
	andThen<U>(chainer: (data: T) => Option<U>) {
		return isSome(this) ? chainer(this.data) : this as unknown as Option<U>;
	},
	orElse<U>(chainer: () => Option<U>) {
		return isNone(this) ? chainer() : this as unknown as Option<U>;
	},
	unwrap() {
		if (isSome(this)) {
			return this.data;
		}

		throw new Error('Attempted to unwrap data from None!');
	},
	inspect(fn: (data: T) => void) {
		if (isSome(this)) {
			fn(this.data);
		}

		return this;
	},
	okOr<E>(error: E) {
		return isSome(this) ? Ok<T, E>(this.data) : Err(error);
	},
	match<U>(matcher: { Some: (data: T) => U, None: () => U }) {
		return isSome(this) ? matcher.Some(this.data) : matcher.None();
	},
	caseOf<U>(cases: { Some: (data: T) => U, None: () => U }): U {
		return isSome(this) ? cases.Some(this.data) : cases.None();
	}
});

/**
 * Creates a new Some, an {@link Option} containing a value.
 *
 * @param data The data to be embedded within the Option.
 */
export const Some = <T>(data: T) => createOption({ type: 'some', data });

/**
 * Creates a new None, an {@link Option} without an inner value.
 */
export const None = <T>() => createOption<T>({ type: 'none' });

/**
 * Wraps the given data into an {@link Option}; Specifically, a Some if it is non-nullish, None otherwise.
 *
 * @param data The data to be wrapped in an Option
 */
export const intoOption = <T>(data: T | undefined | null): Option<T> => data === undefined || data === null ? None() : Some<T>(data);