import { useState, type CSSProperties } from 'react';
import { Button, Card, Form, Input, Result, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { culinaryPalette } from '../theme/themeConfig';
import type { ApiResponse } from '../types/interfaces/ApiResponse';
import type { ResetPasswordForm } from '../types/interfaces/ResetPasswordForm';

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '48px 16px'
  },
  card: {
    borderRadius: 20
  },
  title: {
    margin: '0 0 8px',
    fontSize: 26,
    fontWeight: 800,
    color: culinaryPalette.text
  },
  description: {
    margin: '0 0 24px',
    fontSize: 15,
    color: culinaryPalette.textSecondary
  },
  input: {
    height: 48,
    borderRadius: 14
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    fontWeight: 700
  }
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setCurrentUser } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = searchParams.get('token');

  const handleResetPassword = async ({ password }: ResetPasswordForm) => {
    setIsSubmitting(true);

    try {
      const apiResponse = await fetch('/api/v1/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const response = await apiResponse.json() as ApiResponse<{ passwordReset: boolean }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to reset your password.');
      }

      // The reset signs out every device, including this one.
      setCurrentUser(null);
      message.success('Your password was changed. Sign in with your new password.');
      navigate('/Login', { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to reset your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <section style={styles.page}>
        <Result
          status="warning"
          title="This reset link is incomplete"
          subTitle="Open the link from your email again, or request a new one from the sign-in page."
          extra={(
            <Button
              type="primary"
              onClick={() => navigate('/Login')}
            >
              Go to sign in
            </Button>
          )}
        />
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <Card style={styles.card}>
        <h1 style={styles.title}>Choose a new password</h1>
        <p style={styles.description}>This signs you out of every device. Sign in again afterwards with your new password.</p>

        <Form<ResetPasswordForm>
          layout="vertical"
          requiredMark={false}
          onFinish={handleResetPassword}
        >
          <Form.Item
            name="password"
            label="New password"
            rules={[{ required: true, min: 8, message: 'Use at least 8 characters.' }]}
          >
            <Input.Password
              autoComplete="new-password"
              placeholder="At least 8 characters"
              style={styles.input}
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm new password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Enter the new password again.' },
              ({ getFieldValue }) => ({
                validator: (_rule, value) => value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('The passwords do not match.')),
              }),
            ]}
          >
            <Input.Password
              autoComplete="new-password"
              style={styles.input}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={isSubmitting}
            style={styles.submitButton}
          >
            Change password
          </Button>
        </Form>
      </Card>
    </section>
  );
};

export default ResetPasswordPage;
