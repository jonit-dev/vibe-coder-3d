# Game Systems

This directory contains game-specific ECS systems that run during the engine update loop.

Systems should be registered using the `registerSystem` function from `@core` and follow the `ISystemDescriptor` interface.

Example:

```ts
import { registerSystem } from '@core';

registerSystem({
  id: 'game.health-system',
  order: 200,
  update: (dt) => {
    // System logic here
  },
});
```
