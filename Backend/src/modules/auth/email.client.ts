import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import type { EmailMessage } from './interfaces/EmailMessage.js';

const isSmtpConfigured = env.smtpHost.length > 0;

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
  })
  : null;

export const sendEmail = async (message: EmailMessage): Promise<void> => {
  if (transporter) {
    await transporter.sendMail({ from: env.emailFrom, ...message });
    return;
  }

  if (env.nodeEnv === 'production') {
    throw new Error('SMTP is not configured, so account emails cannot be sent.');
  }

  // Development-only fallback: without SMTP settings, print the email so its link can be opened locally.
  console.info(`\n[dev email — not sent] To: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`);
};
