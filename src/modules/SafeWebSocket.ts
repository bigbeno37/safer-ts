import { io, IO, AsyncResult, Err, Ok } from '../monads';
import {ZodSchema, z} from 'zod';
import {ParseJSONError, parseJSONWithSchema} from './SafeJSON';
import { WebSocketServer } from 'ws';

export type SafeWebSocketConfig = {
	url: string
};

export type SafeWebSocket<M> = {
	send: (data: M) => IO<void>,
	close: () => IO<void>
};

export type SafeWebSocketConnectionHandler<S extends ZodSchema> = {
	onClose: () => void,
	onMessage: (message: z.infer<S>) => void,
	onInvalidMessage: (error: ParseJSONError, rawMessage: string) => void
};

const bindSafeWebSocketListeners = <S extends ZodSchema, M>(schema: S, ws: WebSocket) => (createListeners: (ws: SafeWebSocket<M>) => SafeWebSocketConnectionHandler<S>) => {
	const safeWs: SafeWebSocket<M> = {
		send: data => io(() => ws.send(JSON.stringify(data))),
		close: () => io(() => ws.close())
	};

	const listeners = createListeners(safeWs);

	ws.addEventListener('close', listeners.onClose);
	ws.addEventListener('message', ({data}) =>
		parseJSONWithSchema(schema)(data).caseOf({
			Ok: listeners.onMessage,
			Err: error => listeners.onInvalidMessage(error, data)
		})
	);
};

export const createSafeWebSocket = <S extends ZodSchema, M>(schema: S, config: SafeWebSocketConfig) => (createListeners: (ws: SafeWebSocket<M>) => SafeWebSocketConnectionHandler<S>): IO<AsyncResult<{}, Event>> => {
	return io(() => {
		const ws = new WebSocket(config.url);

		return new Promise((resolve) => {
			ws.addEventListener('open', () => {
				bindSafeWebSocketListeners(schema, ws)(createListeners);

				resolve(Ok({}));
			});

			ws.addEventListener('error', (e) => resolve(Err(e)))
		});
	});
};

export type SafeWebSocketServerListeners<S extends ZodSchema, M> = {
	onConnection: (ws: SafeWebSocket<M>) => SafeWebSocketConnectionHandler<S>
};

export const createSafeWebSocketServer = <S extends ZodSchema, M>(schema: S, config: {port: number}) => (createListeners: () => SafeWebSocketServerListeners<S, M>): IO<AsyncResult<{}, Error>> => {
	return io(() => {
		return new Promise(resolve => {
			const wss = new WebSocketServer({ port: config.port });

			wss.on('error', e => resolve(Err(e)));
			wss.on('listening', () => {
				const listeners = createListeners();

				wss.on('connection', ws => {
					bindSafeWebSocketListeners(schema, ws as unknown as WebSocket)(listeners.onConnection);
				});

				resolve(Ok({}));
			})
		});
	});
};