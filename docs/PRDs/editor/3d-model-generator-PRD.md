# 3D Model Generator PRD (Image → 3D GLB)

## Overview

- **Context & Goals**

  - Enable in-editor generation of 3D assets as `.glb` via a two-step flow: image generation (OpenRouter) → image-to-3D (Replicate Hunyuan3D).
  - Integrate outputs with existing asset folder conventions and optimization pipelines to produce LODs and compressed, runtime-ready assets.
  - Support interactive UX for prompt authoring, retry, style presets, and approval before 3D generation.
  - Ensure generated assets land under `src/game/assets/models` and are synced/optimized for runtime.

- **Current Pain Points**
  - Manual asset creation/import slows iteration and requires external tools.
  - Inconsistent folder structures and optimization steps cause runtime performance variance.
  - Lack of a guided, discoverable editor UX for asset generation and post-processing.

## Proposed Solution

- **High‑level Summary**

  - Add a multi-step Model Generator modal (stepper UX) in the editor.
  - Step 1 uses `openrouter` with `openai/gpt-5-image-mini` to generate a transparent-background image; supports retry and prompt/style tuning.
  - Step 2 calls Replicate Hunyuan3D to produce `.glb` from the selected image.
  - Save generated assets under `src/game/assets/models/<ModelName>/glb|lod|textures`, then invoke optimization (`scripts/optimize.js` and option to fall back/augment via `scripts/optimize-models.js`).
  - Reuse and extend the existing `assets-api` Vite server plugin—or a new `generator-api`—to securely call external APIs and write files.

- **Architecture & Directory Structure**

```
/src
├── editor/
│   ├── components/
│   │   └── assets/
│   │       └── ModelGeneratorModal.tsx            # Stepper modal UI (like TerrainWizard pattern)
│   ├── hooks/
│   │   └── useModelGenerator.ts                   # Business logic, prompt state, retries, flow
│   └── services/
│       └── generatorClient.ts                     # Client for /api/generator endpoints
├── plugins/
│   ├── assets-api/
│   │   └── createAssetsApi.ts                     # Existing; may extend to support model saves
│   └── generator-api/
│       └── createGeneratorApi.ts                  # New: server-side calls to OpenRouter/Replicate
├── game/
│   └── assets/
│       └── models/
│           └── <ModelName>/
│               ├── glb/<fileName>.glb            # Generated base
│               ├── lod/<fileName>.high_fidelity.glb
│               ├── lod/<fileName>.low_fidelity.glb
│               └── textures/                      # Optional baked/preview textures
└── scripts/
    ├── optimize.js                                # Current pipeline (MODELS_DIR=src/...)
    └── optimize-models.js                         # Public assets pipeline (optional augmentation)

.env
├── OPENROUTER_API_KEY
├── OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
├── OPENROUTER_IMAGE_MODEL=openai/gpt-5-image-mini
├── REPLICATE_API_TOKEN
└── HYPER3D_BASE_URL=https://api.hyper3d.com
```

## Implementation Plan

- **Phase 1: Setup & Config (0.5 day)**

  1. Define `.env` variables and inject via Vite server plugin (server-only usage).
  2. Create `generator-api` Vite plugin with routes for image generation, image→3D conversion, saving, and optimization triggers.
  3. Extend or reuse `assets-api` file-writing utilities for model folder creation.

- **Phase 2: UI & Flow (1.0 day)**

  1. Implement `ModelGeneratorModal.tsx` as a multi-step wizard mirroring `TerrainWizard` stepper.
  2. Step 1 UI: prompt editor, style selector, size controls, retry regenerate; display gallery (latest N attempts) with selection.
  3. Step 2 UI: Replicate Hunyuan3D options (seed, steps, etc.), model naming (`ModelName` and `fileName`), generate and show progress.
  4. On success, show save path and a button to “Add to Scene.”

- **Phase 3: Server Integrations (1.0 day)**

  1. Implement `POST /api/generator/image` (OpenRouter → image buffer with transparent background).
  2. Implement `POST /api/generator/mesh` (Replicate Hunyuan3D) to convert image → `.glb` and return path.
  3. Implement `POST /api/generator/optimize` to invoke `scripts/optimize.js --force` (and optional `optimize-models.js`).

- **Phase 4: Asset Pipeline Hooking (0.5 day)**

  1. Save `.glb` to `src/game/assets/models/<ModelName>/glb/<fileName>.glb`.
  2. Run optimization to produce `lod/` variants and compression.
  3. Confirm sync to `public/assets/models/...` via `scripts/sync-assets.js`.

- **Phase 5: Testing & Hardening (0.5 day)**
  1. Unit tests for prompt builder, provider selection logic, and filename sanitation.
  2. Integration tests for server endpoints with mocked providers.
  3. Manual QA: generate character and prop; verify editor loads LODs and sizes.

