# Typed Scene Entities - VSCode Validation Guide

**Date:** 2025-10-10
**Status:** ✅ Active

## Overview

Scene entity components now have **compile-time type checking** in VSCode. This means you get instant feedback with red squiggly lines when you type invalid component data.

**✨ New Features:**

- `PersistentId` is now **optional**! If you don't provide it, a UUID will be auto-generated during scene loading.
- Entity `id` field is now **optional**! Scene entities no longer require manual ID tracking - IDs are auto-generated based on array position.

## How It Works

### Before (No Type Checking)

```typescript
{
  id: 0,  // Manual ID tracking required
  name: 'Camera',
  components: {
    PersistentId: { id: 'some-uuid' },  // Required UUID
    Transform: {
      positiion: [0, 0, 0],  // ❌ Typo not caught
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    }
  }
}
```

### After (With Type Checking + Auto-IDs)

```typescript
{
  // ✨ No id field needed - auto-generated from array position!
  name: 'Camera',
  components: {
    // ✨ No PersistentId needed - UUID auto-generated!
    Transform: {
      positiion: [0, 0, 0],  // 🔴 VSCode shows red squiggle
      // Error: Object literal may only specify known properties,
      // and 'positiion' does not exist in type 'ITransformComponent'.
      // Did you mean to write 'position'?
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    }
  }
}
```

## Auto-Generated IDs

### Why Auto-Generate?

**Entity IDs (`id` field):**

1. **Zero tracking overhead** - No need to manually assign sequential IDs
2. **Auto-derived from array position** - First entity is 0, second is 1, etc.
3. **Parent-child relationships work seamlessly** - Use numeric indices for `parentId`

**Persistent IDs (`PersistentId` component):**

1. **Less boilerplate** - No need to manually add PersistentId to every entity
2. **No duplicates** - UUIDs are guaranteed unique
3. **Cleaner scenes** - Scene files are simpler and easier to read
4. **Flexibility** - Still supports manual UUIDs when needed for stable references

### How It Works

When loading a scene, the EntitySerializer:

1. Checks if entity has a `PersistentId` component
2. If present, uses the provided ID
3. If missing, generates a new UUID automatically
4. Logs auto-generated IDs in debug mode

### Example

**Without PersistentId (Auto-Generated):**

```typescript
entities: [
  {
    id: 0,
    name: 'Camera',
    components: {
      Transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      Camera: { fov: 75, near: 0.1, far: 1000 /*...*/ },
      // ✨ No PersistentId - will be auto-generated!
    },
  },
];
```

**With PersistentId (Manual):**

```typescript
entities: [
  {
    id: 0,
    name: 'Camera',
    components: {
      PersistentId: { id: 'my-custom-camera-id' }, // Custom ID
      Transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      Camera: { fov: 75, near: 0.1, far: 1000 /*...*/ },
    },
  },
];
```

## Component Types

All component types are defined in `/src/core/types/components.ts`:

### Transform Component

```typescript
interface ITransformComponent {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}
```

### Camera Component

```typescript
interface ICameraComponent {
  fov: number;
  near: number;
  far: number;
  projectionType: 'perspective' | 'orthographic';
  orthographicSize: number;
  depth: number;
  isMain: boolean;
  clearFlags?: 'skybox' | 'solidColor' | 'depthOnly' | 'dontClear';
  // ... more properties
}
```

### PersistentId Component (Optional)

```typescript
interface IPersistentIdComponent {
  id: string; // UUID or custom ID
}
```

## Usage in Scene Files

Scene files automatically get type checking when using `defineScene`:

```typescript
import { defineScene } from './defineScene';

export default defineScene({
  metadata: {
    name: 'MyScene',
    version: 1,
    timestamp: '2025-10-10T00:00:00.000Z',
  },
  entities: [
    {
      id: 0,
      name: 'Main Camera',
      components: {
        // ✅ PersistentId is optional
        // ✅ Autocomplete available
        // ✅ Type checking enabled
        Transform: {
          position: [0, 1, -10],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        Camera: {
          fov: 75,
          near: 0.1,
          far: 1000,
          projectionType: 'perspective',
          // ... more properties
        },
      },
    },
  ],
  materials: [],
  prefabs: [],
});
```

## Features

### 1. **Autocomplete**

When typing inside `components`, VSCode shows available component types:

- Transform
- Camera
- Light
- MeshRenderer
- PersistentId (optional)
- RigidBody
- MeshCollider
- PrefabInstance
- Script

### 2. **Property Autocomplete**

Inside each component, VSCode shows available properties:

```typescript
Transform: {
  pos|  // ← Type "pos" and VSCode suggests "position"
}
```

### 3. **Type Validation**

Invalid types are highlighted immediately:

```typescript
Camera: {
  fov: "not a number",  // 🔴 Error: Type 'string' is not assignable to type 'number'
}
```

### 4. **Enum Validation**

Enum values are type-checked:

```typescript
Camera: {
  projectionType: 'invalid',  // 🔴 Error: Type '"invalid"' is not assignable to type '"perspective" | "orthographic"'
}
```

### 5. **Optional vs Required**

Optional fields (like PersistentId) can be omitted:

```typescript
components: {
  Transform: { /*...*/ },
  // PersistentId is optional - omit it for auto-generation
}
```

## Benefits

1. **✨ Less Boilerplate** - No need to manually add PersistentId
2. **Instant Feedback** - See errors as you type, not at runtime
3. **Autocomplete** - Discover available properties without docs
4. **Refactoring Safety** - Rename component properties with confidence
5. **Documentation** - Hover over properties to see types
6. **Fewer Bugs** - Catch typos and type errors before running code

## Best Practices

### When to Use Manual IDs

Use manual PersistentId when:

- You need stable IDs across saves/loads
- You're referencing entities from scripts
- You're setting up entity relationships

### When to Use Auto-Generated IDs

Use auto-generated IDs when:

- Creating simple scenes
- Prototyping
- Entities don't need stable references

## Example: Minimal Scene

```typescript
import { defineScene } from './defineScene';

export default defineScene({
  metadata: {
    name: 'MinimalScene',
    version: 1,
    timestamp: '2025-10-10T00:00:00.000Z',
  },
  entities: [
    {
      id: 0,
      name: 'Camera',
      components: {
        // ✨ No PersistentId - auto-generated!
        Transform: {
          position: [0, 5, -10],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        Camera: {
          fov: 60,
          near: 0.1,
          far: 1000,
          projectionType: 'perspective',
          orthographicSize: 10,
          depth: 0,
          isMain: true,
        },
      },
    },
  ],
  materials: [],
  prefabs: [],
});
```

## Related Files

- `/src/core/types/components.ts` - Component type definitions
- `/src/game/scenes/defineScene.ts` - Typed scene helper
- `/src/core/lib/serialization/EntitySerializer.ts` - Auto-ID generation logic
- `/src/core/index.ts` - Core exports

## Summary

Typed scene entities provide:

- ✅ Compile-time type safety
- ✅ Instant VSCode validation
- ✅ Autocomplete for all properties
- ✅ **Optional PersistentId with auto-generation**
- ✅ Cleaner, simpler scene files
- ✅ Fewer runtime errors

---

_Generated: 2025-10-10_
