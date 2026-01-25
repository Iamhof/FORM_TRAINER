/**
 * Enhanced Logger with Remote Logging Support
 * 
 * Features:
 * - Console logging for development
 * - Sentry breadcrumbs for production debugging
 * - Log buffering and batch sending
 * - Automatic sensitive data sanitization
 * - Configurable log levels
 * 
 * Environment Variables:
 * - EXPO_PUBLIC_LOG_LEVEL: debug|info|warn|error (default: debug in dev, error in prod)
 * - EXPO_PUBLIC_SENTRY_DSN: Sentry DSN for remote logging
 */

// Safe runtime check for __DEV__ to avoid parsing errors during build/transform
function getIsDev(): boolean {
  try {
    // Check if __DEV__ exists and is true
    const dev = (global as any).__DEV__;
    if (dev === true) return true;
    // Fallback to NODE_ENV check
    return process.env.NODE_ENV === 'development';
  } catch {
    // If any error occurs, default to NODE_ENV check
    return process.env.NODE_ENV === 'development';
  }
}

const isDev = getIsDev();
const logLevel = (process.env.EXPO_PUBLIC_LOG_LEVEL || (isDev ? 'debug' : 'error')) as 'debug' | 'info' | 'warn' | 'error';

const sensitiveKeys = ['token', 'password', 'access_token', 'authorization', 'secret', 'key'];

function sanitize(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Log buffer for batch sending
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: number;
}

class LoggerService {
  private buffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private sentryInitialized = false;

  constructor() {
    // Initialize Sentry integration if available
    this.initSentry();
    
    // Start periodic flush in production
    if (!isDev) {
      this.startPeriodicFlush();
    }
  }

  private initSentry() {
    // Only initialize in production with DSN configured
    if (isDev) return;
    
    const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (!sentryDsn) return;

    try {
      // Dynamically import Sentry to avoid errors if not installed
      const Sentry = require('@sentry/react-native');
      
      // Check if Sentry is already initialized (by error.service.ts)
      if ((Sentry as any).getCurrentHub?.().getClient()) {
        this.sentryInitialized = true;
        return;
      }

      // Initialize Sentry if not already done
      Sentry.init({
        dsn: sentryDsn,
        environment: process.env.NODE_ENV || 'production',
        tracesSampleRate: 0.1,
        // Enable breadcrumbs for better debugging
        maxBreadcrumbs: 100,
        beforeSend(event: any) {
          // Sanitize sensitive data in events
          if (event.request?.headers) {
            delete event.request.headers.authorization;
          }
          return event;
        },
      });

      this.sentryInitialized = true;
    } catch (error) {
      // Silently fail if Sentry is not available
      console.warn('[Logger] Sentry initialization skipped:', error);
    }
  }

  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private addToBuffer(entry: LogEntry) {
    this.buffer.push(entry);
    
    // Flush if buffer is full
    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  private flush() {
    if (this.buffer.length === 0) return;
    
    // Send buffered logs to Sentry as breadcrumbs
    if (this.sentryInitialized) {
      try {
        const Sentry = require('@sentry/react-native');
        
        this.buffer.forEach(entry => {
          Sentry.addBreadcrumb({
            level: entry.level as any,
            message: entry.message,
            data: entry.data,
            timestamp: entry.timestamp / 1000, // Sentry uses seconds
          });
        });
      } catch (error) {
        // Silently fail
      }
    }
    
    // Clear buffer
    this.buffer = [];
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[logLevel];
    const messageLevel = levels[level];
    return messageLevel >= currentLevel;
  }

  private formatMessage(args: any[]): { message: string; data?: any } {
    if (args.length === 0) return { message: '' };
    
    // First arg is typically the message
    const message = String(args[0]);
    
    // Additional args are treated as data
    const data = args.length > 1 ? args.slice(1).map(sanitize) : undefined;
    
    return { message, data: data && data.length > 0 ? data : undefined };
  }

  debug(...args: any[]) {
    if (!this.shouldLog('debug')) return;
    
    const sanitizedArgs = args.map(sanitize);
    console.log('[DEBUG]', ...sanitizedArgs);
    
    // Don't buffer debug logs in production
    if (isDev) return;
    
    const { message, data } = this.formatMessage(args);
    this.addToBuffer({
      level: 'debug',
      message,
      data,
      timestamp: Date.now(),
    });
  }

  info(...args: any[]) {
    if (!this.shouldLog('info')) return;
    
    const sanitizedArgs = args.map(sanitize);
    console.info('[INFO]', ...sanitizedArgs);
    
    const { message, data } = this.formatMessage(args);
    this.addToBuffer({
      level: 'info',
      message,
      data,
      timestamp: Date.now(),
    });
  }

  warn(...args: any[]) {
    if (!this.shouldLog('warn')) return;
    
    const sanitizedArgs = args.map(sanitize);
    console.warn('[WARN]', ...sanitizedArgs);
    
    const { message, data } = this.formatMessage(args);
    this.addToBuffer({
      level: 'warn',
      message,
      data,
      timestamp: Date.now(),
    });
  }

  error(...args: any[]) {
    if (!this.shouldLog('error')) return;
    
    const sanitizedArgs = args.map(sanitize);
    console.error('[ERROR]', ...sanitizedArgs);
    
    const { message, data } = this.formatMessage(args);
    this.addToBuffer({
      level: 'error',
      message,
      data,
      timestamp: Date.now(),
    });
    
    // Immediately flush errors to ensure they're captured
    if (!isDev) {
      this.flush();
    }
  }

  // Public method to manually flush logs
  flushLogs() {
    this.flush();
  }

  // Cleanup method for graceful shutdown
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // Final flush
  }

  // Expose sanitize for use by other services
  sanitize = sanitize;
}

// Export singleton instance
export const logger = new LoggerService();

