# Animation Asset Externalization PRD

## Overview

### Context & Goals

- Honor the existing asset-reference architecture so animations become
  first-class files resolved via IDs exactly like materials, leveraging the
  documented convention-over-configuration pipeline (docs/architecture/scene-
  asset-references.md:5).
- Mirror the material workflow—authoring modal, browser, registry-backed
  store, and filesystem asset writes—so animation clips can be created,
  duplicated, and assigned with the same ergonomics provided today in
  MaterialCreateModal and MaterialBrowserModal (src/editor/components/
  materials/MaterialCreateModal.tsx:22, src/editor/components/materials/
  MaterialBrowserModal.tsx:19).
- Feed the Animation Timeline editor with reusable assets rather than entity-
  local blobs so clip edits propagate everywhere and remain Git-friendly
  (src/editor/store/timelineStore.ts:19).
- Keep runtime deterministic by letting AnimationSystem pull clips from a
  registry instead of per-entity copies, matching how MaterialRegistry feeds
  renderers (src/core/systems/AnimationSystem.ts:64).

### Current Pain Points

- Scene files embed full clip payloads (clips[] with every keyframe),
  which inflates files and prevents reuse; see the inline timeline stored
  under the Animation component in animationsystem.tsx (src/game/scenes/
  animationsystem.tsx:160).
- AnimationComponentSchema mixes playback state with clip definitions, so any
  change to a timeline requires touching entity components and reserializing
  entire clips (src/core/components/animation/AnimationComponent.ts:21).
- The materials pipeline already proves out slugged IDs, registry caches,
  and FsAssetStore emission, but animations lack any asset type entry
  in AssetType, the assets API allowlist, or the file writer (src/core/
  lib/serialization/assets/AssetTypes.ts:9, src/plugins/assets-api/
  createAssetsApi.ts:111, src/plugins/assets-api/FsAssetStore.ts:99).
- The timeline store writes edits straight back into the component registry,
  so clips can’t be reused or versioned independently (src/editor/store/
  timelineStore.ts:75).
- Scene loading only resolves materials via assetReferences → materialRef,
  leaving animations as inline JSON even though the same resolver tooling
  exists (src/plugins/scene-api/formats/TsxFormatHandler.ts:561, src/core/
  lib/serialization/multi-file/MultiFileSceneLoader.ts:18).

## Proposed Solution

### High-level Summary

- Introduce animation asset schemas (defineAnimationClip/
  defineAnimationClips) that wrap the existing ClipSchema plus metadata,
  stored under src/game/assets/animations/\*.animation.tsx.
- Extend the asset infrastructure (types, API, store, resolver, browser
  loader, catalogs) with a new animation type so animation clips move through
  the same code paths as materials and prefabs.
- Refactor AnimationComponent to hold lightweight clipBindings (asset
  references + per-entity overrides) and keep runtime clip data inside an
  AnimationRegistry.
- Update scene save/load (TsxFormatHandler, SceneSerializer,
  MultiFile loader) to extract inline clips into asset files, add
  assetReferences.animations, and convert IDs back on load, with migration
  support for legacy inline components.
- Build editor UX parity: an Animation Browser/Create flow, integration with
  the timeline panel, and an AnimationAssetService that saves clips via the /
  api/assets/animation/save endpoint like the material UI already does.

### Architecture & Directory Structure

src/
├── core/
│ ├── animation/
│ │ ├── AnimationRegistry.ts
│ │ └── assets/
│ │ └── defineAnimations.ts
│ ├── lib/serialization/
│ │ ├── assets/ (AssetTypes, AssetReferenceResolver, BrowserAssetLoader…)
│ │ ├── multi-file/
│ │ │ └── AnimationExtraction.ts
│ │ └── SceneSerializer.ts
├── editor/
│ ├── components/
│ │ └── animations/
│ │ ├── AnimationBrowserModal.tsx
│ │ └── AnimationCreateModal.tsx
│ └── store/
│ └── animationsStore.ts
├── plugins/
│ ├── assets-api/
│ │ └── FsAssetStore.ts
│ └── scene-api/
│ └── formats/TsxFormatHandler.ts
└── game/
├── assets/
│ └── animations/
│ └── _.animation.tsx
└── scenes/
└── _.tsx (with assetReferences.animations)

## Implementation Plan

### Phase 1: Asset Schema & Runtime Registry (1 day)

1. Create defineAnimationClip(s) helpers using ClipSchema with metadata
   (tags, author, preview).
