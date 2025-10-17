# Optimization Scripts

## Overview

The optimization pipeline automatically decimates models and generates LOD variants with intelligent caching to avoid unnecessary reprocessing.

## Architecture

### Key Scripts

- **`optimize.js`** - Unified optimization pipeline with caching
- **`lib/modelAnalyzer.js`** - Analyzes model complexity (SRP)
- **`lib/blenderDecimator.js`** - Blender Python integration (SRP)
- **`lib/logger.js`** - Simple console logging (KISS)
- **`check-model-complexity.js`** - Standalone complexity checker

### Design Principles

- **SRP**: Each module has one clear responsibility
- **DRY**: Shared analysis logic between scripts
- **KISS**: Simple CLI interface with minimal flags

## Model Directory Structure

```
src/game/assets/models/
└── ModelName/
    ├── model.glb              # SOURCE (committed to git)
    ├── glb/                   # BASE OPTIMIZED (gitignored)
    │   └── model.glb          # Decimated + optimized
    └── lod/                   # LOD VARIANTS (gitignored)
        ├── model.high_fidelity.glb  # 75% of base
        └── model.low_fidelity.glb   # 35% of base
```

### Directory Purposes

1. **Root** (`model.glb`): Source file from 3D software

   - Version controlled (committed)
   - Input for optimization pipeline
   - May have very high triangle count

2. **glb/** (`glb/model.glb`): Optimized base model

   - NOT version controlled (regenerated)
   - Loaded by application at close distance
   - Target: hero 40K, prop 10K, background 3K triangles

3. **lod/** (`lod/model.*.glb`): LOD variants
   - NOT version controlled (regenerated)
   - Used by LOD system based on distance
   - Generated via meshoptimizer from base model

## Usage

### Basic Commands

```bash
# Optimize all models (with caching)
yarn optimize

# Check complexity without optimizing
node scripts/optimize.js --check-only

# Force re-optimization (ignore cache)
yarn optimize:force

# Optimize specific model
node scripts/optimize.js --model=FarmHouse
```

### Auto-Optimization on Dev

Pipeline runs automatically on `yarn dev`:

- Checks manifest cache
- Only optimizes changed/new models
- Runs silently in background

### With Blender Decimation

```bash
# Enable in .env
USE_BLENDER_DECIMATION=true
AUTO_DECIMATE_MODELS=true

# Or inline
USE_BLENDER_DECIMATION=true AUTO_DECIMATE_MODELS=true yarn optimize
```

## Caching System

### Manifest

Located at `.model-optimization-manifest.json`:

```json
{
  "version": 1,
  "optimized": {
    "src/game/assets/models/Model/model.glb": {
      "sourceHash": "abc123...",
      "timestamp": 1697500000000,
      "outputs": {
        "base": "src/game/assets/models/Model/glb/model.glb",
        "lodVariants": [
          "src/game/assets/models/Model/lod/model.high_fidelity.glb",
          "src/game/assets/models/Model/lod/model.low_fidelity.glb"
        ]
      }
    }
  }
}
```

### Cache Logic

Model is re-optimized if:

1. `--force` flag is used
2. Source file hash changed
3. Any output file missing (glb or LOD variants)

Otherwise skipped (instant).

## Pipeline Flow

```
1. Find source models in src/game/assets/models/*/model.glb
   ↓
2. Check manifest cache (skip if unchanged)
   ↓
3. Analyze complexity → classify as hero/prop/background
   ↓
4. Blender decimation → glb/model.glb (target triangle count)
   ↓
5. Generate LOD variants from base:
   - lod/model.high_fidelity.glb (75% of base via meshopt)
   - lod/model.low_fidelity.glb (35% of base via meshopt)
   ↓
