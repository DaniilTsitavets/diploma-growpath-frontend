type Context = Record<string, unknown>

function write(level: 'warn' | 'error', message: string, context?: Context) {
  const entry = { level, message, time: new Date().toISOString(), ...context }
  if (level === 'error') console.error(entry)
  else console.warn(entry)
}

export const logger = {
  warn: (message: string, context?: Context) => write('warn', message, context),
  error: (message: string, context?: Context) => write('error', message, context),
}
