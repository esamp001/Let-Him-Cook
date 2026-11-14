import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { finishGoogleSignIn, getCurrentUser, signIn, signOut, signUp, startGoogleSignIn } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/sign-up', signUp);
authRouter.post('/sign-in', signIn);
authRouter.post('/sign-out', signOut);
authRouter.get('/me', requireAuth, getCurrentUser);
authRouter.get('/google', startGoogleSignIn);
authRouter.get('/google/callback', finishGoogleSignIn);
