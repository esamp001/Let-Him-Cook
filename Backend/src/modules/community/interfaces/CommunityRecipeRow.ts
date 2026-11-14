import type { CommunityRecipeStatus } from '../community.types.js';

export interface CommunityRecipeRow {
  id: string;
  author_user_id: string | null;
  title: string;
  description: string | null;
  cuisine: string | null;
  image_url: string | null;
  source_url: string | null;
  cooking_time_minutes: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  status: CommunityRecipeStatus;
  helpful_count: number;
  not_helpful_count: number;
  submitted_at: Date | null;
  published_at: Date | null;
}
