# Rendering Library Guidelines

**Purpose**: Core rendering utilities and optimizations for the 3D engine.

## Structure

- `BVHManager.ts` - Bounding Volume Hierarchy optimization manager
- `rendering.ts` - Core rendering utilities (culling, LOD, etc.)
- `shapes/` - Shape descriptors and registry
- `RendererFactory.ts` - Renderer initialization

## BVH System (Spatial Acceleration)

### Overview

The BVH (Bounding Volume Hierarchy) system provides spatial acceleration for:

- **Accelerated Raycasting**: Up to 10-100x faster ray intersection tests
- **Frustum Culling**: Efficient visibility determination for large scenes
- **Performance Monitoring**: Track culling effectiveness

### Architecture

#### BVHManager (`BVHManager.ts`)

Core service that manages BVH structures for all meshes in the scene.

**Key Features:**

- Automatic BVH construction for registered meshes
- Configurable construction strategy (SAH, CENTER, AVERAGE)
- Periodic BVH updates for dynamic geometry
- Frustum culling acceleration
- Performance statistics

**Configuration:**

```typescript
{
  enableFrustumCulling: boolean; // Enable/disable frustum culling
  enableRaycastAcceleration: boolean; // Enable/disable BVH raycasting
  updateInterval: number; // Milliseconds between updates
  maxLeafTris: number; // Triangles per BVH leaf (10-20 recommended)
  strategy: 'SAH' | 'CENTER' | 'AVERAGE'; // Construction algorithm
}
```

**Usage:**

```typescript
import { getBVHManager } from '@core/lib/rendering/BVHManager';

const bvhManager = getBVHManager();
bvhManager.registerMesh(mesh, meshId);
bvhManager.update(deltaTime);
```

#### BVH System (`src/core/systems/bvhSystem.ts`)

ECS system integration for BVH optimization.

**Features:**

- Automatic initialization with scene and camera
- Per-frame BVH updates
- Frustum culling execution
- Performance logging

**Integration:**
The BVH system is automatically initialized in `EngineLoop.tsx` and runs every frame.

### Configuration

#### Enabling BVH (Opt-In)

**IMPORTANT**: BVH is **disabled by default** to prevent WebGL context loss on large scenes. Enable it only when:

- You have tested it with your scene
- Your scene has 500+ objects that would benefit from culling
- You're experiencing performance issues with raycasting

Enable via the engine store:

```typescript
import { useEngineStore } from '@core/state/engineStore';

const { bvhCulling, setBvhCulling } = useEngineStore();
setBvhCulling(true); // Enable BVH culling - scene will be processed
```

**Note**: When enabling for the first time, the system will process all meshes in the scene. For large scenes (1000+ meshes), this may take a few seconds.

### Performance Considerations

#### When to Use BVH

- **Large Scenes**: Scenes with 1000+ objects benefit significantly
- **Complex Geometry**: High poly meshes (10k+ triangles)
- **Frequent Raycasting**: Games with mouse picking, shooting, etc.

#### BVH Construction Cost

- Initial build: ~1-5ms per mesh (depends on triangle count)
- Updates: Only when geometry changes
- Memory: ~1-5% overhead per mesh

#### Optimal Settings

- **maxLeafTris**: 10 (default) - good balance for most scenes
  - Lower (5): Better query performance, slower builds
  - Higher (20): Faster builds, slower queries
- **strategy**: 'SAH' (default) - best quality, slowest build
  - 'CENTER': Fast builds, decent quality
  - 'AVERAGE': Middle ground

#### Performance Gains

- **Raycasting**: 10-100x faster (scene dependent)
- **Frustum Culling**: 2-5x faster culling checks
- **Large Scenes**: Can render 10x more objects at same framerate

### Implementation Details

#### Three.js Integration

BVH is integrated directly into Three.js prototypes:

- `BufferGeometry.computeBoundsTree()` - Build BVH
- `BufferGeometry.disposeBoundsTree()` - Clean up BVH
- `Mesh.raycast()` - Accelerated raycasting

#### Automatic Registration

Meshes are automatically registered when scenes are loaded. For dynamic meshes:

```typescript
import { registerMeshWithBVH } from '@core/systems/bvhSystem';

// Register dynamically created mesh
registerMeshWithBVH(newMesh, 'unique-id');

// Unregister when removed
import { unregisterMeshFromBVH } from '@core/systems/bvhSystem';
unregisterMeshFromBVH('unique-id');
```

### Debugging

Enable debug logging to monitor BVH performance:

```typescript
import { Logger } from '@core/lib/logger';

// Stats are logged every 10 seconds showing:
// - Total objects in scene
// - Culled objects
// - Visible objects
// - Culling ratio
```

### Limitations & Considerations

