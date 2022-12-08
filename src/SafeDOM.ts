import { intoOption } from './monads/Option';
import { IO, io } from './monads/IO';

/**
 * Attempts to retrieve an element from the DOM based on the given selector, returning an {@link Option} based on
 * whether this was successful.
 *
 * @param selector The element to be selected.
 */
export const querySelector = (selector: string) => intoOption(document.querySelector(selector));

/**
 * Attempts to retrieve a list of elements from the DOM based on the given selector, returning an {@link Option} based
 * on whether this was successful.
 *
 * @param selector The elements to be selected.
 */
export const querySelectorAll = (selector: string) => intoOption(document.querySelectorAll(selector));

/**
 * Adds an event listener to the given element, making use of an {@link IO} to allow multiple events to be tied together
 * under a single IO without actually executing those functions until required.
 *
 * @param element The element to add a listener to.
 */
export const addEventListenerToElement = (element: Element) => <K extends keyof ElementEventMap>(event: K, listener: (event: ElementEventMap[K]) => void): IO<{ removeEventListener: IO<void> }> => {
	return io(() => {
		element.addEventListener(event, listener);

		return {
			removeEventListener: io(() => element.removeEventListener(event, listener))
		}
	});
};