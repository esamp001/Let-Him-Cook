import type { EmailMessage } from '../modules/auth/interfaces/EmailMessage.js';

const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Name: escapeHtml.
 * Returns: The text with HTML special characters replaced by entities.
 * Parameters: text, untrusted text such as a user's name.
 * Description: Prevents user-provided values from injecting markup into email HTML.
 */
export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (character) => htmlEscapes[character]);

/**
 * Name: buildAuthLink.
 * Returns: An absolute frontend URL carrying the token as a query value.
 * Parameters: appUrl, the frontend base URL; path, the frontend page; token, the raw emailed token.
 * Description: Builds the link placed in verification and password reset emails.
 */
export const buildAuthLink = (appUrl: string, path: string, token: string): string => {
  const link = new URL(path, appUrl);
  link.searchParams.set('token', token);

  return link.toString();
};

/**
 * Name: buildVerificationEmail.
 * Returns: An EmailMessage asking the user to confirm their email address.
 * Parameters: to, the recipient; name, the user's display name; link, the verification link.
 * Description: Creates the plain-text and HTML versions of the email verification message.
 */
export const buildVerificationEmail = (to: string, name: string, link: string): EmailMessage => ({
  to,
  subject: 'Confirm your Let Him Cook email',
  text: `Hi ${name},\n\nConfirm your email address to submit, rate, and report community recipes:\n${link}\n\nThis link expires in 24 hours. If you did not create a Let Him Cook account, you can ignore this email.`,
  html: `<p>Hi ${escapeHtml(name)},</p><p>Confirm your email address to submit, rate, and report community recipes.</p><p><a href="${escapeHtml(link)}">Confirm my email</a></p><p>This link expires in 24 hours. If you did not create a Let Him Cook account, you can ignore this email.</p>`,
});

/**
 * Name: buildPasswordResetEmail.
 * Returns: An EmailMessage with a link to choose a new password.
 * Parameters: to, the recipient; name, the user's display name; link, the password reset link.
 * Description: Creates the plain-text and HTML versions of the password reset message.
 */
export const buildPasswordResetEmail = (to: string, name: string, link: string): EmailMessage => ({
  to,
  subject: 'Reset your Let Him Cook password',
  text: `Hi ${name},\n\nUse this link to choose a new password:\n${link}\n\nThis link expires in 30 minutes and signs you out of all devices once used. If you did not ask for a password reset, you can ignore this email.`,
  html: `<p>Hi ${escapeHtml(name)},</p><p>Use this link to choose a new password.</p><p><a href="${escapeHtml(link)}">Reset my password</a></p><p>This link expires in 30 minutes and signs you out of all devices once used. If you did not ask for a password reset, you can ignore this email.</p>`,
});
