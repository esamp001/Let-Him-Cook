import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { CurrentUserProvider } from './components/CurrentUserProvider';
import { FavoritesProvider } from './components/FavoritesProvider';
import { culinaryTheme } from './theme/themeConfig';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={culinaryTheme}>
        <AntApp>
          <CurrentUserProvider>
            <FavoritesProvider>
              <App />
            </FavoritesProvider>
          </CurrentUserProvider>
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
);
