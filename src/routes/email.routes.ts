import { Hono } from 'hono';
import { EmailController } from '../controllers/email.controller';
import { requireAdmin, requireAuth, requireMailboxAccess } from '../middleware/auth.middleware';
import type { AppEnv } from '../types/env';

export const emailRoutes = new Hono<AppEnv>();

// GET /api/mailboxes (Admin only)
emailRoutes.get('/mailboxes', requireAuth, requireAdmin, (c) => {
	const controller = new EmailController(c.get('emailService'));
	return controller.listMailboxes(c);
});

// GET /api/emails?mailbox=<name>&limit=<limit>&offset=<offset> (Admin or matching mailbox token)
emailRoutes.get('/emails', requireAuth, requireMailboxAccess, (c) => {
	const controller = new EmailController(c.get('emailService'));
	return controller.getEmails(c);
});

// DELETE /api/emails?mailbox=<name> (Admin or matching mailbox token)
emailRoutes.delete('/emails', requireAuth, requireMailboxAccess, (c) => {
	const controller = new EmailController(c.get('emailService'));
	return controller.deleteEmails(c);
});

// GET /api/emails/:id (Admin or matching email mailbox owner)
emailRoutes.get('/emails/:id', requireAuth, (c) => {
	const controller = new EmailController(c.get('emailService'));
	return controller.getEmailById(c);
});

// DELETE /api/emails/:id (Admin or matching email mailbox owner)
emailRoutes.delete('/emails/:id', requireAuth, (c) => {
	const controller = new EmailController(c.get('emailService'));
	return controller.deleteEmailById(c);
});
