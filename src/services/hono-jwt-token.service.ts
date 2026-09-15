import { sign, verify } from 'hono/jwt';
import type { AuthTokenPayload, BaseTokenPayload } from '../types/auth';
import type { ITokenService } from './token.service.interface';

/**
 * Concrete token service implementation using Hono's native Web Crypto JWT helper.
 * Follows Single Responsibility Principle (crypto token operations only).
 */
export class HonoJwtTokenService implements ITokenService {
	private static readonly DEFAULT_EXPIRATION_SECONDS = 86400; // 24 hours

	constructor(private readonly secret: string) {}

	async sign(payload: BaseTokenPayload, expiresInSeconds: number = HonoJwtTokenService.DEFAULT_EXPIRATION_SECONDS): Promise<string> {
		const now = Math.floor(Date.now() / 1000);
		const fullPayload: AuthTokenPayload = {
			...payload,
			iat: now,
			exp: now + expiresInSeconds,
		};

		return await sign(fullPayload, this.secret, 'HS256');
	}

	async verify(token: string): Promise<AuthTokenPayload> {
		const payload = await verify(token, this.secret, 'HS256');
		return payload as unknown as AuthTokenPayload;
	}
}
