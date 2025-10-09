/**
 * Simple, lightweight logging utility for the Vibe Coder 3D engine
 * Provides structured logging with namespaces and different log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface ILoggerConfig {
  level: LogLevel;
  enableColors: boolean;
  enableTimestamps: boolean;
  enableNamespaces: boolean;
}

// Default configuration
const DEFAULT_CONFIG: ILoggerConfig = {
  level: LogLevel.INFO,
  enableColors: true,
  enableTimestamps: true,
  enableNamespaces: true,
};

// Global configuration
let globalConfig: ILoggerConfig = { ...DEFAULT_CONFIG };

// ANSI color codes for console styling
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
} as const;

/**
 * Logger class for structured logging with namespaces
 */
export class Logger {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  /**
   * Create a new logger instance with a namespace
   */
  static create(namespace: string): Logger {
    return new Logger(namespace);
  }

  /**
   * Configure global logger settings
   */
  static configure(config: Partial<ILoggerConfig>): void {
    globalConfig = { ...globalConfig, ...config };
  }

  /**
   * Set global log level
   */
  static setLevel(level: LogLevel): void {
    globalConfig.level = level;
  }

  /**
   * Configure for production environment
   */
  static configureForProduction(): void {
    globalConfig = {
      level: LogLevel.WARN, // Only warnings and errors in production
      enableColors: false,
      enableTimestamps: true,
      enableNamespaces: true,
    };
  }

  /**
   * Configure for development environment
   */
  static configureForDevelopment(): void {
    globalConfig = {
      level: LogLevel.DEBUG,
      enableColors: true,
      enableTimestamps: true,
      enableNamespaces: true,
    };
  }

  /**
   * Debug level logging
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Info level logging
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Warning level logging
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Error level logging
   */
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    // Check if log level is enabled
    if (level < globalConfig.level) {
      return;
    }

    // In production, filter out debug/info logs completely
    if (import.meta.env?.PROD && level < LogLevel.WARN) {
      return;
    }

    const parts: string[] = [];

    // Add timestamp
    if (globalConfig.enableTimestamps) {
      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, -5);
      const timestampColor = globalConfig.enableColors ? Colors.gray : '';
      const resetColor = globalConfig.enableColors ? Colors.reset : '';
      parts.push(`${timestampColor}[${timestamp}]${resetColor}`);
    }

    // Add namespace
    if (globalConfig.enableNamespaces) {
      const namespaceColor = globalConfig.enableColors ? Colors.cyan : '';
      const resetColor = globalConfig.enableColors ? Colors.reset : '';
      parts.push(`${namespaceColor}[${this.namespace}]${resetColor}`);
    }

    // Add level indicator with color
    const levelInfo = this.getLevelInfo(level);
    const levelColor = globalConfig.enableColors ? levelInfo.color : '';
    const resetColor = globalConfig.enableColors ? Colors.reset : '';
    parts.push(`${levelColor}${levelInfo.label}${resetColor}`);

    // Format the complete log line
    const prefix = parts.join(' ');
    const fullMessage = `${prefix} ${message}`;

    // Output to appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage, ...args);
        break;
      case LogLevel.INFO:
        console.info(fullMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(fullMessage, ...args);
        break;
    }
  }

  /**
   * Get level-specific styling information
   */
  private getLevelInfo(level: LogLevel): { label: string; color: string } {
    switch (level) {
      case LogLevel.DEBUG:
        return { label: 'DEBUG', color: Colors.gray };
      case LogLevel.INFO:
        return { label: 'INFO ', color: Colors.blue };
      case LogLevel.WARN:
        return { label: 'WARN ', color: Colors.yellow };
      case LogLevel.ERROR:
        return { label: 'ERROR', color: Colors.red };
      default:
        return { label: 'LOG  ', color: Colors.white };
    }
  }

  /**
   * Create a child logger with a sub-namespace
   */
  child(subNamespace: string): Logger {
    return new Logger(`${this.namespace}:${subNamespace}`);
  }

  /**
   * Log execution time of a function
   */
  time<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    this.debug(`${label} took ${(end - start).toFixed(2)}ms`);
    return result;
  }

  /**
   * Log execution time of an async function
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    this.debug(`${label} took ${(end - start).toFixed(2)}ms`);
    return result;
  }

  /**
   * Start tracking a named operation (returns a function to end tracking)
   */
  startTracker(operationName: string): () => void {
    const startTime = performance.now();
    const appStartTime = (window as any).__appStartTime;

    this.info(`${operationName} started`, {
      timestamp: startTime,
      timeFromAppStart: appStartTime ? `${(startTime - appStartTime).toFixed(2)}ms` : 'unknown'
    });

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.info(`${operationName} completed`, {
        duration: `${duration.toFixed(2)}ms`,
        timeFromAppStart: appStartTime ? `${(endTime - appStartTime).toFixed(2)}ms` : 'unknown'
      });
    };
  }

  /**
   * Track multiple sequential steps in a process
   */
  createStepTracker(processName: string) {
    const startTime = performance.now();
    const appStartTime = (window as any).__appStartTime;
    let lastStepTime = startTime;
    let stepCount = 0;

    this.info(`${processName} process started`, {
      timestamp: startTime,
      timeFromAppStart: appStartTime ? `${(startTime - appStartTime).toFixed(2)}ms` : 'unknown'
    });

    return {
      step: (stepName: string) => {
        const now = performance.now();
        const stepDuration = now - lastStepTime;
        const totalDuration = now - startTime;
        stepCount++;

        this.info(`${processName} - Step ${stepCount}: ${stepName}`, {
          stepDuration: `${stepDuration.toFixed(2)}ms`,
          totalDuration: `${totalDuration.toFixed(2)}ms`,
          timeFromAppStart: appStartTime ? `${(now - appStartTime).toFixed(2)}ms` : 'unknown'
        });

        lastStepTime = now;
      },
      complete: () => {
        const endTime = performance.now();
        const totalDuration = endTime - startTime;

        this.info(`${processName} process completed`, {
          totalSteps: stepCount,
          totalDuration: `${totalDuration.toFixed(2)}ms`,
          timeFromAppStart: appStartTime ? `${(endTime - appStartTime).toFixed(2)}ms` : 'unknown'
        });
      }
    };
  }

  /**
   * Track performance milestones (cumulative timing from app start)
   */
  milestone(milestoneName: string, additionalData?: Record<string, any>) {
    const now = performance.now();
    const appStartTime = (window as any).__appStartTime;

    this.info(`🏁 MILESTONE: ${milestoneName}`, {
      timeFromAppStart: appStartTime ? `${(now - appStartTime).toFixed(2)}ms` : 'unknown',
      timestamp: now,
      ...additionalData
    });
  }
}

// Export default logger instance for quick usage
export const defaultLogger = Logger.create('Engine');

// Convenience exports
export { LogLevel as Level };
