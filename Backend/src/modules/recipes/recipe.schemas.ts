import { z } from 'zod';

export const mealDbResponseSchema = z.object({
  meals: z.array(z.record(z.unknown())).nullable(),
});