## File and Directory Structures

```
/src/editor/components/assets/
├── ModelGeneratorModal.tsx
/src/editor/hooks/
├── useModelGenerator.ts
/src/editor/services/
├── generatorClient.ts
/src/plugins/generator-api/
├── createGeneratorApi.ts
/src/game/assets/models/
└── <ModelName>/
    ├── glb/<fileName>.glb
    ├── lod/<fileName>.high_fidelity.glb
    ├── lod/<fileName>.low_fidelity.glb
    └── textures/
```

## Technical Details

- **Environment Variables**

```bash
# OpenRouter
OPENROUTER_API_KEY=...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_IMAGE_MODEL=openai/gpt-5-image-mini

# Replicate (Hunyuan3D)
REPLICATE_API_TOKEN=...
```

- **Replicate Setup (Node.js)**

```bash
yarn add replicate

# or, if using npm (not recommended in this workspace):
# npm install replicate

# Set token (shell)
export REPLICATE_API_TOKEN=<paste-your-token-here>
```

```ts
// Server-side setup
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Run Hunyuan3D
const output = await replicate.run(
  'ndreca/hunyuan3d-2.1:895e514f953d39e8b5bfb859df9313481ad3fa3a8631e5c54c7e5c9c85a6aa9f',
  {
    input: {
      seed: 1234,
      image: 'https://example.com/image.png',
      steps: 50,
      num_chunks: 8000,
      max_facenum: 20000,
      guidance_scale: 7.5,
      generate_texture: true,
      octree_resolution: 256,
      remove_background: false,
    },
  },
);
```

- **Client Types (TS)**

```ts
// src/editor/services/generatorClient.ts (types)
export interface ImageGenRequest {
  prompt: string; // user prompt
  style: string; // e.g., "low-poly", "realistic", etc.
  width?: number; // px
  height?: number; // px
  background?: 'transparent' | 'white';
  negativePrompt?: string;
  seed?: number;
}

export interface ImageGenResult {
  imageId: string;
  imageDataUrl: string; // data URL for preview
}

export interface MeshGenRequest {
  imageId: string; // reference to selected image
  modelName: string; // folder name under models
  fileName: string; // base file name for glb
  options?: {
    seed?: number;
    steps?: number;
    numChunks?: number; // maps to num_chunks
    maxFaceNum?: number; // maps to max_facenum
    guidanceScale?: number; // maps to guidance_scale
    generateTexture?: boolean; // maps to generate_texture
    octreeResolution?: number; // maps to octree_resolution
    removeBackground?: boolean; // maps to remove_background
  };
}

export interface MeshGenResult {
  modelPath: string; // absolute path (server) + public path mapping
}
```

- **Server Routes (TS skeletons)**

```ts
// src/plugins/generator-api/createGeneratorApi.ts (skeleton)
import type { Plugin } from 'vite';

export const createGeneratorApi = (options?: { corsOrigin?: string }): Plugin => ({
  name: 'generator-api',
  configureServer(server) {
    // POST /api/generator/image
    server.middlewares.use('/api/generator/image', async (req, res) => {
      // 1) parse body (prompt, style, size, background=transparent)
      // 2) call OpenRouter: model=openai/gpt-5-image-mini
      // 3) return { imageId, imageDataUrl }
    });

    // POST /api/generator/mesh
    server.middlewares.use('/api/generator/mesh', async (req, res) => {
      // 1) parse body (imageId, modelName, fileName, options)
      // 2) resolve selected image to a URL (or upload temp) for Replicate
      // 3) call Replicate Hunyuan3D and receive mesh output
      // 4) write GLB to src/game/assets/models/<ModelName>/glb/<fileName>.glb
      // 5) return { modelPath }
    });

    // POST /api/generator/optimize
    server.middlewares.use('/api/generator/optimize', async (req, res) => {
      // 1) spawn node scripts/optimize.js --force
      // 2) (optional) also run scripts/optimize-models.js for public assets
      // 3) return summary
    });
  },
});
```

- **UX Flow Details**

  - Step 1 (Preview Image): Build prompt as “Create a STYLE_HERE 3D model with transparent background” + user-provided details. Allow retry (re-generate) without leaving step; maintain an image history list.
  - Step 2 (Image→3D): Provide Replicate Hunyuan3D options; supply `ModelName` and `fileName`; show progress and final size.
  - After success: Persist to disk, trigger optimization, show final asset paths (base + LODs), and provide “Add to Scene” shortcut with `/assets/models/...` URLs.

## Usage Examples

