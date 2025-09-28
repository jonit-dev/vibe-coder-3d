# Terrain System Implementation Plan

## Overview

### Context & Goals

- **Landscape Creation Need**: Vibe Coder 3D currently lacks specialized tools for creating large-scale natural landscapes and environmental terrain, limiting users to basic geometric shapes for ground surfaces
- **Unity-like Workflow**: Users expect familiar terrain creation tools similar to Unity's terrain system, with heightmap support, multi-layer texturing, and performance-optimized rendering
- **Performance Requirements**: Large terrain systems need specialized LOD (Level of Detail) management and chunk-based rendering to maintain 60+ FPS with complex landscapes spanning hundreds of square kilometers
- **Physics Integration**: Terrain must integrate seamlessly with the existing Rapier3D physics system using optimized `HeightfieldCollider` for realistic collision detection without performance degradation

### Current Pain Points

- **Limited Ground Creation**: Users must create ground surfaces using scaled cubes or planes, which don't support natural landscape features like hills, valleys, or complex terrain topology
- **No Heightmap Support**: The current system lacks ability to import real-world elevation data or create procedural terrain using noise functions and heightmaps
- **Performance Issues with Large Surfaces**: Creating large ground areas using multiple primitive shapes causes performance bottlenecks due to excessive draw calls and physics calculations
- **Missing Terrain Tools**: No specialized editing tools for terrain sculpting, texture blending, or environmental detail placement that are standard in modern 3D engines

## Proposed Solution

### High-level Summary

- **Hybrid Integration Approach**: Extend the existing ECS component system with a specialized `Terrain` component that leverages current architecture while adding terrain-specific optimizations
- **HeightfieldCollider Physics**: Utilize Rapier3D's native `HeightfieldCollider` for memory-efficient, high-performance terrain physics without requiring additional dependencies
- **Multi-layer Texture System**: Implement custom shader-based texture blending supporting up to 8 terrain layers with height-based and slope-based automatic blending rules
- **Chunk-based LOD Rendering**: Develop a streaming LOD system that dynamically loads/unloads terrain chunks based on camera distance, supporting massive terrains (1000x1000+ world units)
- **Editor Tool Integration**: Create intuitive terrain creation and editing tools within the existing Unity-like editor interface, including heightmap import and basic sculpting capabilities

### Architecture & Directory Structure

```typescript
src/
├── core/
│   ├── lib/
│   │   ├── ecs/
│   │   │   ├── components/
│   │   │   │   ├── definitions/
│   │   │   │   │   └── TerrainComponent.ts          # New terrain ECS component
│   │   │   │   └── ComponentDefinitions.ts          # Register terrain component
│   │   └── terrain/                                 # New terrain subsystem
│   │       ├── TerrainGeometry.ts                   # Heightmap-based geometry generation
│   │       ├── TerrainMaterial.ts                   # Multi-layer texture blending
│   │       ├── TerrainPhysics.ts                    # HeightfieldCollider integration
│   │       ├── TerrainLOD.ts                        # Level-of-detail management
│   │       └── TerrainStreaming.ts                  # Chunk-based streaming system
├── editor/
│   ├── components/
│   │   ├── menus/
│   │   │   └── EnhancedAddObjectMenu.tsx            # Add terrain to menu
│   │   ├── panels/
│   │   │   ├── ViewportPanel/
│   │   │   │   ├── components/
│   │   │   │   │   ├── TerrainGeometry.tsx          # React Three Fiber integration
│   │   │   │   │   ├── TerrainMaterial.tsx          # Material rendering component
│   │   │   │   │   └── TerrainCollider.tsx          # Physics visualization
│   │   │   └── InspectorPanel/
│   │   │       └── Terrain/                         # New terrain inspector sections
│   │   │           ├── TerrainSection.tsx           # Basic terrain properties
│   │   │           ├── HeightmapSection.tsx         # Heightmap import/export
│   │   │           ├── TextureSection.tsx           # Multi-layer texturing
│   │   │           └── LODSection.tsx               # Performance settings
│   │   └── terrain/                                 # New terrain-specific UI
│   │       ├── HeightmapImporter.tsx                # Heightmap file handling
│   │       ├── TextureLayerEditor.tsx               # Layer configuration
│   │       └── TerrainPreview.tsx                   # Real-time preview
│   └── types/
│       └── shapes.ts                                # Add Terrain to ShapeType enum
```

## Implementation Phases

### Phase 1: Foundation - Terrain as Enhanced Shape Type

#### 1.1 Type System Integration

**Add to Shape Types** (`src/editor/types/shapes.ts`):

```typescript
export type ShapeType =
  | 'Cube'
  | 'Sphere'
  // ... existing shapes
  | 'Terrain'
  | 'CustomModel';
```

**Component Registry** (`src/core/lib/ecs/ComponentRegistry.ts`):

