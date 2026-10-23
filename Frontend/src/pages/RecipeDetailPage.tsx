import React, { useState } from 'react';
import { Button, message, Checkbox } from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  FireOutlined,
  HeartOutlined,
  HeartFilled,
  PlusOutlined,
} from '@ant-design/icons';
import type { Recipe } from '../types/recipe';
import type { ShoppingItem } from '../types/shoppingList';

interface RecipeDetailPageProps {
  recipe: Recipe;
  onBack: () => void;
  onAddToShoppingList: (items: ShoppingItem[]) => void;
}

export const RecipeDetailPage: React.FC<RecipeDetailPageProps> = ({
  recipe,
  onBack,
  onAddToShoppingList,
}) => {
  const [favorite, setFavorite] = useState(recipe.isFavorite ?? false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(
    recipe.ingredients
      .filter((ing) => !ing.isOwned) // Pre-select missing ingredients
      .map((ing) => ing.name)
  );

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handleAddShoppingList = () => {
    const itemsToAdd: ShoppingItem[] = recipe.ingredients
      .filter((ing) => selectedIngredients.includes(ing.name))
      .map((ing) => ({
        id: crypto.randomUUID(),
        name: ing.name + (ing.isOptional ? ' (optional)' : ''),
        quantity: ing.quantity || '1',
        checked: false,
      }));

    if (itemsToAdd.length === 0) {
      message.info('No ingredients selected to add.');
      return;
    }

    onAddToShoppingList(itemsToAdd);
    message.success(`Added ${itemsToAdd.length} missing ingredients to Shopping List!`);
  };

  return (
    <div className="recipe-detail-container">
      {/* Back button bar */}
      <div className="recipe-detail-back-bar">
        <button type="button" className="back-btn" onClick={onBack}>
          <ArrowLeftOutlined /> Back to Recipes
        </button>
      </div>

      {/* Hero Banner Image */}
      <div className="recipe-detail-hero">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="recipe-detail-image"
        />
      </div>

      {/* Header Info */}
      <div className="recipe-detail-header">
        <div className="recipe-title-row">
          <h1 className="recipe-detail-title">{recipe.title}</h1>
          <button
            type="button"
            className="detail-favorite-btn"
            onClick={() => setFavorite(!favorite)}
            aria-label="Toggle favorite"
          >
            {favorite ? (
              <HeartFilled style={{ color: '#EA580C' }} />
            ) : (
              <HeartOutlined style={{ color: '#4B5563' }} />
            )}
          </button>
        </div>

        <div className="recipe-detail-meta">
          <span className="meta-badge">
            <ClockCircleOutlined /> {recipe.cookingTimeMinutes} min
          </span>
          <span className="meta-badge">
            <FireOutlined /> {recipe.difficulty}
          </span>
        </div>

        {recipe.description && (
          <p className="recipe-detail-description">{recipe.description}</p>
        )}
      </div>

      {/* Two-Column Grid: Ingredients & Steps */}
      <div className="recipe-detail-grid">
        {/* Left Column: Ingredients */}
        <div className="recipe-detail-card ingredients-column">
          <div className="column-title-row">
            <h2 className="column-title">Ingredients</h2>
            <span className="column-subtitle">Select to add to shopping list</span>
          </div>

          <div className="ingredients-list">
            {recipe.ingredients.map((ing) => {
              const isSelected = selectedIngredients.includes(ing.name);
              return (
                <div
                  key={ing.name}
                  className={`ingredient-row ${ing.isOwned ? 'owned' : 'missing'}`}
                  onClick={() => toggleIngredient(ing.name)}
                >
                  <Checkbox
                    checked={isSelected || ing.isOwned}
                    disabled={ing.isOwned}
                  />
                  <div className="ingredient-info">
                    <span className="ingredient-name">
                      {ing.name}
                      {ing.isOptional && (
                        <span className="optional-tag"> (optional)</span>
                      )}
                    </span>
                    {ing.quantity && (
                      <span className="ingredient-qty">({ing.quantity})</span>
                    )}
                  </div>
                  {ing.isOwned && <span className="in-pantry-badge">In Pantry</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Cooking Steps */}
        <div className="recipe-detail-card steps-column">
          <h2 className="column-title">Steps</h2>
          <ol className="steps-list">
            {recipe.steps.map((step, idx) => (
              <li key={idx} className="step-item">
                <span className="step-number">{idx + 1}.</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="recipe-detail-cta-bar">
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          className="cta-shopping-btn"
          onClick={handleAddShoppingList}
        >
          Add to Shopping List
        </Button>
      </div>
    </div>
  );
};

