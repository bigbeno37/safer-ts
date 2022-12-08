import { intoOption } from './monads/Option';
import { IO, io } from './monads/IO';

export const querySelector = (selector: string) => intoOption(document.querySelector(selector));
export const querySelectorAll = (selector: string) => intoOption(document.querySelectorAll(selector));
export const addEventListenerToElement = (element: Element) => <K extends keyof ElementEventMap>(event: K, listener: (event: ElementEventMap[K]) => void): IO<{ removeEventListener: IO<void> }> => {
	return io(() => {
		element.addEventListener(event, listener);

		return {
			removeEventListener: io(() => element.removeEventListener(event, listener))
		}
	});
};