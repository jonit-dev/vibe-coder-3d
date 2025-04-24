# End-to-End 3D Model Import Workflow (Meshy.ai -> Mixamo -> Project)

This document provides a step-by-step guide for importing a 3D model created or obtained from Meshy.ai, rigging and animating it using Mixamo, and integrating it into the Vibe Coder 3D project.

## Workflow Overview

1.  **Model Acquisition (Meshy.ai):** Obtain your 3D model.
2.  **Model Export (Meshy.ai):** Export the model in a suitable format (FBX preferred).
3.  **Rigging & Animation (Mixamo):** Upload, auto-rig, and apply animations to the model.
4.  **Model Download (Mixamo):** Download the rigged and animated model (FBX format).
5.  **Project Setup:** Place the downloaded files into the correct project structure.
6.  **Asset Preparation Script:** Run the script to process textures.
7.  **Asset Manifest Update:** Register the new model in the project's asset manifest.
8.  **(Optional) GLB Conversion:** Convert the FBX to GLB format (recommended).

## Step-by-Step Guide

### 1. Model Acquisition & Export (Meshy.ai)

- **Create/Generate Model:** Use Meshy.ai's tools (e.g., Text to 3D, Image to 3D) to create your desired 3D model.
- **Refine (Optional):** Use Meshy.ai's editing or refinement features if needed.
- **Export:**
  - Navigate to the export options for your model.
  - **Choose FBX format.** This is generally the best format for compatibility with Mixamo and other 3D tools. If FBX is unavailable, OBJ is a secondary option, but FBX is strongly preferred as it can contain rigging and animation data.
  - Ensure textures are included with the export if possible (often embedded or provided as separate files).
  - Download the exported `.fbx` file and any associated texture files/folders.

### 2. Rigging & Animation (Mixamo)

