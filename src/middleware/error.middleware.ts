import type { ErrorHandler } from 'hono';
import type { AppEnv } from '../types/env';

/**
 * Global error handler middleware for uncaught exceptions.
 */
export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
	console.error('[HTTP Error]', err);
	return c.json(
		{
			success: false,
			error: err.message || 'Internal server error',
		},
		500,
	);
};
