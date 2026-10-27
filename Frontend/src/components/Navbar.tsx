import { Badge } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
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
            <svg
              width="32"
              height="32"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Hat puffs */}
              <path
                d="M10 16.5C7.5 16.5 6 18.5 6 21C6 23.5 8 25.5 10.5 25.5H25.5C28 25.5 30 23.5 30 21C30 18.5 28.5 16.5 26 16.5C26.5 13.8 24.5 11 22 11C20.5 11 19.2 11.8 18.5 13C17.8 11.2 16 10 13.5 10C11 10 9.5 12.8 10 16.5Z"
                fill="#FFFFFF"
                stroke="#1F2937"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Hat band */}
              <path
                d="M10 25.5H26V28C26 28.6 25.5 29 25 29H11C10.5 29 10 28.6 10 28V25.5Z"
                fill="#FFFFFF"
                stroke="#1F2937"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Bottom warm accent plate */}
              <path
                d="M8.5 31C13 32.5 23 32.5 27.5 31"
                stroke="#F59E0B"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
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
