# 3D Asset Optimization Pipeline Guide

## Overview

The 3D Asset Optimization Pipeline is an automated system that optimizes GLB model files for runtime performance and load times. It applies geometry transforms, mesh compression, texture resizing, and generates LOD (Level of Detail) variants.

## Features

- ✅ **Geometry Optimization**: Prune, dedup, weld, and quantize vertex data
- ✅ **Mesh Compression**: Draco compression for smaller file sizes
- ✅ **Texture Processing**: Automatic power-of-two resizing with max dimension caps
- ✅ **LOD Generation**: Multiple quality levels for distance-based rendering
- ✅ **Smart Caching**: Skip reprocessing when files and config are unchanged
- ✅ **Detailed Reporting**: Size reduction and triangle count statistics

## Quick Start

```bash
# Optimize all models
yarn optimize

# Force re-optimization (ignore cache)
yarn optimize:force

# Optimize as part of build
yarn build
```

The pipeline runs automatically during:

- `yarn dev` - Silent background optimization
- `yarn build` - Pre-build optimization

## Configuration

Edit `.model-optimization.config.json` in the project root:

```json
{
  "pipelineVersion": 1,
  "geometry": {
    "quantize": {
      "position": 14,
      "normal": 10,
      "texcoord": 12,
      "color": 8,
      "generic": 12
    },
    "simplify": {
      "enabled": true,
      "ratio": 0.6,
      "error": 0.001
    }
  },
  "compression": {
    "method": "draco",
    "draco": {
      "encodeSpeed": 5,
      "decodeSpeed": 5
    },
    "meshopt": {
      "level": "medium"
    }
  },
  "textures": {
    "resize": {
      "enabled": true,
      "max": 2048,
      "powerOfTwo": true
    },
    "ktx2": {
      "enabled": false,
      "mode": "ETC1S",
      "quality": 128,
      "uastcZstandard": 18
    }
  },
  "lod": {
    "enabled": true,
    "ratios": [1.0, 0.5, 0.25]
  }
}
```

### Configuration Options

#### Geometry

- **quantize**: Precision bits for vertex attributes (lower = smaller file)

  - `position`: 14 bits (default) - Good balance for most models
  - `normal`: 10 bits - Sufficient for smooth shading
  - `texcoord`: 12 bits - High precision UVs
  - `color`: 8 bits - Standard color precision
  - `generic`: 12 bits - Other vertex attributes

- **simplify**: Polygon reduction settings
  - `enabled`: Enable/disable simplification
  - `ratio`: Keep N% of triangles (0.6 = 60%)
  - `error`: Maximum visual deviation (0.001 = 0.1%)

#### Compression

- **method**: `"draco"` | `"meshopt"` | `"both"`

  - `draco`: Better compression, slower decode
  - `meshopt`: Faster decode, web-optimized
  - `both`: Apply both (not recommended)

- **draco**: Draco-specific settings
  - `encodeSpeed`: 1-10 (10 = fastest, lower quality)
  - `decodeSpeed`: 1-10 (10 = fastest decode)

#### Textures

- **resize**: Texture sizing options

  - `enabled`: Enable automatic resizing
  - `max`: Maximum dimension (e.g., 2048)
  - `powerOfTwo`: Force power-of-two dimensions

- **ktx2**: KTX2/Basis Universal compression
  - `enabled`: Enable KTX2 compression (requires `toktx` binary)
  - `mode`: `"ETC1S"` (smaller) or `"UASTC"` (higher quality)
  - `quality`: 1-255 (higher = better quality)

#### LOD

- **enabled**: Enable LOD generation
- **ratios**: Array of simplification ratios
  - First value (1.0) is always the base model
  - Additional values generate LOD variants (e.g., [1.0, 0.5, 0.25])

## Directory Structure

The pipeline organizes models as follows:

```
public/assets/models/
└── <ModelName>/
    ├── model.glb              # Original source file
    ├── glb/
    │   └── model.glb          # Optimized base (LOD0)
    └── lod/
        ├── model.lod1.glb     # 50% triangle count
        └── model.lod2.glb     # 25% triangle count
```

