import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import type { AppConfig } from '../config/configuration.js';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redis = configService.getOrThrow<AppConfig['redis']>('redis');
        return new Redis({ host: redis.host, port: redis.port });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
