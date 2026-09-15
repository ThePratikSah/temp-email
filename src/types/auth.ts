export type UserRole = 'admin' | 'user';

export interface BaseTokenPayload {
	sub: string;
	role: UserRole;
	mailbox?: string;
	[key: string]: unknown;
}

export interface AuthTokenPayload extends BaseTokenPayload {
	exp: number;
	iat?: number;
	nbf?: number;
}

export interface AuthUser {
	id: string;
	role: UserRole;
	mailbox?: string;
}

export interface AdminLoginDTO {
	apiKey: string;
}

export interface MailboxTokenDTO {
	mailbox: string;
	expiresInSeconds?: number;
}

export interface TokenResponse {
	token: string;
	expiresIn: number;
	tokenType: 'Bearer';
	role: UserRole;
	mailbox?: string;
}
