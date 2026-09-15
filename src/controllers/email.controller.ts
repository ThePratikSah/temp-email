import type { Context } from 'hono';
import type { IEmailService } from '../services/email.service.interface';
import type { AppEnv } from '../types/env';

/**
 * Controller handling HTTP requests for mailboxes and emails.
 * Follows Single Responsibility Principle (HTTP presentation layer) and
 * Dependency Inversion Principle (depends on IEmailService abstraction).
 */
export class EmailController {
	constructor(private readonly emailService: IEmailService) {}

	/**
	 * GET /api/mailboxes
	 * Lists all mailboxes and message counts.
	 */
	async listMailboxes(c: Context<AppEnv>): Promise<Response> {
		const mailboxes = await this.emailService.listMailboxes();
		return c.json({ success: true, mailboxes });
	}

	/**
	 * GET /api/emails?mailbox=<name>&limit=<limit>&offset=<offset>
	 * Lists emails in a specific mailbox.
	 */
	async getEmails(c: Context<AppEnv>): Promise<Response> {
		const mailbox = c.req.query('mailbox');
		if (!mailbox) {
			return c.json(
				{
					success: false,
					error: "Missing 'mailbox' query parameter (e.g. ?mailbox=junk or ?mailbox=hi)",
				},
				400,
			);
		}

		const limitParam = c.req.query('limit');
		const offsetParam = c.req.query('offset');

		const limit = limitParam !== undefined ? parseInt(limitParam, 10) : undefined;
		const offset = offsetParam !== undefined ? parseInt(offsetParam, 10) : undefined;

		const emails = await this.emailService.getEmailsByMailbox(mailbox, limit, offset);
		return c.json({
			success: true,
			mailbox,
			count: emails.length,
			emails,
		});
	}

	/**
	 * GET /api/emails/:id
	 * Retrieves a single email by ID.
	 */
	async getEmailById(c: Context<AppEnv>): Promise<Response> {
		const id = c.req.param('id');
		if (!id) {
			return c.json({ success: false, error: 'Missing email ID' }, 400);
		}
		const email = await this.emailService.getEmailById(id);

		if (!email) {
			return c.json({ success: false, error: 'Email not found' }, 404);
		}

		return c.json({ success: true, email });
	}

	/**
	 * DELETE /api/emails?mailbox=<name>
	 * Bulk deletes all emails in a mailbox.
	 */
	async deleteEmails(c: Context<AppEnv>): Promise<Response> {
		const mailbox = c.req.query('mailbox');
		if (!mailbox) {
			return c.json(
				{
					success: false,
					error: "Missing 'mailbox' query parameter.",
				},
				400,
			);
		}

		const deletedCount = await this.emailService.deleteEmailsByMailbox(mailbox);
		return c.json({
			success: true,
			message: `Successfully deleted all emails in mailbox '${mailbox}'`,
			deletedCount,
		});
	}

	/**
	 * DELETE /api/emails/:id
	 * Deletes a single email by ID.
	 */
	async deleteEmailById(c: Context<AppEnv>): Promise<Response> {
		const id = c.req.param('id');
		if (!id) {
			return c.json({ success: false, error: 'Missing email ID' }, 400);
		}
		const deleted = await this.emailService.deleteEmailById(id);

		return c.json({ success: deleted, deletedId: id });
	}
}
