import type { IEmailService } from '../services/email.service.interface';

export interface AppVariables {
	emailService: IEmailService;
}

export type AppEnv = {
	Bindings: Env;
	Variables: AppVariables;
};
