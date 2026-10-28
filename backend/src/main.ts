import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';
import type { AppConfig } from './infrastructure/config/configuration.js';
import { DomainExceptionFilter } from './interface/http/common/domain-exception.filter.js';
import { RedisIoAdapter } from './infrastructure/realtime/redis-io.adapter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Behind the Caddy proxy in production: take the client IP (stored on
  // sessions) from X-Forwarded-For.
  app.set('trust proxy', 1);
  const configService = app.get(ConfigService);

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: configService.getOrThrow<AppConfig['corsOrigin']>('corsOrigin'),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());

  await app.listen(configService.getOrThrow<AppConfig['port']>('port'));
}
await bootstrap();
