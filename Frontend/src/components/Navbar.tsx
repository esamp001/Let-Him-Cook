import type { CSSProperties } from 'react';
import { UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChefHatIcon } from './ChefHatIcon';
import type { NavbarProps } from '../types/interfaces/NavbarProps';
import { culinaryPalette } from '../theme/themeConfig';
import './Navbar.css';

const avatarButtonStyle: CSSProperties = { width: 40, height: 40, minWidth: 40, padding: 0, borderRadius: '50%', border: `2px solid ${culinaryPalette.border}`, background: culinaryPalette.surface };
const activeAvatarButtonStyle: CSSProperties = { borderColor: culinaryPalette.primary };
const avatarStyle: CSSProperties = { background: culinaryPalette.successSurface, color: culinaryPalette.primary };

export const Navbar = ({ shoppingListCount = 0 }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const isHome = path === '/' || path === '/home';
  const isChat = path.startsWith('/chat');
  const isMyRecipes = path.startsWith('/my-recipes');
  const isRecipes = path.startsWith('/recipes');
  const isShoppingList = path.startsWith('/shopping-list');

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-logo" onClick={() => navigate('/Home')}>
          <span className="logo-icon" aria-label="Chef Hat">
            <ChefHatIcon />
          </span>
          <span className="logo-text">
            Let Him <span className="logo-accent">Cook</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="navbar-nav">
          <button
            type="button"
            className={`nav-link ${isHome ? 'active' : ''}`}
            onClick={() => navigate('/Home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`nav-link ${isChat ? 'active' : ''}`}
            onClick={() => navigate('/Chat')}
          >
            Chat
          </button>
          <button
            type="button"
            className={`nav-link ${isRecipes ? 'active' : ''}`}
            onClick={() => navigate('/Recipes')}
          >
            Recipes
          </button>
          <button
            type="button"
            className={`nav-link ${isShoppingList ? 'active' : ''}`}
            onClick={() => navigate('/Shopping-List')}
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
          <Button
            type="text"
            shape="circle"
            aria-label="My recipes"
            onClick={() => navigate('/My-Recipes')}
            style={{ ...avatarButtonStyle, ...(isMyRecipes ? activeAvatarButtonStyle : {}) }}
          >
            <Avatar size={32} icon={<UserOutlined />} style={avatarStyle} />
          </Button>
        </div>
      </div>
    </header>
  );
};
