import { Err, Ok, Result } from './Result';

export type Option<T> = ({ type: 'some', data: T } | { type: 'none' })
	& {
		isSome: () => boolean,
		isNone: () => boolean,
		map: <U>(mapper: (data: T) => U) => Option<U>,
		andThen: <U>(chainer: (data: T) => Option<U>) => Option<U>,
		orElse: <U>(chainer: () => Option<U>) => Option<U>,
		unwrap: () => T,
		inspect: (fn: (data: T) => void) => Option<T>,
		okOr: <E>(error: E) => Result<T, E>
	};

const isSome = <T>(option: Option<T>): option is Option<T> & { type: 'some', data: T } => {
	return option.type === 'some';
};

const isNone = <T>(option: Option<T>): option is Option<T> & { type: 'none' } => {
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
	}
});

export const Some = <T>(data: T) => createOption({ type: 'some', data });
export const None = <T>() => createOption<T>({ type: 'none' });

export const intoOption = <T>(data: T | undefined | null): Option<T> => data === undefined || data === null ? None() : Some<T>(data);