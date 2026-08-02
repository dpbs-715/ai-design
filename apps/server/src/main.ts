import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'

import { AppModule } from './app.module.js'
import type { EnvironmentVariables } from './config/environment.js'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const config = app.get(ConfigService<EnvironmentVariables, true>)
  const port = config.get('PORT', { infer: true })
  const jsonBodyLimitBytes = config.get('JSON_BODY_LIMIT_BYTES', { infer: true })
  const trustProxyHops = config.get('TRUST_PROXY_HOPS', { infer: true })
  const express = app.getHttpAdapter().getInstance()

  express.disable('x-powered-by')
  if (trustProxyHops > 0) {
    express.set('trust proxy', trustProxyHops)
  }
  app.use(cookieParser())
  app.useBodyParser('json', { limit: jsonBodyLimitBytes })
  app.enableCors({
    origin: config.get('WEB_ORIGIN', { infer: true }),
    credentials: true,
  })
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()
  await app.listen(port)
}

void bootstrap()
