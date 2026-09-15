import type { Hono } from 'hono';
import type { AppEnv } from '../types/env';
import { authRoutes } from './auth.routes';
import { emailRoutes } from './email.routes';
import { rootRoutes } from './root.routes';

export * from './auth.routes';
export * from './email.routes';
export * from './root.routes';

/**
 * Registers all application route modules onto the main Hono app instance.
 */
export function registerRoutes(app: Hono<AppEnv>): void {
	app.route('/', rootRoutes);
	app.route('/api/auth', authRoutes);
	app.route('/api', emailRoutes);
}
