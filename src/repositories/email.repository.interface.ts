import type { CreateEmailDTO, EmailRecord, MailboxSummary } from '../types/email';

/**
 * Segregated interface for email query operations (Interface Segregation Principle).
 */
export interface IEmailReader {
	findById(id: string): Promise<EmailRecord | null>;
	findByMailbox(mailbox: string, limit: number, offset: number): Promise<EmailRecord[]>;
	listMailboxes(): Promise<MailboxSummary[]>;
}

/**
 * Segregated interface for email mutation operations (Interface Segregation Principle).
 */
export interface IEmailWriter {
	save(input: CreateEmailDTO): Promise<void>;
	deleteById(id: string): Promise<boolean>;
	deleteByMailbox(mailbox: string): Promise<number>;
}

/**
 * Full email repository interface combining read and write operations.
 */
export interface IEmailRepository extends IEmailReader, IEmailWriter {}
