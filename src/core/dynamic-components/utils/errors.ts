/**
 * Error handling utilities for the dynamic components system
 */

export class ComponentError extends Error {
  constructor(
    message: string,
    public readonly componentId?: string,
    public readonly entityId?: number,
    public readonly operation?: string,
  ) {
    super(message);
    this.name = 'ComponentError';
  }
}

export class ValidationError extends ComponentError {
  constructor(
    message: string,
    componentId?: string,
    entityId?: number,
    public readonly validationErrors: string[] = [],
  ) {
    super(message, componentId, entityId, 'validation');
    this.name = 'ValidationError';
  }
}

export class DependencyError extends ComponentError {
  constructor(
    message: string,
    componentId?: string,
    public readonly missingDependencies: string[] = [],
    public readonly conflicts: string[] = [],
  ) {
    super(message, componentId, undefined, 'dependency');
    this.name = 'DependencyError';
  }
}

export class RegistrationError extends ComponentError {
  constructor(message: string, componentId?: string) {
    super(message, componentId, undefined, 'registration');
    this.name = 'RegistrationError';
  }
}

export interface IErrorContext {
  componentId?: string;
  entityId?: number;
  operation?: string;
  additionalData?: Record<string, any>;
}

export class ErrorLogger {
  private static logError(
    level: 'error' | 'warn' | 'debug',
    message: string,
    context?: IErrorContext,
  ): void {
    const logPrefix = `[DynamicComponents]`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const fullMessage = `${logPrefix} ${message}${contextStr}`;

    switch (level) {
      case 'error':
        console.error(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'debug':
        console.debug(fullMessage);
        break;
    }
  }

  static error(message: string, context?: IErrorContext): void {
    this.logError('error', message, context);
  }

  static warn(message: string, context?: IErrorContext): void {
    this.logError('warn', message, context);
  }

  static debug(message: string, context?: IErrorContext): void {
    this.logError('debug', message, context);
  }
}

export const createValidationResult = (
  valid: boolean,
  errors: string[] = [],
  warnings: string[] = [],
  missingDependencies: string[] = [],
  conflicts: string[] = [],
) => ({
  valid,
  errors,
  warnings,
  missingDependencies,
  conflicts,
});

export const createSuccessResult = (warnings: string[] = []) =>
  createValidationResult(true, [], warnings);

export const createErrorResult = (errors: string[], warnings: string[] = []) =>
  createValidationResult(false, errors, warnings);
