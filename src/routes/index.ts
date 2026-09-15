import type { Hono } from 'hono';
import type { AppEnv } from '../types/env';
import { emailRoutes } from './email.routes';
import { rootRoutes } from './root.routes';

export * from './email.routes';
export * from './root.routes';

/**
 * Registers all application route modules onto the main Hono app instance.
 */
export function registerRoutes(app: Hono<AppEnv>): void {
	app.route('/', rootRoutes);
	app.route('/api', emailRoutes);
}
