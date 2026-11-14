import type { z } from 'zod';
import type { savedRecipeSnapshotSchema } from './favorites.schemas.js';

export type SavedRecipeSnapshot = z.infer<typeof savedRecipeSnapshotSchema>;
