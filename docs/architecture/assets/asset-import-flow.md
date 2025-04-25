# 3D Asset Import Flow

This document outlines the process for importing 3D models and animations into the project, covering steps from concept to integration into a scene.

## Overview

The typical flow involves creating or obtaining a 3D model, processing it and its animations using Mixamo, preparing the assets for the project using a script, defining metadata, creating a React component wrapper, and finally integrating the model into a scene.

## Step-by-Step Process

1.  **Model Concept & Creation/Download:**

    - Start with a concept for your 3D model or obtain it from a source like an AI model generator (e.g., meshy.ai).
    - Download the model in FBX format. Often, this will be provided as a ZIP archive containing the FBX file. Extract it if necessary.

2.  **Prepare Base Model in Mixamo:**

    - Upload the extracted FBX model file to Adobe Mixamo.
    - Once uploaded, search for and select the "T-pose" animation.
    - Click "Download". In the download settings, ensure the format is FBX and the "Pose" is "T-pose". Crucially, select **"With Skin"** from the "Skin" dropdown.
    - Download the file.
    - Rename the downloaded file to `ModelName_T-Pose.fbx` (replace `ModelName` with your model's actual name).
    - Save this file in your project under `source_models/fbx/ModelNameHere/ModelName_T-Pose.fbx`.

3.  **Download Animations from Mixamo:**

    - While still in Mixamo with your model loaded, select the desired animations (e.g., search for "Idle" and choose one like "Standing Idle").
    - Click "Download". In the download settings, ensure the format is FBX. Crucially, select **"Without Skin"** from the "Skin" dropdown.
    - Download the file.
    - Rename the downloaded file descriptively, like `ModelName_Standing_Idle.fbx`.
    - Place this animation FBX file under `source_models/fbx/ModelNameHere/animations/`. Repeat this for any other required animations.
    - Your `source_models` directory should resemble this structure:
      ```
      source_models/
      └── fbx/
          └── ModelNameHere/
              ├── animations/
              │   └── ModelName_Standing_Idle.fbx
              │   └── (other_animation_files.fbx...)
              └── ModelName_T-Pose.fbx
      ```

4.  **Prepare Assets for Project Use:**

    - **Prerequisite:** Ensure Blender is installed on your system (Linux/WSL). If not, you can often install it by running the script: `scripts/blender-install.sh`. Check the script for details or specific instructions for your environment.
    - Once Blender is installed, run the asset preparation script from the project root:
      ```bash
      yarn prepare-models
      ```
    - This script (defined in `package.json` and likely using `scripts/basic-model-compression.js`) processes the raw FBX files (the T-pose model and animations), optimizes them (e.g., compression, converting to GLTF/GLB), applies animations, and places the processed assets into the `public/assets/models/` directory, ready for loading in the application.

5.  **Setup Model Metadata:**

    - Create a metadata entry for your model. Refer to `nightStalkerTextureMetadata.ts` (or similar asset metadata files) as an example.
    - This metadata file will typically define paths to the processed model and animation files, initial animation states, and other configuration details needed by the application's asset loading system.

6.  **Create React Wrapper Component:**

    - Create a dedicated React component to wrap and manage your 3D model. Refer to `@/game/models/NightStalkerModel.tsx` as an example.
    - This component will handle loading the model and its animations using hooks like `useAsset` and `useModelAnimations`.
    - It should encapsulate the Three.js logic for the specific model, making it reusable and easier to manage within different scenes.

7.  **Integrate into a Scene:**
    - Place your new model wrapper component into a Three.js scene component. Refer to `@/components/NightStalkerDemo.tsx` as an example.
    - Position and scale the model as needed within the scene's coordinate system.
    - Handle interactions, animations, and other scene-specific logic within or around the model component.

This process ensures that raw assets are properly prepared and integrated into the React/Three.js environment for use in the application.
