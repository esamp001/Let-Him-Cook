import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { healthRouter } from './modules/health/health.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/ai', aiRouter);

app.use(notFound);
app.use(errorHandler);
