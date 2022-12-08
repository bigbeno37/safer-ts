import { io, IO } from './monads/IO';

type SafeWindow = {
	setInterval: (fn: () => void, delay: number) => IO<{ clear: IO<void> }>,
	setTimeout: (fn: () => void, delay: number) => IO<{ clear: IO<void> }>
};

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