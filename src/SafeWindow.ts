import { io, IO } from './monads/IO';

/**
 * Represents safer versions of various common {@link Window} utilities, generally involving {@link IO}.
 */
type SafeWindow = {
	/**
	 * Returns an {@link IO} that will begin an interval with the given function and delay, which will then
	 * return an object to clear the interval, no longer requiring {@link Window#clearInterval}.
	 *
	 * @param fn The function to be called each unit of time.
	 * @param delay The interval the given function should run.
	 */
	setInterval: (fn: () => void, delay: number) => IO<{ clear: IO<void> }>,

	/**
	 * Returns an {@link IO} that will begin a Timeout with the given function and delay, further returning an object
	 * to clear the timeout, no longer requiring {@link Window#clearTimeout}.
	 *
	 * @param fn The function to be called after the delay.
	 * @param delay The delay to wait until the function is called.
	 */
	setTimeout: (fn: () => void, delay: number) => IO<{ clear: IO<void> }>
};

/**
 * Creates an instance of {@link SafeWindow}.
 */
export const getSafeWindow = (): SafeWindow => ({
	setInterval: (fn, delay) => io(() => {
		const id = setInterval(fn, delay);

		return {
			clear: io(() => clearInterval(id))
		};
	}),
	setTimeout: (fn, delay) => io(() => {
		const id = setTimeout(fn, delay);

		return {
			clear: io(() => clearTimeout(id))
		};
	})
});