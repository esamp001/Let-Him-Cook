import React from 'react';
import {
  HomeOutlined,
  BookOutlined,
  CheckSquareOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Badge } from 'antd';

interface MobileNavProps {
  activeTab: 'home' | 'recipes' | 'shopping-list';
  onTabChange: (tab: 'home' | 'recipes' | 'shopping-list') => void;
  shoppingListCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  shoppingListCount = 0,
}) => {
  return (
    <nav className="mobile-bottom-nav">
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
      >
        <HomeOutlined className="mobile-nav-icon" />
        <span className="mobile-nav-label">Home</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'recipes' ? 'active' : ''}`}
        onClick={() => onTabChange('recipes')}
      >
        <BookOutlined className="mobile-nav-icon" />
        <span className="mobile-nav-label">Recipes</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'shopping-list' ? 'active' : ''}`}
        onClick={() => onTabChange('shopping-list')}
      >
        <Badge
          count={shoppingListCount}
          size="small"
          offset={[6, -2]}
          style={{ backgroundColor: '#0D3B2E' }}
        >
          <CheckSquareOutlined className="mobile-nav-icon" />
        </Badge>
        <span className="mobile-nav-label">Shopping List</span>
      </button>

      <button
        type="button"
        className="mobile-nav-item"
        onClick={() => alert('Profile feature coming in a future update!')}
      >
        <UserOutlined className="mobile-nav-icon" />
        <span className="mobile-nav-label">Profile</span>
      </button>
    </nav>
  );
};

