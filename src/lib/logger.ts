const isDev = process.env.NODE_ENV === 'development'
const logErrorsInProd = process.env.LOG_ERRORS === 'true'

function safeFormat(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (arg instanceof Error) {
      return `[${arg.name}] ${arg.message}${arg.stack ? '\n' + arg.stack : ''}`
    }
    return arg
  })
}

function writeError(args: unknown[]) {
  // eslint-disable-next-line no-console
  console.error(...safeFormat(args))
}

export const logger = {
  error: (...args: unknown[]) => {
    if (isDev || logErrorsInProd) {
      writeError(args)
    }
  },
  // eslint-disable-next-line no-console
  warn: (...args: unknown[]) => { if (isDev) console.warn(...args) },
  // eslint-disable-next-line no-console
  log: (...args: unknown[]) => { if (isDev) console.log(...args) },
}
