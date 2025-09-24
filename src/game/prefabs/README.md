# Game Prefabs

This directory contains prefab definitions - reusable entity templates.

Prefabs should be registered using the `registerPrefab` function from `@core` and follow the `IPrefabDescriptor` interface.

Example:

```ts
import { registerPrefab } from '@core';

registerPrefab({
  id: 'game.player',
  create: (params = {}) => {
    // Create and return entity ID
    return entityId;
  },
});
```
