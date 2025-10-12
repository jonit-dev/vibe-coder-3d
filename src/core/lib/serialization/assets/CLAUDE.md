# Asset Library System

## Overview

The Asset Library System provides a centralized, reusable asset management infrastructure for materials, prefabs, input configurations, and scripts. Assets can be defined in external files and referenced from scenes using path-based references.

## Architecture

### Core Components

1. **Asset Types** (`AssetTypes.ts`)
   - Defines all supported asset types: `material`, `prefab`, `input`, `script`
   - Provides constants for file extensions and define function names
   - Exports utility functions for working with asset references

2. **Asset Reference Resolver** (`AssetReferenceResolver.ts`)
   - Resolves asset references to actual asset data
   - Supports two reference types:
     - **Library references**: `@/materials/common/Default`
     - **Scene-relative references**: `./materials/TreeGreen`
   - Caches resolved assets for performance
   - Automatically parses asset files using regex patterns

3. **Asset Library Catalog** (`AssetLibraryCatalog.ts`)
   - Scans and indexes all library assets
   - Provides fast lookup for asset existence
   - Used by serializer to determine library vs scene-local assets

4. **Browser Asset Loader** (`BrowserAssetLoader.ts`)
   - Client-side asset loader using Vite's `import.meta.glob`
   - Dynamically loads assets from library directories
   - Used by editor stores to populate asset registries

## Directory Structure

```
/src/game/assets/          # Asset library root
├── materials/
│   ├── common/
│   │   ├── Default.material.tsx
│   │   └── TestMaterial.material.tsx
│   └── CrateTexture.material.tsx
├── inputs/
│   └── Default.input.tsx
├── prefabs/
│   └── (prefab files)
└── scripts/
    └── (script files)
```

## Asset File Format

### Materials

```typescript
// src/game/assets/materials/common/Default.material.tsx
import { defineMaterial } from '@core/lib/serialization/assets/defineMaterials';

export default defineMaterial({
  id: 'default',
  name: 'Default Material',
  shader: 'standard',
  materialType: 'solid',
  color: '#cccccc',
  // ... other properties
});
```

### Multiple Materials (Scene-Local)

```typescript
// src/game/scenes/Forest/Forest.materials.tsx
import { defineMaterials } from '@core/lib/serialization/assets/defineMaterials';

export default defineMaterials([
  { id: 'TreeBark', name: 'Tree Bark', color: '#3d2817' },
  { id: 'Grass', name: 'Grass', color: '#2d5016' },
]);
```

### Input Assets

```typescript
// src/game/assets/inputs/Default.input.tsx
import { defineInputAsset } from '@core/lib/serialization/assets/defineInputAssets';
import { ActionType, ControlType, DeviceType, CompositeType } from '@core';

export default defineInputAsset({
  name: 'Default Input',
  controlSchemes: [...],
  actionMaps: [...],
});
```

## Asset References

### In Scene Files

Entities reference materials using `materialRef`:

```typescript
// Scene file with library reference
{
  id: 1,
  name: 'Cube',
  components: {
    MeshRenderer: {
      meshId: 'cube',
      materialRef: '@/materials/common/Default', // Library reference
    },
  },
}

// Scene file with scene-local reference
{
  id: 2,
  name: 'Tree',
  components: {
    MeshRenderer: {
      meshId: 'tree',
      materialRef: './materials/TreeBark', // Scene-local reference
    },
  },
}
```

### Multi-File Scenes

When using multi-file format, the serializer automatically:
1. Checks if a material exists in the library catalog
2. Uses `@/` reference if found in library
3. Falls back to `./` reference for scene-local materials
4. Extracts scene-local materials to `SceneName.materials.tsx`

## Loading Flow

### Editor Store Initialization

1. **Materials Store** (`materialsStore.ts`):
   ```typescript
   const loadLibraryMaterials = async () => {
     const loader = new BrowserAssetLoader();
     const libraryMaterials = await loader.loadMaterials();

     libraryMaterials.forEach((material) => {
       registry.upsert(material);
     });

     get()._refreshMaterials();
   };

   loadLibraryMaterials();
   ```

2. **Input Store** (`inputStore.ts`):
   ```typescript
   const loadDefaultInputAssets = async () => {
     const loader = new BrowserAssetLoader();
     const libraryInputs = await loader.loadInputAssets();
     return libraryInputs;
   };

   // Set initial state from loaded assets
   loadDefaultInputAssets().then((assets) => {
     set({ assets, currentAsset: assets[0]?.name });
   });
   ```

### Scene Loading

1. **Scene Loader** loads scene data
2. **MultiFileSceneLoader** resolves asset references:
   - Reads `materialRef` from entity
   - Uses `AssetReferenceResolver` to load asset file
   - Replaces reference with inline material data
   - Passes to deserializer

## Assets API

### Endpoints

#### POST `/api/assets/:type/save`
Save an asset to the library or scene.

