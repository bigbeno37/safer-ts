import { Err, Ok, Result } from './monads/Result';
import { z, ZodError, ZodSchema } from 'zod';

export type ParseJSONError =
	| { type: 'PARSE_ERROR', error: Error }
	| { type: 'ZOD_ERROR', error: ZodError };

/**
 * Safely parses the given string as JSON according the given schema, returning an Ok {@link Result} if successful,
 * or an Err if not.
 *
 * @param json The JSON string to be parsed.
 * @param schema The expected JSON schema.
 */
export const parseJSON = <S extends ZodSchema>(json: string, schema: S): Result<z.infer<S>, ParseJSONError> => {
	try {
		const obj = JSON.parse(json);

		const result = schema.safeParse(obj);

		if (!result.success) return Err<ParseJSONError, z.infer<S>>({ type: 'ZOD_ERROR', error: result.error });

		return Ok(result.data);
	} catch (e) {
		return Err<ParseJSONError, z.infer<S>>({ type: 'PARSE_ERROR', error: e as Error});
	}
};