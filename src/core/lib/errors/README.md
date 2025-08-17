# Error Handling Guide

## Overview

The centralized error handling system provides consistent error processing, logging, and reporting across the entire application.

## Migration from Inconsistent Patterns

### Before (Inconsistent)
```typescript
// ❌ Inconsistent error handling patterns
try {
  doSomething();
} catch (error) {
  console.error('Something failed:', error);
  // Inconsistent error message format
  return error instanceof Error ? error.message : String(error);
}
```

### After (Centralized)
```typescript
// ✅ Consistent error handling
import { handleError, handleAsyncError } from '@/core/lib/errors';

try {
  doSomething();
} catch (error) {
  const errorInfo = handleError(error, 'ComponentName.methodName');
  return null; // or appropriate fallback
}

// For async operations
const result = await handleAsyncError(
  () => asyncOperation(),
  'ComponentName.asyncMethod'
);
```

## Usage Patterns

### Basic Error Handling
```typescript
import { handleError } from '@/core/lib/errors';

function processData(data: unknown) {
  try {
    return validateAndProcess(data);
  } catch (error) {
    handleError(error, 'DataProcessor.processData', 'medium');
    return null;
  }
}
```

### React Component Error Handling
```typescript
import { useErrorHandler, ErrorBoundary } from '@/core/lib/errors';

function MyComponent() {
  const handleError = useErrorHandler('MyComponent');

  const onClick = () => {
    try {
      riskyOperation();
    } catch (error) {
      handleError(error, 'high');
    }
  };

  return (
    <ErrorBoundary context="MyComponent" fallback={<div>Failed to load</div>}>
      <button onClick={onClick}>Click me</button>
    </ErrorBoundary>
  );
}
```

### Async Operations
```typescript
import { handleAsyncError } from '@/core/lib/errors';

async function loadData() {
  const data = await handleAsyncError(
    () => fetch('/api/data').then(r => r.json()),
    'DataLoader.loadData',
    'medium'
  );

  return data; // null if error occurred
}
```

## Error Severity Levels

- **low**: Debug information, non-critical issues
- **medium**: Warnings, recoverable errors (default)  
- **high**: Errors that affect functionality
- **critical**: System-breaking errors

## Error Context Naming

Use descriptive context strings following this pattern:
- `ComponentName.methodName` for React components
- `ServiceName.operation` for services
- `SystemName.process` for systems

Examples:
- `ScriptSystem.executeScript`
- `ComponentRegistry.addComponent`
- `EntityMesh.renderModel`

## Error Reporting

Add custom error reporters for external services:

```typescript
import { errorHandler } from '@/core/lib/errors';

// Add custom reporter
errorHandler.addReporter((errorInfo) => {
  if (errorInfo.severity === 'critical') {
    // Send to external monitoring service
    sendToSentry(errorInfo);
  }
});
```

## Benefits

1. **Consistency**: All errors handled the same way
2. **Logging**: Automatic structured logging with appropriate levels
3. **Debugging**: Better error context and stack traces
4. **Monitoring**: Easy integration with external services
5. **Testing**: Predictable error handling for unit tests

## Migration Strategy

1. **New Code**: Use error handling utilities from the start
2. **Existing Code**: Replace `console.error` patterns incrementally
3. **React Components**: Wrap with ErrorBoundary where appropriate
4. **Services**: Use handleError/handleAsyncError consistently