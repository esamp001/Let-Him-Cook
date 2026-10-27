import { z } from 'zod';

export const mealDbResponseSchema = z.object({
  meals: z.array(z.record(z.unknown())).nullable(),
});

export const browseRecipeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
  search: z.string().trim().max(100).default(''),
  cuisine: z.string().trim().max(80).default('any'),
  ingredient: z.string().trim().max(80).default(''),
  source: z.enum(['all', 'themealdb', 'community']).default('all'),
});
