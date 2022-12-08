/**
 * Represents a function that, when executed, will cause side effects. This could include things like networking,
 * filesystem access, etc.
 *
 * Generally, IOs should only be executed at the top level of a program; to make use of an IO outside of the top level,
 * use {@link IO#map} and {@link IO#andThen} to chain together instructions.
 */
export type IO<T> = {
	/**
	 * The function to be executed. NOTE: This is an internal reference, and should never be called outside of library
	 * code. Use {@link IO#UNSAFE_run} instead to execute this IO.
	 */
	_fn: () => T,

	/**
	 * Runs this IO, and returns the return value of the evaluated function. This should only be used at the top
	 * level of a program, as this may cause side effects to be emitted, e.g. networking, filesystem access, etc.
	 */
	UNSAFE_run: () => T,

	/**
	 * Maps the return value of this IO into something else, returning a new IO.
	 *
	 * @param mapper The mapping function to use.
	 */
	map: <U>(mapper: (data: T) => U) => IO<U>,

	/**
	 * Maps the return value of this IO into another IO, allowing for chaining of multiple IO events together, e.g.
	 *
	 * @example
	 * declare var getUserName: (id: string) => IO<string>;
	 * declare var saveToConfig: (contents: string) => IO<void>;
	 *
	 * getUser('1234')
	 *     .andThen(name => saveToConfig(name))
	 *     .UNSAFE_run();
	 *
	 * @param chainer The function that will be used to generate a new IO.
	 */
	andThen: <U>(chainer: (data: T) => IO<U>) => IO<U>
};

/**
 * Creates a new IO with the given fn.
 *
 * @param fn The function to be run that will produce a side effect.
 */
export const io = <T>(fn: () => T): IO<T> => ({
	_fn: fn,
	UNSAFE_run() {
		return this._fn();
	},
	map<U>(mapper: (data: T) => U) {
		return io(() => mapper(this.UNSAFE_run()));
	},
	andThen<U>(chainer: (data: T) => IO<U>) {
		return io(() => chainer(this.UNSAFE_run()).UNSAFE_run());
	}
});