```typescript
const meshIdToTypeMap: { [key: string]: string } = {
  cube: 'Cube',
  sphere: 'Sphere',
  // ... existing mappings
  terrain: 'Terrain',
  custom: 'custom',
};
```

#### 1.2 Terrain Component Definition

**Terrain Data Interface**:

```typescript
export interface ITerrainData {
  // Basic terrain properties
  size: [number, number]; // width, depth in world units
  resolution: [number, number]; // vertices per axis (power of 2 + 1)
  heightScale: number; // maximum height variation

  // Heightmap configuration
  heightmapUrl?: string; // external heightmap image
  heightmapData?: Float32Array; // runtime heightmap data

  // LOD system
  enableLOD: boolean;
  chunkSize: number; // chunk size for LOD (power of 2)
  maxLODLevel: number; // maximum LOD levels
  lodDistance: number[]; // distance thresholds for LOD levels

  // Texturing
  textureBlending: boolean;
  layers: ITerrainLayer[];

  // Physics
  generateCollider: boolean;
  colliderLOD: number; // LOD level for physics collider

  // Advanced features (Phase 3)
  enableDeformation?: boolean;
  vegetationEnabled?: boolean;
}

export interface ITerrainLayer {
  // Texture maps
  diffuseTexture: string;
  normalTexture?: string;
  roughnessTexture?: string;

  // Texture tiling
  scale: [number, number]; // UV scale
  offset: [number, number]; // UV offset

  // Blending rules
  heightRange: [number, number]; // min/max height for this layer (0-1)
  slopeRange: [number, number]; // min/max slope for this layer (0-1)
  blendSharpness: number; // edge sharpness for blending

  // Layer properties
  metallic: number;
  roughness: number;
  opacity: number;
}
```

#### 1.3 Component Factory Integration

**Terrain Component** (`src/core/lib/ecs/components/definitions/TerrainComponent.ts`):

```typescript
import { z } from 'zod';
import { ComponentFactory, ComponentCategory } from '../ComponentFactory';

const TerrainLayerSchema = z.object({
  diffuseTexture: z.string(),
  normalTexture: z.string().optional(),
  roughnessTexture: z.string().optional(),
  scale: z.tuple([z.number(), z.number()]),
  offset: z.tuple([z.number(), z.number()]),
  heightRange: z.tuple([z.number(), z.number()]),
  slopeRange: z.tuple([z.number(), z.number()]),
  blendSharpness: z.number().min(0).max(10),
  metallic: z.number().min(0).max(1),
  roughness: z.number().min(0).max(1),
  opacity: z.number().min(0).max(1),
});

const TerrainSchema = z.object({
  size: z.tuple([z.number().positive(), z.number().positive()]),
  resolution: z.tuple([z.number().min(3), z.number().min(3)]),
  heightScale: z.number().positive(),
  heightmapUrl: z.string().optional(),
  enableLOD: z.boolean(),
  chunkSize: z.number().min(8),
  maxLODLevel: z.number().min(1).max(8),
  lodDistance: z.array(z.number().positive()),
  textureBlending: z.boolean(),
  layers: z.array(TerrainLayerSchema).min(1).max(8),
  generateCollider: z.boolean(),
  colliderLOD: z.number().min(0),
});

export const terrainComponent = ComponentFactory.create({
  id: 'Terrain',
  name: 'Terrain',
  category: ComponentCategory.Rendering,
  schema: TerrainSchema,
  fields: {
    sizeX: 'f32',
    sizeZ: 'f32',
    resolutionX: 'ui16',
    resolutionZ: 'ui16',
    heightScale: 'f32',
    enableLOD: 'ui8',
    chunkSize: 'ui16',
    maxLODLevel: 'ui8',
    textureBlending: 'ui8',
    generateCollider: 'ui8',
    colliderLOD: 'ui8',
  },
  incompatibleComponents: ['MeshRenderer', 'Camera', 'Light'],
  dependencies: ['Transform'],
  defaultValue: {
    size: [100, 100],
    resolution: [129, 129],
    heightScale: 10,
    enableLOD: true,
    chunkSize: 32,
    maxLODLevel: 4,
    lodDistance: [50, 100, 200, 400],
    textureBlending: true,
    layers: [
      {
        diffuseTexture: '/textures/grass-diffuse.jpg',
        scale: [10, 10],
        offset: [0, 0],
        heightRange: [0, 1],
        slopeRange: [0, 1],
        blendSharpness: 1,
        metallic: 0,
        roughness: 0.8,
        opacity: 1,
      },
    ],
    generateCollider: true,
    colliderLOD: 2,
  },
});
```

### Phase 2: Core Terrain Rendering System

#### 2.1 Terrain Geometry Generation

**Terrain Geometry Component** (`src/editor/components/panels/ViewportPanel/components/TerrainGeometry.tsx`):

