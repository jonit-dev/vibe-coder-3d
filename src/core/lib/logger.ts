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
}

// Export default logger instance for quick usage
export const defaultLogger = Logger.create('Engine');

// Convenience exports
export { LogLevel as Level };
