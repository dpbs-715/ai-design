export interface AgentLogger {
  debug(message: string, meta?: Record<string, unknown>): void
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
}

export const consoleAgentLogger: AgentLogger = {
  debug: (message, meta) => console.debug(`[agents] ${message}`, meta ?? ''),
  info: (message, meta) => console.info(`[agents] ${message}`, meta ?? ''),
  warn: (message, meta) => console.warn(`[agents] ${message}`, meta ?? ''),
  error: (message, meta) => console.error(`[agents] ${message}`, meta ?? ''),
}

/** 什么都不做的 logger,用于测试。 */
export const silentAgentLogger: AgentLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}
