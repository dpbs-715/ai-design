import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import type { EnvironmentVariables } from './config/environment'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService<EnvironmentVariables, true>)
  const port = config.get('PORT', { infer: true })

  app.setGlobalPrefix('api')
  app.enableShutdownHooks()
  await app.listen(port)
}

void bootstrap()
