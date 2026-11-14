import { useState, type CSSProperties } from 'react';
import { Alert, Button, message } from 'antd';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { ApiResponse } from '../types/interfaces/ApiResponse';

const bannerStyle: CSSProperties = {
  borderRadius: 0,
  justifyContent: 'center'
};

export const EmailVerificationBanner = () => {
  const { currentUser } = useCurrentUser();
  const [isSending, setIsSending] = useState(false);

  if (!currentUser || currentUser.emailVerified) return null;

  const handleResend = async () => {
    setIsSending(true);

    try {
      const apiResponse = await fetch('/api/v1/auth/email-verification/resend', { method: 'POST' });
      const response = await apiResponse.json() as ApiResponse<{ sent?: boolean; alreadyVerified?: boolean }>;

      if (!apiResponse.ok || !response.data) {
        throw new Error(response.error?.message ?? 'Unable to send the email.');
      }

      message.success(`We sent a new confirmation link to ${currentUser.email}.`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to send the email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Alert
      type="warning"
      showIcon
      banner
      style={bannerStyle}
      message={`Confirm your email (${currentUser.email}) to submit, rate, and report community recipes.`}
      action={(
        <Button
          size="small"
          loading={isSending}
          onClick={handleResend}
        >
          Resend email
        </Button>
      )}
    />
  );
};
