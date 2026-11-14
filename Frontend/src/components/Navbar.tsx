import { cloneElement, type CSSProperties, type ReactElement } from 'react';
import { BookOutlined, LogoutOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, Dropdown, message, type MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChefHatIcon } from './ChefHatIcon';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { buildLoginPath } from '../front-end-helpers/auth-redirect.helpers';
import type { NavbarProps } from '../types/interfaces/NavbarProps';
import { culinaryPalette } from '../theme/themeConfig';
import './Navbar.css';

const userMenuItems: MenuProps['items'] = [
  { key: 'my-recipes', label: 'My recipes', icon: <BookOutlined /> },
  { type: 'divider' },
  { key: 'sign-out', label: 'Sign out', icon: <LogoutOutlined />, danger: true },
];

const avatarButtonStyle: CSSProperties = {
  width: 40,
  height: 40,
  minWidth: 40,
  padding: 0,
  borderRadius: '50%',
  border: `2px solid ${culinaryPalette.border}`,
  background: culinaryPalette.surface
};
const activeAvatarButtonStyle: CSSProperties = {
  borderColor: culinaryPalette.primary
};
const avatarStyle: CSSProperties = {
  background: culinaryPalette.successSurface,
  color: culinaryPalette.primary,
  fontWeight: 700
};
const userMenuPanelStyle: CSSProperties = {
  minWidth: 240,
  borderRadius: 16,
  background: culinaryPalette.surface,
  boxShadow: '0 12px 32px rgba(17, 24, 39, 0.12)',
  overflow: 'hidden'
};
const userMenuHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  borderBottom: `1px solid ${culinaryPalette.borderSubtle}`
};
const userMenuNameStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 700,
  color: culinaryPalette.text
};
const userMenuEmailStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: culinaryPalette.textMuted,
  wordBreak: 'break-all'
};
const userMenuListStyle: CSSProperties = {
  boxShadow: 'none',
  borderRadius: 0,
  padding: 6
};
const signInButtonStyle: CSSProperties = {
  paddingInline: 20
};

export const Navbar = ({ shoppingListCount = 0 }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isLoadingUser, signOut } = useCurrentUser();
  const path = location.pathname.toLowerCase();

  const handleUserMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === 'my-recipes') {
      navigate('/My-Recipes');
      return;
    }

    try {
      await signOut();
      message.success('You are signed out.');
      navigate('/Home');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to sign out.');
    }
  };

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
          {currentUser ? (
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              popupRender={(menu) => (
                <div style={userMenuPanelStyle}>
                  <div style={userMenuHeaderStyle}>
                    <Avatar
                      size={40}
                      style={avatarStyle}
                    >
                      {currentUser.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <p style={userMenuNameStyle}>{currentUser.name}</p>
                      <p style={userMenuEmailStyle}>{currentUser.email}</p>
                    </div>
                  </div>
                  {cloneElement(menu as ReactElement<{ style?: CSSProperties }>, { style: userMenuListStyle })}
                </div>
              )}
            >
              <Button
                type="text"
                shape="circle"
                aria-label={`Account menu for ${currentUser.name}`}
                style={{ ...avatarButtonStyle, ...(isMyRecipes ? activeAvatarButtonStyle : {}) }}
              >
                <Avatar
                  size={32}
                  style={avatarStyle}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </Avatar>
              </Button>
            </Dropdown>
          ) : (
            !isLoadingUser && (
              <Button
                type="primary"
                style={signInButtonStyle}
                onClick={() => navigate(buildLoginPath(`${location.pathname}${location.search}`))}
              >
                Sign in
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