6. Update manifest with new hash + outputs
```

## Model Classification

Based on WebGL/Three.js industry LOD benchmarks:

- **Hero** (>20K triangles): Main characters, key props

  - Desktop: 50K-100K | Mobile: 20K-40K
  - Target: 50K ideal, 80K max

- **Prop** (5K-20K triangles): Environment objects

  - Desktop: 20K-50K | Mobile: 10K-20K
  - Target: 20K ideal, 50K max

- **Background** (<5K triangles): Filler objects
  - Desktop: 5K-20K | Mobile: 2K-10K
  - Target: 5K ideal, 20K max

### LOD Variant Targets

Generated automatically from base model:

- **LOD0 (Base)**: Targets above
- **LOD1 (high_fidelity)**: 40% of base (e.g., 50K → 20K)
- **LOD2 (low_fidelity)**: 10% of base (e.g., 50K → 5K)

## Configuration

### Environment Variables (.env)

```bash
# Platform
PLATFORM=desktop                      # desktop|mobile|web
IS_MOBILE=false

# Models location
MODELS_DIR=src/game/assets/models     # Source and output directory

# Decimation
USE_BLENDER_DECIMATION=true           # Enable Blender integration
AUTO_DECIMATE_MODELS=true             # Auto-decimate complex models
AUTO_DECIMATE_RATIO=0.15              # Default ratio (15%)
BLENDER_PATH=blender                  # Path to Blender executable

# Texture
MAX_TEXTURE_SIZE=2048                 # Maximum texture dimension

# LOD (Based on industry benchmarks)
ENABLE_LOD_GENERATION=true
LOD_HIGH_RATIO=0.4                    # High fidelity (40% of base, targets 20k-50k)
LOD_LOW_RATIO=0.1                     # Low fidelity (10% of base, targets 5k-20k)
```

## Quality Recommendations

### By Asset Type

**Hero Characters / Main Props:**

```bash
AUTO_DECIMATE_RATIO=0.3  # Keep 30%
MAX_TEXTURE_SIZE=2048
```

**Environment Props:**

```bash
AUTO_DECIMATE_RATIO=0.15  # Keep 15%
MAX_TEXTURE_SIZE=1024
```

**Background Objects:**

```bash
AUTO_DECIMATE_RATIO=0.08  # Keep 8%
MAX_TEXTURE_SIZE=512
```

### Blender vs Meshoptimizer

- **Blender**: Best for aggressive reduction (>75%)

  - Can achieve 95%+ reduction
  - Better UV/normal/material handling
  - Requires Blender installed

- **Meshoptimizer**: Good for moderate reduction (<75%)
  - Fast, no external dependencies
  - Hits ~25% quality floor on complex models
  - Used for LOD generation

## Troubleshooting

### Models Not Optimizing

**Check:**

1. Is source file in correct location? (`src/game/assets/models/Model/model.glb`)
2. Is file extension `.glb`? (not `.gltf`)
3. Run with `--force` to ignore cache

### Blender Not Found

```bash
# Install Blender
# macOS: brew install --cask blender
# Linux: apt install blender

# Or set custom path in .env
BLENDER_PATH=/custom/path/to/blender
```

### Cache Issues

```bash
# Force re-optimization
yarn optimize:force

# Or delete manifest
rm .model-optimization-manifest.json
```

## Performance

### Example Results

**FarmHouse:**

- Source: 499K triangles → Base: 40K (92% reduction)
- LOD High: 30K triangles
- LOD Low: 14K triangles
- Time: ~15s first run, <1s cached

**Caching Impact:**

- First run: 15-30s per model (Blender + LOD generation)
- Cached run: <1s (skipped entirely)
- Dev startup: Only processes changed models

## Related Files

- `.model-optimization-manifest.json` - Cache manifest (gitignored)
- `.env.example` - Configuration template
- `OPTIMIZATION-SUMMARY.md` - Original problem/solution overview

## Integration with LOD System

The LOD system (in `src/core/lib/rendering/`) expects this structure:

```typescript
// Base path points to glb/ subdirectory
const modelPath = useLODModel({
  basePath: '/assets/models/Model/glb/model.glb',
  distance: cameraDistance,
});

// Automatically resolves to:
// - distance < 50:    glb/model.glb (original)
// - distance 50-100:  lod/model.high_fidelity.glb
// - distance > 100:   lod/model.low_fidelity.glb
```

The optimization pipeline ensures these files exist and are properly optimized.