```typescript
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { ITerrainData } from '@/core/types/terrain';

export interface ITerrainGeometryProps extends ITerrainData {
  onGeometryUpdate?: (geometry: THREE.BufferGeometry) => void;
}

export const TerrainGeometry: React.FC<ITerrainGeometryProps> = ({
  size,
  resolution,
  heightScale,
  heightmapUrl,
  heightmapData,
  enableLOD,
  chunkSize,
  onGeometryUpdate,
}) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // Load heightmap texture if provided
  const heightmapTexture = useTexture(heightmapUrl || '', (texture) => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
    }
  });

  const geometry = useMemo(() => {
    const [width, depth] = size;
    const [widthSegments, depthSegments] = resolution;

    // Create base plane geometry
    const geom = new THREE.PlaneGeometry(
      width,
      depth,
      widthSegments - 1,
      depthSegments - 1
    );

    // Rotate to lie flat (Y-up)
    geom.rotateX(-Math.PI / 2);

    // Apply heightmap if available
    if (heightmapTexture || heightmapData) {
      applyHeightmap(geom, heightmapTexture, heightmapData, heightScale, resolution);
    }

    // Generate LOD versions if enabled
    if (enableLOD) {
      generateLODGeometries(geom, chunkSize);
    }

    geom.computeVertexNormals();
    geom.computeBoundingBox();
    geom.computeBoundingSphere();

    return geom;
  }, [size, resolution, heightScale, heightmapTexture, heightmapData, enableLOD, chunkSize]);

  useEffect(() => {
    if (geometryRef.current && onGeometryUpdate) {
      onGeometryUpdate(geometryRef.current);
    }
  }, [geometry, onGeometryUpdate]);

  return <primitive ref={geometryRef} object={geometry} />;
};

function applyHeightmap(
  geometry: THREE.BufferGeometry,
  heightmapTexture: THREE.Texture | null,
  heightmapData: Float32Array | undefined,
  heightScale: number,
  resolution: [number, number]
) {
  const positions = geometry.attributes.position.array as Float32Array;
  const [widthRes, depthRes] = resolution;

  if (heightmapTexture) {
    // Extract height data from texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = widthRes;
    canvas.height = depthRes;

    ctx.drawImage(heightmapTexture.image, 0, 0, widthRes, depthRes);
    const imageData = ctx.getImageData(0, 0, widthRes, depthRes);

    for (let i = 0; i < positions.length / 3; i++) {
      const pixelIndex = i * 4;
      const height = (imageData.data[pixelIndex] / 255) * heightScale;
      positions[i * 3 + 1] = height; // Y component
    }
  } else if (heightmapData) {
    // Use provided height data
    for (let i = 0; i < Math.min(positions.length / 3, heightmapData.length); i++) {
      positions[i * 3 + 1] = heightmapData[i] * heightScale;
    }
  }

  geometry.attributes.position.needsUpdate = true;
}

function generateLODGeometries(
  geometry: THREE.BufferGeometry,
  chunkSize: number
) {
  // Implementation for LOD chunk generation
  // This will be expanded in Phase 2.2
  console.log('LOD generation not yet implemented');
}
```

#### 2.2 Terrain Material System

**Terrain Material** (`src/editor/components/panels/ViewportPanel/components/TerrainMaterial.tsx`):

```typescript
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { ITerrainLayer } from '@/core/types/terrain';

export interface ITerrainMaterialProps {
  layers: ITerrainLayer[];
  textureBlending: boolean;
  heightmapTexture?: THREE.Texture;
}

export const TerrainMaterial: React.FC<ITerrainMaterialProps> = ({
  layers,
  textureBlending,
  heightmapTexture,
}) => {
  // Load all layer textures
  const layerTextures = useTexture(
    layers.flatMap(layer => [
      layer.diffuseTexture,
      layer.normalTexture || '',
      layer.roughnessTexture || '',
    ]).filter(Boolean)
  );

  const material = useMemo(() => {
    if (!textureBlending || layers.length === 1) {
      // Single layer material
      const layer = layers[0];
      return new THREE.MeshStandardMaterial({
        map: layerTextures[layer.diffuseTexture],
        normalMap: layer.normalTexture ? layerTextures[layer.normalTexture] : undefined,
        roughnessMap: layer.roughnessTexture ? layerTextures[layer.roughnessTexture] : undefined,
        metalness: layer.metallic,
        roughness: layer.roughness,
      });
    }

    // Multi-layer blended material (custom shader)
    return createTerrainBlendMaterial(layers, layerTextures, heightmapTexture);
  }, [layers, textureBlending, layerTextures, heightmapTexture]);

  return <primitive object={material} />;
};

function createTerrainBlendMaterial(
  layers: ITerrainLayer[],
  textures: Record<string, THREE.Texture>,
  heightmapTexture?: THREE.Texture
): THREE.ShaderMaterial {
  // Custom shader material for terrain blending
  // This will be expanded with proper vertex/fragment shaders

  const uniforms = {
    uHeightmap: { value: heightmapTexture },
    uLayers: { value: layers.length },
    ...layers.reduce((acc, layer, index) => ({
      ...acc,
      [`uDiffuse${index}`]: { value: textures[layer.diffuseTexture] },
      [`uNormal${index}`]: { value: layer.normalTexture ? textures[layer.normalTexture] : null },
      [`uRoughness${index}`]: { value: layer.roughnessTexture ? textures[layer.roughnessTexture] : null },
      [`uScale${index}`]: { value: new THREE.Vector2(...layer.scale) },
      [`uOffset${index}`]: { value: new THREE.Vector2(...layer.offset) },
      [`uHeightRange${index}`]: { value: new THREE.Vector2(...layer.heightRange) },
      [`uSlopeRange${index}`]: { value: new THREE.Vector2(...layer.slopeRange) },
      [`uBlendSharpness${index}`]: { value: layer.blendSharpness },
    }), {}),
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
  });
}

const terrainVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vHeight;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vHeight = position.y;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const terrainFragmentShader = `
  // Multi-layer terrain blending shader
  // This will be expanded with proper blending logic

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vHeight;

  void main() {
    // Placeholder - implement proper terrain blending
    gl_FragColor = vec4(0.5, 0.8, 0.3, 1.0);
  }
