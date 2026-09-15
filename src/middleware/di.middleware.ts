import type { MiddlewareHandler } from 'hono';
import { D1EmailRepository } from '../repositories/d1-email.repository';
import { EmailService } from '../services/email.service';
import type { AppEnv } from '../types/env';

/**
 * Dependency Injection middleware.
 * Instantiates and injects concrete implementations into the Hono request context,
 * allowing controllers to consume abstractions.
 */
export const diMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
	const emailRepo = new D1EmailRepository(c.env.DB);
	const emailService = new EmailService(emailRepo);
	c.set('emailService', emailService);
	await next();
};
