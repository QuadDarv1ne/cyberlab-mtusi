const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  // eslint-disable-next-line no-console
  error: (...args: unknown[]) => { if (isDev) console.error(...args) },
  // eslint-disable-next-line no-console
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args) },
  // eslint-disable-next-line no-console
  log: (...args: unknown[]) => { if (isDev) console.log(...args) },
}
