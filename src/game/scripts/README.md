# Game Scripts

This directory contains Unity-like behavior scripts that can be attached to entities.

Scripts should be registered using the `registerScript` function from `@core` and follow the `IScriptDescriptor` interface.

Example:

```ts
import { registerScript } from '@core';

registerScript({
  id: 'game.player-controller',
  onInit: (entityId) => {
    /* ... */
  },
  onUpdate: (entityId, dt) => {
    /* ... */
  },
  onDestroy: (entityId) => {
    /* ... */
  },
});
```
