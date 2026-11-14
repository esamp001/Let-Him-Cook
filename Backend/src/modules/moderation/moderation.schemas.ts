import { z } from 'zod';
import { communityRecipeStatusSchema } from '../community/community.schemas.js';

export const moderationActionSchema = z.enum(['approve', 'reject', 'unpublish', 'restore']);
export const reportStatusSchema = z.enum(['open', 'resolved', 'dismissed']);

export const moderationQueueQuerySchema = z.object({
  status: communityRecipeStatusSchema.optional(),
});

export const moderationActionRequestSchema = z.object({
  action: moderationActionSchema,
  note: z.string().trim().max(1_000).optional(),
});

export const reportListQuerySchema = z.object({
  status: reportStatusSchema.default('open'),
});

export const reportIdParamsSchema = z.object({
  reportId: z.string().uuid(),
});

export const resolveReportRequestSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
});