2. Add AnimationRegistry mirroring MaterialRegistry for loading/indexing
   clips by ID.
3. Extend BrowserAssetLoader to eagerly load /src/game/assets/animations/\*_/
   _.animation.tsx when editor bootstraps.

### Phase 2: Asset Pipeline Integration (1 day)

1. Add 'animation' to AssetType, ASSET_EXTENSIONS, ASSET_DEFINE_FUNCTIONS,
   and the assets API allowlist.
2. Teach FsAssetStore.generateAssetFile how to serialize clip assets (default
   omission, pretty JSON, optional arrays).
3. Update AssetReferenceResolver/AssetLibraryCatalog to parse .animation.tsx
   files and resolve refs.
4. Ensure /api/assets/animation/\* routes read/write animation files to src/
   game/assets/animations.

### Phase 3: Scene Serialization & Migration (1.5 days)

1. Extend SceneSerializer to collect animation assets from the registry and
   include animations array or references.
2. Update TsxFormatHandler.save to extract inline clips from Animation
   components, save them via FsAssetStore, replace clips with clipBindings,
   and emit assetReferences.animations.
3. Modify TsxFormatHandler.extractDefineSceneData + MultiFileSceneLoader to
   accept assetReferences.animations, resolve clips into the registry, and
   map bindings back to runtime.

### Phase 4: Editor Authoring Flows (2 days)

1. Add AnimationBrowserModal + AnimationCreateModal patterned after materials
   for browsing, previewing, duplicating, assigning clips.
2. Implement useAnimationsStore (zustand) to wrap AnimationRegistry, track
   selections, and expose CRUD actions.
3. Introduce AnimationAssetService that wraps the assets API for save/load/
   delete/list operations.

### Phase 5: Timeline & Component Integration (1.5 days)

1. Refactor TimelinePanel and useTimelineStore to open clips via
   AnimationAssetService, edit them in-memory, and persist back to asset
   files.
2. Update AnimationSection inspector UI to show clip bindings, allow slotting
   animations from the browser, and configure per-entity overrides (speed,
   default clip).
3. Adjust AnimationSystem to pull clips from AnimationRegistry using binding
   IDs instead of component clips[].

### Phase 6: QA, Tests, and Tooling (0.5 day)

1. Add comprehensive unit/integration tests (asset resolvers, serialization,
   migration) and update snapshots.
2. Document workflows (docs + in-editor tooltips) and add CLI migration
   command.
3. Verify Rust exporter still receives fully expanded clip data for runtime
   parity.

## File and Directory Structures

src/core/animation/
├── AnimationRegistry.ts
├── AnimationComponent.ts # updated schema w/ clipBindings
└── assets/
└── defineAnimations.ts # new helpers

src/editor/components/animations/
├── AnimationBrowserModal.tsx # search, assign, duplicate
├── AnimationCreateModal.tsx
└── components/
└── AnimationPreview.tsx # optional playback preview

src/editor/store/
├── animationsStore.ts # wraps registry + asset service
└── timelineStore.ts # refactored to use assets

src/game/assets/animations/
└── walk.animation.tsx # defineAnimationClip export

scripts/
└── migrate-inline-animations.ts # optional migration helper

## Technical Details

// src/core/animation/assets/defineAnimations.ts
import { ClipSchema, type IClip } from '@core/components/animation/
AnimationComponent';
import { z } from 'zod';

export const AnimationAssetSchema = ClipSchema.extend({
tags: z.array(z.string()).default([]),
author: z.string().optional(),
description: z.string().optional(),
previewFrame: z.number().min(0).optional(),
});
export type IAnimationAsset = z.infer<typeof AnimationAssetSchema>;

export function defineAnimationClip(
clip: Partial<IAnimationAsset> & Pick<IAnimationAsset, 'id' | 'name'>,
): IAnimationAsset {
return AnimationAssetSchema.parse(clip);
}

export function defineAnimationClips(
clips: Array<Partial<IAnimationAsset> & Pick<IAnimationAsset, 'id' |
'name'>>,
): IAnimationAsset[] {
return clips.map((clip) => AnimationAssetSchema.parse(clip));
}

// src/core/animation/AnimationRegistry.ts
export class AnimationRegistry {
private static instance: AnimationRegistry | null = null;
static getInstance(): AnimationRegistry {
if (!this.instance) this.instance = new AnimationRegistry();
return this.instance;
}

    private idToClip = new Map<string, IAnimationAsset>();