- **WebGL Context**: Processing very large scenes (2000+ complex meshes) can cause WebGL context loss
  - BVH is disabled by default for safety
  - Enable only after testing with your specific scene
  - Consider enabling progressively or during loading screens
- **Dynamic Geometry**: Requires BVH rebuild when vertices change
- **Instanced Meshes**: Each instance needs separate BVH
- **Memory**: Additional memory per mesh (~1-5%)
- **Initialization Cost**: Large scenes may take 1-5 seconds to process all meshes

### Best Practices

1. **Start Small**: Test BVH with a small scene first
2. **Monitor Performance**: Watch for WebGL errors in console
3. **Gradual Rollout**: Enable BVH progressively as scene complexity grows
4. **Loading Screens**: Process BVH during loading/initialization phases
5. **Error Recovery**: System auto-disables on errors to prevent crashes

### Future Enhancements

- Automatic LOD integration with BVH
- Occlusion culling using BVH
- Spatial partitioning (octree) for very large scenes
- Multi-threaded BVH construction

## Asset Optimization Pipeline

### Overview

Automatic model optimization is integrated into the development and build workflow to reduce file sizes, improve load times, and enhance runtime performance.

### How It Works

The optimization system runs after asset sync to optimize all served models:

1. **Sync**: Copy models from `src/game/assets/` to `public/assets/`
2. **Scan**: Find all GLB/GLTF files in `public/assets/models/` (what gets served)
3. **Check**: Compare file hashes against manifest to detect changes
4. **Optimize**: Apply glTF-Transform optimizations to changed files
5. **Track**: Update manifest with new file hashes

### Integration Points

#### Development Workflow

```bash
yarn dev         # Auto-optimizes changed models, then starts dev server
yarn optimize    # Manually run optimization with progress output
yarn optimize:force  # Force re-optimization of all models
```

#### Build Workflow

```bash
yarn build       # Optimizes models as part of production build
```

### Optimization Techniques Applied

The system uses `@gltf-transform/functions` to apply several optimizations:

1. **Prune**: Removes unused nodes, materials, textures, and accessories
2. **Dedup**: Merges duplicate vertex and texture data
3. **Weld**: Merges duplicate vertices within epsilon threshold
4. **Quantize**: Reduces precision of vertex attributes to save bandwidth
   - Position: 14 bits (sub-millimeter precision)
   - Normals: 10 bits
   - UVs: 12 bits
   - Colors: 8 bits

### Performance Impact

**File Size Reduction:**

- Typical savings: 30-60% reduction in file size
- Depends on model complexity and redundancy

**Runtime Performance:**

- Smaller files = faster network transfer
- Quantized attributes = less GPU memory bandwidth
- Welded vertices = better GPU cache utilization

### Double-Optimization Prevention

The system uses a SHA-256 hash manifest (`.model-optimization-manifest.json`) to track optimized files:

- Only processes files that have changed since last optimization
- Prevents redundant processing on every dev server start
- Manifest is gitignored (local cache only)

**Manifest Structure:**

```json
{
  "optimized": {
    "public/assets/models/Example/model.glb": "sha256-hash..."
  }
}
```

**Important**: The system optimizes `public/assets/models/` (what gets served at runtime) rather than source files, ensuring all models are optimized regardless of whether they're synced from `src/` or added directly to `public/`.

### Script Location

`scripts/optimize-models.js` - Main optimization script

### Configuration

Edit `scripts/optimize-models.js` to adjust:

- Quantization bit depths (line 94-100)
- Enable/disable simplification (commented by default)
- Add additional optimization passes

### Troubleshooting

**Issue: Models look corrupted after optimization**

- Solution: Reduce quantization bit depths or disable quantize step

**Issue: Optimization takes too long**

- Solution: Use `--silent` flag to skip progress output
- Already enabled by default in dev/build scripts

**Issue: Need to re-optimize all models**

- Solution: Run `yarn optimize:force` or delete `.model-optimization-manifest.json`

### Best Practices

1. **Test First**: Run `yarn optimize` manually to see results before committing
2. **Check Quality**: Verify optimized models look correct in your scene
3. **Source Control**: Keep original high-quality models in `src/game/assets/` in version control
4. **Iterative**: Start with conservative settings, increase aggressiveness as needed
5. **Public Assets**: Models added directly to `public/assets/models/` will also be optimized

### Advanced: Mesh Simplification

For polygon reduction, uncomment the simplification step in `scripts/optimize-models.js`:

```typescript
// Reduce polygon count by 10% with 0.1% error tolerance
simplify({ ratio: 0.9, error: 0.001 });
```

**Note**: Test carefully - aggressive simplification can degrade visual quality

### Related Systems

- **Asset Sync** (`scripts/sync-assets.js`): Copies optimized models to `public/assets/`
- **BVH System**: Benefits from optimized geometry (fewer triangles = faster BVH)
