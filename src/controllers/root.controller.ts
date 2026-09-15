import type { Context } from 'hono';
import type { AppEnv } from '../types/env';

/**
 * Controller handling root landing endpoint and service metadata.
 */
export class RootController {
	getIndex(c: Context<AppEnv>): Response {
		return c.json({
			name: 'Cloudflare Catch-All Email Worker with D1 Storage and JWT Auth',
			endpoints: {
				'POST /api/auth/token': 'Exchange admin API key for an admin JWT token',
				'POST /api/auth/mailbox-token': 'Issue a scoped access token for a specific temporary mailbox',
				'GET /api/auth/me': 'Inspect currently authenticated token claims (Bearer token)',
				'GET /api/mailboxes': 'List all mailboxes and message counts (Admin only)',
				'GET /api/emails?mailbox=<name>': 'List emails in a mailbox (requires matching token or admin)',
				'GET /api/emails/:id': 'Get single email by ID (requires matching token or admin)',
				'DELETE /api/emails?mailbox=junk': 'Delete all emails in a mailbox at once (requires matching token or admin)',
				'DELETE /api/emails/:id': 'Delete single email by ID (requires matching token or admin)',
			},
		});
	}
}
