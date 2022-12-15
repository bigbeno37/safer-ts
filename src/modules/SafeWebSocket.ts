import { io, IO, AsyncResult, Err, Ok } from '../monads';
import { Schema, ZodSchema } from 'zod';
import { parseJSON } from './SafeJSON';
import { WebSocketServer } from 'ws';
import { Listener } from '../types';

export type CreateConnection<T extends { disconnect: () => IO<void> }, E> = (onDisconnect: () => void) => IO<AsyncResult<T, E>>;

export type SafeWebSocket<S extends ZodSchema, M = string> = {
	_ws: WebSocket,
	listen: (listener: (message: ReturnType<typeof parseJSON<S>>, rawMessage: string) => void) => void,
	send: (message: M) => IO<void>,
	disconnect: () => IO<void>
};

export const createSafeWebSocket = <S extends ZodSchema, M = string>(url: string, messageSchema: S): CreateConnection<SafeWebSocket<S, M>, Event> => onDisconnect => {
	return io(() => {
		const ws = new WebSocket(url);

		return new Promise((resolve) => {
			ws.addEventListener('open', () => {
				ws.addEventListener('close', onDisconnect);

				const safeWebSocket: SafeWebSocket<S, M> = {
					_ws: ws,
					listen: listener => ws.addEventListener('message', ({data}) => {
						listener(parseJSON(data, messageSchema), data);
					}),
					send: message => io(() => ws.send(JSON.stringify(message))),
					disconnect: () => io(() => ws.close())
				};

				resolve(Ok(safeWebSocket));
			});
			ws.addEventListener('error', (e) => resolve(Err(e)))
		});
	});
};

export type SafeWebSocketServer<S extends Schema, M> = {
	_server: WebSocketServer,
	onConnection: (onDisconnect: () => void) => (listener: (connection: SafeWebSocket<S, M>) => void) => Listener,
}

export const createSafeWebSocketServer = <S extends ZodSchema, M>(schema: S, config: { port: number }): IO<AsyncResult<SafeWebSocketServer<S, M>, Error>> => {
	return io(() => {
		return new Promise((resolve) => {
			const wss = new WebSocketServer({ port: config.port });

			wss.on('error', e => resolve(Err(e)));
			wss.on('listening', () => {
				const safeServer = Ok<SafeWebSocketServer<S, M>, Error>({
					_server: wss,
					onConnection: onDisconnect => listener => {
						const connectionListener = (ws: WebSocket) => {
							ws.addEventListener('close', onDisconnect);

							const safeWebSocket: SafeWebSocket<S, M> = {
								_ws: ws,
								listen: listener => ws.addEventListener('message', ({data}) => {
									listener(parseJSON(data, schema), data);
								}),
								send: message => io(() => ws.send(JSON.stringify(message))),
								disconnect: () => io(() => ws.close())
							};

							listener(safeWebSocket);
						};

						wss.on('connection', connectionListener);

						return {
							removeListener: () => wss.off('connection', connectionListener)
						}
					}
				});

				resolve(safeServer);
			})
		});
	});
};