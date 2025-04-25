# Asset Management Implementation

Implement a typed asset management system as outlined in `docs/architecture/assets/assets-overview.md`.

## Phase 1: Core Setup & Types

- [ ] Define core asset type interfaces (`IBaseAssetMetadata`, `IModelAssetMetadata`, `ITextureAssetMetadata`, `IAudioAssetMetadata`) in `src/core/types/assets.ts`
- [ ] Define asset configuration interfaces (`IModelConfig`, `ITextureConfig`, `IAudioConfig`) in `src/core/types/assets.ts`
- [ ] Define main manifest types (`IAssetMetadata`, `AssetManifest`) in `src/core/types/assets.ts`
- [ ] Create `AssetKeys` enum in `src/config/assets.ts`
- [ ] Create `assets: AssetManifest` object in `src/config/assets.ts`
- [ ] Create `getAssetMetadata` helper function in `src/config/assets.ts`
- [ ] Create basic `useAsset` hook signature and structure in `src/core/hooks/useAsset.ts` (returning placeholder data initially)
- [ ] Establish asset file organization structure in `public/assets/*`.

## Phase 2: Basic Asset Loading

- [ ] Implement GLTF model loading within `useAsset` using `useGLTF`.
- [ ] Implement standard texture loading (JPG, PNG, WebP) within `useAsset` using `useTexture`.
- [ ] Document basic usage of `useAsset` hook with `<Suspense>`.

## Phase 3: Configuration Application

- [ ] Implement applying model configuration (`scale`, `position`, `rotation`) in consuming components.
- [ ] Implement applying texture configuration (`wrapS`, `wrapT`, `repeat`, filters) in consuming components.

## Phase 4: Advanced Loading & Features

- [ ] Implement KTX2 texture loading/decoding within `useAsset`.
- [ ] Integrate KTX2 loader setup if not implicitly handled.
- [ ] Implement audio asset loading (potentially separate hook like `useSound`).

## Phase 5: DX Improvements & Enhancements

- [ ] Implement generic `useAsset` hook for improved type safety.
- [ ] Create specialized wrapper hooks (`useConfiguredModel`, `useConfiguredTexture`) to auto-apply config (refactoring config application from Phase 3).
- [ ] Create asset registration helper functions (`registerModel`, `registerTexture`).
- [ ] Implement asset groups for organized preloading (`AssetGroup` enum, `AssetPreloader` component).
- [ ] Enhance `useAsset` hook with error handling, fallbacks, and timeouts.
- [ ] Add backward compatibility to `useAsset` for direct URL loading.
- [ ] Develop `AssetExplorer` component for debugging.
- [ ] Create `validateAssetManifest` utility.

## Implementation Plan

The core idea is to centralize asset loading through a `useAsset` hook that reads from a typed manifest (`src/config/assets.ts`). This manifest maps asset keys (`AssetKeys`) to their metadata (URL, type, config). **Implementation will proceed in phases:**

1.  **Phase 1 (Core Setup):** Define all necessary TypeScript interfaces and set up the basic structure of the manifest file (`assets.ts`) and the `useAsset` hook. Establish the public asset folder structure.
2.  **Phase 2 (Basic Loading):** Implement the actual loading logic within `useAsset` for common asset types (GLTF models, standard textures) using `@react-three/drei` hooks. Ensure basic `<Suspense>` integration works.
3.  **Phase 3 (Configuration):** Enable the application of configuration properties (like scale, position, texture wrapping) defined in the manifest. Initially, this logic will reside in the components consuming the hook.
4.  **Phase 4 (Advanced Loading):** Add support for more complex formats like KTX2 textures and handle audio loading (potentially with a dedicated hook).
5.  **Phase 5 (DX & Enhancements):** Refine the system with generics for better type safety, create wrapper hooks to simplify usage (auto-applying configurations), implement preloading strategies, add robust error handling, and build development tools.

### Relevant Files

- `src/core/types/assets.ts` - Contains all type definitions for assets and metadata.
- `src/config/assets.ts` - Defines the `AssetKeys` enum and the `assets` manifest object.
- `src/core/hooks/useAsset.ts` - The central hook for loading assets.
- `docs/architecture/assets/assets-overview.md` - The source architecture document.
- `public/assets/` - Directory for storing asset files (models, textures, audio).
- Components using assets (e.g., `MyModelComponent.tsx`, `MyTexturedComponent.tsx`) - Will consume `useAsset`.
