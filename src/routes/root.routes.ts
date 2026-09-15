import { Hono } from 'hono';
import { RootController } from '../controllers/root.controller';
import type { AppEnv } from '../types/env';

export const rootRoutes = new Hono<AppEnv>();
const rootController = new RootController();

// GET /
rootRoutes.get('/', (c) => rootController.getIndex(c));
