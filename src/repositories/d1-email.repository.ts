import type { CreateEmailDTO, EmailRecord, MailboxSummary } from '../types/email';
import type { IEmailRepository } from './email.repository.interface';

/**
 * Concrete implementation of IEmailRepository using Cloudflare D1.
 * Follows Single Responsibility Principle (only responsible for D1 persistence operations).
 */
export class D1EmailRepository implements IEmailRepository {
	constructor(private readonly db: D1Database) {}

	async save(input: CreateEmailDTO): Promise<void> {
		const receivedAt = input.receivedAt || new Date().toISOString();
		const isJunk = input.mailbox.toLowerCase() === 'junk' ? 1 : 0;

		await this.db
			.prepare(
				`INSERT INTO emails (
					id, mailbox, domain, recipient, sender, sender_name, reply_to,
					subject, body_text, body_html, has_attachments, attachments,
					raw_size, message_id, headers, is_read, is_junk, received_at
				) VALUES (
					?, ?, ?, ?, ?, ?, ?,
					?, ?, ?, ?, ?,
					?, ?, ?, ?, ?, ?
				)`,
			)
			.bind(
				input.id,
				input.mailbox.toLowerCase(),
				input.domain.toLowerCase(),
				input.recipient.toLowerCase(),
				input.sender.toLowerCase(),
				input.senderName ?? null,
				input.replyTo ?? null,
				input.subject ?? null,
				input.bodyText ?? null,
				input.bodyHtml ?? null,
				input.hasAttachments ? 1 : 0,
				input.attachments ? JSON.stringify(input.attachments) : null,
				input.rawSize,
				input.messageId ?? null,
				input.headers ? JSON.stringify(input.headers) : null,
				0, // is_read
				isJunk,
				receivedAt,
			)
			.run();
	}

	async findById(id: string): Promise<EmailRecord | null> {
		return await this.db.prepare('SELECT * FROM emails WHERE id = ?').bind(id).first<EmailRecord>();
	}

	async findByMailbox(mailbox: string, limit: number = 50, offset: number = 0): Promise<EmailRecord[]> {
		const { results } = await this.db
			.prepare(
				`SELECT * FROM emails
				 WHERE mailbox = ?
				 ORDER BY received_at DESC
				 LIMIT ? OFFSET ?`,
			)
			.bind(mailbox.toLowerCase(), limit, offset)
			.all<EmailRecord>();

		return results;
	}

	async deleteById(id: string): Promise<boolean> {
		const result = await this.db.prepare('DELETE FROM emails WHERE id = ?').bind(id).run();

		return (result.meta?.changes ?? 0) > 0;
	}

	async deleteByMailbox(mailbox: string): Promise<number> {
		const result = await this.db.prepare('DELETE FROM emails WHERE mailbox = ?').bind(mailbox.toLowerCase()).run();

		return result.meta?.changes ?? 0;
	}

	async listMailboxes(): Promise<MailboxSummary[]> {
		const { results } = await this.db
			.prepare(
				`SELECT
					mailbox,
					COUNT(*) as count,
					MAX(received_at) as last_received
				 FROM emails
				 GROUP BY mailbox
				 ORDER BY count DESC`,
			)
			.all<MailboxSummary>();

		return results;
	}
}
