import { intoOption, Option, Some } from '../monads/Option';

type SafeMap<K, V> = {
	_map: Map<K, V>,
	get: (key: K) => Option<V>,
	has: (key: K) => boolean,
	set: (key: K, value: V) => SafeMap<K, V>,
	clear: () => SafeMap<K, V>,
	delete: (key: K) => SafeMap<K, V>,
	entries: () => IterableIterator<[K, V]>,
	keys: () => IterableIterator<K>,
	values: () => IterableIterator<V>,
	forEach: (fn: (value: V, key: K, map: Map<K, V>) => void) => SafeMap<K, V>
};

export const createSafeMap = <K, V>(existingMap?: Map<K, V>): SafeMap<K, V> => ({
	_map: existingMap ?? new Map<K, V>(),
	get(key) {
		return intoOption(this._map.get(key));
	},
	has(key) {
		return this._map.has(key);
	},
	set(key, value) {
		const clonedMap = new Map(this._map);
		clonedMap.set(key, value);

		return createSafeMap(clonedMap);
	},
	clear() {
		return createSafeMap();
	},
	delete(key) {
		const clonedMap = new Map(this._map);
		clonedMap.delete(key);

		return createSafeMap(clonedMap);
	},
	entries() {
		return this._map.entries();
	},
	keys() {
		return this._map.keys();
	},
	values() {
		return this._map.values();
	},
	forEach(fn) {
		this._map.forEach(fn);

		return this;
	}
});

export const createMutableSafeMap = <K, V>(existingMap?: Map<K, V>): SafeMap<K, V> => ({
	_map: existingMap ?? new Map<K, V>(),
	get(key) {
		return intoOption(this._map.get(key));
	},
	has(key) {
		return this._map.has(key);
	},
	set(key, value) {
		this._map.set(key, value);

		return this;
	},
	clear() {
		this._map.clear();

		return this;
	},
	delete(key) {
		this._map.delete(key);

		return this;
	},
	entries() {
		return this._map.entries();
	},
	keys() {
		return this._map.keys();
	},
	values() {
		return this._map.values();
	},
	forEach(fn) {
		this._map.forEach(fn);

		return this;
	}
});