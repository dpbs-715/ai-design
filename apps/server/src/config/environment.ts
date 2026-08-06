export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production'
  PORT: number
  JSON_BODY_LIMIT_BYTES: number
  TRUST_PROXY_HOPS: number
  TRASH_RETENTION_DAYS: number
  WEB_ORIGIN: string
  POSTGRES_HOST: string
  POSTGRES_PORT: number
  POSTGRES_DB: string
  POSTGRES_USER: string
  POSTGRES_PASSWORD: string
  REDIS_HOST: string
  REDIS_PORT: number
  REDIS_USERNAME: string
  REDIS_PASSWORD: string
  SMTP_HOST: string
  SMTP_PORT: number
  SMTP_SECURE: boolean
  SMTP_USER: string
  SMTP_PASSWORD: string
  SMTP_FROM: string
  AGENT_MODEL_API_KEY: string
  AGENT_MODEL_NAME: string
  AGENT_MODEL_BASE_URL: string
  AGENT_MODEL_TIMEOUT_MS: number
}

const DEFAULT_SERVER_PORT = 3000
const DEFAULT_JSON_BODY_LIMIT_BYTES = 2 * 1024 * 1024
const DEFAULT_TRUST_PROXY_HOPS = 0
const DEFAULT_TRASH_RETENTION_DAYS = 30
const DEFAULT_WEB_ORIGIN = 'http://localhost:5173'
const DEFAULT_POSTGRES_HOST = '127.0.0.1'
const DEFAULT_REDIS_HOST = '127.0.0.1'
const DEFAULT_SMTP_HOST = 'smtp.qq.com'
const DEFAULT_SMTP_PORT = 465
const DEFAULT_AGENT_MODEL_TIMEOUT_MS = 120_000

function readRequiredString(
  environment: Record<string, unknown>,
  name: keyof EnvironmentVariables,
): string {
  const value = environment[name]

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function readBoolean(
  environment: Record<string, unknown>,
  name: keyof EnvironmentVariables,
  defaultValue: boolean,
): boolean {
  const value = environment[name] ?? defaultValue

  if (value === true || value === 'true') {
    return true
  }

  if (value === false || value === 'false') {
    return false
  }

  throw new Error(`Environment variable ${name} must be true or false`)
}

function readPort(
  environment: Record<string, unknown>,
  name: keyof EnvironmentVariables,
  defaultValue?: number,
): number {
  const value = environment[name] ?? defaultValue
  const port = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Environment variable ${name} must be a valid port`)
  }

  return port
}

function readNonNegativeInteger(
  environment: Record<string, unknown>,
  name: keyof EnvironmentVariables,
  defaultValue: number,
): number {
  const value = environment[name] ?? defaultValue
  const parsedValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`Environment variable ${name} must be a non-negative integer`)
  }

  return parsedValue
}

function readPositiveInteger(
  environment: Record<string, unknown>,
  name: keyof EnvironmentVariables,
  defaultValue: number,
): number {
  const value = readNonNegativeInteger(environment, name, defaultValue)

  if (value === 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`)
  }

  return value
}

export function validateEnvironment(environment: Record<string, unknown>): EnvironmentVariables {
  const nodeEnvironment = environment.NODE_ENV ?? 'development'

  if (!['development', 'test', 'production'].includes(String(nodeEnvironment))) {
    throw new Error('Environment variable NODE_ENV must be development, test, or production')
  }

  const smtpUser = readRequiredString(environment, 'SMTP_USER')

  return {
    NODE_ENV: nodeEnvironment as EnvironmentVariables['NODE_ENV'],
    PORT: readPort(environment, 'PORT', DEFAULT_SERVER_PORT),
    JSON_BODY_LIMIT_BYTES: readPositiveInteger(
      environment,
      'JSON_BODY_LIMIT_BYTES',
      DEFAULT_JSON_BODY_LIMIT_BYTES,
    ),
    TRUST_PROXY_HOPS: readNonNegativeInteger(
      environment,
      'TRUST_PROXY_HOPS',
      DEFAULT_TRUST_PROXY_HOPS,
    ),
    TRASH_RETENTION_DAYS: readPositiveInteger(
      environment,
      'TRASH_RETENTION_DAYS',
      DEFAULT_TRASH_RETENTION_DAYS,
    ),
    WEB_ORIGIN:
      typeof environment.WEB_ORIGIN === 'string' ? environment.WEB_ORIGIN : DEFAULT_WEB_ORIGIN,
    POSTGRES_HOST:
      typeof environment.POSTGRES_HOST === 'string'
        ? environment.POSTGRES_HOST
        : DEFAULT_POSTGRES_HOST,
    POSTGRES_PORT: readPort(environment, 'POSTGRES_PORT'),
    POSTGRES_DB: readRequiredString(environment, 'POSTGRES_DB'),
    POSTGRES_USER: readRequiredString(environment, 'POSTGRES_USER'),
    POSTGRES_PASSWORD: readRequiredString(environment, 'POSTGRES_PASSWORD'),
    REDIS_HOST:
      typeof environment.REDIS_HOST === 'string' ? environment.REDIS_HOST : DEFAULT_REDIS_HOST,
    REDIS_PORT: readPort(environment, 'REDIS_PORT'),
    REDIS_USERNAME: readRequiredString(environment, 'REDIS_USERNAME'),
    REDIS_PASSWORD: readRequiredString(environment, 'REDIS_PASSWORD'),
    SMTP_HOST:
      typeof environment.SMTP_HOST === 'string' ? environment.SMTP_HOST : DEFAULT_SMTP_HOST,
    SMTP_PORT: readPort(environment, 'SMTP_PORT', DEFAULT_SMTP_PORT),
    SMTP_SECURE: readBoolean(environment, 'SMTP_SECURE', true),
    SMTP_USER: smtpUser,
    SMTP_PASSWORD: readRequiredString(environment, 'SMTP_PASSWORD'),
    SMTP_FROM: typeof environment.SMTP_FROM === 'string' ? environment.SMTP_FROM : smtpUser,
    AGENT_MODEL_API_KEY: readRequiredString(environment, 'AGENT_MODEL_API_KEY'),
    AGENT_MODEL_NAME: readRequiredString(environment, 'AGENT_MODEL_NAME'),
    AGENT_MODEL_BASE_URL: readRequiredString(environment, 'AGENT_MODEL_BASE_URL'),
    AGENT_MODEL_TIMEOUT_MS: readPositiveInteger(
      environment,
      'AGENT_MODEL_TIMEOUT_MS',
      DEFAULT_AGENT_MODEL_TIMEOUT_MS,
    ),
  }
}
