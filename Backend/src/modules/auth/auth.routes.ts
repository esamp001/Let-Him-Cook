import { Router } from 'express';
import { accountEmailRateLimit, accountTokenRateLimit, signInRateLimit, signUpRateLimit } from '../../middleware/rateLimits.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { finishGoogleSignIn, getCurrentUser, requestPasswordReset, resendVerificationEmail, resetPassword, signIn, signOut, signOutAllDevices, signUp, startGoogleSignIn, verifyEmail } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/sign-up', signUpRateLimit, signUp);
authRouter.post('/sign-in', signInRateLimit, signIn);
authRouter.post('/sign-out', signOut);
authRouter.post('/sign-out-all', requireAuth, signOutAllDevices);
authRouter.get('/me', requireAuth, getCurrentUser);
authRouter.post('/password-reset/request', accountEmailRateLimit, requestPasswordReset);
authRouter.post('/password-reset/confirm', accountTokenRateLimit, resetPassword);
authRouter.post('/email-verification/confirm', accountTokenRateLimit, verifyEmail);
authRouter.post('/email-verification/resend', accountEmailRateLimit, requireAuth, resendVerificationEmail);
authRouter.get('/google', startGoogleSignIn);
authRouter.get('/google/callback', finishGoogleSignIn);
