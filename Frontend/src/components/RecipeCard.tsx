import type React from 'react';
import { Card, Tag } from 'antd';
import { ClockCircleOutlined, HeartOutlined, HeartFilled, FireOutlined } from '@ant-design/icons';
import { useFavorites } from '../hooks/useFavorites';
import type { RecipeCardProps } from '../types/interfaces/RecipeCardProps';
import './RecipeCard.css';

export const RecipeCard = ({ recipe, onSelect }: RecipeCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(recipe.id);

  const handleToggleFavorite = (event: React.MouseEvent) => {
    event.stopPropagation();
    void toggleFavorite(recipe);
  };

  return (
    <Card
      hoverable
      className="recipe-card"
      onClick={() => onSelect?.(recipe)}
      cover={
        <div className="recipe-card-cover">
          {recipe.imageUrl ? (
            <img alt={recipe.title} src={recipe.imageUrl} className="recipe-card-image" loading="lazy" />
          ) : (
            <div className="recipe-card-image" style={{ display: 'grid', placeItems: 'center', background: '#E8EEE9', color: '#52675C' }}>No photo available</div>
          )}
          <button
            type="button"
            className="favorite-button"
            onClick={handleToggleFavorite}
            aria-label={favorite ? 'Remove from saved recipes' : 'Save to favorites'}
            aria-pressed={favorite}
          >
            {favorite ? (
              <HeartFilled style={{ color: '#EA580C' }} />
            ) : (
              <HeartOutlined style={{ color: '#FFFFFF' }} />
            )}
          </button>
        </div>
      }
    >
      <div className="recipe-card-content">
        {recipe.source && <Tag style={{ marginBottom: 8 }}>{recipe.source === 'themealdb' ? 'TheMealDB' : recipe.source === 'community' ? 'Community recipe' : 'AI suggestion'}</Tag>}
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <div className="recipe-card-meta">
          <span className="meta-item">
            <ClockCircleOutlined className="meta-icon" />
            {recipe.cookingTimeMinutes ? `${recipe.cookingTimeMinutes} min` : 'Time not listed'}
          </span>
          <span className="meta-item">
            <FireOutlined className="meta-icon" />
            {recipe.difficulty ?? 'Difficulty not listed'}
          </span>
        </div>
      </div>
    </Card>
  );
};
