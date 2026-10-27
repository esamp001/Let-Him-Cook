import type { FallbackOption } from './FallbackOption';
import type { Recipe } from './Recipe';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  followUpOptions?: string[];
  fallbackOptions?: FallbackOption[];
  recipes?: Recipe[];
}
