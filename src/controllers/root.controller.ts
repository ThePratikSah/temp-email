import type { Context } from 'hono';
import type { AppEnv } from '../types/env';

/**
 * Controller handling root landing endpoint and service metadata.
 */
export class RootController {
	getIndex(c: Context<AppEnv>): Response {
		return c.json({
			name: 'Cloudflare Catch-All Email Worker with D1 Storage',
			endpoints: {
				'GET /api/mailboxes': 'List all mailboxes and message counts',
				'GET /api/emails?mailbox=<name>': 'List emails in a mailbox (e.g. ?mailbox=hi)',
				'GET /api/emails/:id': 'Get single email by ID',
				'DELETE /api/emails?mailbox=junk': 'Delete all emails in a mailbox at once',
				'DELETE /api/emails/:id': 'Delete single email by ID',
			},
		});
	}
}
