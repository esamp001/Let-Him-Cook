import React, { useState } from 'react';
import { Card } from 'antd';
import { ClockCircleOutlined, HeartOutlined, HeartFilled, FireOutlined } from '@ant-design/icons';
import type { Recipe } from '../types/recipe';
import './RecipeCard.css';

interface Props {
  recipe: Recipe;
  onSelect?: (recipe: Recipe) => void;
}

export const RecipeCard = ({ recipe, onSelect }: Props) => {
  const [favorite, setFavorite] = useState(recipe.isFavorite ?? false);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite((prev) => !prev);
  };

  return (
    <Card
      hoverable
      className="recipe-card"
      onClick={() => onSelect?.(recipe)}
      cover={
        <div className="recipe-card-cover">
          <img
            alt={recipe.title}
            src={recipe.imageUrl}
            className="recipe-card-image"
            loading="lazy"
          />
          <button
            type="button"
            className="favorite-button"
            onClick={toggleFavorite}
            aria-label="Save to favorites"
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
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <div className="recipe-card-meta">
          <span className="meta-item">
            <ClockCircleOutlined className="meta-icon" />
            {recipe.cookingTimeMinutes} min
          </span>
          <span className="meta-item">
            <FireOutlined className="meta-icon" />
            {recipe.difficulty}
          </span>
        </div>
      </div>
    </Card>
  );
};

