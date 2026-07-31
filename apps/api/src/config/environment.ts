export interface EnvironmentVariables {
  PORT: number
  POSTGRES_HOST: string
  POSTGRES_PORT: number
  POSTGRES_DB: string
  POSTGRES_USER: string
  POSTGRES_PASSWORD: string
  REDIS_HOST: string
  REDIS_PORT: number
  REDIS_USERNAME: string
  REDIS_PASSWORD: string
}

const DEFAULT_API_PORT = 3000
const DEFAULT_POSTGRES_HOST = '127.0.0.1'
const DEFAULT_REDIS_HOST = '127.0.0.1'

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

export function validateEnvironment(environment: Record<string, unknown>): EnvironmentVariables {
  return {
    PORT: readPort(environment, 'PORT', DEFAULT_API_PORT),
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
  }
}
