import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { diMiddleware, errorHandler } from './middleware';
import { registerRoutes } from './routes';
import type { AppEnv } from './types';

/**
 * Creates and configures the Hono application instance with all middlewares and routes.
 */
export function createApp(): Hono<AppEnv> {
	const app = new Hono<AppEnv>();

	// CORS Middleware
	app.use(
		'*',
		cors({
			origin: '*',
			allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
			allowHeaders: ['Content-Type'],
		}),
	);

	// Dependency Injection Middleware
	app.use('*', diMiddleware);

	// Register Routes
	registerRoutes(app);

	// Centralized Error and Not Found Handlers
	app.onError(errorHandler);
	app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));

	return app;
}
