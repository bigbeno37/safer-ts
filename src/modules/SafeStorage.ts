import { z, ZodSchema } from 'zod';
import {ParseJSONError, parseJSONWithSchema} from './SafeJSON';
import { intoOption, io, IO, Option, Result } from '../monads';

/**
 * Represents a safer version of the traditional {@link Storage} API. This integrates with {@link Option} and {@link IO}
 * to provide a more elegant developer experience.
 */
export type SafeStorage<T extends Record<string, ZodSchema>> = {
	/**
	 * Attempts to retrieve the item at the given key. If the item exists, it will then be attempted to be parsed,
	 * resulting in a {@link Result}.
	 *
	 * @param key The key to retrieve.
	 */
	getItem: <K extends keyof T>(key: K) => Option<Result<z.infer<T[K]>, ParseJSONError>>,

	/**
	 * Returns whether an item at the key exists.
	 *
	 * @param key The key to be checked.
	 */
	hasItem: <K extends keyof T>(key: K) => boolean,

	/**
	 * Assigns an item to the given key, automatically serialising the value via JSON.stringify.
	 *
	 * @param key The key to assign to.
	 * @param value The value to be assigned.
	 */
	setItem: <K extends keyof T>(key: K, value: z.infer<T[K]>) => IO<SafeStorage<T>>,

	/**
	 * Removes an item entirely from this Storage at the given key.
	 *
	 * @param key The key to remove.
	 */
	removeItem: <K extends keyof T>(key: K) => IO<SafeStorage<T>>,

	/**
	 * Clears this Storage.
	 */
	clear: () => IO<SafeStorage<T>>
};

/**
 * Returns a {@link SafeStorage} based on the given Storage source and Schema. This generally should not be used;
 * see {@link getSafeLocalStorage} and {@link getSafeSessionStorage}.
 *
 * @param storage The Storage source (generally {@link sessionStorage} or {@link localStorage})
 */
export const getSafeStorage = (storage: Storage) => <S extends Record<string, ZodSchema>>(schema: S): SafeStorage<S> => ({
	getItem: <K extends keyof S>(key: K) => intoOption(storage.getItem(key as string))
		.map(value => parseJSONWithSchema(schema[key])(value)),
	hasItem(key) {
		return this.getItem(key).isSome();
	},
	setItem<K extends keyof S>(key: K, value: z.infer<S[K]>) {
		return io(() => {
			storage.setItem(key as string, JSON.stringify(value));
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
			storage.clear();z
			return this;
		});
	}
});

/**
 * Returns a {@link SafeStorage} based on {@link localStorage} and the given schema.
 */
export const getSafeLocalStorage = () => getSafeStorage(localStorage);

/**
 * Returns a {@link SafeStorage} based on {@link sessionStorage} and the given schema.
 */
export const getSafeSessionStorage = () => getSafeStorage(sessionStorage);