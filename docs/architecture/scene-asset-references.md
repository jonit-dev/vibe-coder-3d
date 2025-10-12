# Scene Asset References Architecture

## KISS Principle: ID-Based References with Conventions

Scene files now use **simple ID references** instead of verbose path references. Asset locations are determined by **convention**, not explicit paths.

## Format

### Scene File (KISS)
```typescript
export default defineScene({
  metadata: { name: "MyScene", ... },
  entities: [ /* entity data */ ],
  assetReferences: {
    materials: ["red", "blue", "default"],
    inputs: ["PlayerInput"],
    prefabs: ["Player", "Enemy"]
  }
});
```

### Conventions (Implicit)

| ID Reference | File Location |
|--------------|---------------|
| `"red"` (material) | `src/game/assets/materials/red.material.tsx` |
| `"PlayerInput"` (input) | `src/game/assets/inputs/PlayerInput.input.tsx` |
| `"Player"` (prefab) | `src/game/assets/prefabs/Player.prefab.tsx` |

**Rule:** `{type}` assets → `src/game/assets/{type}s/{id}.{type}.tsx`

## Save Workflow

When you save a scene in the editor:

1. **Extract Assets**
   - Materials from entities
   - Input assets from scene
   - Prefabs from scene

2. **Save as Separate Files**
   ```
   src/game/assets/materials/red.material.tsx
   src/game/assets/inputs/PlayerInput.input.tsx
   src/game/assets/prefabs/Player.prefab.tsx
   ```

3. **Generate Scene File** (KISS)
   - Just entities
   - Just asset IDs
   - No inline data!

## Load Workflow

When you load a scene:

1. **Parse Scene File**
   - Extract `assetReferences: { materials: ["red", "blue"] }`

2. **Convert IDs to Paths** (using convention)
   - `"red"` → `@/materials/red`

3. **Resolve Asset Files**
   - Load `src/game/assets/materials/red.material.tsx`
   - Parse and return data

4. **Return Full Scene Data**
   - Entities
   - Resolved materials
   - Ready for deserialization

## Backward Compatibility

The system supports both formats:

### Old Format (Path-Based)
```typescript
assetReferences: {
  materials: ['@/materials/red', '@/materials/common/Default']
}
```

### New Format (ID-Based) ✅
```typescript
assetReferences: {
  materials: ['red', 'default']
}
```

Both are automatically converted to full paths (`@/materials/red`) during load.

## Benefits

### KISS (Keep It Simple, Stupid)
- **Scene files**: Just IDs, not paths
- **Less verbose**: `"red"` vs `"@/materials/red"`
- **Easier to read**: Clear and concise

### Convention over Configuration
- **No path management**: Convention determines location
- **Predictable structure**: Always know where assets are
- **Easy refactoring**: Move files, update convention

### DRY (Don't Repeat Yourself)
- **Single source of truth**: Asset file = asset definition
- **No duplication**: Materials defined once, referenced everywhere
- **Reusability**: Share assets across scenes

## Example: Creating "Red" Material

### Before (387 lines)
```typescript
export default defineScene({
  metadata: { ... },
  entities: [ ... ],
  materials: [
    {
      id: "red",
      name: "Red",
      shader: "standard",
      materialType: "solid",
      color: "#ff0000",
      metalness: 0,
      roughness: 0.7,
      emissive: "#000000",
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
      textureRepeatX: 1,
      textureRepeatY: 1
    },
    // ... more materials
  ],
  inputAssets: [ ... 200 lines ... ],
  prefabs: [ ... ]
});
```

### After (101 lines) ✅
```typescript
export default defineScene({
  metadata: { ... },
  entities: [
    {
      id: 0,
      name: "Cube",
      components: {
        MeshRenderer: {
          meshId: "cube",
          materialId: "red"  // Just the ID!
        }
      }
    }
  ],
  assetReferences: {
    materials: ["red"],  // Convention: src/game/assets/materials/red.material.tsx
    inputs: ["PlayerInput"]
  }
});
```

**Material file** (`src/game/assets/materials/red.material.tsx`):
```typescript
import { defineMaterial } from '@core/lib/serialization/assets/defineMaterials';

export default defineMaterial({
  id: 'red',
  name: 'Red',
  shader: 'standard',
  materialType: 'solid',
  color: '#ff0000',
  metalness: 0,
  roughness: 0.7,
  // ... full definition
});
```

## Result

- **Scene file**: 101 lines (down from 387)
- **74% reduction**: Just entities + IDs
- **KISS**: No massive data dumps
- **Maintainable**: Edit materials in their own files
- **Reusable**: Share "red" material across all scenes

## Tests

Run tests to verify:
```bash
yarn test TsxFormatHandler.save.test.ts
yarn test TsxFormatHandler.integration.test.ts
yarn test TsxFormatHandler.roundtrip.test.ts
```

All tests validate:
- ✅ Materials saved as separate files
- ✅ Scene uses ID references (not paths)
- ✅ Round-trip preserves data integrity
- ✅ Scene file is KISS (< 50 lines for simple scenes)
