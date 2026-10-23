import React from 'react';
import { Avatar, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface NavbarProps {
  activeTab: 'home' | 'recipes' | 'shopping-list';
  onTabChange: (tab: 'home' | 'recipes' | 'shopping-list') => void;
  shoppingListCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = 'home',
  onTabChange,
  shoppingListCount = 0,
}) => {
  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-logo" onClick={() => onTabChange('home')}>
          <span className="logo-icon" aria-label="Chef Hat">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0D3B2E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </span>
          <span className="logo-text">
            Let Him <span className="logo-accent">Cook</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="navbar-nav">
          <button
            type="button"
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => onTabChange('recipes')}
          >
            Recipes
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === 'shopping-list' ? 'active' : ''}`}
            onClick={() => onTabChange('shopping-list')}
          >
            Shopping List
            {shoppingListCount > 0 && (
              <Badge
                count={shoppingListCount}
                offset={[8, -2]}
                style={{ backgroundColor: '#0D3B2E' }}
              />
            )}
          </button>
        </nav>

        {/* User Profile */}
        <div className="navbar-user">
          <Avatar
            size={38}
            icon={<UserOutlined />}
            style={{
              backgroundColor: '#E5E7EB',
              color: '#4B5563',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>
    </header>
  );
};