**Request:**
```json
{
  "path": "@/materials/rocks/Granite",
  "payload": {
    "id": "Granite",
    "name": "Granite Material",
    "color": "#7a7a7a",
    "roughness": 0.85
  }
}
```

**Response:**
```json
{
  "success": true,
  "filename": "Granite.material.tsx",
  "path": "@/materials/rocks/Granite",
  "size": 425
}
```

#### GET `/api/assets/:type/load?path=...`
Load an asset from the library.

**Example:** `/api/assets/material/load?path=@/materials/common/Default`

**Response:**
```json
{
  "success": true,
  "filename": "Default.material.tsx",
  "payload": {
    "id": "default",
    "name": "Default Material",
    // ... asset data
  }
}
```

#### GET `/api/assets/:type/list?scope=library|scene&scene=...`
List all assets of a type.

**Example:** `/api/assets/material/list?scope=library`

**Response:**
```json
{
  "success": true,
  "assets": [
    {
      "filename": "Default.material.tsx",
      "path": "@/materials/common/Default",
      "size": 456,
      "type": "material"
    }
  ]
}
```

#### DELETE `/api/assets/:type/delete?path=...`
Delete an asset.

**Example:** `/api/assets/material/delete?path=@/materials/rocks/Granite`

## Integration

### Vite Configuration

```typescript
// vite.config.ts
import { createAssetsApi } from './src/plugins/assets-api/createAssetsApi';

export default defineConfig({
  plugins: [
    createAssetsApi({
      libraryRoot: 'src/game/assets',
      scenesRoot: 'src/game/scenes',
    }),
  ],
  server: {
    watch: {
      ignored: [
        '**/assets/**/*.material.tsx',
        '**/assets/**/*.prefab.tsx',
        '**/assets/**/*.input.tsx',
        '**/assets/**/*.script.tsx',
      ],
    },
  },
});
```

### Multi-File Serialization

```typescript
const serializer = new MultiFileSceneSerializer();
const sceneData = await serializer.serializeMultiFile(
  entities,
  metadata,
  materials,
  prefabs,
  inputAssets,
  {
    preferLibraryRefs: true, // Prefer @/ over ./
    libraryRoot: 'src/game/assets',
  }
);
```

## Define Helpers

All asset types have consistent define helpers:

```typescript
// Single asset
defineMaterial(asset)
definePrefab(asset)
defineInputAsset(asset)
defineScript(asset)

// Multiple assets
defineMaterials([...])
definePrefabs([...])
defineInputAssets([...])
defineScripts([...])
```

## Best Practices

1. **Shared Assets → Library**
   - Place reusable assets in `src/game/assets/`
   - Use descriptive directory structure
   - Reference with `@/` prefix

2. **Scene-Specific Assets → Scene-Local**
   - Place in `SceneName.materials.tsx` etc.
   - Reference with `./` prefix
   - Automatically extracted by multi-file serializer

3. **Asset IDs**
   - Use unique, descriptive IDs
   - Follow naming convention: PascalCase for library, camelCase for scene-local
   - IDs must be unique within their scope

4. **File Organization**
   - Group related assets in subdirectories
   - Use consistent naming: `AssetName.{type}.tsx`
   - Keep single assets in library, arrays in scene files

## Migration from Hardcoded Assets

### Before (Hardcoded in Store)
```typescript
const ensureTestMaterials = () => {
  registry.upsert({
    id: 'test123',
    name: 'Test Material',
    // ... properties
  });
};
```

### After (External File)
```typescript
// src/game/assets/materials/common/TestMaterial.material.tsx
export default defineMaterial({
  id: 'test123',
  name: 'Test Material',
  // ... properties
});

// Store loads automatically via BrowserAssetLoader
const loadLibraryMaterials = async () => {
  const loader = new BrowserAssetLoader();
  const materials = await loader.loadMaterials();
  materials.forEach(m => registry.upsert(m));
};
```

## Troubleshooting

### Asset Not Found
- Verify file exists in correct directory
- Check asset ID matches reference
- Ensure define function is exported as default
- Clear resolver cache: `resolver.clearCache()`

### Reference Resolution Fails
- Check reference format: `@/` or `./`
- Verify asset file extension is correct
- Check for syntax errors in asset file
- Review regex patterns in `parseAssetFile()`

### Store Not Loading Assets
- Verify `import.meta.glob` pattern matches files
- Check async loading completes before use
- Ensure BrowserAssetLoader is imported correctly
- Check browser console for errors

## Related Files

- `/src/core/lib/serialization/assets/` - Core asset system
- `/src/plugins/assets-api/` - Assets API implementation
- `/src/game/assets/` - Asset library root
- `/src/editor/store/materialsStore.ts` - Material store integration
- `/src/editor/store/inputStore.ts` - Input store integration
- `/vite.config.ts` - Assets API configuration
