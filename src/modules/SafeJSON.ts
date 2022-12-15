import { z, ZodError, ZodSchema } from 'zod';
import { Err, Ok, Result } from '../monads';

export const parseWithSchema = <S extends ZodSchema>(schema: S) => (obj: unknown): Result<z.infer<S>, ZodError> => {
	const result = schema.safeParse(obj);

	return result.success === true ? Ok(result.data) : Err(result.error);
};

export const parseJSON = (json: string): Result<unknown, Error> => {
	try {
		return Ok(JSON.parse(json));
	} catch (e) {
		return Err(e as Error);
	}
};

export type ParseJSONError =
	| { type: 'PARSE_ERROR', error: Error }
	| { type: 'ZOD_ERROR', error: ZodError };

export const parseJSONWithSchema = <S extends ZodSchema>(schema: S) => (json: string): Result<z.infer<S>, ParseJSONError> =>
	parseJSON(json)
		.mapErr<ParseJSONError>(error => ({type: 'PARSE_ERROR', error}))
		.andThen(data => parseWithSchema(schema)(data).mapErr<ParseJSONError>(error => ({type: 'ZOD_ERROR', error})));