`;
```

#### 2.3 EntityMesh Integration

**Update EntityMesh.tsx**:

```typescript
// Add terrain case to geometry switch
case 'Terrain':
  return <TerrainGeometry {...terrainProps} />;
```

### Phase 3: Editor Integration

#### 3.1 Entity Creation

**Update useEntityCreation.ts**:

```typescript
const createTerrain = useCallback(
  (name?: string, parentId?: number) => {
    const actualName = name || `Terrain ${getNextNumber('Terrain')}`;
    const entity = createEntity(actualName, parentId);

    // Add terrain component with default settings
    const terrainData: ITerrainData = {
      size: [100, 100],
      resolution: [129, 129],
      heightScale: 10,
      enableLOD: true,
      chunkSize: 32,
      maxLODLevel: 4,
      lodDistance: [50, 100, 200, 400],
      textureBlending: true,
      layers: [
        {
          diffuseTexture: '/textures/grass-diffuse.jpg',
          scale: [10, 10],
          offset: [0, 0],
          heightRange: [0, 1],
          slopeRange: [0, 1],
          blendSharpness: 1,
          metallic: 0,
          roughness: 0.8,
          opacity: 1,
        },
      ],
      generateCollider: true,
      colliderLOD: 2,
    };

    componentManager.addComponent(entity.id, 'Terrain', terrainData);
    return entity;
  },
  [createEntity, componentManager, getNextNumber],
);
```

#### 3.2 Menu Integration

**Update EnhancedAddObjectMenu.tsx**:

```typescript
const OBJECT_CATEGORIES: IMenuCategory[] = [
  // ... existing categories
  {
    label: 'Environment',
    icon: <TbMountain size={18} />,
    items: [
      {
        type: 'Terrain',
        label: 'Terrain',
        icon: <TbMountain size={18} />,
      },
    ],
  },
];

const validTypes: ShapeType[] = [
  'Cube',
  'Sphere',
  // ... existing types
  'Terrain',
];
```

#### 3.3 Inspector Panel Integration

**Terrain Inspector Component** (`src/editor/components/panels/InspectorPanel/Terrain/TerrainSection.tsx`):

```typescript
import React from 'react';
import { ITerrainData } from '@/core/types/terrain';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { Vector2Field } from '@/editor/components/shared/Vector2Field';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';

export interface ITerrainSectionProps {
  data: ITerrainData;
  onChange: (newData: Partial<ITerrainData>) => void;
}

export const TerrainSection: React.FC<ITerrainSectionProps> = ({
  data,
  onChange,
}) => {
  return (
    <CollapsibleSection title="Terrain Properties" defaultOpen={true}>
      <div className="space-y-3">
        {/* Basic Properties */}
        <Vector2Field
          label="Size"
          value={data.size}
          onChange={(size) => onChange({ size })}
          min={1}
          step={1}
        />

        <Vector2Field
          label="Resolution"
          value={data.resolution}
          onChange={(resolution) => onChange({ resolution })}
          min={3}
          step={1}
        />

        <SingleAxisField
          label="Height Scale"
          value={data.heightScale}
          onChange={(heightScale) => onChange({ heightScale })}
          min={0.1}
          step={0.1}
        />

        {/* LOD Settings */}
        <CheckboxField
          label="Enable LOD"
          checked={data.enableLOD}
          onChange={(enableLOD) => onChange({ enableLOD })}
        />

        {data.enableLOD && (
          <>
            <SingleAxisField
              label="Chunk Size"
              value={data.chunkSize}
              onChange={(chunkSize) => onChange({ chunkSize })}
              min={8}
              step={8}
            />

            <SingleAxisField
              label="Max LOD Level"
              value={data.maxLODLevel}
              onChange={(maxLODLevel) => onChange({ maxLODLevel })}
              min={1}
              max={8}
              step={1}
            />
          </>
        )}

        {/* Physics */}
        <CheckboxField
          label="Generate Collider"
          checked={data.generateCollider}
          onChange={(generateCollider) => onChange({ generateCollider })}
        />

        {/* Texturing */}
        <CheckboxField
          label="Texture Blending"
          checked={data.textureBlending}
          onChange={(textureBlending) => onChange({ textureBlending })}
        />
      </div>
    </CollapsibleSection>
  );
};
```

