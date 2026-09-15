import type { IAuthService } from '../services/auth.service.interface';
import type { IEmailService } from '../services/email.service.interface';
import type { ITokenService } from '../services/token.service.interface';
import type { AuthUser } from './auth';

export interface AppVariables {
	emailService: IEmailService;
	tokenService: ITokenService;
	authService: IAuthService;
	authUser?: AuthUser;
}

export type AppEnv = {
	Bindings: Env;
	Variables: AppVariables;
};
