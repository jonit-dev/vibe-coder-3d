# Geometry Assets

This directory contains geometry metadata files (`.shape.json`) that define 3D geometry using a JSON format compatible with THREE.BufferGeometry.

## Overview

Geometry assets replace the legacy TSX-based custom shapes with a simple, engine-agnostic JSON format that can be:
- Exported from the editor
- Created manually
- Imported from external tools
- Rendered identically in both TypeScript (Three.js) and Rust (three-d) renderers

## File Format

Geometry files use the `.shape.json` extension and follow this structure:

```json
{
  "meta": {
    "version": "1.0.0",
    "generator": "vibe-geometry-exporter",
    "name": "Example Box",
    "tags": ["primitive", "box"]
  },
  "attributes": {
    "position": {
      "itemSize": 3,
      "normalized": false,
      "array": [...],
      "type": "float32"
    },
    "normal": { /* optional */ },
    "uv": { /* optional */ },
    "color": { /* optional */ },
    "tangent": { /* optional */ }
  },
  "index": { /* optional */ },
  "groups": [ /* optional, for multi-material support */ ],
  "bounds": { /* optional, computed automatically if missing */ }
}
```

## Attributes

### Required Attributes

- **position**: Vertex positions (itemSize: 3, type: float32)
  - Format: `[x1, y1, z1, x2, y2, z2, ...]`

### Optional Attributes

- **normal**: Vertex normals (itemSize: 3, type: float32)
  - Format: `[nx1, ny1, nz1, nx2, ny2, nz2, ...]`
  - Can be computed automatically if missing

- **uv**: Texture coordinates (itemSize: 2, type: float32)
  - Format: `[u1, v1, u2, v2, ...]`

- **color**: Vertex colors (itemSize: 3 or 4, type: float32)
  - RGB: `[r1, g1, b1, r2, g2, b2, ...]`
  - RGBA: `[r1, g1, b1, a1, r2, g2, b2, a2, ...]`

- **tangent**: Tangent vectors for normal mapping (itemSize: 4, type: float32)
  - Format: `[tx1, ty1, tz1, w1, tx2, ty2, tz2, w2, ...]`
  - w component encodes handedness (+1 or -1)
  - Can be computed automatically if missing

## Using Geometry Assets

### In the Editor

1. **Import existing geometry**:
   - Select a mesh in the viewport
   - Use "Export to Geometry Asset" feature
   - File is saved to `src/game/geometry/`

2. **Create entity with geometry asset**:
   - Open the Add Object menu
   - Navigate to "Geometry Assets"
   - Browse and select a .shape.json file
   - Entity is created with GeometryAsset component

### Programmatically

```typescript
import { createGeometryAssetEntity } from '@/editor/hooks/useEntityCreation';

const entity = createGeometryAssetEntity('/src/game/geometry/example_box.shape.json', {
  position: [0, 5, 0],
  materialId: 'myMaterial',
  options: {
    recomputeNormals: false,
    scale: 2.0
  }
});
```

### Component Properties

The GeometryAsset component has these properties:

- **path** (required): Path to the .shape.json file
- **geometryId** (optional): Unique identifier for this geometry
- **materialId** (optional): Override material
- **enabled**: Enable/disable rendering (default: true)
- **castShadows**: Cast shadows (default: true)
- **receiveShadows**: Receive shadows (default: true)
- **options**:
  - **recomputeNormals**: Recompute normals from geometry (default: false)
  - **recomputeTangents**: Recompute tangents for normal mapping (default: false)
  - **recenter**: Center geometry at origin (default: false)
  - **computeBounds**: Compute bounding box/sphere (default: true)
  - **flipNormals**: Flip normal direction (default: false)
  - **scale**: Additional scale factor (default: 1.0)

## Best Practices

1. **Naming**: Use descriptive names like `tree_oak.shape.json`, `building_house.shape.json`
2. **Tags**: Add relevant tags for searchability
3. **Optimization**: For large geometries (>10k vertices), consider using external .bin files
4. **Normals**: Include normals when possible for better performance
5. **UVs**: Include UVs if you plan to use textures
6. **Bounds**: Let the system compute bounds automatically unless you have specific requirements

## Visual Verification

You can render any `.shape.json` file to a PNG image for visual verification and quality checking:

```bash
# Render geometry to PNG
node scripts/render-geometry.js src/game/geometry/tree_oak.shape.json

# Or use the npm script
yarn render:geometry src/game/geometry/tree_oak.shape.json

# Specify custom output path
node scripts/render-geometry.js src/game/geometry/tree_oak.shape.json output/preview.png
```

The script will:
- Parse the geometry metadata into Three.js BufferGeometry
- Render with proper lighting (ambient + directional lights)
- Apply vertex colors if present
- Position camera based on bounding sphere
- Output a 1024x1024 PNG with shadows

**Use cases:**
- Verify geometry looks correct after creation/modification
- Compare against reference images when iterating on design
- Generate previews for documentation or asset browsing
- Debug vertex positions, colors, and normals visually

## Format Version

Current version: **1.0.0**

Future versions may add support for:
- Morph targets (blend shapes)
- Skeletal animation data
- Compressed binary formats
- Streaming/LOD support

## Migration from Custom Shapes

Legacy CustomShape components will be automatically migrated to GeometryAsset format. To manually migrate:

1. Export your custom shape to a .shape.json file
2. Replace CustomShape component with GeometryAsset
3. Reference the exported .shape.json path

See the migration guide for details: `/docs/GEOMETRY_MIGRATION.md`
