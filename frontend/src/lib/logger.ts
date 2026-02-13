type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  context: string;
  message: string;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

const SERVICE_NAME = "ecosfer-skdm-frontend";
const isProduction = process.env.NODE_ENV === "production";

function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}

function writeLog(
  level: LogLevel,
  context: string,
  data?: Record<string, unknown>,
  error?: unknown
): void {
  if (isProduction) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: SERVICE_NAME,
      context,
      message: data?.message as string || context,
      ...data,
    };

    if (error) {
      const formatted = formatError(error);
      entry.error = formatted.message;
      if (formatted.stack) {
        entry.stack = formatted.stack;
      }
    }

    const json = JSON.stringify(entry);
    switch (level) {
      case "error":
        console.error(json);
        break;
      case "warn":
        console.warn(json);
        break;
      default:
        console.log(json);
    }
  } else {
    const prefix = `[${level.toUpperCase()}] [${context}]`;
    const extra = data ? ` ${JSON.stringify(data)}` : "";

    switch (level) {
      case "error":
        if (error) {
          console.error(prefix, error, extra || undefined);
        } else {
          console.error(prefix, extra || undefined);
        }
        break;
      case "warn":
        console.warn(prefix, extra || undefined);
        break;
      default:
        console.log(prefix, extra || undefined);
    }
  }
}

export function logError(
  context: string,
  error: unknown,
  data?: Record<string, unknown>
): void {
  writeLog("error", context, data, error);
}

export function logInfo(
  context: string,
  data?: Record<string, unknown>
): void {
  writeLog("info", context, data);
}

export function logWarn(
  context: string,
  data?: Record<string, unknown>
): void {
  writeLog("warn", context, data);
}
