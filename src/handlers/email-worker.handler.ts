import PostalMime from 'postal-mime';
import { D1EmailRepository } from '../repositories/d1-email.repository';
import { EmailService } from '../services/email.service';
import type { AttachmentMeta } from '../types/email';

/**
 * Cloudflare Email Worker handler.
 * Triggered whenever an email arrives at the domain's catch-all route.
 * Follows Single Responsibility Principle by coordinating MIME parsing and delegating
 * domain persistence to the EmailService.
 */
export async function handleIncomingEmail(message: ForwardableEmailMessage, env: Env, _ctx: ExecutionContext): Promise<void> {
	try {
		// 0. Envelope & Mailbox Extraction
		const recipient = message.to.trim().toLowerCase();
		const [rawMailbox, domain = ''] = recipient.split('@');
		const mailbox = rawMailbox || 'default';
		const sender = message.from.trim().toLowerCase();

		// 1. DB
		const emailRepo = new D1EmailRepository(env.DB);
		const emailService = new EmailService(emailRepo);

		console.log(`[Email] Received for ${recipient} (mailbox: ${mailbox}) from ${sender}`);
		if (!await emailService.mailboxExists(mailbox)) { // check if the mailbox exists or deleted
			console.error('[Email] Email processing failed as mailbox was deleted');
			message.setReject('Internal processing error');
		}

		// 2. Parse MIME structure using PostalMime
		const email = await PostalMime.parse(message.raw);

		// 3. Extract Headers
		const headerMap: Record<string, string> = {};
		for (const [key, value] of message.headers.entries()) {
			headerMap[key.toLowerCase()] = value;
		}

		const subject = email.subject || message.headers.get('subject') || '(No Subject)';
		const messageId = email.messageId || message.headers.get('message-id') || null;
		const replyTo = message.headers.get('reply-to') || null;

		// 4. Extract Attachment Metadata (omitting raw binary to respect D1 row size limits)
		const attachments: AttachmentMeta[] = (email.attachments || []).map((att) => {
			let size = 0;
			if (typeof att.content === 'string') {
				size = att.content.length;
			} else if (att.content && 'byteLength' in att.content) {
				size = att.content.byteLength;
			}
			return {
				filename: att.filename || 'unnamed',
				mimeType: att.mimeType || 'application/octet-stream',
				size,
				disposition: att.disposition || 'attachment',
			};
		});

		// 5. Persist via EmailService
		const id = crypto.randomUUID();
		await emailService.saveEmail({
			id,
			mailbox,
			domain,
			recipient,
			sender,
			senderName: email.from?.name || null,
			replyTo,
			subject,
			bodyText: email.text || null,
			bodyHtml: email.html || null,
			hasAttachments: attachments.length > 0,
			attachments,
			rawSize: message.rawSize,
			messageId,
			headers: headerMap,
			receivedAt: new Date().toISOString(),
		});

		console.log(`[Email] Successfully saved email ${id} to mailbox '${mailbox}' in D1`);
	} catch (error) {
		console.error('[Email] Email processing failed:', error);

		// Fallback: forward to admin or reject
		try {
			await message.forward('shivam3448@gmail.com');
		} catch (fallbackError) {
			console.error('[Email] Fallback forwarding failed:', fallbackError);
			message.setReject('Internal processing error');
		}
	}
}
