# Dependency Injection Guide

## Overview

The dependency injection (DI) system provides a structured alternative to the singleton pattern, improving testability and reducing tight coupling.

## Migration from Singletons

### Before (Singleton Pattern)
```typescript
// ❌ Tight coupling to singleton
export class MySystem {
  process() {
    const registry = ComponentRegistry.getInstance();
    const entityManager = EntityManager.getInstance();
    // ... logic
  }
}
```

### After (Dependency Injection)
```typescript
// ✅ Flexible dependencies
export class MySystem {
  constructor(
    private componentRegistry: ComponentRegistry,
    private entityManager: EntityManager,
    private logger: Logger
  ) {}

  process() {
    // Use injected dependencies
    const entities = this.entityManager.getAllEntities();
    // ... logic
  }

  static create(): MySystem {
    return new MySystem(
      container.resolve('ComponentRegistry'),
      container.resolve('EntityManager'),
      Logger.create('MySystem')
    );
  }
}
```

## Benefits

1. **Testability**: Easy to inject mocks for unit testing
2. **Flexibility**: Can swap implementations without changing code
3. **Explicit Dependencies**: Clear what each class depends on
4. **Memory Management**: Proper cleanup and lifecycle control

## Container Usage

### Registration
```typescript
// Register a class
container.registerClass(MyService);

// Register with factory
container.register('Logger', () => Logger.create('System'));

// Register instance
container.registerInstance('Config', config);
```

### Resolution
```typescript
// Resolve by class
const service = container.resolve(MyService);

// Resolve by string token
const logger = container.resolve<Logger>('Logger');
```

## Testing Pattern

```typescript
describe('MySystem', () => {
  let system: MySystem;
  let mockRegistry: jest.Mocked<ComponentRegistry>;
  let mockEntityManager: jest.Mocked<EntityManager>;

  beforeEach(() => {
    mockRegistry = createMock<ComponentRegistry>();
    mockEntityManager = createMock<EntityManager>();
    
    system = MySystem.createForTest(mockRegistry, mockEntityManager);
  });

  it('should process entities', () => {
    mockEntityManager.getAllEntities.mockReturnValue([]);
    system.process();
    expect(mockEntityManager.getAllEntities).toHaveBeenCalled();
  });
});
```

## Migration Strategy

1. **New Code**: Use DI pattern from the start
2. **Existing Singletons**: Gradual migration by:
   - Adding DI constructors alongside getInstance()
   - Registering singletons in container
   - Converting dependent code incrementally
   - Removing getInstance() when no longer used

## Container Configuration

The global container is configured in `main.tsx`:

```typescript
// Register existing singletons during transition
container.registerInstance('ComponentRegistry', ComponentRegistry.getInstance());
container.registerInstance('EntityManager', EntityManager.getInstance());
```