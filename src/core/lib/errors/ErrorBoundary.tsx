/**
 * React Error Boundary Component
 * Provides consistent error handling for React component trees
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler, IErrorInfo } from './ErrorHandler';

interface IErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
}

interface IErrorBoundaryState {
  hasError: boolean;
  errorInfo: IErrorInfo | null;
}

/**
 * React Error Boundary that integrates with our centralized error handling
 */
export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(_: Error): Partial<IErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context = this.props.context || 'React Component';

    // Handle error with our centralized system
    const processedError = errorHandler.handle(error, context, 'high');

    this.setState({ errorInfo: processedError });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary p-4 border border-red-500 bg-red-50 rounded">
          <h2 className="text-red-800 font-bold">Something went wrong</h2>
          {this.state.errorInfo && (
            <details className="mt-2">
              <summary className="text-red-600 cursor-pointer">Error Details</summary>
              <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                {this.state.errorInfo.message}
              </pre>
              {this.state.errorInfo.stack && (
                <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
                  {this.state.errorInfo.stack}
                </pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler(context: string = 'Component') {
  return React.useCallback(
    (error: unknown, severity: IErrorInfo['severity'] = 'medium') => {
      errorHandler.handle(error, context, severity);
    },
    [context],
  );
}
