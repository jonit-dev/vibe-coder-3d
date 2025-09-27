/**
 * Centralized Error Handling System
 * Provides consistent error processing, logging, and reporting
 */

import { Logger } from '../logger';

export interface IErrorInfo {
  message: string;
  code?: string;
  context?: string;
  stack?: string;
  originalError?: unknown;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface IErrorHandler {
  handle(error: unknown, context: string, severity?: IErrorInfo['severity']): IErrorInfo;
  logError(errorInfo: IErrorInfo): void;
  reportError(errorInfo: IErrorInfo): void;
}

/**
 * Centralized error handler that provides consistent error processing
 */
export class ErrorHandler implements IErrorHandler {
  private logger = Logger.create('ErrorHandler');
  private errorReporters: Array<(errorInfo: IErrorInfo) => void> = [];

  /**
   * Register an error reporter (e.g., for sending to external services)
   */
  addReporter(reporter: (errorInfo: IErrorInfo) => void): void {
    this.errorReporters.push(reporter);
  }

  /**
   * Handle and process an error with context
   */
  handle(error: unknown, context: string, severity: IErrorInfo['severity'] = 'medium'): IErrorInfo {
    const errorInfo: IErrorInfo = {
      message: this.extractMessage(error),
      context,
      severity,
      timestamp: new Date(),
      originalError: error,
    };

    // Add error code if available
    if (error instanceof Error && 'code' in error) {
      errorInfo.code = (error as Error & { code: string }).code;
    }

    // Add stack trace for Error objects
    if (error instanceof Error) {
      errorInfo.stack = error.stack;
    }

    // Log the error
    this.logError(errorInfo);

    // Report to external services if configured
    this.reportError(errorInfo);

    return errorInfo;
  }

  /**
   * Log error with appropriate level based on severity
   */
  logError(errorInfo: IErrorInfo): void {
    const logMessage = `[${errorInfo.context}] ${errorInfo.message}`;
    const logData = {
      code: errorInfo.code,
      severity: errorInfo.severity,
      stack: errorInfo.stack,
    };

    switch (errorInfo.severity) {
      case 'low':
        this.logger.debug(logMessage, logData);
        break;
      case 'medium':
        this.logger.warn(logMessage, logData);
        break;
      case 'high':
        this.logger.error(logMessage, logData);
        break;
      case 'critical':
        this.logger.error(`CRITICAL: ${logMessage}`, logData);
        break;
    }
  }

  /**
   * Report error to external services
   */
  reportError(errorInfo: IErrorInfo): void {
    // Only report medium and above severity errors
    if (errorInfo.severity === 'low') {
      return;
    }

    for (const reporter of this.errorReporters) {
      try {
        reporter(errorInfo);
      } catch (reportingError) {
        this.logger.error('Failed to report error:', reportingError);
      }
    }
  }

  /**
   * Extract meaningful message from various error types
   */
  private extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      // Try common error properties
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
      if ('msg' in error && typeof error.msg === 'string') {
        return error.msg;
      }
      if ('error' in error && typeof error.error === 'string') {
        return error.error;
      }
      // Fallback to JSON stringify
      try {
        return JSON.stringify(error);
      } catch {
        return 'Unable to serialize error object';
      }
    }

    return String(error);
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

/**
 * Convenience function for handling errors consistently
 */
export function handleError(
  error: unknown,
  context: string,
  severity: IErrorInfo['severity'] = 'medium',
): IErrorInfo {
  return errorHandler.handle(error, context, severity);
}

/**
 * Async wrapper that handles errors in async functions
 */
export async function handleAsyncError<T>(
  fn: () => Promise<T>,
  context: string,
  severity: IErrorInfo['severity'] = 'medium',
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context, severity);
    return null;
  }
}

/**
 * Sync wrapper that handles errors in sync functions
 */
export function handleSyncError<T>(
  fn: () => T,
  context: string,
  severity: IErrorInfo['severity'] = 'medium',
): T | null {
  try {
    return fn();
  } catch (error) {
    handleError(error, context, severity);
    return null;
  }
}
