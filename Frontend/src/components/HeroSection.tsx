import React, { useState } from 'react';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';

interface HeroSectionProps {
  onSearch: (ingredients: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const suggestions = [
    'chicken + potatoes',
    'pasta + tomatoes',
    'eggs + spinach',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Left Column: Text & Search Form */}
        <div className="hero-content">
          <p className="hero-subtitle">Good food. Less stress.</p>
          <h1 className="hero-title">
            Tell me what you have, <br />
            I'll help you cook.
          </h1>
          <p className="hero-description">
            Find delicious recipes based on your ingredients, create shopping lists,
            and make cooking easier — one meal at a time.
          </p>

          {/* Search Bar */}
          <form className="hero-search-form" onSubmit={handleSubmit}>
            <div className="search-bar-wrapper">
              <span className="search-icon-circle">
                <SearchOutlined />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="What ingredients do you have?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                className="search-submit-btn"
                aria-label="Search recipes"
              >
                <ArrowRightOutlined />
              </button>
            </div>
          </form>

          {/* Quick Suggestions */}
          <div className="hero-suggestions">
            <span className="suggestions-label">Try:</span>
            <div className="suggestions-list">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="suggestion-pill"
                  onClick={() => handleSuggestionClick(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Culinary Visual Showcase */}
        <div className="hero-visual">
          <div className="hero-backdrop-shape" />

          {/* Handwritten Annotation Callout */}
          <div className="hero-annotation">
            <span className="annotation-text">
              Great meals <br />
              start with <br />
              what you have
            </span>
            <svg
              className="annotation-arrow"
              width="42"
              height="42"
              viewBox="0 0 50 50"
              fill="none"
              stroke="#0D3B2E"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M 10 10 Q 25 35 38 32" />
              <path d="M 30 26 L 39 32 L 32 38" />
            </svg>
          </div>

          {/* Hero Dish Image */}
          <div className="hero-dish-container">
            <img
              src="https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=900&q=80"
              alt="Roasted Chicken with Potatoes and Herbs"
              className="hero-dish-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

