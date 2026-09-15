import type { AuthUser, TokenResponse } from '../types/auth';

/**
 * Domain contract for authentication and authorization operations.
 * Adheres to Dependency Inversion Principle.
 */
export interface IAuthService {
	authenticateAdmin(apiKey: string): Promise<TokenResponse | null>;
	createMailboxToken(mailbox: string, expiresInSeconds?: number): Promise<TokenResponse>;
	validateMailboxAccess(user: AuthUser, mailbox: string): boolean;
}