- **Visit Mixamo:** Go to [www.mixamo.com](https://www.mixamo.com) and log in (Adobe account required).
- **Upload Character:**
  - Click "Upload Character".
  - Select the `.fbx` file you exported from Meshy.ai.
- **Auto-Rigger:**
  - Follow the on-screen instructions to place markers on key joints (chin, wrists, elbows, knees, groin).
  - Let Mixamo process the auto-rigging. Review the result and adjust markers if necessary.
- **Find Animations:**
  - Once rigging is complete, browse Mixamo's extensive animation library.
  - Select an animation you want to apply (e.g., "Idle", "Walking", "Running").
  - Fine-tune animation parameters (e.g., "Overwrite", "In Place") as needed.

### 3. Model Download (Mixamo)

- **Download Settings:**
  - With your character previewing the desired animation, click the "Download" button.
  - **Format:** Select `FBX Binary` (or `FBX for Unity` if available, as it's often a reliable FBX variant).
  - **Skin:** Select `With Skin`. This includes the model's geometry and textures along with the skeleton and animation. (Use `Without Skin` only if you are applying an animation to an _already_ rigged model file you possess).
  - **Frames per Second:** `30` is usually fine.
  - **Keyframe Reduction:** `None` (or choose a reduction level if optimization is needed later).
- **Download:** Click "Download". You will get an `.fbx` file containing the model, rig, and the selected animation.

### 4. Project Setup

- **Locate Files:** Find the `.fbx` file downloaded from Mixamo. If Meshy.ai provided textures separately, locate those as well.
- **Create Model Directory:**
  - Navigate to the `source_models/fbx/` directory in your project.
  - Create a new folder named after your model (e.g., `source_models/fbx/AlienGuard/`). Use PascalCase for the name.
- **Place Files:**

  - Move the downloaded `.fbx` file into the new model directory (e.g., `source_models/fbx/AlienGuard/AlienGuard.fbx`). **Rename the FBX file to match the directory name.**
  - **Crucially:** Mixamo usually embeds textures within the FBX. However, our `prepare-models` script currently looks for a `.fbm` folder containing textures, which is common when exporting _from_ 3D software like Blender/Maya, but not _from_ Mixamo downloads directly.
  - **Workaround/TODO:** You might need to manually extract textures from the FBX using software like Blender or modify the `prepare-models.js` script to handle FBX files with embedded textures (or skip texture copying if the final GLB conversion handles it). For now, if you have separate texture files from Meshy.ai, create a `.fbm` folder (e.g., `AlienGuard.fbm`) inside the model directory (`source_models/fbx/AlienGuard/`) and place the textures there.

  ```
  vibe-coder-3d/
  └── source_models/
      └── fbx/
          └── YourModelName/  <- PascalCase
              ├── YourModelName.fbx  <- Renamed to match folder
              └── YourModelName.fbm/ <- Optional: If textures are separate
                  └── texture_0.png
                  └── texture_1.jpg
                  └── ...
  ```

### 5. Asset Preparation Script

- **Run the Script:** Open your terminal in the project root and run:

  ```bash
  yarn prepare-models
  ```

- **Verification:** This script _should_ copy textures from the `.fbm` folder (if it exists) to `public/assets/models/YourModelName/textures/`. Check this public directory to confirm. As noted above, this step might need adjustment depending on how textures are handled from Mixamo FBX files.

### 6. (Optional but Recommended) Convert FBX to GLB

The web standard and preferred format for models in this project is GLTF/GLB. You should convert your FBX file.

- **Using Online Converters:** Search for "FBX to GLB converter" online. Many free tools exist (e.g., hosted versions of Facebook's FBX2glTF tool, or other online services). Upload your `.fbx` file from the `source_models` directory.
- **Using Blender:**
  1.  Open Blender.
  2.  Go to `File > Import > FBX (.fbx)`. Select your file from `source_models/fbx/YourModelName/`.
  3.  Go to `File > Export > glTF 2.0 (.glb/.gltf)`.
  4.  In the export settings (right panel):
      - **Format:** `glTF Binary (.glb)`
      - **Include:** Check "Selected Objects" (if you selected the imported object) or ensure the correct objects are included. Under "Data", check things like "Mesh", "Materials", "Animations". Make sure "Embed Textures" or similar is checked if applicable.
      - **Animation:** Ensure animations are included under the "Animation" tab settings.
  5.  Save the `.glb` file directly into the corresponding **public** assets folder: `public/assets/models/YourModelName/YourModelName.glb`.

### 7. Asset Manifest Update

- **Open Manifest:** Edit the file `src/config/assets.ts`.
- **Add Asset Key:** Add a unique key for your model to the `AssetKeys` enum:

  ```typescript
  export enum AssetKeys {
    // ... existing keys
    AlienGuard = 'AlienGuard', // Use PascalCase, matching folder name
  }
  ```

- **Add Asset Metadata:** Add an entry for your model in the `assets` object. Ensure the `url` points to the **final `.glb` file** in the `public` directory.

  ```typescript
  export const assets: AssetManifest = {
    // ... existing assets

    [AssetKeys.AlienGuard]: {
      key: AssetKeys.AlienGuard,
      type: 'gltf', // Use 'gltf' for .glb files
      url: '/assets/models/AlienGuard/AlienGuard.glb', // Path to the GLB in public/
      config: {
        // Optional: Add default scale, position, rotation, or other config
        scale: 1.0,
        // castShadow: true, // Example custom config
        // receiveShadow: true, // Example custom config
      },
      // Optional: Specify which animations are included (useful for code clarity)
      animations: ['Idle', 'Walk'], // Match animation names within the GLB
    },

    // You might also need to add textures to the manifest if they are separate
    // Example for a texture:
    // [AssetKeys.AlienGuardDiffuse]: {
    //   key: AssetKeys.AlienGuardDiffuse,
    //   type: 'texture',
    //   url: '/assets/models/AlienGuard/textures/AlienGuard_Diffuse.png',
    //   config: { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping }
    // }
  };
  ```

### 8. Usage in Code

You can now load and use your model in any component using the `useAsset` hook:

```typescript
import { useAsset } from '@/core/hooks/useAsset';
import { AssetKeys } from '@/config/assets';
import { useAnimations } from '@react-three/drei'; // For playing animations
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function ShowAlienGuard() {
  const { asset: gltf, config } = useAsset(AssetKeys.AlienGuard);
  const modelRef = useRef<THREE.Group>(null!);

  // Hook to manage animations embedded in the GLTF
  const { actions } = useAnimations(gltf?.animations || [], modelRef);

  useEffect(() => {
    // Play a specific animation
    actions?.['Idle']?.play(); // Use the animation name defined in the manifest/GLB
  }, [actions]);

  // Apply config if needed (scale, position etc.) - potentially handled by a specialized hook later
   useEffect(() => {
    if (gltf?.scene && modelRef.current && config) {
        const modelConfig = config as any; // Adjust type as needed
        if (modelConfig.scale) {
            modelRef.current.scale.setScalar(modelConfig.scale);
        }
        // Apply other configs...
    }
  }, [gltf, config]);


  return gltf ? <primitive object={gltf.scene.clone()} ref={modelRef} /> : null;
}
```

Remember to wrap components using `useAsset` in `<Suspense>`.

This completes the workflow. The key parts within the project are setting up the `source_models` directory correctly, running the `prepare-models` script (potentially adjusting it or manual steps for textures), converting to GLB, placing the GLB in the `public` directory, and updating the asset manifest.