### Phase 4: Advanced Features (Future Development)

#### 4.1 Heightmap Import/Export

- Support for common heightmap formats (PNG, EXR, RAW)
- Real-time heightmap preview
- Heightmap generation tools (noise, erosion)

#### 4.2 Visual Terrain Editing

- Terrain sculpting tools (raise, lower, smooth, flatten)
- Texture painting system
- Vegetation placement tools
- Road and path creation tools

#### 4.3 Performance Optimizations

- Chunk-based LOD system
- Frustum culling for terrain chunks
- Heightfield physics colliders
- Texture streaming and compression

#### 4.4 Procedural Generation

- Noise-based terrain generation
- Erosion simulation
- Biome-based texture blending
- Procedural detail placement

## Dependencies and Libraries

### Current Dependencies Analysis

The existing Vibe Coder 3D stack already provides all necessary libraries for terrain implementation:

**✅ Already Available:**

- `@react-three/rapier` v2.1.0 - Includes `HeightfieldCollider` for optimized terrain physics
- `@react-three/drei` v10.0.6 - Provides `useTexture`, geometry utilities, and LOD components
- `three` v0.175.0 - Full Three.js support including `PlaneGeometry`, `ShaderMaterial`, and texture systems
- `@react-three/fiber` v9.1.2 - React integration with Three.js scene graph
- `bitecs` v0.3.40 - High-performance ECS for terrain chunk management
- `zod` v3.24.3 - Runtime validation for terrain component schemas

**❌ No Additional Dependencies Required**

### Recommended Optional Enhancements (Future)

For advanced terrain features, consider these optional additions:

```json
{
  "optional-future-dependencies": {
    "@tensorflow/tfjs": "^4.x.x", // For AI-based terrain generation
    "simplex-noise": "^4.x.x", // For procedural heightmap generation
    "pako": "^2.x.x", // For heightmap compression
    "gpu.js": "^2.x.x" // For GPU-accelerated terrain processing
  }
}
```

## Physics Integration Deep Dive

### Rapier HeightfieldCollider Integration

The terrain system will leverage Rapier's native `HeightfieldCollider` for optimal performance:

```typescript
// Terrain Physics Component
interface ITerrainPhysics {
  heightfieldArgs: [number, number, number[], { x: number; y: number; z: number }];
  bodyType: 'fixed' | 'kinematic'; // Static terrain or moving platforms
  friction: number;
  restitution: number;
  collisionGroups: number;
  solverGroups: number;
}
```

**HeightfieldCollider Advantages:**

- ✅ **Memory Efficient**: Stores only height values, not full mesh data
- ✅ **Performance Optimized**: Purpose-built for terrain collision in Rapier
- ✅ **Scalable**: Handles large terrains without performance degradation
- ✅ **Native Integration**: No additional physics library required

### Physics Component Architecture

**Extended MeshCollider Component**:

```typescript
// Update existing MeshColliderComponent to support heightfield
const colliderTypes = [
  'box',
  'sphere',
  'capsule',
  'convex',
  'mesh',
  'heightfield', // Add terrain support
];

// Terrain-specific collider configuration
export interface ITerrainColliderData extends IColliderData {
  type: 'heightfield';
  heightData: Float32Array | Uint16Array;
  dimensions: [number, number]; // width, height in heightmap units
  scale: [number, number, number]; // world scale factors
  chunkSize?: number; // For large terrain chunking
}
```

### Added: End-to-End Heightfield Collider Wiring (Implemented)

This project now ships with a full, reactive Heightfield collider path that mirrors the procedural terrain mesh exactly and efficiently.

Implementation summary:

1. ECS Schema updates

- File: `src/core/lib/ecs/components/definitions/MeshColliderComponent.ts`
  - Extended `ColliderType` to include `'heightfield'`.
  - Updated Zod enum to accept `'heightfield'`.
  - Mapped to internal `shapeType` index.

2. Inspector UI

- File: `src/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection.tsx`
  - Added “Heightfield (Terrain)” to the collider type select.
  - Shows a short hint when heightfield is selected.

3. Collider selection and config

