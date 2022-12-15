import { intoOption, Option } from '../monads';

/**
 * Represents a {@link Map} with safer API, in addition to being immutable. Any mutation will generate new SafeMaps
 * rather than modifying the current SafeMap in place.
 *
 * This wraps Map and delegates operation to it beyond the higher level safer constructs.
 */
export type SafeMap<K, V> = {
	/**
	 * The internal {@link Map} that will be used to store / retrieve data from.
	 *
	 * THIS SHOULD NOT BE ACCESSED OUTSIDE OF LIBRARIES.
	 */
	_map: Map<K, V>,

	/**
	 * Returns the value at the given key, or None if no value is associated with the given key.
	 *
	 * @param key The key to retrieve the value from.
	 */
	get: (key: K) => Option<V>,

	/**
	 * Returns whether this SafeMap has a value associated with the given key.
	 *
	 * @param key The key to search with.
	 */
	has: (key: K) => boolean,

	/**
	 * Returns a new SafeMap with the same contents and the value assigned to the given key.
	 *
	 * NOTE: This does not alter the existing SafeMap!
	 *
	 * @param key The key to assign the value to.
	 * @param value The value to be assigned.
	 */
	set: (key: K, value: V) => SafeMap<K, V>,

	/**
	 * Returns a new SafeMap with all content cleared.
	 *
	 * NOTE: This does not alter the existing SafeMap!
	 */
	clear: () => SafeMap<K, V>,

	/**
	 * Returns a new SafeMap with identical contents but with the given key deleted.
	 *
	 * NOTE: This does not alter the existing SafeMap!
	 *
	 * @param key The key to remove from the SafeMap.
	 */
	delete: (key: K) => SafeMap<K, V>,

	/**
	 * Returns an iterator that can be used to iterate over all entries in this SafeMap. See {@link Map#entries}
	 * for further information.
	 */
	entries: () => IterableIterator<[K, V]>,

	/**
	 * Returns an iterator for all keys in this SafeMap. See {@link Map#keys} for further information.
	 */
	keys: () => IterableIterator<K>,

	/**
	 * Returns an iterator for all values in this SafeMap. See {@link Map#values} for further information.
	 */
	values: () => IterableIterator<V>,

	/**
	 * Calls the given function over every entry in this SafeMap. See {@link Map#forEach} for further information.
	 *
	 * @param fn
	 */
	forEach: (fn: (value: V, key: K, map: Map<K, V>) => void) => SafeMap<K, V>
};

/**
 * Creates a new {@link SafeMap}, optionally populating with the given map on creation.
 *
 * @param existingMap An existing map that should be used to populate this SafeMap.
 */
export const createSafeMap = <K, V>(existingMap?: Map<K, V>): SafeMap<K, V> => ({
	_map: new Map<K, V>(existingMap ?? []),
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