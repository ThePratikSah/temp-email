import type { MiddlewareHandler } from 'hono';
import { D1EmailRepository } from '../repositories/d1-email.repository';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { HonoJwtTokenService } from '../services/hono-jwt-token.service';
import type { AppEnv } from '../types/env';

/**
 * Dependency Injection middleware.
 * Instantiates and injects concrete service and repository implementations
 * into the Hono request context.
 */
export const diMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
	const jwtSecret = c.env.JWT_SECRET || 'temp-email-dev-secret-key-change-in-production';
	const adminApiKey = c.env.ADMIN_API_KEY || 'temp-email-admin-key';

	const emailRepo = new D1EmailRepository(c.env.DB);
	const emailService = new EmailService(emailRepo);
	const tokenService = new HonoJwtTokenService(jwtSecret);
	const authService = new AuthService(tokenService, adminApiKey);

	c.set('emailService', emailService);
	c.set('tokenService', tokenService);
	c.set('authService', authService);

	await next();
};
