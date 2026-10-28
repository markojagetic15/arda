import type { StringValue } from 'ms';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  frontendUrl: string;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
  };
  auth: {
    accessTokenSecret: string;
    accessTokenTtl: StringValue;
    refreshTokenTtlMs: number;
    passwordResetTtlMs: number;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'arda',
    password: process.env.DB_PASSWORD ?? 'arda',
    database: process.env.DB_DATABASE ?? 'arda',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  auth: {
    accessTokenSecret:
      process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    accessTokenTtl: (process.env.JWT_ACCESS_TTL ?? '15m') as StringValue,
    refreshTokenTtlMs: parseInt(
      process.env.JWT_REFRESH_TTL_MS ?? String(7 * 24 * 60 * 60 * 1000),
      10,
    ),
    passwordResetTtlMs: parseInt(
      process.env.PASSWORD_RESET_TTL_MS ?? String(15 * 60 * 1000),
      10,
    ),
  },
});
