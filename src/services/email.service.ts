import type { IEmailRepository } from '../repositories/email.repository.interface';
import type { BlockedMailbox, CreateEmailDTO, EmailRecord, MailboxSummary } from '../types/email';
import type { IEmailService } from './email.service.interface';

/**
 * Service handling email business logic and domain rules.
 * Follows Single Responsibility Principle (domain logic) and
 * Dependency Inversion Principle (depends on IEmailRepository abstraction).
 */
export class EmailService implements IEmailService {
	private static readonly MAX_BODY_LENGTH = 500_000;
	private static readonly DEFAULT_LIMIT = 50;
	private static readonly MAX_LIMIT = 100;

	constructor(private readonly emailRepo: IEmailRepository) { }

	async listMailboxes(): Promise<MailboxSummary[]> {
		return await this.emailRepo.listMailboxes();
	}

	async getEmailsByMailbox(mailbox: string, limit?: number, offset?: number): Promise<EmailRecord[]> {
		const normalizedMailbox = mailbox.trim().toLowerCase();
		const sanitizedLimit = this.sanitizeLimit(limit);
		const sanitizedOffset = this.sanitizeOffset(offset);

		return await this.emailRepo.findByMailbox(normalizedMailbox, sanitizedLimit, sanitizedOffset);
	}

	async getEmailById(id: string): Promise<EmailRecord | null> {
		const normalizedId = id.trim();
		if (!normalizedId) return null;
		return await this.emailRepo.findById(normalizedId);
	}

	async deleteEmailsByMailbox(mailbox: string): Promise<number> {
		const normalizedMailbox = mailbox.trim().toLowerCase();
		return await this.emailRepo.deleteByMailbox(normalizedMailbox);
	}

	async deleteEmailById(id: string): Promise<boolean> {
		const normalizedId = id.trim();
		if (!normalizedId) return false;
		return await this.emailRepo.deleteById(normalizedId);
	}

	async saveEmail(input: CreateEmailDTO): Promise<void> {
		// Business rule: Enforce body truncation to avoid exceeding D1 row size limits (2MB max per row)
		const safeBodyText =
			input.bodyText && input.bodyText.length > EmailService.MAX_BODY_LENGTH
				? input.bodyText.slice(0, EmailService.MAX_BODY_LENGTH) + '\n\n...[Body text truncated due to size limit]'
				: (input.bodyText ?? null);

		const safeBodyHtml =
			input.bodyHtml && input.bodyHtml.length > EmailService.MAX_BODY_LENGTH
				? input.bodyHtml.slice(0, EmailService.MAX_BODY_LENGTH) + '\n<!-- HTML truncated due to size limit -->'
				: (input.bodyHtml ?? null);

		const sanitizedInput: CreateEmailDTO = {
			...input,
			mailbox: input.mailbox.trim().toLowerCase(),
			domain: input.domain.trim().toLowerCase(),
			recipient: input.recipient.trim().toLowerCase(),
			sender: input.sender.trim().toLowerCase(),
			bodyText: safeBodyText,
			bodyHtml: safeBodyHtml,
		};

		await this.emailRepo.save(sanitizedInput);
	}

	private sanitizeLimit(limit?: number): number {
		if (typeof limit !== 'number' || isNaN(limit) || limit <= 0) {
			return EmailService.DEFAULT_LIMIT;
		}
		return Math.min(Math.floor(limit), EmailService.MAX_LIMIT);
	}

	private sanitizeOffset(offset?: number): number {
		if (typeof offset !== 'number' || isNaN(offset) || offset < 0) {
			return 0;
		}
		return Math.floor(offset);
	}

	mailboxExists(mailbox: string): Promise<BlockedMailbox | null> {
		return this.emailRepo.findDeletedMailbox(mailbox);
	}
}