```ts
// Step 1: Generate preview image
const img = await generatorClient.generateImage({
  prompt: userPrompt,
  style: selectedStyle,
  background: 'transparent',
});

// Step 2: Generate mesh via Replicate
const mesh = await generatorClient.generateMesh({
  imageId: img.imageId,
  modelName: 'MyModel',
  fileName: 'MyModel',
  options: { steps: 50, generateTexture: true },
});

// Step 3: Optimize
await generatorClient.optimizeModels();
```

## Testing Strategy

- **Integration Tests**
  - `/api/generator/image` returns image preview (mock OpenRouter response).
  - `/api/generator/mesh` writes `.glb` to the correct folder (mock Replicate Hunyuan3D).
  - `/api/generator/optimize` triggers optimization and produces `lod/` variants.
  - Editor loads resulting `/assets/models/...` paths and LOD utils select variant URLs correctly.

## Edge Cases

| Edge Case                        | Remediation                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| API key missing or invalid       | Disable actions, show setup instructions; server returns 401 with clear message.      |
| Rate-limits / provider outage    | Exponential backoff, retry UI, fallback provider if possible.                         |
| Non-transparent images returned  | Enforce `background=transparent`; if not possible, post-process (alpha mask) or warn. |
| Large or invalid GLB             | Validate before save; re-run generation with reduced complexity; show error.          |
| Duplicate `ModelName`/`fileName` | Prompt overwrite or auto-increment suffix.                                            |
| Long-running generation          | Show progress spinner and timeouts with cancel/retry.                                 |
| Unsafe prompt content            | Client-side validation and server-side filtering per provider policy.                 |

## Sequence Diagram

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Editor UI (Modal)
  participant GA as Generator API (/api/generator)
  participant OR as OpenRouter (Image)
  participant R as Replicate (Hunyuan3D)
  participant FS as FS (src/game/assets/models)
  participant OPT as optimize.js

  U->>UI: Click “Generate 3D”
  UI->>GA: POST /image { prompt, style, background=transparent }
  GA->>OR: Create image (model=openai/gpt-5-image-mini)
  OR-->>GA: image data (transparent PNG)
  GA-->>UI: { imageId, imageDataUrl }
  U->>UI: Approve image (or Retry)
  UI->>GA: POST /mesh { imageId, modelName, fileName, options }
  GA->>R: Submit image + params → 3D
  R-->>GA: .glb
  GA->>FS: write src/game/assets/models/<ModelName>/glb/<fileName>.glb
  UI->>GA: POST /optimize
  GA->>OPT: node scripts/optimize.js --force
  OPT-->>GA: results (LOD paths)
  GA-->>UI: success { base+LOD URLs }
  UI-->>U: Show “Add to Scene”
```

## Risks & Mitigations

| Risk                                         | Mitigation                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| Provider API changes or model unavailability | Feature-flag model strings; make provider calls configurable via `.env`.       |
| Security of API keys                         | Use server-only Vite plugin; never expose keys to client; restrict CORS.       |
| Slow or failed optimizations                 | Run async with progress; surface summaries; allow retry with `--force`.        |
| Large asset sizes                            | Enforce texture resizing and LOD generation; warn on thresholds before import. |
| Folder structure drift                       | Centralize save logic; add validations and tests for path rules.               |

## Timeline

- Total: ~3.5 days
  - Phase 1: 0.5 day
  - Phase 2: 1.0 day
  - Phase 3: 1.0 day
  - Phase 4: 0.5 day
  - Phase 5: 0.5 day

## Acceptance Criteria

- A “Generate 3D” button opens a two-step modal (image → 3D) with retry and style controls.
- Step 1 uses OpenRouter (`openai/gpt-5-image-mini`) to generate transparent-background images.
- Step 2 uses Replicate Hunyuan3D to convert the approved image to `.glb`.
- `REPLICATE_API_TOKEN` is required and never exposed to the client; calls happen server-side.
- Generated `.glb` is saved to `src/game/assets/models/<ModelName>/glb/<fileName>.glb`.
- Optimization produces `lod/` variants and reduces size; results are visible under `/assets/models/...`.
- No API keys exposed on client; server-side integration works via `/api/generator/*` endpoints.
- Editor can immediately add the new model to the scene from the success screen.

## Conclusion

This plan adds a guided, in-editor 3D asset generation flow integrated with robust post-processing and consistent asset organization. It leverages OpenRouter for fast previews and Meshy/Hyper3D for high-quality `.glb`, then ensures runtime readiness via our existing optimization and LOD pipelines.

## Assumptions & Dependencies

- OpenRouter image generation supports `background=transparent` for the selected model.
- Meshy.ai and Hyper3D provide stable image→3D endpoints and accept PNG/JPEG inputs.
- Development runs under Vite with server plugin support; keys available in `.env`.
- Optimization scripts remain compatible with produced `.glb` files.
