import type { CSSProperties } from 'react';
import { LockOutlined } from '@ant-design/icons';
import { Button, Card } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildLoginPath } from '../front-end-helpers/auth-redirect.helpers';
import { culinaryPalette } from '../theme/themeConfig';
import type { SignInPromptProps } from '../types/interfaces/SignInPromptProps';

const styles: Record<string, CSSProperties> = {
  card: {
    maxWidth: 520,
    margin: '48px auto',
    textAlign: 'center',
    borderRadius: 20
  },
  icon: {
    fontSize: 32,
    color: culinaryPalette.primary
  },
  title: {
    margin: '16px 0 8px',
    fontSize: 22,
    fontWeight: 800,
    color: culinaryPalette.text
  },
  description: {
    margin: '0 0 24px',
    fontSize: 15,
    color: culinaryPalette.textSecondary
  }
};

export const SignInPrompt = ({ title, description }: SignInPromptProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Card style={styles.card}>
      <LockOutlined style={styles.icon} />
      <h2 style={styles.title}>{title}</h2>
      <p style={styles.description}>{description}</p>
      <Button
        type="primary"
        size="large"
        onClick={() => navigate(buildLoginPath(`${location.pathname}${location.search}`))}
      >
        Sign in
      </Button>
    </Card>
  );
};
