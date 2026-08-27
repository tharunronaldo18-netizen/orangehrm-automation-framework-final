/* Minimal structured logger so step output is consistent across
 * pages/api clients and easy to grep in CI logs. */
type Level = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(line));
}

export const Logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('INFO', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('WARN', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('ERROR', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log('DEBUG', msg, meta),
};
