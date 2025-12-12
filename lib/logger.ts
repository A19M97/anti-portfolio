/**
 * Centralized logging utility for debugging and monitoring
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, data?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;

    if (data && Object.keys(data).length > 0) {
      return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`;
    }

    return `${prefix} ${message}`;
  }

  info(message: string, data?: LogContext) {
    console.log(this.formatMessage("info", message, data));
  }

  debug(message: string, data?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      console.log(this.formatMessage("debug", message, data));
    }
  }

  warn(message: string, data?: LogContext) {
    console.warn(this.formatMessage("warn", message, data));
  }

  error(message: string, error?: Error | unknown, data?: LogContext) {
    const errorData = {
      ...data,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    console.error(this.formatMessage("error", message, errorData));
  }

  /**
   * Log the start of an operation with timing
   */
  startOperation(operation: string, data?: LogContext): () => void {
    const startTime = Date.now();
    this.info(`Starting: ${operation}`, data);

    // Return a function to log completion
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Completed: ${operation}`, { ...data, durationMs: duration });
    };
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

// Pre-configured loggers for common modules
export const loggers = {
  api: createLogger("API"),
  anthropic: createLogger("Anthropic"),
  fileProcessing: createLogger("FileProcessing"),
  frontend: createLogger("Frontend"),
  db: createLogger("Database"),
};
