type ResultHelpers<T, E> = {
	/**
	 * Returns whether this Result is an Ok.
	 */
	isOk: () => boolean,

	/**
	 * Returns whether this Result is an Err.
	 */
	isErr: () => boolean,

	/**
	 * Maps this Result's data if this is an Ok, otherwise does nothing and returns this Result.
	 *
	 * @param mapper A mapping function that will map this Result's data if this is Ok.
	 */
	map: <U>(mapper: (data: T) => U) => Result<U, E>,

	/**
	 * Maps this Result's error if this is an Err, otherwise does nothing and returns this Result.
	 *
	 * @param mapper A mapping function that will map this Result's error if this is Err.
	 */
	mapErr: <U>(mapper: (error: E) => U) => Result<T, U>,

	/**
	 * Maps this Result's data into a new Result if this is an Ok, otherwise does nothing and returns this Result.
	 * Useful for chaining multiple operations that may fail together without massive indentation.
	 *
	 * @param chainer A function that will map this Result's data into a new Result if this is Ok.
	 */
	andThen: <U>(chainer: (data: T) => Result<U, E>) => Result<U, E>,

	/**
	 * Maps this Result's error into a new Result if this is an Err, otherwise does nothing and returns this Result.
	 *
	 * @param chainer A function that will map this Result's error into a new Result if this is Err.
	 */
	orElse: <U>(chainer: (error: E) => Result<T, U>) => Result<T, U>,

	/**
	 * Returns this Result's data if this is Ok, OTHERWISE THROWS AN ERROR.
	 *
	 * NOTE: This is an escape hatch for imperative code; be sure to check that this is an Ok before calling this!
	 * It is recommended to make use of {@link Result#map}, {@link Result#andThen}, and {@link Result#inspect} instead.
	 */
	unwrap: () => T,

	/**
	 * Returns this Result's error if this is Err, OTHERWISE THROWS AN ERROR.
	 *
	 * NOTE: This is an escape hatch for imperative code; be sure to check that this is an Err before calling this!
	 * It is recommended to make use of {@link Result#mapErr}, {@link Result#orElse}, and {@link Result#inspectErr} instead.
	 */
	unwrapErr: () => E,

	/**
	 * Runs the given function if this is an Ok, otherwise does nothing and returns this Result.
	 *
	 * @param fn The function to be run.
	 */
	inspect: (fn: (data: T) => void) => Result<T, E>,

	/**
	 * Runs the given function if this is an Err, otherwise does nothing and returns this Result.
	 *
	 * @param fn The function to be run.
	 */
	inspectErr: (fn: (error: E) => void) => Result<T, E>,

	caseOf: <U>(cases: { Ok: (data: T) => U, Err: (error: E) => U }) => U
};

/**
 * Represents the result of an operation, containing either a successful value or an error that occurred. This can be
 * useful in situations where an Error might otherwise be used, such as parsing JSON. This is especially useful in
 * JavaScript, where Errors may be thrown at any level and aren't documented. Returning a Result, on the other hand,
 * is explicit in the code itself and is fully type-safe.
 */
export type Result<T, E> = ({ type: 'ok', data: T } | { type: 'err', error: E }) & ResultHelpers<T, E>;

/**
 * Returns whether the given {@link Result} is an Ok, and provides type narrowing. This may be preferable over
 * {@link Result#isOk}.
 *
 * @param result The Result to be checked.
 */
export const isOk = <T, E>(result: Result<T, E>): result is Result<T, E> & { type: 'ok', data: T } => {
	return result.type === 'ok';
};

/**
 * Returns whether the given {@link Result} is an Err, and provides type narrowing. This may be preferable over
 * {@link Result#isErr}.
 *
 * @param result The Result to be checked.
 */
export const isErr = <T, E>(result: Result<T, E>): result is Result<T, E> & { type: 'err', error: E } => {
	return result.type === 'err';
};

const createResult = <T, E>(obj: { type: 'ok', data: T } | { type: 'err', error: E }): Result<T, E> => ({
	...obj,
	isOk() {
		return isOk(this);
	},
	isErr() {
		return isErr(this);
	},
	map<U>(mapper: (data: T) => U) {
		return isOk(this) ? Ok(mapper(this.data)) : this as unknown as Result<U, E>;
	},
	mapErr<U>(mapper: (error: E) => U) {
		return isErr(this) ? Err(mapper(this.error)) : this as unknown as Result<T, U>;
	},
	andThen<U>(chainer: (data: T) => Result<U, E>) {
		return isOk(this) ? chainer(this.data) : this as unknown as Result<U, E>;
	},
	orElse<U>(chainer: (error: E) => Result<T, U>) {
		return isErr(this) ? chainer(this.error) : this as unknown as Result<T, U>;
	},
	unwrap() {
		if (isOk(this)) return this.data;

		throw new Error('Attempted to unwrap data of Err!');
	},
	unwrapErr() {
		if (isErr(this)) return this.error;

		throw new Error('Attempted to unwrap error of Ok!');
	},
	inspect(fn: (data: T) => void) {
		if (isOk(this)) {
			fn(this.data);
		}

		return this;
	},
	inspectErr(fn: (error: E) => void) {
		if (isErr(this)) {
			fn(this.error);
		}

		return this;
	},
	caseOf<U>(cases: { Ok: (data: T) => U, Err: (error: E) => U }): U {
		return isOk(this) ? cases.Ok(this.data) : cases.Err(this.error);
	}
});

/**
 * Creates an Ok, a successful {@link Result} that will contain the given data.
 *
 * @param data The data to be stored in this Ok.
 */
export const Ok = <T, E>(data: T) => createResult<T, E>({ type: 'ok', data });

/**
 * Creates an Err, an unsuccessful {@link Result} that will contain the given error.
 *
 * @param error The error to be stored in this Err.
 */
export const Err = <E, T>(error: E) => createResult<T, E>({ type: 'err', error });

/**
 * Represents a Promise that will be resolved into a Result. This can be applicable to situations such as networking,
 * where a fetch request may succeed or fail, but is wrapped behind a Promise.
 */
export type AsyncResult<T, E> = Promise<Result<T, E>>;

/**
 * Converts a Promise into an {@link AsyncResult}, altering control flow to the {@link Result}. This may be preferable
 * in situations such as async / await, where try / catch statements may be missed and potential errors could slip
 * through.
 *
 * @param promise The Promise to be converted into an AsyncResult.
 */
export const intoAsyncResult = <T, E>(promise: Promise<T>): Promise<Result<T, E>> => promise.then(data => Ok<T, E>(data)).catch(error => Err(error));