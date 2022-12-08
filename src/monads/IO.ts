export type IO<T> = {
	_fn: () => T,
	UNSAFE_run: () => T,
	map: <U>(mapper: (data: T) => U) => IO<U>,
	andThen: <U>(chainer: (data: T) => IO<U>) => IO<U>
};

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