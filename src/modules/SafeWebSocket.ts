import { io, IO, AsyncResult, Err, Ok } from '../monads';
import {ZodSchema, z} from 'zod';
import {ParseJSONError, parseJSONWithSchema} from './SafeJSON';
import { WebSocketServer } from 'ws';

export type SafeWebSocket<M> = {
	send: (data: M) => IO<void>,
	close: () => IO<void>
};

export type SafeWebSocketListeners<S extends ZodSchema> = {
	onClose: () => void,
	onMessage: (message: z.infer<S>) => void,
	onInvalidMessage: (error: ParseJSONError, rawMessage: string) => void
};

export type SafeWebSocketConfig<S extends ZodSchema, M> = {
	schema: S,
	url: string,
	onConnectionOpened: (ws: SafeWebSocket<M>) => SafeWebSocketListeners<S>
};

const bindSafeWebSocketListeners = <S extends ZodSchema, M>(config: Pick<SafeWebSocketConfig<S, M>, "schema" | "onConnectionOpened">, ws: WebSocket) => {
	const safeWs: SafeWebSocket<M> = {
		send: data => io(() => ws.send(JSON.stringify(data))),
		close: () => io(() => ws.close())
	};

	const listeners = config.onConnectionOpened(safeWs);

	ws.addEventListener('close', listeners.onClose);
	ws.addEventListener('message', ({data}) =>
		parseJSONWithSchema(config.schema)(data).caseOf({
			Ok: listeners.onMessage,
			Err: error => listeners.onInvalidMessage(error, data)
		})
	);
};

export const createSafeWebSocket = <S extends ZodSchema, M>(config: SafeWebSocketConfig<S, M>): IO<AsyncResult<{}, Event>> => {
	return io(() => {
		const ws = new WebSocket(config.url);

		return new Promise((resolve) => {
			ws.addEventListener('open', () => {
				bindSafeWebSocketListeners(config, ws);

				resolve(Ok({}));
			});

			ws.addEventListener('error', (e) => resolve(Err(e)))
		});
	});
};

export type SafeWebSocketServerListeners<S extends ZodSchema, M> = {
	onConnectionOpened: (ws: SafeWebSocket<M>) => SafeWebSocketListeners<S>
};

export type SafeWebSocketServerConfig<S extends ZodSchema, M> = {
	schema: S,
	port: number,
	onListening: () => SafeWebSocketServerListeners<S, M>
}

export const createSafeWebSocketServer = <S extends ZodSchema, M>(config: SafeWebSocketServerConfig<S, M>): IO<AsyncResult<{}, Error>> => {
	return io(() => {
		return new Promise(resolve => {
			const wss = new WebSocketServer({ port: config.port });

			wss.on('error', e => resolve(Err(e)));
			wss.on('listening', () => {
				const listeners = config.onListening();

				wss.on('connection', ws => {
					bindSafeWebSocketListeners({ schema: config.schema, onConnectionOpened: listeners.onConnectionOpened }, ws as unknown as WebSocket);
				});

				resolve(Ok({}));
			})
		});
	});
};