**Important**:

- Source `.glb` files should be placed directly in `<ModelName>/` directories
- `glb/` and `lod/` subdirectories are auto-generated and should be in `.gitignore`
- The pipeline skips `glb/` and `lod/` directories to avoid recursive optimization

## Manifest

The `.model-optimization-manifest.json` tracks optimization state:

```json
{
  "optimized": {
    "public/assets/models/FarmHouse/farm_house_basic_shaded.glb": {
      "fileHash": "sha256:...",
      "configHash": "sha256:...",
      "outputs": {
        "lod0": { "path": "...", "size": 123456 },
        "lod1": { "path": "...", "size": 65432 },
        "lod2": { "path": "...", "size": 32100 }
      },
      "timestamp": 1730000000000
    }
  }
}
```

- **fileHash**: SHA-256 of source file content
- **configHash**: SHA-256 of pipeline configuration
- Models are re-optimized when either hash changes

## Performance Impact

Typical results from optimizing farm assets:

```
📊 Summary:
   ✅ Optimized: 3
   💾 Total size: 19,133KB → 9,282KB (-51.5%)
   🔺 Total triangles: 297,709 → 291,286 (-2.2%)
```

### Size Reduction Factors

1. **Draco Compression**: 40-60% reduction
2. **Geometry Simplification**: 5-15% reduction
3. **Texture Resizing**: 20-40% (when textures are oversized)
4. **Quantization**: 10-20% reduction

## Best Practices

### Adding New Models

1. Place source `.glb` file in `public/assets/models/<ModelName>/`
2. Run `yarn optimize` or let build scripts handle it
3. Commit source files only; generated `glb/` and `lod/` are ephemeral

### Adjusting Quality

**For high-quality hero assets:**

```json
{
  "geometry": { "simplify": { "ratio": 0.8 } },
  "compression": { "draco": { "encodeSpeed": 3 } }
}
```

**For background/distant objects:**

```json
{
  "geometry": { "simplify": { "ratio": 0.4 } },
  "compression": { "draco": { "encodeSpeed": 8 } }
}
```

### Troubleshooting

**Models not optimizing:**

- Check file is `.glb` (not `.gltf`)
- Verify file is in correct directory (not in `glb/` or `lod/`)
- Run with `--force` to ignore cache

**Visual artifacts:**

- Increase `geometry.simplify.ratio`
- Reduce `geometry.simplify.error`
- Increase quantization bits

**Large file sizes:**

- Enable texture resizing
- Lower `textures.resize.max`
- Enable KTX2 compression (requires `toktx`)

## CI/CD Integration

The pipeline integrates seamlessly with build processes:

```json
{
  "build": "... && node scripts/optimize-models.js --silent && tsc && vite build"
}
```

Silent mode suppresses output except errors, ideal for CI logs.

## Dependencies

- `@gltf-transform/core` - glTF document manipulation
- `@gltf-transform/functions` - Optimization transforms
- `draco3dgltf` - Draco compression codec
- `meshoptimizer` - Meshopt simplification
- `sharp` - Image resizing (Node native)

Optional:

- `toktx` - KTX2/Basis Universal compression (external binary)

## Advanced: Per-Model Overrides

To override settings for specific models, modify `scripts/optimize-models.js`:

```javascript
const modelConfig = {
  'FarmHouse/farm_house_basic_shaded.glb': {
    geometry: { simplify: { ratio: 0.8 } },
  },
};
```

## Related Documentation

- [PRD: 3D Asset Optimization Pipeline](./PRDs/editor/3d-asset-optimization-pipeline.md)
- [gltf-transform Documentation](https://gltf-transform.dev/)
- [Draco Compression](https://google.github.io/draco/)
- [Meshoptimizer](https://github.com/zeux/meshoptimizer)

## Support

For issues or questions:

1. Check manifest for error details
2. Run `yarn optimize` with verbose output
3. Review optimization logs for specific models
4. Consult PRD edge cases section
