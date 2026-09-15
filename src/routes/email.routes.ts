import { Hono } from 'hono';
import { EmailController } from '../controllers/email.controller';
import type { AppEnv } from '../types/env';

export const emailRoutes = new Hono<AppEnv>();

// GET /api/mailboxes
emailRoutes.get('/mailboxes', (c) => {
	const controller = new EmailController(c.get('emailService'));
	return controller.listMailboxes(c);
});

// GET /api/emails?mailbox=<name>&limit=<limit>&offset=<offset>
emailRoutes.get('/emails', (c) => {
	const controller = new EmailController(c.get('emailService'));
	return controller.getEmails(c);
});

// DELETE /api/emails?mailbox=<name>
emailRoutes.delete('/emails', (c) => {
	const controller = new EmailController(c.get('emailService'));
	return controller.deleteEmails(c);
});

// GET /api/emails/:id
emailRoutes.get('/emails/:id', (c) => {
	const controller = new EmailController(c.get('emailService'));
	return controller.getEmailById(c);
});

// DELETE /api/emails/:id
emailRoutes.delete('/emails/:id', (c) => {
	const controller = new EmailController(c.get('emailService'));
	return controller.deleteEmailById(c);
});