- File: `src/editor/components/panels/ViewportPanel/hooks/useEntityColliders.ts`
  - Returns `'heightfield'` for Terrain by default (fallback) and when explicitly chosen in the MeshCollider.
  - Provides base collider config; terrain-specific data is injected later.

4. Terrain → Heightfield data generation

- File: `src/editor/components/panels/ViewportPanel/utils/terrainHeightfield.ts`
  - New utility `generateHeightfieldFromTerrain(terrain)` reuses the same multi‑octave value noise and rim shaping as the visual mesh to produce `[rows, cols, heights, scale]` expected by Rapier.
  - Heights are normalized so the lowest point sits at world Y=0 (matching geometry).

5. Runtime injection into colliders

- File: `src/editor/components/panels/ViewportPanel/EntityRenderer.tsx`
  - When the computed collider type is `'heightfield'`, we locate the entity's `Terrain` data, generate heightfield arrays, and pass them to `EntityColliders`.
  - This ties collider rebuilds to terrain edits (size, segments, noise params). The existing `terrainColliderKey` forces the physics body to remount on changes.

6. Collider rendering

- File: `src/editor/components/panels/ViewportPanel/components/EntityColliders.tsx`
  - Renders `<HeightfieldCollider>` with Rapier’s expected args: `[cols, rows, heights, { x, y, z }]`.

Editor usage:

- Select a terrain entity → add or open `Mesh Collider` in the Inspector → choose “Heightfield (Terrain)”.
- Tweak terrain parameters (size, segments, noise). Collider updates automatically and matches the visible mesh.

Performance notes:

- Heightfield is significantly cheaper than a trimesh for large terrains. We generate densities based on segments; for very large terrains consider reducing segments to the minimum that still matches gameplay needs.

Follow‑ups:

- Colliders can be chunked per LOD in the future. The current single heightfield is adequate for typical editor scenes.

**Physics Body Management**:

```typescript
// Terrain entities use static RigidBody for optimal performance
const terrainRigidBodyDefaults: IRigidBodyData = {
  bodyType: 'fixed', // Static terrain - no movement
  mass: 0, // Infinite mass for static bodies
  friction: 0.7, // Realistic terrain friction
  restitution: 0.1, // Low bounce for natural feel
  gravityScale: 1.0,
  canSleep: false, // Static bodies don't sleep
  linearDamping: 0,
  angularDamping: 0,
};
```

### Collision Optimization Strategies

**1. Heightmap Data Optimization**:

```typescript
class TerrainHeightmapManager {
  private heightmaps = new Map<string, Uint16Array>();

  // Convert float heights to 16-bit integers for memory efficiency
  compressHeights(heights: number[], maxHeight: number): Uint16Array {
    const compressed = new Uint16Array(heights.length);
    const scale = 65535 / maxHeight; // 16-bit range

    for (let i = 0; i < heights.length; i++) {
      compressed[i] = Math.round(heights[i] * scale);
    }

    return compressed;
  }

  // Decompress for physics engine
  decompressHeights(compressed: Uint16Array, maxHeight: number): number[] {
    const scale = maxHeight / 65535;
    return Array.from(compressed, (h) => h * scale);
  }
}
```

**2. Chunk-based Collision for Large Terrains**:

```typescript
interface ITerrainChunk {
  id: string;
  bounds: THREE.Box3;
  heightData: Uint16Array;
  lod: number;
  physicsActive: boolean;
}

class TerrainPhysicsManager {
  private activeChunks = new Map<string, ITerrainChunk>();
  private chunkSize = 64; // 64x64 heightmap per chunk

  updatePhysicsChunks(cameraPosition: THREE.Vector3) {
    // Activate physics for chunks near camera
    // Deactivate physics for distant chunks
    // Use different LOD levels based on distance
  }
}
```

**3. Collision Layers and Interaction Groups**:

```typescript
// Rapier collision groups for terrain
const CollisionGroups = {
  TERRAIN: 0b0001, // Group 1: Terrain
  PLAYER: 0b0010, // Group 2: Player characters
  OBJECTS: 0b0100, // Group 3: Interactive objects
  PROJECTILES: 0b1000, // Group 4: Projectiles
} as const;

// Terrain collides with everything except other terrain
const terrainCollisionGroups = CollisionGroups.TERRAIN;
const terrainSolverGroups =
  CollisionGroups.PLAYER | CollisionGroups.OBJECTS | CollisionGroups.PROJECTILES;
```

## Technical Considerations

### Performance

1. **Memory Management**:

   - Use `Uint16Array` for heightmap data compression (65KB per 512x512 terrain vs 2MB float32)
   - Implement texture atlasing for multiple layers (single draw call)
   - Chunk-based loading/unloading for large terrains (only active chunks in memory)
   - WeakMap for height data cleanup when terrain entities are destroyed

