export type Result<T, E> = ({ type: 'ok', data: T } | { type: 'err', error: E })
	& {
		isOk: () => boolean,
		isErr: () => boolean,
		map: <U>(mapper: (data: T) => U) => Result<U, E>,
		mapErr: <U>(mapper: (error: E) => U) => Result<T, U>,
		andThen: <U>(chainer: (data: T) => Result<U, E>) => Result<U, E>,
		orElse: <U>(chainer: (error: E) => Result<T, U>) => Result<T, U>,
		unwrap: () => T,
		unwrapErr: () => E,
		inspect: (fn: (data: T) => void) => Result<T, E>,
		inspectErr: (fn: (error: E) => void) => Result<T, E>
	};

export const isOk = <T, E>(result: Result<T, E>): result is Result<T, E> & { type: 'ok', data: T } => {
	return result.type === 'ok';
};

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
	}
});

export const Ok = <T, E>(data: T) => createResult<T, E>({ type: 'ok', data });
export const Err = <E, T>(error: E) => createResult<T, E>({ type: 'err', error });

export const intoAsyncResult = <T, E>(promise: Promise<T>): Promise<Result<T, E>> => promise.then(data => Ok<T, E>(data)).catch(error => Err(error));