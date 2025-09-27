# Core State Guidelines

**Purpose**: Global state management for core engine functionality.

**State Categories**:

- Engine configuration and settings
- Global runtime state (play/pause/stop)
- Performance metrics and monitoring
- Asset loading state
- User preferences and settings

**State Management**:

- Use Zustand for global state stores
- Immutable state updates only
- Type-safe state definitions with TypeScript
- Proper state persistence mechanisms

**Store Structure**:

- Separate stores for different concerns
- Clear state shape with interfaces
- Actions for state mutations
- Selectors for derived state

**Best Practices**:

- Keep state normalized and flat
- Avoid storing derived/computed values
- Use proper TypeScript types
- Implement proper error handling
- Document state shape and actions
