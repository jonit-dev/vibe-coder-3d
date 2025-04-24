# Asset Management Implementation

Implement the asset management system as described in `docs/architecture/assets/assets-overview.md`. This involves creating a type-safe asset manifest and a central hook for loading assets.

## Completed Tasks

- [ ] (None yet)

## In Progress Tasks

- [ ] **Define Asset Metadata Types:** Create TypeScript interfaces (`IBaseAssetMetadata`, `IModelAssetMetadata`, `ITextureAssetMetadata`, `IAudioAssetMetadata`, `IModelConfig`, `ITextureConfig`, `IAudioConfig`, `IAssetMetadata`, `AssetManifest`) in `src/core/types/assets.ts`.
- [ ] **Create Asset Manifest File:** Set up `src/config/assets.ts` with the `AssetKeys` enum, the main `assets` object, and the `getAssetMetadata` helper function.
- [ ] **Implement `useAsset` Hook:** Create the central `useAsset` hook in `src/core/hooks/useAsset.ts` which utilizes the manifest and delegates to appropriate `@react-three/drei` loaders (`useGLTF`, `useTexture`). Ensure it returns both the `asset` and `config`.
- [ ] **Establish Asset Organization:** Ensure the `public/assets/` folder structure (`models/`, `textures/`, `audio/`, `fonts/`) is in place.
- [ ] **Add Basic Example Usage:** Implement example components (`MyModelComponent`, `MyTexturedComponent`) demonstrating how to use `useAsset` and apply configuration, ensuring `<Suspense>` is used.
- [ ] **Document Loading Sequence:** Add or verify the Mermaid diagram illustrating the `useAsset` loading flow.

## Future Tasks

- [ ] **Implement Type-Safe Generics in `useAsset`:** Enhance `useAsset` with generics for improved type safety (as shown in "Advanced Features").
- [ ] **Create Specialized Wrapper Hooks:** Develop `useConfiguredModel`, `useConfiguredTexture`, etc., to automatically apply configuration from the manifest.
- [ ] **Develop Asset Registration Helpers:** Implement `registerModel`, `registerTexture` functions to streamline adding assets to the manifest.
- [ ] **Implement Asset Grouping & Preloading:** Define `AssetGroup` enum, add `groups` field to metadata, and create an `AssetPreloader` component.
- [ ] **Enhance Error Handling in `useAsset`:** Add options for fallback assets, error callbacks, and timeouts to `useAsset`.
- [ ] **Support Backward Compatibility:** Modify `useAsset` to optionally handle direct URL strings for gradual migration.
- [ ] **Create Development Tools:** Build an `AssetExplorer` component and a `validateAssetManifest` utility for improved developer experience.
- [ ] **Implement Audio Asset Loading:** Define how audio assets (type `'audio'`) are loaded (potentially via a separate `useSound` hook integrated with the manifest).

## Implementation Plan

The implementation will follow the steps outlined in the `assets-overview.md` document.

1.  **Core System:** First, implement the basic manifest structure, types, and the `useAsset` hook.
2.  **Basic Usage:** Add example components and ensure basic model/texture loading works correctly.
3.  **Advanced Features:** Incrementally add the advanced features like generics, wrapper hooks, preloading, error handling, and dev tools as needed or prioritized.

### Relevant Files

- `src/core/types/assets.ts` - Asset type definitions
- `src/config/assets.ts` - Asset manifest and keys
- `src/core/hooks/useAsset.ts` - Central asset loading hook
- `public/assets/` - Directory for storing asset files
- `docs/architecture/assets/assets-overview.md` - Architecture documentation
- `asset-tasklist.md` - This task list file
