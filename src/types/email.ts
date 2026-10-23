export interface AttachmentMeta {
	filename: string;
	mimeType: string;
	size: number;
	disposition: string;
}

export interface EmailRecord {
	id: string;
	mailbox: string;
	domain: string;
	recipient: string;
	sender: string;
	sender_name: string | null;
	reply_to: string | null;
	subject: string | null;
	body_text: string | null;
	body_html: string | null;
	has_attachments: number; // 0 or 1
	attachments: string | null; // JSON string of AttachmentMeta[]
	raw_size: number;
	message_id: string | null;
	headers: string | null; // JSON string of headers map
	is_read: number; // 0 or 1
	is_junk: number; // 0 or 1
	received_at: string;
	created_at: string;
}

export interface MailboxSummary {
	mailbox: string;
	count: number;
	last_received: string;
}

export interface BlockedMailbox {
	mailbox: string;
	blocked_at: string;
}

export interface CreateEmailDTO {
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

export interface GetEmailsQuery {
	mailbox: string;
	limit?: number;
	offset?: number;
}
