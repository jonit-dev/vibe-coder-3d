/**
 * Error handling exports
 * Provides centralized error management utilities
 */

export {
  ErrorHandler,
  errorHandler,
  handleError,
  handleAsyncError,
  handleSyncError,
  type IErrorHandler,
  type IErrorInfo,
} from './ErrorHandler';

export { ErrorBoundary, useErrorHandler } from './ErrorBoundary';