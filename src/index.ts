import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleIncomingEmail } from './handlers';
import { diMiddleware, errorHandler } from './middleware';
import { registerRoutes } from './routes';
import type { AppEnv } from './types';

const app = new Hono<AppEnv>();

// Global CORS Middleware
app.use(
	'*',
	cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	}),
);

// Dependency Injection Middleware
app.use('*', diMiddleware);

// Route Registration
registerRoutes(app);

// Global Error & 404 Handlers
app.onError(errorHandler);
app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));

export default {
	fetch: app.fetch,
	email: handleIncomingEmail,
} satisfies ExportedHandler<Env>;
