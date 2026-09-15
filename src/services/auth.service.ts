import type { AuthUser, TokenResponse } from '../types/auth';
import type { IAuthService } from './auth.service.interface';
import type { ITokenService } from './token.service.interface';

/**
 * Service handling authentication domain rules.
 * Follows Single Responsibility Principle (auth business rules) and
 * Dependency Inversion Principle (depends on ITokenService abstraction).
 */
export class AuthService implements IAuthService {
	private static readonly ADMIN_EXPIRY_SECONDS = 86400; // 24 hours
	private static readonly DEFAULT_MAILBOX_EXPIRY_SECONDS = 86400; // 24 hours

	constructor(
		private readonly tokenService: ITokenService,
		private readonly adminApiKey: string,
	) {}

	async authenticateAdmin(apiKey: string): Promise<TokenResponse | null> {
		const trimmedKey = apiKey.trim();
		if (!trimmedKey || trimmedKey !== this.adminApiKey) {
			return null;
		}

		const token = await this.tokenService.sign(
			{
				sub: 'admin',
				role: 'admin',
			},
			AuthService.ADMIN_EXPIRY_SECONDS,
		);

		return {
			token,
			expiresIn: AuthService.ADMIN_EXPIRY_SECONDS,
			tokenType: 'Bearer',
			role: 'admin',
		};
	}

	async createMailboxToken(mailbox: string, expiresInSeconds: number = AuthService.DEFAULT_MAILBOX_EXPIRY_SECONDS): Promise<TokenResponse> {
		const normalizedMailbox = mailbox.trim().toLowerCase();
		const safeExpiry = Math.max(60, Math.min(expiresInSeconds, 604800)); // between 1 min and 7 days

		const token = await this.tokenService.sign(
			{
				sub: `mailbox:${normalizedMailbox}`,
				role: 'user',
				mailbox: normalizedMailbox,
			},
			safeExpiry,
		);

		return {
			token,
			expiresIn: safeExpiry,
			tokenType: 'Bearer',
			role: 'user',
			mailbox: normalizedMailbox,
		};
	}

	validateMailboxAccess(user: AuthUser, mailbox: string): boolean {
		if (user.role === 'admin') {
			return true;
		}

		if (user.role === 'user' && user.mailbox) {
			return user.mailbox.toLowerCase() === mailbox.trim().toLowerCase();
		}

		return false;
	}
}
