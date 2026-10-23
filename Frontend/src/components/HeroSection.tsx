import { useState, type FormEvent } from 'react';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import heroImg from '../assets/Rustic Herb Chicken Bowl with Fresh Garnishes.png';
import './HeroSection.css';

interface Props {
  onSearch: (ingredients: string) => void;
}

export const HeroSection = ({ onSearch }: Props) => {
  const [query, setQuery] = useState('');

  const suggestions = [
    'chicken + potatoes',
    'pasta + tomatoes',
    'eggs + spinach',
  ];

  const handleSubmit = (e: FormEvent) => {
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
            Tell me what you have,
            <br />
            I'll help you cook.
          </h1>
          <p className="hero-description">
            Find delicious recipes based on your ingredients,
            <br />
            create shopping lists, and make cooking easier
            <br />
            — one meal at a time.
          </p>

          {/* Search Bar Pill */}
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

        {/* Right Column: Culinary Visual & Annotation */}
        <div className="hero-visual">
          {/* Warm organic background shape behind the dish on the right */}
          <div className="hero-warm-blob" />

          {/* Handwritten Annotation Callout */}
          <div className="hero-annotation">
            <span className="annotation-text">
              Great meals
              <br />
              start with
              <br />
              what you have
            </span>
            <svg
              className="annotation-arrow"
              width="38"
              height="44"
              viewBox="0 0 38 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4C22 14 28 26 22 36"
                stroke="#0D3B2E"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M14 31L22 37L28 30"
                stroke="#0D3B2E"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Hero Dish Image */}
          <div className="hero-dish-wrapper">
            <img
              src={heroImg}
              alt="Rustic herb chicken bowl with fresh garnishes"
              className="hero-dish-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
