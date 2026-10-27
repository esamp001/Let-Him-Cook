export interface PublishedRecipeRow {
  id: string;
  title: string;
  description: string | null;
  cuisine: string | null;
  image_url: string | null;
  source_url: string | null;
  cooking_time_minutes: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
}
