/**
 * Structured logging utility for Cloudflare Workers
 */

import { LogContext } from '../types';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;
  private context: LogContext;

  constructor(level: string = 'info', context: LogContext = {}) {
    this.level = this.parseLogLevel(level);
    this.context = context;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, context: LogContext = {}): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...context,
    };
    return JSON.stringify(logEntry);
  }

  debug(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  error(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context));
    }
  }

  child(additionalContext: LogContext): Logger {
    return new Logger(
      Object.keys(LogLevel)[this.level],
      { ...this.context, ...additionalContext }
    );
  }
}

export function createLogger(env: { LOG_LEVEL?: string }, context: LogContext = {}): Logger {
  return new Logger(env.LOG_LEVEL || 'info', context);
}
