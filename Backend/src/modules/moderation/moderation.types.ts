import type { z } from 'zod';
import type { moderationActionSchema, reportStatusSchema } from './moderation.schemas.js';

export type ModerationAction = z.infer<typeof moderationActionSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
