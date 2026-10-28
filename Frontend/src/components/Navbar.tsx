import { Badge } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChefHatIcon } from './ChefHatIcon';
import type { NavbarProps } from '../types/interfaces/NavbarProps';
import './Navbar.css';

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
          <button
            type="button"
            className={`user-avatar-btn ${isMyRecipes ? 'active' : ''}`}
            aria-label="My recipes"
            onClick={() => navigate('/My-Recipes')}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
