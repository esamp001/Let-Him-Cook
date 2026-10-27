import { useState, type CSSProperties, type FormEvent } from 'react';
import { SearchOutlined, ArrowRightOutlined, DownOutlined, SlidersOutlined } from '@ant-design/icons';
import { Dropdown, type MenuProps } from 'antd';
import type { CuisinePreference } from '../types/ai';
import type { HeroSectionProps } from '../types/interfaces/HeroSectionProps';
import heroImg from '../assets/Rustic Herb Chicken Bowl with Fresh Garnishes.png';
import './HeroSection.css';

const searchBarStyle: CSSProperties = {
  paddingLeft: 4,
};

const cuisineFilterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 118,
  height: 48,
  padding: '0 12px',
  borderRadius: 9999,
  border: 'none',
  backgroundColor: '#EFF6F1',
  color: '#0D3B2E',
  flexShrink: 0,
  cursor: 'pointer',
};

const cuisineTextStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  lineHeight: 1.05,
  flex: 1,
};

const cuisineLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 500,
  color: '#7A8C84',
};

const cuisineValueStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#0D3B2E',
};

const cuisineLabels: Record<CuisinePreference, string> = {
  any: 'Any cuisine',
  filipino: 'Filipino',
  asian: 'Asian',
  italian: 'Italian',
  western: 'Western',
};

const getCuisineOptions = (selectedCuisine: CuisinePreference): MenuProps['items'] => (
  Object.entries(cuisineLabels).map(([value, label]) => ({
    key: value,
    label: <span style={{ color: value === selectedCuisine ? '#FFFFFF' : '#374151' }}>{label}</span>,
  }))
);

export const HeroSection = ({ onSearch }: HeroSectionProps) => {
  const [query, setQuery] = useState('');
  const [cuisinePreference, setCuisinePreference] = useState<CuisinePreference>('any');

  const suggestions = [
    'chicken + potatoes',
    'pasta + tomatoes',
    'eggs + spinach',
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), cuisinePreference);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion, cuisinePreference);
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
            <div className="search-bar-wrapper" style={searchBarStyle}>
              <Dropdown
                trigger={['click']}
                placement="bottomLeft"
                menu={{
                  items: getCuisineOptions(cuisinePreference),
                  selectable: true,
                  selectedKeys: [cuisinePreference],
                  onClick: ({ key }) => setCuisinePreference(key as CuisinePreference),
                }}
                styles={{ root: { minWidth: 160 } }}
              >
                <button type="button" aria-label="Choose cuisine preference" style={cuisineFilterStyle}>
                  <SlidersOutlined style={{ fontSize: 16 }} />
                  <span style={cuisineTextStyle}>
                    <span style={cuisineLabelStyle}>Cuisine</span>
                    <strong style={cuisineValueStyle}>{cuisineLabels[cuisinePreference]}</strong>
                  </span>
                  <DownOutlined style={{ fontSize: 10 }} />
                </button>
              </Dropdown>
              <span className="search-icon-circle" style={{ marginLeft: 14 }}>
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
