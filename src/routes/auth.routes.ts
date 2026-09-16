import { Hono } from 'hono';
import { AuthController } from '../controllers';
import { requireAuth } from '../middleware/auth.middleware';
import type { AppEnv } from '../types/env';

export const authRoutes = new Hono<AppEnv>();

// POST /api/auth/token - Exchange admin API key for an admin JWT token
authRoutes.post('/token', (c) => {
	const controller = new AuthController(c.get('authService'));
	return controller.createAdminToken(c);
});

// POST /api/auth/mailbox-token - Create scoped token for a specific mailbox
authRoutes.post('/mailbox-token', (c) => {
	const controller = new AuthController(c.get('authService'));
	return controller.createMailboxToken(c);
});

// GET /api/auth/me - Inspect currently authenticated token claims
authRoutes.get('/me', requireAuth, (c) => {
	const controller = new AuthController(c.get('authService'));
	return controller.getProfile(c);
});
