import type { AuthTokenPayload, BaseTokenPayload } from '../types/auth';

/**
 * Segregated interface for generating signed tokens (Interface Segregation Principle).
 */
export interface ITokenSigner {
	sign(payload: BaseTokenPayload, expiresInSeconds?: number): Promise<string>;
}

/**
 * Segregated interface for verifying and decoding tokens (Interface Segregation Principle).
 */
export interface ITokenVerifier {
	verify(token: string): Promise<AuthTokenPayload>;
}

/**
 * Unified token service contract combining signing and verification.
 * Adheres to Dependency Inversion Principle.
 */
export interface ITokenService extends ITokenSigner, ITokenVerifier {}
