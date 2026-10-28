import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './infrastructure/config/configuration.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { AuthModule } from './interface/http/auth/auth.module.js';
import { HealthController } from './interface/http/health.controller.js';
import { HierarchyModule } from './interface/http/hierarchy/hierarchy.module.js';
import { CollaborationModule } from './interface/websocket/collaboration/collaboration.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    HierarchyModule,
    CollaborationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