2. **Rendering Optimization**:

   - LOD system with distance-based detail reduction using drei's `<Level>` component
   - Frustum culling for terrain chunks using Three.js built-in culling
   - Instanced rendering for vegetation and details using drei's `<Instances>`
   - GPU-based terrain generation using `ShaderMaterial` for procedural details

3. **Physics Integration**:
   - `HeightfieldCollider` for efficient collision detection (10x faster than mesh collision)
   - Simplified physics geometry at different LOD levels (64x64 near, 16x16 far)
   - Dynamic collider updates for terrain deformation using Rapier's dynamic heightfield updates
   - Collision layer optimization to reduce unnecessary collision checks

### Heightfield Physics Implementation

**Terrain Collider Component**:

```typescript
// Integration with existing EntityColliders system
export const TerrainCollider: React.FC<{
  terrainData: ITerrainData;
  center: [number, number, number];
  isTrigger: boolean;
}> = ({ terrainData, center, isTrigger }) => {
  const heightArray = useMemo(() => {
    return convertHeightmapToArray(terrainData.heightmapData, terrainData.resolution);
  }, [terrainData.heightmapData, terrainData.resolution]);

  return (
    <HeightfieldCollider
      args={[
        terrainData.resolution[0] - 1, // width segments
        terrainData.resolution[1] - 1, // height segments
        heightArray,
        {
          x: terrainData.size[0] / (terrainData.resolution[0] - 1),
          y: terrainData.heightScale,
          z: terrainData.size[1] / (terrainData.resolution[1] - 1)
        }
      ]}
      position={center}
      sensor={isTrigger}
      friction={0.7}
      restitution={0.1}
      collisionGroups={CollisionGroups.TERRAIN}
      solverGroups={terrainCollisionGroups}
    />
  );
};
```

**Performance Monitoring**:

```typescript
// Terrain performance metrics
interface ITerrainMetrics {
  renderTime: number; // Frame render time for terrain
  physicsTime: number; // Physics simulation time
  memoryUsage: number; // Memory usage in MB
  activeChunks: number; // Number of active terrain chunks
  collisionChecks: number; // Physics collision checks per frame
}

class TerrainPerformanceMonitor {
  metrics: ITerrainMetrics = {
    renderTime: 0,
    physicsTime: 0,
    memoryUsage: 0,
    activeChunks: 0,
    collisionChecks: 0,
  };

  // Integration with editor performance panel
  updateMetrics() {
    // Track terrain-specific performance
  }
}
```

### Editor Integration

1. **Visual Feedback**:

   - Real-time terrain preview in viewport
   - Heightmap visualization overlay
   - LOD level debugging visualization

2. **User Experience**:

   - Intuitive terrain creation workflow
   - Progressive disclosure of advanced features
   - Clear visual indicators for terrain boundaries

3. **Asset Management**:
   - Terrain preset system
   - Heightmap asset browser
   - Texture library integration

### Future Extensibility

1. **Plugin Architecture**:

   - Custom terrain generators
   - Third-party heightmap sources
   - Specialized terrain tools

2. **Export/Import**:

   - Standard terrain format support
   - Unity terrain conversion
   - Heightmap export for external tools

3. **Collaboration**:
   - Real-time collaborative terrain editing
   - Version control for terrain assets
   - Cloud-based terrain processing

### Collision Debug Visualization

**Terrain Physics Debug Component**:

```typescript
// Extended collision visualization for terrain
export const TerrainCollisionDebug: React.FC<{
  terrainData: ITerrainData;
  showHeightfield: boolean;
  showChunks: boolean;
}> = ({ terrainData, showHeightfield, showChunks }) => {
  return (
    <group>
      {/* Heightfield bounds visualization */}
      {showHeightfield && (
        <mesh>
          <boxGeometry args={[
            terrainData.size[0],
            terrainData.heightScale,
            terrainData.size[1]
          ]} />
          <meshBasicMaterial
            color="#00ff00"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Chunk boundaries visualization */}
      {showChunks && (
        <TerrainChunkDebugGrid terrainData={terrainData} />
      )}
    </group>
  );
};
```

### Large Terrain Optimization

**Terrain Streaming System**:

```typescript
class TerrainStreamingManager {
  private loadedChunks = new Map<string, ITerrainChunk>();
  private loadingQueue: string[] = [];
  private maxActiveChunks = 25; // 5x5 grid around player

  async updateTerrain(cameraPosition: THREE.Vector3) {
    const visibleChunks = this.getVisibleChunks(cameraPosition);

    // Unload distant chunks
    this.unloadDistantChunks(cameraPosition);

    // Load nearby chunks
    await this.loadNearbyChunks(visibleChunks);

    // Update physics colliders
    this.updatePhysicsColliders(cameraPosition);
  }

  private async loadTerrainChunk(chunkId: string): Promise<ITerrainChunk> {
    // Load heightmap data for chunk
    // Generate geometry and physics data
    // Add to active chunks
  }
}
```

## Advanced Implementation Features

