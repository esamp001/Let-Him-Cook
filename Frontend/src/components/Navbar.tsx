import { Avatar, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

interface Props {
  shoppingListCount?: number;
}

export const Navbar = ({
  shoppingListCount = 0,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const isHome = path === '/' || path === '/home';
  const isRecipes = path.startsWith('/recipes');
  const isShoppingList = path.startsWith('/shopping-list');

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="navbar-logo" onClick={() => navigate('/Home')}>
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
            className={`nav-link ${isHome ? 'active' : ''}`}
            onClick={() => navigate('/Home')}
          >
            Home
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
