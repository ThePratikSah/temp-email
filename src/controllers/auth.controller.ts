import type { Context } from 'hono';
import type { IAuthService } from '../services/auth.service.interface';
import type { AdminLoginDTO, MailboxTokenDTO } from '../types/auth';
import type { AppEnv } from '../types/env';

/**
 * Controller handling authentication and token endpoints.
 * Follows Single Responsibility Principle (HTTP presentation) and
 * Dependency Inversion Principle (depends on IAuthService abstraction).
 */
export class AuthController {
	constructor(private readonly authService: IAuthService) {}

	/**
	 * POST /api/auth/token
	 * Exchange admin API key for an admin JWT token.
	 */
	async createAdminToken(c: Context<AppEnv>): Promise<Response> {
		let body: AdminLoginDTO;
		try {
			body = await c.req.json<AdminLoginDTO>();
		} catch {
			return c.json(
				{
					success: false,
					error: 'Invalid JSON body. Expected { apiKey: string }',
				},
				400,
			);
		}

		if (!body.apiKey) {
			return c.json(
				{
					success: false,
					error: "Missing 'apiKey' field in request body.",
				},
				400,
			);
		}

		const tokenResponse = await this.authService.authenticateAdmin(body.apiKey);
		if (!tokenResponse) {
			return c.json(
				{
					success: false,
					error: 'Invalid API key.',
				},
				401,
			);
		}

		return c.json({
			success: true,
			...tokenResponse,
		});
	}

	/**
	 * POST /api/auth/mailbox-token
	 * Issue a scoped access token for a specific temporary mailbox.
	 */
	async createMailboxToken(c: Context<AppEnv>): Promise<Response> {
		let body: MailboxTokenDTO;
		try {
			body = await c.req.json<MailboxTokenDTO>();
		} catch {
			return c.json(
				{
					success: false,
					error: 'Invalid JSON body. Expected { mailbox: string, expiresInSeconds?: number }',
				},
				400,
			);
		}

		if (!body.mailbox || typeof body.mailbox !== 'string' || !body.mailbox.trim()) {
			return c.json(
				{
					success: false,
					error: "Missing or invalid 'mailbox' field in request body.",
				},
				400,
			);
		}

		const tokenResponse = await this.authService.createMailboxToken(body.mailbox, body.expiresInSeconds);

		return c.json({
			success: true,
			...tokenResponse,
		});
	}

	/**
	 * GET /api/auth/me
	 * Returns the currently authenticated user / token claims.
	 */
	getProfile(c: Context<AppEnv>): Response {
		const user = c.get('authUser');
		if (!user) {
			return c.json(
				{
					success: false,
					error: 'Unauthorized: No authenticated user context.',
				},
				401,
			);
		}

		return c.json({
			success: true,
			user,
		});
	}
}
