# Game Components

This directory contains game-specific ECS components that extend the core engine.

Components should be registered using the `registerComponent` function from `@core` and follow the `IComponentDescriptor` interface.

Example:

```ts
import { registerComponent } from '@core';

registerComponent({
  id: 'game.health',
  schema: HealthSchema,
  serialize: (entityId) => {
    /* ... */
  },
  deserialize: (entityId, data) => {
    /* ... */
  },
});
```