    load(assets: IAnimationAsset[]): void {
      assets.forEach((asset) => this.idToClip.set(asset.id, asset));
    }

    upsert(asset: IAnimationAsset): void {
      this.idToClip.set(asset.id, asset);
    }

    get(id: string): IAnimationAsset | undefined {
      return this.idToClip.get(id);
    }

    list(): IAnimationAsset[] {
      return [...this.idToClip.values()];
    }

}

// src/core/components/animation/AnimationComponent.ts (excerpt)
export const ClipBindingSchema = z.object({
bindingId: z.string(),
clipId: z.string(),
assetRef: z.string(), // '@/animations/walk' or './animations/MyScene'
overrides: z
.object({
loop: z.boolean().optional(),
speed: z.number().positive().optional(),
startOffset: z.number().nonnegative().optional(),
})
.optional(),
});

export const AnimationComponentSchema = z.object({
activeBindingId: z.string().optional(),
playing: z.boolean().default(false),
time: z.number().nonnegative().default(0),
clipBindings: z.array(ClipBindingSchema).default([]),
version: z.literal(2).default(2),
});

// src/editor/store/animationsStore.ts
export const useAnimationsStore = create<IAnimationsState>((set, get) => ({
assets: [],
loadLibrary: async () => {
const loader = new BrowserAssetLoader();
const clips = await
loader.loadLibraryAssets<IAnimationAsset>('animation');
AnimationRegistry.getInstance().load(clips);
set({ assets: clips });
},
saveClip: async (clip) => {
await AnimationAssetService.save(clip);
AnimationRegistry.getInstance().upsert(clip);
set((state) => ({ assets: state.assets.filter((c) => c.id !==
clip.id).concat(clip) }));
},
}));

// src/plugins/assets-api/FsAssetStore.ts (animation branch)
const importMap: Record<AssetType, string> = {
material: '@core/lib/serialization/assets/defineMaterials',
prefab: '@core/lib/serialization/assets/definePrefabs',
input: '@core/lib/serialization/assets/defineInputAssets',
script: '@core/lib/serialization/assets/defineScripts',
animation: '@core/animation/assets/defineAnimations',
};

// src/editor/components/animations/AnimationBrowserModal.tsx
export const AnimationBrowserModal: React.FC<IAnimationBrowserModalProps>
= ({
isOpen,
onClose,
onSelect,
onCreate,
}) => {
const { assets, deleteClip, duplicateClip } = useAnimationsStore();
// mirror MaterialBrowser UX with timeline preview button etc.
};

## Usage Examples

// Scene file referencing animation assets
export default defineScene({
metadata: { name: 'Forest', version: 2, timestamp: new
Date().toISOString() },
entities: [
{
id: 3,
name: 'Spirit',
components: {
Animation: {
clipBindings: [
{
bindingId: 'idleBinding',
clipId: 'idleSpirit',
assetRef: '@/animations/idleSpirit',
overrides: { loop: true },
},
],
activeBindingId: 'idleBinding',
playing: true,
},
},
},
],
assetReferences: {
animations: ['idleSpirit'],
materials: ['mossyBark'],
},
});

// Runtime usage in AnimationSystem
const registry = AnimationRegistry.getInstance();
const binding = component.clipBindings.find((b) => b.bindingId ===
state.activeBindingId);
const clip = binding ? registry.get(binding.clipId) : null;
if (clip) {
const evaluation = this.evaluator.evaluate(clip, state.time);
// ...
}

// Editor timeline saving an asset
const clip = await AnimationAssetService.load('idleSpirit');
const updated = timelineMutations(clip);
await AnimationAssetService.save(updated); // POST /api/assets/animation/save
useAnimationsStore.getState().saveClip(updated);

## Testing Strategy

- Unit Tests
  - defineAnimationClip schema validation (required fields, defaults,
    metadata parsing).
  - AnimationRegistry CRUD and cache invalidation logic.
  - FsAssetStore serialize/parse round-trip for .animation.tsx.
  - AssetReferenceResolver resolving both library (@/animations/...) and
    scene (./animations/SceneName) references.
  - Updated AnimationComponent migrations (legacy clips → clipBindings).
- Integration Tests
  - TsxFormatHandler.save/load writing animation assets, ensuring
    assetReferences.animations appear once and rehydration produces correct
    bindings.
  - MultiFileSceneLoader resolving animation refs alongside materials and
    feeding AnimationRegistry.
  - Timeline store editing flow: open clip, edit keyframes, persist asset,
    rebind entity.
  - Assets API /api/assets/animation/\* endpoints (save/list/load/delete)
    with FsAssetStore.
  - Scene export to Rust verifying animation data still included.

