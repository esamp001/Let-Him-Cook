import type { AiRecipe } from './AiRecipe';
import type { CookingPlan } from './CookingPlan';
import type { FallbackOption } from './FallbackOption';

export interface AiChatResponse {
  data?: {
    reply: string;
    action: 'ask_follow_up' | 'choose_fallback' | 'generate_recipe';
    plan: CookingPlan;
    followUpOptions: string[];
    fallbackOptions: FallbackOption[];
    recipes: AiRecipe[];
  };
  error?: { message?: string };
}
