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

// Import type-safe runtime utility for development mode detection
import { isDevelopmentMode } from './runtime-utils';

const isDev = isDevelopmentMode();
const logLevel = (process.env.EXPO_PUBLIC_LOG_LEVEL || (isDev ? 'debug' : 'error')) as 'debug' | 'info' | 'warn' | 'error';

// Detect if running in serverless/Node.js environment (not React Native)
// This prevents trying to load @sentry/react-native in Vercel functions
function isServerless(): boolean {
  return typeof process !== 'undefined' && (
    process.env.VERCEL === '1' ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
    // No React Native globals present (navigator exists in RN but not pure Node)
    typeof navigator === 'undefined'
  );
}

const isServerlessEnv = isServerless();

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

// Log buffer for batch sending and on-device inspection
export interface LogEntry {
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

  // In-memory ring buffer for on-device log inspection (TestFlight debugging).
  // Always active regardless of log level so production issues can be diagnosed
  // by viewing recent entries on the device without a debugger attached.
  private readonly ringBuffer: LogEntry[] = [];
  private readonly RING_BUFFER_SIZE = 200;

  constructor() {
    // Initialize Sentry integration if available
    // Skip in serverless - @sentry/react-native won't work in Node.js
    if (!isServerlessEnv) {
      this.initSentry();
    }

    // Start periodic flush in production
    // Skip in serverless - functions are stateless, no point buffering
    if (!isDev && !isServerlessEnv) {
      this.startPeriodicFlush();
    }
  }

  private initSentry() {
    // Only initialize in production with DSN configured
    if (isDev) return;

    // Skip in serverless environments - @sentry/react-native doesn't work in Node.js
    if (isServerlessEnv) return;

    const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (!sentryDsn) return;

    try {
      // Dynamically import Sentry to avoid errors if not installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- Conditional require for optional React Native dependency
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
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- Conditional require for optional React Native dependency
        const Sentry = require('@sentry/react-native');

        this.buffer.forEach(entry => {
          Sentry.addBreadcrumb({
            level: entry.level,
            message: entry.message,
            data: entry.data,
            timestamp: entry.timestamp / 1000, // Sentry uses seconds
          });
        });
      } catch {
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
    const { message, data } = this.formatMessage(args);
    const entry: LogEntry = { level: 'debug', message, data, timestamp: Date.now() };

    // Always capture to ring buffer for TestFlight diagnostics
    this.addToRingBuffer(entry);

    if (!this.shouldLog('debug')) return;
    
    const sanitizedArgs = args.map(sanitize);
    console.info('[DEBUG]', ...sanitizedArgs);
    
    // Don't buffer debug logs in production
    if (isDev) return;
    
    this.addToBuffer(entry);
  }

  info(...args: any[]) {
    const { message, data } = this.formatMessage(args);
    const entry: LogEntry = { level: 'info', message, data, timestamp: Date.now() };

    // Always capture to ring buffer for TestFlight diagnostics
    this.addToRingBuffer(entry);

    if (!this.shouldLog('info')) return;
    
    const sanitizedArgs = args.map(sanitize);
    console.info('[INFO]', ...sanitizedArgs);
    
    this.addToBuffer(entry);
  }

  warn(...args: any[]) {
    const { message, data } = this.formatMessage(args);
    const entry: LogEntry = { level: 'warn', message, data, timestamp: Date.now() };

    // Always capture to ring buffer for TestFlight diagnostics
    this.addToRingBuffer(entry);

    if (!this.shouldLog('warn')) return;
    
    const sanitizedArgs = args.map(sanitize);
    console.warn('[WARN]', ...sanitizedArgs);
    
    this.addToBuffer(entry);
  }

  error(...args: any[]) {
    const { message, data } = this.formatMessage(args);
    const entry: LogEntry = { level: 'error', message, data, timestamp: Date.now() };

    // Always capture to ring buffer for TestFlight diagnostics
    this.addToRingBuffer(entry);

    if (!this.shouldLog('error')) return;
    
    const sanitizedArgs = args.map(sanitize);
    console.error('[ERROR]', ...sanitizedArgs);
    
    this.addToBuffer(entry);
    
    // Immediately flush errors to ensure they're captured
    if (!isDev) {
      this.flush();
    }
  }

  private addToRingBuffer(entry: LogEntry) {
    this.ringBuffer.push(entry);
    if (this.ringBuffer.length > this.RING_BUFFER_SIZE) {
      this.ringBuffer.shift();
    }
  }

  /**
   * Returns the most recent log entries from the in-memory ring buffer.
   * Useful for on-device diagnostics in TestFlight builds where no debugger
   * is attached. Call this from a hidden debug screen or share-sheet action.
   *
   * @param count - Maximum number of entries to return (default: 50)
   * @returns Array of recent log entries, newest last
   */
  getRecentLogs(count = 50): LogEntry[] {
    return this.ringBuffer.slice(-count);
  }

  /**
   * Returns the recent logs formatted as a human-readable string,
   * suitable for copy-to-clipboard or sharing from a debug screen.
   */
  getRecentLogsFormatted(count = 50): string {
    return this.getRecentLogs(count)
      .map(entry => {
        const time = new Date(entry.timestamp).toISOString();
        const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
        return `[${time}] ${entry.level.toUpperCase()} ${entry.message}${dataStr}`;
      })
      .join('\n');
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

