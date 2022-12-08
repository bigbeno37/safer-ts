import { intoOption, Option } from './monads/Option';
import { z, ZodError, ZodSchema } from 'zod';
import { Err, Ok, Result } from './monads/Result';
import { io, IO } from './monads/IO';

export type SafeStorage<T extends Record<string, ZodSchema>> = {
	getItem: <K extends keyof T>(key: K) => Option<Result<z.infer<T[K]>, ZodError>>,
	hasItem: <K extends keyof T>(key: K) => boolean,
	setItem: <K extends keyof T>(key: K, value: z.infer<T[K]>) => IO<SafeStorage<T>>,
	removeItem: <K extends keyof T>(key: K) => IO<SafeStorage<T>>,
	clear: () => IO<SafeStorage<T>>
};

const getSafeStorage = (storage: Storage) => <S extends Record<string, ZodSchema>>(schema: S): SafeStorage<S> => ({
	getItem: <K extends keyof S>(key: K) => intoOption(storage.getItem(key as string)).map(value => {
		const result = schema[key]!.safeParse(value);

		if (result.success) {
			return Ok(result.data);
		}

		return Err(result.error);
	}),
	hasItem(key) {
		return this.getItem(key).isSome();
	},
	setItem<K extends keyof S>(key: K, value: z.infer<S[K]>) {
		return io(() => {
			storage.setItem(key as string, value);
			return this;
		});
	},
	removeItem<K extends keyof S>(key: K) {
		return io(() => {
			storage.removeItem(key as string);
			return this;
		});
	},
	clear() {
		return io(() => {
			storage.clear();
			return this;
		});
	}
});

export const getSafeLocalStorage = getSafeStorage(localStorage);
export const getSafeSessionStorage = getSafeStorage(sessionStorage);