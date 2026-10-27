/**
 * LifeXP — Configuracao centralizada a partir de variaveis de ambiente.
 * Segredos nunca sao hard-coded.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.includes("troque-este") || value.includes("troque-esta")) {
    throw new Error(
      `Variavel de ambiente obrigatoria nao definida ou em valor padrao de exemplo: ${name}`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const config = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: Number(optional("PORT", "3333")),
  apiBaseUrl: optional("API_BASE_URL", "http://localhost:3333"),
  webUrl: optional("WEB_URL", "http://localhost:5173"),
  frontendUrl: optional("FRONTEND_URL", "http://localhost:5173"),

  databaseUrl: required("DATABASE_URL"),
  readDatabaseUrl: optional("READ_DATABASE_URL", ""),
  enableReadReplica: optional("ENABLE_READ_REPLICA", "false") === "true",
  redisUrl: optional("REDIS_URL", "redis://localhost:6379"),

  appSecret: required("APP_SECRET"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtAccessTtlSeconds: Number(optional("JWT_ACCESS_TTL_SECONDS", "900")),
  jwtRefreshTtlDays: Number(optional("JWT_REFRESH_TTL_DAYS", "30")),
  refreshTokenRotation: optional("REFRESH_TOKEN_ROTATION", "true") !== "false",

  sessionCookieName: optional("SESSION_COOKIE_NAME", "lifexp_session"),
  sessionCookieDomain: optional("SESSION_COOKIE_DOMAIN", "") || undefined,
  sessionCookieSecure: optional("SESSION_COOKIE_SECURE", "false") === "true",
  sessionCookieSameSite: (optional("SESSION_COOKIE_SAME_SITE", "lax") as "lax" | "strict" | "none"),

  corsOrigin: optional("CORS_ORIGIN", "http://localhost:5173"),
  rateLimitWindowMs: Number(optional("RATE_LIMIT_WINDOW_MS", "60000")),
  rateLimitMax: Number(optional("RATE_LIMIT_MAX", "100")),

  smtpHost: optional("SMTP_HOST", ""),
  smtpPort: Number(optional("SMTP_PORT", "587")),
  smtpUser: optional("SMTP_USER", ""),
  smtpPass: optional("SMTP_PASS", ""),
  smtpFrom: optional("SMTP_FROM", "LifeXP <noreply@lifexp.local>"),
  emailEnabled: optional("EMAIL_ENABLED", "false") === "true",

  fcmProjectId: optional("FCM_PROJECT_ID", ""),
  apnsKeyId: optional("APNS_KEY_ID", ""),
  pushEnabled: optional("PUSH_ENABLED", "false") === "true",

  stripeSecretKey: optional("STRIPE_SECRET_KEY", ""),
  subscriptionEnabled: optional("SUBSCRIPTION_ENABLED", "false") === "true",

  logLevel: optional("LOG_LEVEL", "info"),
} as const;
