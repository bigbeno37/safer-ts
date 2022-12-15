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
	onConnectionOpened: (ws: SafeWebSocket<M>) => SafeWebSocketListeners<S>,
	createWebSocket?: (url: string) => WebSocket
};

const intoSafeWebSocket = <S extends ZodSchema, M>(config: Pick<SafeWebSocketConfig<S, M>, "schema" | "onConnectionOpened">, ws: WebSocket): SafeWebSocket<M> => {
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

	return safeWs;
};

export const createSafeWebSocket = <S extends ZodSchema, M>(config: SafeWebSocketConfig<S, M>): IO<AsyncResult<SafeWebSocket<M>, Event>> => {
	return io(() => {
		const ws = config.createWebSocket?.(config.url) ?? new WebSocket(config.url);

		return new Promise((resolve) => {
			ws.addEventListener('open', () => {
				const safeWs = intoSafeWebSocket(config, ws);

				resolve(Ok(safeWs));
			});

			ws.addEventListener('error', (e) => resolve(Err(e)))
		});
	});
};

export type SafeWebSocketServerListeners<S extends ZodSchema, M> = {
	onConnectionOpened: (ws: SafeWebSocket<M>) => SafeWebSocketListeners<S>
};

// TODO: It'd be pretty nifty if we could do some util stuff like keep track of all connected clients
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
					intoSafeWebSocket({ schema: config.schema, onConnectionOpened: listeners.onConnectionOpened }, ws as unknown as WebSocket);
				});

				resolve(Ok({}));
			})
		});
	});
};