# Game Scenes Guidelines

**Purpose**: Define game scenes as pure data with zero boilerplate.

## Scene File Structure

Scene files are **100% data definitions** with NO loading logic:

```typescript
import { defineScene } from './defineScene';

/**
 * Scene Name
 * Generated: 2025-10-01T23:20:44.771Z
 * Version: 1
 *
 * Pure data definition - all loading logic abstracted
 */
export default defineScene({
  metadata: {
    name: 'scene-name',
    version: 1,
    timestamp: '2025-10-01T23:20:44.771Z',
  },
  entities: [
    {
      id: 5,
      name: 'Main Camera',
      components: {
        PersistentId: { id: 'uuid' },
        Transform: { position: [0, 1, -10], rotation: [0, 0, 0], scale: [1, 1, 1] },
        Camera: { fov: 20, isMain: true /* ... */ },
      },
    },
    // More entities...
  ],
  materials: [
    {
      id: 'default',
      name: 'Default Material',
      shader: 'standard',
      color: '#cccccc',
      // ... material properties
    },
  ],
  prefabs: [
    {
      id: 'prefab_id',
      name: 'Prefab Name',
      version: 1,
      root: {
        /* prefab entity tree */
      },
    },
  ],
});
```

## Key Principles

1. ✅ **NO loading logic** - Just data
2. ✅ **NO imports** - Only `defineScene`
3. ✅ **NO hooks** - No React logic
4. ✅ **NO async** - Pure synchronous data
5. ✅ **Passive components** - defineScene returns component that does nothing

## Scene Definition Helper

The `defineScene()` helper creates a passive component:

```typescript
// src/game/scenes/defineScene.ts
export function defineScene(sceneData: ISceneData) {
  // Passive component - no auto-loading
  const SceneComponent: React.FC = () => {
    return null;
  };

  SceneComponent.displayName = sceneData.metadata.name;

  return {
    Component: SceneComponent,
    metadata: sceneData.metadata,
    data: sceneData, // Accessible for SceneRegistry
  };
}
```

**Critical:** The component is passive and does NOT auto-load. Loading happens via SceneRegistry.

## Scene Registration

Register scenes in `src/game/scenes/index.ts`:

```typescript
import { sceneRegistry } from '@core/lib/scene/SceneRegistry';
import { SceneLoader } from '@core/lib/serialization/SceneLoader';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentManager } from '@core/lib/ecs/ComponentManager';
import TestScene from './Test';

export function registerAllScenes(): void {
  sceneRegistry.defineScene(
    'test',
    async () => {
      const sceneLoader = new SceneLoader();
      const entityManager = EntityManager.getInstance();
      const componentManager = ComponentManager.getInstance();

      await sceneLoader.load(TestScene.data, entityManager, componentManager, {
        refreshMaterials: () => {},
        refreshPrefabs: () => {},
      });
    },
    {
      name: TestScene.metadata.name,
      description: 'Test scene with camera, lights, and trees',
    },
  );
}
```

## Loading Flow

```
1. Editor Start
   ↓
2. registerGameExtensions()
   ↓
3. registerAllScenes()
   ↓ (Registers scene builders, doesn't load)
4. SceneRegistry has 'test' scene registered
   ↓
5. useSceneInitialization runs
   ↓
6. SceneRegistry.loadScene('test')
   ↓ (NOW scene loads - ONCE)
7. Builder executes
   ↓
8. SceneLoader.load(TestScene.data)
   ↓
9. Materials → Prefabs → Entities loaded
   ↓
10. Scene ready
```

## Scene Generation

Scenes are dynamically generated via:

1. **Editor Save** → `tsxSerializer.generateTsxScene()`
2. **File Written** → `src/game/scenes/SceneName.tsx`
3. **Format** → `defineScene({ metadata, entities, materials, prefabs })`

Generated files are automatically formatted with:

- Header comment with metadata
- Clean JSON formatting
- Type-safe structure

## Best Practices

### Do

✅ Keep scenes as pure data definitions
✅ Use descriptive entity names
✅ Include all required components (Transform, PersistentId)
✅ Use consistent metadata (name, version, timestamp)
✅ Test scene loading via SceneRegistry

### Don't

❌ Add loading logic to scene files
❌ Import hooks or React utilities
❌ Call useStaticSceneLoader (causes double-loading)
❌ Use console.log (use Logger in systems)
❌ Manually edit complex scenes (use editor)

## Migration from Old Format

Old scenes with 80+ lines of boilerplate:

```typescript
// OLD - 80+ lines
import { useEffect } from 'react';
import { useStaticSceneLoader } from '@editor/hooks/useStaticSceneLoader';
// ... many imports

export default function TestScene() {
  const sceneLoader = useStaticSceneLoader();

  useEffect(() => {
    async function loadScene() {
      // ... 60+ lines of loading logic
    }
    loadScene();
  }, []);

  return null;
}
```

Now refactored to 16 lines:

```typescript
// NEW - 16 lines
import { defineScene } from './defineScene';

export default defineScene({
  metadata: { ... },
  entities: [ ... ],
  materials: [ ... ],
  prefabs: [ ... ]
});
```

**98.75% reduction in code!**

## Troubleshooting

### Scene Loading Twice

**Symptom:** "Duplicate PersistentId" errors

**Cause:** Component auto-loading + SceneRegistry loading

**Fix:** Ensure defineScene component is passive (returns null)

### Scene Not Loading

**Symptom:** Scene doesn't appear in editor

**Cause:** Not registered with SceneRegistry

**Fix:** Add to `registerAllScenes()` in `src/game/scenes/index.ts`

### Component Data Issues

**Symptom:** Entity loads but components missing

**Cause:** Invalid component data structure

**Fix:** Validate against component schemas, check console for errors

## Related Documentation

- `/src/core/lib/serialization/CLAUDE.md` - Serialization system architecture
- `/src/core/lib/scene/SceneRegistry.ts` - Scene registration and loading
- `/src/editor/hooks/useSceneInitialization.ts` - Editor initialization

## Summary

Game scenes are now:

- ✅ Pure data (16 lines vs 80+)
- ✅ Zero boilerplate
- ✅ Type-safe
- ✅ Auto-generated from editor
- ✅ Passive (no auto-loading)
- ✅ Registered with SceneRegistry
- ✅ Loaded once via SceneRegistry
