import { AttachmentMeta, EmailRecord, MailboxSummary } from "./types";

export interface InsertEmailInput {
	id: string;
	mailbox: string;
	domain: string;
	recipient: string;
	sender: string;
	senderName?: string | null;
	replyTo?: string | null;
	subject?: string | null;
	bodyText?: string | null;
	bodyHtml?: string | null;
	hasAttachments: boolean;
	attachments?: AttachmentMeta[];
	rawSize: number;
	messageId?: string | null;
	headers?: Record<string, string>;
	receivedAt?: string;
}

/**
 * Saves a parsed incoming email into Cloudflare D1.
 */
export async function saveEmail(db: D1Database, input: InsertEmailInput): Promise<void> {
	const receivedAt = input.receivedAt || new Date().toISOString();
	const isJunk = input.mailbox.toLowerCase() === "junk" ? 1 : 0;

	// D1 string/row limit is 2MB. To be safe, truncate huge email bodies if they exceed 500KB.
	const safeBodyText = input.bodyText && input.bodyText.length > 500_000
		? input.bodyText.slice(0, 500_000) + "\n\n...[Body text truncated due to size limit]"
		: input.bodyText ?? null;

	const safeBodyHtml = input.bodyHtml && input.bodyHtml.length > 500_000
		? input.bodyHtml.slice(0, 500_000) + "\n<!-- HTML truncated due to size limit -->"
		: input.bodyHtml ?? null;

	await db
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
			safeBodyText,
			safeBodyHtml,
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

/**
 * Deletes all emails belonging to a specific mailbox (e.g. 'junk').
 * Returns the number of rows deleted.
 */
export async function deleteEmailsByMailbox(db: D1Database, mailbox: string): Promise<number> {
	const result = await db
		.prepare("DELETE FROM emails WHERE mailbox = ?")
		.bind(mailbox.toLowerCase())
		.run();

	return result.meta?.changes ?? 0;
}

/**
 * Fetches emails for a specific mailbox with pagination.
 */
export async function getEmailsByMailbox(
	db: D1Database,
	mailbox: string,
	limit: number = 50,
	offset: number = 0,
): Promise<EmailRecord[]> {
	const { results } = await db
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

/**
 * Retrieves an email by its unique ID.
 */
export async function getEmailById(db: D1Database, id: string): Promise<EmailRecord | null> {
	return await db
		.prepare("SELECT * FROM emails WHERE id = ?")
		.bind(id)
		.first<EmailRecord>();
}

/**
 * Deletes a single email by its unique ID.
 */
export async function deleteEmailById(db: D1Database, id: string): Promise<boolean> {
	const result = await db
		.prepare("DELETE FROM emails WHERE id = ?")
		.bind(id)
		.run();

	return (result.meta?.changes ?? 0) > 0;
}

/**
 * Lists all mailboxes with email counts and the timestamp of the latest email received.
 */
export async function listMailboxes(db: D1Database): Promise<MailboxSummary[]> {
	const { results } = await db
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
