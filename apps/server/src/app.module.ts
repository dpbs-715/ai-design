import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { AuthModule } from './auth/auth.module.js'
import { validateEnvironment } from './config/environment.js'
import { DatabaseModule } from './database/database.module.js'
import { HealthModule } from './health/health.module.js'
import { RedisModule } from './redis/redis.module.js'

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [resolve(serverRoot, '../../env/.env')],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
