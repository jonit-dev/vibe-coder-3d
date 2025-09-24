# Game Scenes

This directory contains scene definitions that can be loaded by the engine.

Scenes should be registered using the `registerScene` function from `@core` and follow the `ISceneDescriptor` interface.

Example:

```ts
import { registerScene } from '@core';

registerScene({
  id: 'game.main',
  load: async () => {
    // Scene loading logic here
  },
});
```

This directory currently contains scenes moved from the core engine:

- defaultScene.ts
- jsxExampleScene.tsx
- sampleScene.ts
- index.ts
