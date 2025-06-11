# Testing Setup

This project uses Vitest as the testing framework with React Testing Library for component testing.

## Testing Libraries

- **Vitest**: Fast unit test framework built on Vite
- **@testing-library/react**: Simple and complete testing utilities for React components
- **@testing-library/jest-dom**: Custom jest matchers for DOM assertions
- **@testing-library/user-event**: Fire events the same way a user does
- **jsdom**: DOM implementation for Node.js (for testing browser-like environment)

## Available Scripts

```bash
# Run tests in watch mode
yarn test

# Run tests with UI dashboard
yarn test:ui

# Run tests once
yarn test:run

# Run tests with coverage report
yarn test:coverage

# Run tests in watch mode
yarn test:watch
```

## Test File Structure

Tests should be placed in `__tests__` folders next to the code they test:

```
src/
├── components/
│   ├── MyComponent.tsx
│   └── __tests__/
│       └── MyComponent.test.tsx
├── hooks/
│   ├── useMyHook.ts
│   └── __tests__/
│       └── useMyHook.test.ts
└── utils/
    ├── myUtil.ts
    └── __tests__/
        └── myUtil.test.ts
```

## Test Utilities

The `src/test/utils.tsx` file provides:

- **Custom render functions**: `render()` and `renderWithCanvas()` for 3D components
- **Mock creators**: For ECS components, entity managers, stores
- **Helper functions**: For creating test data

## Example Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Mocking

### Three.js Components

Three.js components are automatically mocked in the test setup. Use `renderWithCanvas()` for components that need 3D context.

### ECS System

Use the provided mock creators:

```typescript
import { createMockEntityManager, createMockComponentManager } from '@/test/utils';

const mockEntityManager = createMockEntityManager();
const mockComponentManager = createMockComponentManager();
```

### Stores (Zustand)

Mock Zustand stores by mocking the store module:

```typescript
vi.mock('@/store/myStore', () => ({
  useMyStore: (selector) => selector(mockStoreData),
}));
```

## Configuration

The test configuration is in `vitest.config.ts` and includes:

- TypeScript support via Vite
- Path aliases from tsconfig.json
- jsdom environment for DOM testing
- Coverage reporting with v8
- HTML test reports

## Coverage

Coverage reports are generated in the `coverage/` directory and include:

- HTML report: `coverage/index.html`
- JSON report: `coverage/coverage.json`
- Text summary in terminal

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Mock external dependencies**
4. **Keep tests focused and isolated**
5. **Use data-testid for complex queries**
6. **Test error cases and edge conditions**