### Dynamic Terrain Deformation

**Runtime Terrain Modification**:

```typescript
interface ITerrainDeformation {
  position: [number, number]; // X, Z coordinates in heightmap space
  radius: number; // Deformation radius
  strength: number; // Deformation intensity (-1 to 1)
  type: 'raise' | 'lower' | 'smooth' | 'flatten';
}

class TerrainDeformationSystem {
  applyDeformation(terrainData: ITerrainData, deformation: ITerrainDeformation) {
    // Modify heightmap data
    const modifiedHeights = this.modifyHeightmap(terrainData.heightmapData, deformation);

    // Update geometry
    this.updateTerrainGeometry(terrainData, modifiedHeights);

    // Update physics collider
    this.updatePhysicsCollider(terrainData, modifiedHeights);

    // Trigger re-render
    this.notifyTerrainUpdate(terrainData);
  }
}
```

### Terrain Material Blending

**Multi-layer Terrain Shader**:

```typescript
const terrainFragmentShader = `
uniform sampler2D uHeightmap;
uniform sampler2D uSplatmap;    // R=sand, G=grass, B=rock, A=snow

uniform sampler2D uSandDiffuse;
uniform sampler2D uGrassDiffuse;
uniform sampler2D uRockDiffuse;
uniform sampler2D uSnowDiffuse;

uniform sampler2D uSandNormal;
uniform sampler2D uGrassNormal;
uniform sampler2D uRockNormal;
uniform sampler2D uSnowNormal;

varying vec2 vUv;
varying vec3 vNormal;
varying float vHeight;

void main() {
  // Sample blend weights from splatmap
  vec4 splatWeights = texture2D(uSplatmap, vUv);
  
  // Normalize weights
  float totalWeight = splatWeights.r + splatWeights.g + splatWeights.b + splatWeights.a;
  if (totalWeight > 0.0) {
    splatWeights /= totalWeight;
  }
  
  // Sample all diffuse textures
  vec3 sandColor = texture2D(uSandDiffuse, vUv * 16.0).rgb;
  vec3 grassColor = texture2D(uGrassDiffuse, vUv * 8.0).rgb;
  vec3 rockColor = texture2D(uRockDiffuse, vUv * 4.0).rgb;
  vec3 snowColor = texture2D(uSnowDiffuse, vUv * 2.0).rgb;
  
  // Blend colors based on weights
  vec3 finalColor = sandColor * splatWeights.r +
                   grassColor * splatWeights.g +
                   rockColor * splatWeights.b +
                   snowColor * splatWeights.a;
  
  // Apply height-based blending
  float heightBlend = smoothstep(0.3, 0.7, vHeight);
  finalColor = mix(finalColor, snowColor, heightBlend * 0.5);
  
  // Apply slope-based blending
  float slope = 1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0));
  float slopeBlend = smoothstep(0.3, 0.8, slope);
  finalColor = mix(finalColor, rockColor, slopeBlend * 0.7);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
```

## Implementation Timeline

**Phase 1 - Foundation (2-3 weeks)**:

- ✅ Basic terrain component integration with existing ECS system
- ✅ Simple heightmap support using `PlaneGeometry` and height displacement
- ✅ HeightfieldCollider integration for basic physics collision
- ✅ Single-layer material system with PBR support

**Phase 2 - Core Features (3-4 weeks)**:

- 🔧 Multi-layer texture blending with custom shader materials
- 🔧 LOD system implementation using chunk-based geometry
- 🔧 Advanced physics integration with collision optimization
- 🔧 Memory management for large terrain datasets

**Phase 3 - Editor Tools (2-3 weeks)**:

- 🔧 Inspector panel integration with terrain-specific property editors
- 🔧 Heightmap import/export system (PNG, EXR, RAW formats)
- 🔧 Basic editing tools (height painting, texture painting)
- 🔧 Real-time terrain preview and validation

**Phase 4 - Advanced Features (4-6 weeks)**:

- ⏳ Visual terrain editing with sculpting tools
- ⏳ Procedural generation using noise algorithms
- ⏳ Performance optimizations and streaming system
- ⏳ Dynamic terrain deformation and runtime editing

**Phase 5 - Polish & Optimization (2-3 weeks)**:

- ⏳ Performance profiling and bottleneck elimination
- ⏳ Memory usage optimization and garbage collection
- ⏳ Editor UX improvements and workflow refinement
- ⏳ Documentation and tutorial creation

## Conclusion

This terrain system design provides a comprehensive foundation for landscape creation in Vibe Coder 3D while maintaining compatibility with the existing architecture. The hybrid approach ensures seamless integration with the Unity-like editor while enabling the specialized optimizations required for high-performance terrain rendering.

The phased implementation approach allows for incremental development and testing, ensuring that each feature builds upon a solid foundation. The system is designed to be extensible, allowing for future enhancements and specialized terrain tools.
