import { BookOutlined, CheckSquareOutlined, HomeOutlined, MessageOutlined } from '@ant-design/icons';
import { Badge } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MobileNavProps } from '../types/interfaces/MobileNavProps';
import './MobileNav.css';

export const MobileNav = ({
  shoppingListCount = 0,
}: MobileNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const isHome = path === '/' || path === '/home';
  const isChat = path.startsWith('/chat');
  const isRecipes = path.startsWith('/recipes');
  const isShoppingList = path.startsWith('/shopping-list');

  return (
    <nav className="mobile-bottom-nav">
      <button
        type="button"
        className={`mobile-nav-item ${isHome ? 'active' : ''}`}
        onClick={() => navigate('/Home')}
      >
        <HomeOutlined className="mobile-nav-icon" />
        <span className="mobile-nav-label">Home</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isChat ? 'active' : ''}`}
        onClick={() => navigate('/Chat')}
      >
        <MessageOutlined className="mobile-nav-icon" />
        <span className="mobile-nav-label">Chat</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isRecipes ? 'active' : ''}`}
        onClick={() => navigate('/Recipes')}
      >
        <BookOutlined className="mobile-nav-icon" />
        <span className="mobile-nav-label">Recipes</span>
      </button>

      <button
        type="button"
        className={`mobile-nav-item ${isShoppingList ? 'active' : ''}`}
        onClick={() => navigate('/Shopping-List')}
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
    </nav>
  );
};

