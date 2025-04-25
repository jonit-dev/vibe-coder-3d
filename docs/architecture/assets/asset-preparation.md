# 3D Model Asset Preparation Workflow

This document outlines the workflow for preparing 3D model assets for use in the Vibe Coder 3D application.

## Overview

The asset preparation workflow involves:

1. Placing source model files in the correct location
2. Running a script to automatically copy textures to the public directory
3. Adding the model to the asset manifest

## Requirements

- Node.js and Yarn installed
- Source model files (FBX format with textures)

## Directory Structure

```
vibe-coder-3d/
├── source_models/          # Source models directory (not deployed)
│   └── fbx/                # FBX format models
│       └── ModelName/      # Each model in its own directory
│           ├── ModelName.fbx
│           └── ModelName.fbm/  # Textures directory (typically created by FBX export)
│               └── texture_0.png
├── public/                 # Deployed assets
│   └── assets/
│       └── models/
│           └── ModelName/  # Each model in its own directory
│               ├── glb/        # Processed GLB model file(s)
│               │   └── ModelName.glb
│               ├── textures/   # Copied textures for this model
│               │   └── texture_0.png
│               └── animations/ # Optional animation files (e.g., GLB)
│                   └── AnimationName.glb
```

## Workflow Steps

### 1. Placing Source Models

1. Create a directory for your model under `source_models/fbx/`
2. Add your FBX file and its textures (typically in a `.fbm` subdirectory)

```bash
# Example directory structure for a model named "Character"
source_models/fbx/Character/Character.fbx
source_models/fbx/Character/Character.fbm/texture_0.png
```

### 2. Running the Preparation Script

We've created a script that automatically:

- Scans the `source_models/fbx` directory for model folders
- Creates the required directories in `public/assets/models/`
- Copies all textures to the appropriate destination

Run the script with:

```bash
yarn prepare-models
```

This script will:

1. Create directories under `public/assets/models/ModelName/textures/` as needed
2. Copy all textures from the source model's `.fbm` directory to the public directory
3. If no `.fbm` directory is found, it will search for texture files (PNG, JPG, etc.) in the model's directory

### 3. Adding to Asset Manifest

After preparing the model files, you need to add the model to the asset manifest:

1. Open `src/config/assets.ts`
2. Add a new entry to the `AssetKeys` enum:

```typescript
export enum AssetKeys {
  // ... existing keys
  MyNewModel = 'MyNewModel',
}
```

3. Add metadata for the asset in the `assets` object:

```typescript
export const assets: AssetManifest = {
  // ... existing assets
  [AssetKeys.MyNewModel]: {
    key: AssetKeys.MyNewModel,
    type: 'gltf',
    url: '/assets/models/MyNewModel/MyNewModel.glb', // Path relative to the public directory
    config: {
      // Optional configuration for this model
      scale: 1.0,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
  },
};
```

## Using the Asset in Your Code

Once the asset is prepared and added to the manifest, you can use it in your components:

```typescript
import { Suspense } from 'react';
import { useAsset } from '@/core/hooks/useAsset';
import { AssetKeys } from '@/config/assets';

function MyModelComponent() {
  const { asset: gltf, config } = useAsset(AssetKeys.MyNewModel);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {gltf && <primitive object={gltf.scene.clone()} />}
    </Suspense>
  );
}
```

## Troubleshooting

### Missing Textures

If textures are missing or not applied correctly:

1. Verify that textures were correctly copied by checking the `public/assets/models/ModelName/textures/` directory
2. Run `yarn prepare-models` again to ensure all textures are copied
3. Check that texture file names match those referenced in your model

### Script Fails

If the `prepare-models` script fails:

1. Ensure the source model directory structure is correct
2. Check if the model name and directory names match
3. Verify that the `.fbm` directory exists for your model

For more detailed information about asset management, see the [Asset Management](./architecture/assets.md) documentation.
