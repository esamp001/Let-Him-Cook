import { useEffect, useState, type CSSProperties } from 'react';
import { ArrowLeftOutlined, ArrowRightOutlined, GoogleOutlined } from '@ant-design/icons';
import { Button, Checkbox, ConfigProvider, Divider, Form, Grid, Input, Tabs, message, type ThemeConfig } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChefHatIcon } from '../components/ChefHatIcon';
import { FridgeIllustration } from '../components/FridgeIllustration';
import type { AuthApiResponse } from '../types/interfaces/AuthApiResponse';
import type { LoginForm } from '../types/interfaces/LoginForm';
import { culinaryPalette } from '../theme/themeConfig';
import { getSafeRedirectPath } from '../front-end-helpers/auth-redirect.helpers';

type AuthMode = 'sign_in' | 'create_account';

const authModeTabs = [
  { key: 'sign_in', label: 'Sign in' },
  { key: 'create_account', label: 'Create account' },
] as const;

const authErrorMessages: Record<string, string> = {
  google_failed: 'Google sign-in did not finish. Please try again.',
  google_unavailable: 'Google sign-in is not set up yet. Use your email instead.',
};

const displayFont = `'Bricolage Grotesque', 'Inter', sans-serif`;

const authTabsTheme: ThemeConfig = {
  components: {
    Tabs: { inkBarColor: culinaryPalette.accent, itemColor: culinaryPalette.textMuted, itemSelectedColor: culinaryPalette.primary, itemHoverColor: culinaryPalette.primary, titleFontSize: 15, horizontalItemGutter: 28, horizontalMargin: '0' },
  },
};

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
    minHeight: '100dvh',
    background: culinaryPalette.surface
  },
  compactPage: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    background: culinaryPalette.warmSurface
  },
  showcase: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 32,
    padding: '40px 56px',
    overflow: 'hidden',
    background: culinaryPalette.warmSurface
  },
  illustration: {
    display: 'flex',
    justifyContent: 'center'
  },
  compactIllustration: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 250
  },
  showcaseCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  showcaseTitle: {
    margin: 0,
    fontFamily: displayFont,
    fontSize: 48,
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: '-0.025em',
    color: culinaryPalette.primary
  },
  showcaseText: {
    margin: 0,
    maxWidth: 460,
    fontSize: 17,
    lineHeight: 1.5,
    color: culinaryPalette.textSecondary
  },
  brandButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    height: 44,
    padding: 0,
    border: 'none',
    background: 'transparent',
    boxShadow: 'none',
    color: culinaryPalette.text,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.3px'
  },
  brandAccent: {
    color: culinaryPalette.accent
  },
  compactHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '16px 16px 0'
  },
  skipButton: {
    padding: 0,
    height: 44,
    color: culinaryPalette.primary,
    fontWeight: 600
  },
  formPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 64px'
  },
  compactFormPanel: {
    flex: 1,
    padding: 24,
    borderRadius: '28px 28px 0 0',
    background: culinaryPalette.surface,
    boxShadow: '0 -8px 24px rgba(13, 59, 46, 0.06)'
  },
  formColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    width: '100%',
    maxWidth: 400
  },
  compactFormColumn: {
    gap: 16,
    maxWidth: 480,
    margin: '0 auto'
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 0,
    height: 44,
    color: culinaryPalette.textSecondary,
    fontWeight: 600
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  formTitle: {
    margin: 0,
    fontFamily: displayFont,
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: culinaryPalette.text
  },
  compactFormTitle: {
    fontSize: 28,
    lineHeight: 1.1,
    color: culinaryPalette.primary
  },
  formSubtitle: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.5,
    color: culinaryPalette.textSecondary
  },
  tabs: {
    marginBottom: -4,
    fontWeight: 600
  },
  formItem: {
    marginBottom: 16
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    background: culinaryPalette.pageBackground,
    fontSize: 15
  },
  passwordLabelRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: 8
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151'
  },
  linkButton: {
    padding: 0,
    height: 'auto',
    fontSize: 13,
    fontWeight: 600,
    color: '#C2410C'
  },
  checkbox: {
    marginBottom: 16,
    fontSize: 14,
    color: '#374151'
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700
  },
  divider: {
    margin: 0,
    color: culinaryPalette.textMuted,
    fontSize: 13
  },
  googleButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: culinaryPalette.border,
    color: culinaryPalette.text,
    fontSize: 15,
    fontWeight: 600
  },
  switchText: {
    margin: 0,
    textAlign: 'center',
    fontSize: 14,
    color: culinaryPalette.textSecondary
  },
  switchButton: {
    padding: 0,
    height: 'auto',
    fontSize: 14,
    fontWeight: 700,
    color: '#C2410C'
  },
  legal: {
    margin: 0,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 1.5,
    color: culinaryPalette.textMuted
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const isCompact = !screens.lg;
  const isSignIn = mode === 'sign_in';
  const [userForm, setUserForm] = useState<LoginForm>({
    name: '',
    email: '',
    password: '',
    keepSignedIn: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const redirectPath = getSafeRedirectPath(searchParams.get('redirect'));

  // The Google callback redirects back here with ?authError=... when sign-in fails.
  useEffect(() => {
    const authError = searchParams.get('authError');

    if (!authError) return;

    // A fixed key stops React StrictMode's double effect run from showing the message twice.
    message.error({ content: authErrorMessages[authError] ?? 'Unable to sign in. Please try again.', key: 'auth-error' });
    // Remove only authError so the redirect value survives for the next sign-in attempt.
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('authError');
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSubmit = async () => {
    const fallbackErrorMessage = isSignIn ? 'Unable to sign in.' : 'Unable to create your account.';
    setIsSubmitting(true);

    const { name, email, password, keepSignedIn } = userForm;

    try {
      const apiResponse = await fetch(isSignIn ? '/api/v1/auth/sign-in' : '/api/v1/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(isSignIn
          ? { email, password, keepSignedIn }
          : { name, email, password }),
      });

      const response = await apiResponse.json() as AuthApiResponse;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? fallbackErrorMessage);
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : fallbackErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const brand = (
    <Button
      style={styles.brandButton}
      onClick={() => navigate('/Home')}
      aria-label="Let Him Cook home"
    >
      <ChefHatIcon />
      <span>Let Him <span style={styles.brandAccent}>Cook</span></span>
    </Button>
  );

  return (
    <section style={isCompact ? styles.compactPage : styles.page}>
      {isCompact ? (
        <>
          <div style={styles.compactHeader}>
            {brand}
            <Button
              type="link"
              style={styles.skipButton}
              onClick={() => navigate('/Home')}
            >
              Skip
            </Button>
          </div>
          <div style={styles.compactIllustration}>
            <FridgeIllustration
              width={260}
              height={250}
            />
          </div>
        </>
      ) : (
        <aside style={styles.showcase}>
          {brand}
          <div style={styles.illustration}>
            <FridgeIllustration
              width={440}
              height={374}
            />
          </div>
          <div style={styles.showcaseCopy}>
            <h1 style={styles.showcaseTitle}>Open the fridge. Start cooking.</h1>
            <p style={styles.showcaseText}>Tell us what you already have. We'll match it to real recipes and list only what's missing.</p>
          </div>
        </aside>
      )}

      <div style={isCompact ? styles.compactFormPanel : styles.formPanel}>
        <div style={{ ...styles.formColumn, ...(isCompact ? styles.compactFormColumn : {}) }}>
          {!isCompact && (
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              style={styles.backButton}
              onClick={() => navigate('/Home')}
            >
              Back to home
            </Button>
          )}

          <div style={styles.heading}>
            <h2 style={{ ...styles.formTitle, ...(isCompact ? styles.compactFormTitle : {}) }}>
              {isCompact ? 'Open the fridge. Start cooking.' : isSignIn ? 'Welcome back' : 'Create your account'}
            </h2>
            <p style={styles.formSubtitle}>
              {isCompact ? "Tell us what you have. We'll find real recipes and list only what's missing." : isSignIn ? 'Your recipes, lists and chats are waiting.' : 'Save recipes and shopping lists in less than a minute.'}
            </p>
          </div>

          <ConfigProvider theme={authTabsTheme}>
            <Tabs
              activeKey={mode}
              onChange={(key) => setMode(key as AuthMode)}
              items={[...authModeTabs]}
              style={styles.tabs}
            />
          </ConfigProvider>

          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={handleSubmit}
          >
            {!isSignIn && (
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Enter your name.' }]}
                style={styles.formItem}
              >
                <Input
                  placeholder="Juan dela Cruz"
                  onChange={(event) => setUserForm((previousForm) => ({ ...previousForm, name: event.target.value }))}
                  autoComplete="name"
                  style={styles.input}
                />
              </Form.Item>
            )}
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: 'email', message: 'Enter a valid email address.' }]}
              style={styles.formItem}
            >
              <Input
                placeholder="you@example.com"
                onChange={(event) => setUserForm((previousForm) => ({ ...previousForm, email: event.target.value }))}
                autoComplete="email"
                style={styles.input}
              />
            </Form.Item>

            <div style={styles.passwordLabelRow}>
              <label
                htmlFor="password"
                style={styles.passwordLabel}
              >
                Password
              </label>
              {isSignIn && (
                <Button
                  type="link"
                  style={styles.linkButton}
                  onClick={() => message.info('Password reset is coming soon.')}
                >
                  {isCompact ? 'Forgot?' : 'Forgot password?'}
                </Button>
              )}
            </div>
            <Form.Item
              name="password"
              rules={isSignIn
                ? [{ required: true, message: 'Enter your password.' }]
                : [{ required: true, min: 8, message: 'Use at least 8 characters.' }]}
              style={styles.formItem}
            >
              <Input.Password
                placeholder={isSignIn ? 'Your password' : 'At least 8 characters'}
                onChange={(event) => setUserForm((previousForm) => ({ ...previousForm, password: event.target.value }))}
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                style={styles.input}
              />
            </Form.Item>

            {isSignIn && (
              <Form.Item
                name="keepSignedIn"
                valuePropName="checked"
                noStyle
              >
                <Checkbox
                  onChange={(event) => setUserForm((previousForm) => ({ ...previousForm, keepSignedIn: event.target.checked }))}
                  style={styles.checkbox}
                >
                  Keep me signed in
                </Checkbox>
              </Form.Item>
            )}

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isSubmitting}
              style={styles.submitButton}
              icon={<ArrowRightOutlined />}
              iconPlacement="end"
            >
              {isSignIn ? "Let's cook" : 'Create account'}
            </Button>
          </Form>

          <Divider
            plain
            style={styles.divider}
          >
            or
          </Divider>

          <Button
            block
            icon={<GoogleOutlined />}
            style={styles.googleButton}
            onClick={() => window.location.assign(`/api/v1/auth/google?redirect=${encodeURIComponent(redirectPath)}`)}
          >
            Continue with Google
          </Button>

          <p style={styles.switchText}>
            {isSignIn ? (isCompact ? 'New here? ' : 'New to Let Him Cook? ') : 'Already have an account? '}
            <Button
              type="link"
              style={styles.switchButton}
              onClick={() => setMode(isSignIn ? 'create_account' : 'sign_in')}
            >
              {isSignIn ? 'Create an account' : 'Sign in'}
            </Button>
          </p>

          {!isSignIn && <p style={styles.legal}>By creating an account, you agree to the Terms of Service and Privacy Policy.</p>}
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
