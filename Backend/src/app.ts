import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { communityRouter } from './modules/community/community.routes.js';
import { conversationsRouter } from './modules/conversations/conversations.routes.js';
import { favoritesRouter } from './modules/favorites/favorites.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { moderationRouter } from './modules/moderation/moderation.routes.js';
import { recipeRouter } from './modules/recipes/recipe.routes.js';
import { shoppingListRouter } from './modules/shopping-list/shopping-list.routes.js';

export const app = express();

if (env.trustProxyHops > 0) {
  // Behind Nginx, read the client IP from X-Forwarded-For so rate limits apply per visitor.
  app.set('trust proxy', env.trustProxyHops);
}

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/recipes', recipeRouter);
app.use('/api/v1/community', communityRouter);
app.use('/api/v1/moderation', moderationRouter);
app.use('/api/v1/favorites', favoritesRouter);
app.use('/api/v1/shopping-list', shoppingListRouter);
app.use('/api/v1/conversations', conversationsRouter);

app.use(notFound);
app.use(errorHandler);
