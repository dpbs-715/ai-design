import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { resolve } from 'node:path'

import { validateEnvironment } from './config/environment'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './health/health.module'
import { RedisModule } from './redis/redis.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [resolve(__dirname, '../.env'), resolve(__dirname, '../../../infra/.env')],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
  ],
})
export class AppModule {}
