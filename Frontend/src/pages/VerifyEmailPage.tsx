import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Result, Spin } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { ApiResponse } from '../types/interfaces/ApiResponse';

type VerificationState = 'verifying' | 'verified' | 'failed';

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '48px 16px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: 64
  }
};

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshCurrentUser } = useCurrentUser();
  const [verificationState, setVerificationState] = useState<VerificationState>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const hasStarted = useRef(false);
  const token = searchParams.get('token') ?? '';

  useEffect(() => {
    // Each link works once, so React StrictMode's second effect run must not send it again.
    if (hasStarted.current) return;
    hasStarted.current = true;

    const verifyEmail = async () => {
      try {
        const apiResponse = await fetch('/api/v1/auth/email-verification/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const response = await apiResponse.json() as ApiResponse<{ emailVerified: boolean }>;

        if (!apiResponse.ok || !response.data) {
          throw new Error(response.error?.message ?? 'This link is invalid or has expired.');
        }

        setVerificationState('verified');
        await refreshCurrentUser();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'This link is invalid or has expired.');
        setVerificationState('failed');
      }
    };

    void verifyEmail();
  }, [refreshCurrentUser, token]);

  if (verificationState === 'verifying') {
    return (
      <div style={styles.loading}>
        <Spin
          size="large"
          tip="Confirming your email…"
        >
          <div />
        </Spin>
      </div>
    );
  }

  return (
    <section style={styles.page}>
      <Result
        status={verificationState === 'verified' ? 'success' : 'warning'}
        title={verificationState === 'verified' ? 'Your email is confirmed' : 'We could not confirm your email'}
        subTitle={verificationState === 'verified'
          ? 'You can now submit, rate, and report community recipes.'
          : `${errorMessage} Sign in and use "Resend email" in the banner to get a new link.`}
        extra={(
          <Button
            type="primary"
            onClick={() => navigate('/Home')}
          >
            Go to home
          </Button>
        )}
      />
    </section>
  );
};

export default VerifyEmailPage;
