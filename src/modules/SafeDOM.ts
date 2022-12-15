import { intoOption } from '../monads';
import { Listener } from '../types';

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
 * Adds an event listener to the given element, returning an object to allow removing the event listener.
 *
 * @param element The element to add a listener to.
 */
export const addEventListenerToElement = (element: Element) => <K extends keyof ElementEventMap>(event: K, listener: (event: ElementEventMap[K]) => void): Listener => {
	element.addEventListener(event, listener);

	return {
		removeListener: () => element.removeEventListener(event, listener)
	}
};