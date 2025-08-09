import React from 'react';

interface IModelErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

interface IModelErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMesh?: React.ReactNode;
  entityId?: number;
}

export class ModelErrorBoundary extends React.Component<
  IModelErrorBoundaryProps,
  IModelErrorBoundaryState
> {
  constructor(props: IModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): IModelErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorMessage: error.message || 'Unknown model loading error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ModelErrorBoundary] Model loading error for entity ${this.props.entityId}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      // Return fallback mesh or default error mesh
      return (
        this.props.fallbackMesh || (
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ff4444" wireframe />
          </mesh>
        )
      );
    }

    return this.props.children;
  }
}
