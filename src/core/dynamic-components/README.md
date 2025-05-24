# Dynamic Components System (Refactored)

A modular, scalable, and maintainable component management system for ECS-based applications.

## Overview

The refactored dynamic components system follows SOLID principles and provides a clean separation of concerns:

- **Single Responsibility Principle (SRP)**: Each class has one clear responsibility
- **Open/Closed Principle**: Easy to extend with new component types
- **Dependency Inversion**: Depends on abstractions, not concrete implementations
- **KISS (Keep It Simple, Stupid)**: Simple, focused interfaces
- **DRY (Don't Repeat Yourself)**: Shared utilities and consistent patterns

## Architecture

### Core Components

1. **ComponentManager**: Main orchestrator that coordinates all services
2. **Services**: Focused services for specific responsibilities
   - `RegistryService`: Manages component descriptors
   - `ValidationService`: Validates component operations
   - `DependencyService`: Handles dependencies and conflicts
   - `EventService`: Manages component change events
   - `EntityService`: Tracks entity-component relationships
3. **Handlers**: Handle different component types
   - `BitEcsHandler`: For BitECS components
   - `EditorStoreHandler`: For editor store components
4. **Providers**: Provide access to handlers
   - `ComponentProvider`: Creates and caches component handlers

### Key Improvements

- **No Static Classes**: All services are instantiated, making testing easier
- **Dependency Injection**: Services receive dependencies through constructor
- **Interface-Based Design**: Easy to mock and test
- **Consistent Error Handling**: Centralized error logging and handling
- **Modular Structure**: Each concern is separated into its own module

## Usage

### Basic Usage

```typescript
import { createComponentManager } from '@/core/dynamic-components';

// Create a component manager
const componentManager = createComponentManager();

// Register components
componentManager.registerComponent(myComponentDescriptor);

// Add components to entities
await componentManager.addComponent(entityId, 'transform', { x: 0, y: 0, z: 0 });

// Remove components
await componentManager.removeComponent(entityId, 'transform');

// Update component data
await componentManager.updateComponent(entityId, 'transform', { x: 10, y: 0, z: 0 });
```

### With Editor Store Integration

```typescript
import { createComponentManagerWithEditor } from '@/core/dynamic-components';

const componentManager = createComponentManagerWithEditor(() => editorStore);
```

### For Testing

```typescript
import { createTestComponentManager } from '@/core/dynamic-components';

const componentManager = createTestComponentManager();
```

## Migration from Old System

The new system maintains backward compatibility with the old API:

```typescript
// Old way (still works)
import { DynamicComponentManager } from '@/core/dynamic-components';
const oldManager = DynamicComponentManager.getInstance();

// New way (recommended)
import { createComponentManager } from '@/core/dynamic-components';
const newManager = createComponentManager();
```

## Benefits

1. **Testability**: No static dependencies, easy to mock services
2. **Maintainability**: Clear separation of concerns
3. **Extensibility**: Easy to add new component types and handlers
4. **Performance**: Efficient caching and lazy loading
5. **Error Handling**: Consistent error reporting and logging
6. **Type Safety**: Full TypeScript support with proper interfaces

## File Structure

```
src/core/dynamic-components/
├── ComponentManager.ts          # Main orchestrator
├── factory.ts                   # Factory functions
├── types/
│   ├── core.ts                 # Core interfaces
│   └── index.ts                # Type exports
├── services/
│   ├── RegistryService.ts      # Component registration
│   ├── ValidationService.ts    # Validation logic
│   ├── DependencyService.ts    # Dependency management
│   ├── EventService.ts         # Event handling
│   ├── EntityService.ts        # Entity tracking
│   └── index.ts                # Service exports
├── handlers/
│   ├── BitEcsHandler.ts        # BitECS component handler
│   ├── EditorStoreHandler.ts   # Editor store handler
│   └── index.ts                # Handler exports
├── providers/
│   ├── ComponentProvider.ts    # Handler provider
│   └── index.ts                # Provider exports
├── utils/
│   ├── errors.ts               # Error utilities
│   └── index.ts                # Utility exports
└── index.ts                    # Main exports
```

## Testing

The new system is designed for easy testing:

```typescript
import { createTestComponentManager } from '@/core/dynamic-components';

describe('ComponentManager', () => {
  let manager: ComponentManager;

  beforeEach(() => {
    manager = createTestComponentManager();
  });

  afterEach(() => {
    manager.clear();
  });

  it('should add components', async () => {
    // Test implementation
  });
});
```
