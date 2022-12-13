import { io, IO } from './monads/IO';
import { AsyncResult, Err, Ok } from './monads/Result';
import { ZodSchema } from 'zod';
import { parseJSON } from './SafeJSON';

type CreateConnection<T extends { disconnect: () => IO<void> }, E> = (onDisconnect: () => void) => IO<AsyncResult<T, E>>;

type SafeWebSocket<S extends ZodSchema, M = string> = {
	listen: (listener: (message: ReturnType<typeof parseJSON>, rawMessage: string) => void) => void,
	send: (message: M) => IO<void>,
	disconnect: () => IO<void>
};

export const createSafeWebSocket = <S extends ZodSchema, M = string>(url: string, messageSchema: S): CreateConnection<SafeWebSocket<S, M>, Event> => onDisconnect => {
	return io(() => {
		const ws = new WebSocket(url);

		return new Promise((resolve, reject) => {
			ws.addEventListener('open', () => {
				ws.addEventListener('close', onDisconnect);

				const safeWebSocket: SafeWebSocket<S, M> = {
					listen: listener => ws.addEventListener('message', ({data}) => {
						listener(parseJSON(data, messageSchema), data);
					}),
					send: message => io(() => ws.send(JSON.stringify(message))),
					disconnect: () => io(() => ws.close())
				};

				resolve(Ok(safeWebSocket));
			});
			ws.addEventListener('error', (e) => reject(Err(e)))
		});
	});
};