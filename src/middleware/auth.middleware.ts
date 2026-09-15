import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types/env';

/**
 * Extracts and verifies Bearer token from the Authorization header.
 * Attaches decoded AuthUser to Hono context.
 */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
	const authHeader = c.req.header('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return c.json(
			{
				success: false,
				error: "Unauthorized: Missing or malformed Authorization header. Expected 'Bearer <token>'.",
			},
			401,
		);
	}

	const token = authHeader.slice(7).trim();
	if (!token) {
		return c.json(
			{
				success: false,
				error: 'Unauthorized: Token not provided.',
			},
			401,
		);
	}

	try {
		const tokenService = c.get('tokenService');
		const payload = await tokenService.verify(token);

		c.set('authUser', {
			id: payload.sub,
			role: payload.role,
			mailbox: payload.mailbox,
		});

		await next();
	} catch (err) {
		return c.json(
			{
				success: false,
				error: 'Unauthorized: Invalid or expired token.',
			},
			401,
		);
	}
};

/**
 * Guard middleware requiring admin role.
 */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
	const user = c.get('authUser');
	if (!user || user.role !== 'admin') {
		return c.json(
			{
				success: false,
				error: 'Forbidden: Admin privileges required for this resource.',
			},
			403,
		);
	}

	await next();
};

/**
 * Guard middleware ensuring user has access to the requested mailbox.
 * Admins can access all mailboxes. Scoped users can only access their assigned mailbox.
 */
export const requireMailboxAccess: MiddlewareHandler<AppEnv> = async (c, next) => {
	const user = c.get('authUser');
	if (!user) {
		return c.json(
			{
				success: false,
				error: 'Unauthorized: Authentication required.',
			},
			401,
		);
	}

	const mailbox = c.req.query('mailbox');
	if (mailbox) {
		const authService = c.get('authService');
		const hasAccess = authService.validateMailboxAccess(user, mailbox);

		if (!hasAccess) {
			return c.json(
				{
					success: false,
					error: `Forbidden: Access to mailbox '${mailbox}' is denied.`,
				},
				403,
			);
		}
	}

	await next();
};
