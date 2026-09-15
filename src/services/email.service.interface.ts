import type { CreateEmailDTO, EmailRecord, MailboxSummary } from '../types/email';

/**
 * Contract for Email domain business logic.
 * Adheres to Dependency Inversion Principle.
 */
export interface IEmailService {
	listMailboxes(): Promise<MailboxSummary[]>;
	getEmailsByMailbox(mailbox: string, limit?: number, offset?: number): Promise<EmailRecord[]>;
	getEmailById(id: string): Promise<EmailRecord | null>;
	deleteEmailsByMailbox(mailbox: string): Promise<number>;
	deleteEmailById(id: string): Promise<boolean>;
	saveEmail(input: CreateEmailDTO): Promise<void>;
}
