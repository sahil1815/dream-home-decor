/**
 * Centralized logging and error tracking module for Dream Home Decor.
 * Supports structured console output and optional Sentry error capturing.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

function formatLog(payload: LogPayload): string {
  const meta = payload.context ? ` | context: ${JSON.stringify(payload.context)}` : '';
  const err = payload.error ? ` | error: ${payload.error.name}: ${payload.error.message}` : '';
  return `[${payload.timestamp}] [${payload.level.toUpperCase()}] ${payload.message}${meta}${err}`;
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };
    console.log(formatLog(payload));
  },

  warn(message: string, context?: Record<string, unknown>) {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    };
    console.warn(formatLog(payload));
  },

  error(message: string, err?: unknown, context?: Record<string, unknown>) {
    const errorDetails =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : err
        ? { name: 'UnknownError', message: String(err) }
        : undefined;

    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context,
      error: errorDetails,
    };

    console.error(formatLog(payload));

    // Optional Sentry Free Tier webhook forwarding if SENTRY_DSN is set
    const sentryDsn = process.env.SENTRY_DSN;
    if (sentryDsn && errorDetails) {
      // Fire-and-forget reporting
      try {
        const dsnMatch = sentryDsn.match(/https:\/\/([^@]+)@([^/]+)\/(\d+)/);
        if (dsnMatch) {
          const [, publicKey, host, projectId] = dsnMatch;
          const url = `https://${host}/api/${projectId}/store/?sentry_version=7&sentry_key=${publicKey}&sentry_client=custom-logger/1.0`;
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `${message}: ${errorDetails.message}`,
              level: 'error',
              extra: context,
              timestamp: new Date().toISOString(),
            }),
          }).catch(() => {
            // ignore network errors
          });
        }
      } catch {
        // gracefully ignore Sentry serialization issues
      }
    }
  },
};
