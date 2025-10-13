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
  enableFrustumCulling: boolean;     // Enable/disable frustum culling
  enableRaycastAcceleration: boolean; // Enable/disable BVH raycasting
  updateInterval: number;             // Milliseconds between updates
  maxLeafTris: number;                // Triangles per BVH leaf (10-20 recommended)
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
