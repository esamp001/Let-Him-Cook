import 'dotenv/config';

// Development-only default for the seeded admin account; change it with ADMIN_PASSWORD.
export const defaultAdminPassword = 'Admin@12345';

const parsePort = (value: string | undefined) => {
  const port = Number(value ?? 4000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number.');
  }

  return port;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL ?? 'qwen3:4b',
  // Recipe imports are extraction work, so they can use a smaller local model.
  // Leaving this unset keeps the existing model and behaviour unchanged.
  ollamaImportModel: process.env.OLLAMA_IMPORT_MODEL ?? process.env.OLLAMA_MODEL ?? 'qwen3:4b',
  theMealDbBaseUrl: process.env.THEMEALDB_BASE_URL ?? 'https://www.themealdb.com/api/json/v1/1',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  // Points at the frontend dev server so the Vite proxy forwards the callback and the
  // final redirect to /Home lands on the frontend.
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:5173/api/v1/auth/google/callback',
  // The frontend address used in emailed verification and password reset links.
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  emailFrom: process.env.EMAIL_FROM ?? 'Let Him Cook <no-reply@localhost>',
  // Number of reverse proxies (such as Nginx) in front of Express, so rate limits see the real client IP.
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS ?? 0),
  // The admin account created by the admin seed. The defaults are for local development only;
  // the seed refuses to use the default password in production.
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@lethimcook.local',
  adminName: process.env.ADMIN_NAME ?? 'Let Him Cook Admin',
  adminPassword: process.env.ADMIN_PASSWORD ?? defaultAdminPassword,
};