## Edge Cases

| Edge Case                                                         | Remediation                            |
| ----------------------------------------------------------------- | -------------------------------------- |
| Missing animation asset file referenced by scene                  | Log warning, fall back                 |
| to stub clip with zero tracks, and surface error in UI for repair |
| Duplicate clip IDs between library and scene                      | Prefer scene-local asset for           |
| binding, but warn and require explicit namespace in browser       |
| Legacy scenes with inline clips[]                                 | Auto-export to ./animations/<scene> on |
| load, mark component version:2, and prompt to save                |
| Timeline editing asset while it’s assigned to multiple entities   | Save                                   |

once, then broadcast registry update so bound entities refresh automatically
|
| Asset deleted while still referenced | Prevent deletion in browser if
references exist; for CLI deletions, loader raises error and disables
playback |

## Sequence Diagram

sequenceDiagram
participant UI as Editor UI
participant Timeline as TimelineStore
participant Service as AnimationAssetService
participant API as /api/assets/animation/save
participant FS as FsAssetStore
participant Scene as SceneSerializer/TsxHandler
participant Runtime as AnimationRegistry

    UI->>Timeline: Open clip binding
    Timeline->>Service: load(clipId)
    Service->>API: GET /animation/load
    API->>FS: read clip file
    FS-->>API: clip payload
    API-->>Service: clip data
    Service-->>Timeline: hydrate clip
    Timeline->>Timeline: edit keyframes
    Timeline->>Service: save(updated clip)
    Service->>API: POST /animation/save
    API->>FS: write .animation.tsx
    API-->>Service: success
    Service-->>Runtime: AnimationRegistry.upsert
    Scene->>Runtime: load refs during save/load

## Risks & Mitigations

| Risk                                                                  | Mitigation |
| --------------------------------------------------------------------- | ---------- |
| Asset name collisions or casing mismatches introduce duplicated files |

Reuse slugify/generateAssetIdentifiers logic from material creation before
writing animation files, and validate uniqueness in AnimationAssetService. |
| Timeline edits introduce breaking schema changes mid-flight | Version
AnimationComponent and asset schema; maintain migration path and guard
timeline store against editing v1 components until upgraded. |
| Large asset catalogs slow startup (dynamic imports) | Lazy-load animation
assets on demand via BrowserAssetLoader and cache in AnimationRegistry,
similar to materials. |
| Rust exporter expectations change | Update exporter to ingest resolved
animation assets and add tests ensuring parity to avoid runtime divergence. |
| Deleting assets that scenes still reference causes runtime failures | Add
reference counts when serializing and prevent deletion from UI; add loader
warnings pointing to offending scenes for manual cleanup. |

## Timeline

- Phase 1: 1.0 day
- Phase 2: 1.0 day
- Phase 3: 1.5 days
- Phase 4: 2.0 days
- Phase 5: 1.5 days
- Phase 6: 0.5 day
  Total: ~7.5 engineering days

## Acceptance Criteria

- Scenes saved through the editor emit assetReferences.animations and zero
  inline clips blocks.
- src/game/assets/animations/\*.animation.tsx files are generated/updated when
  clips are created or modified through the timeline UI.
- Loading a scene registers referenced animation assets in AnimationRegistry,
  and runtime playback uses registry data exclusively.
- The editor exposes an Animation Browser/Create flow with search, duplicate,
  and delete actions parallel to the material UI.
- Timeline edits persist through asset reloads and affect every entity bound
  to the clip.
- The assets API successfully serves /api/assets/animation/
  {save,load,list,delete} and unit/integration tests cover the new type.
- Migration tooling converts legacy inline animations without data loss.

## Conclusion

Refactoring animations into external assets aligns them with our proven
material pipeline, yielding reusable clips, smaller scenes, and reliable
version control. By extending the asset infrastructure, updating scene
existing scenes. Once implemented, animation workflows will feel coherent
with materials: browse, assign, and edit assets that live independently of
any single entity.

## Assumptions & Dependencies

- Asset API endpoints remain available locally so the editor can call /api/
  assets/animation/\*.
- The existing timeline editor continues to operate within React; no RHI/
  rust-side overrides are necessary.
- Rust export path accepts either inline clips or can be updated in tandem.
- No additional sandbox/network permissions are required beyond current
  workspace-write configuration.
- Material slug/ID utilities can be reused for animations without
  modification.
