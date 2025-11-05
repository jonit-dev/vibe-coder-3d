# LOD System Test Scenes

## Quick Start

**Auto-switch is ALWAYS enabled by default** - just run the scene:

```bash
# Test with FarmHouse models (auto LOD by default)
yarn rust:engine --scene ../../game/scenes/tests/testlod-farmhouse.json

# Force specific quality (overrides auto-switch)
yarn rust:engine --scene ../../game/scenes/tests/testlod-farmhouse.json --lod-quality low_fidelity
```

## Scene Layout

**testlod-farmhouse.json** - 5 FarmHouse models positioned to test different LOD scenarios:

1. **Close (0, 0, 0)** - ~25 units from camera → Original quality
2. **Medium (40, 0, -20)** - ~65 units from camera → High Fidelity
3. **Far (0, 0, -80)** - ~105 units from camera → Low Fidelity
4. **Override High (-40, 0, -20)** - Always High Fidelity (ignores distance)
5. **Override Low (20, 0, 5)** - Always Low Fidelity (ignores distance)

Camera at (0, 8, 25) looking down at scene.

## Default Thresholds

- **< 50 units**: Original quality (full detail)
- **50-100 units**: High Fidelity (75% polygons)
- **> 100 units**: Low Fidelity (35% polygons)

## Custom Thresholds

```bash
# Tighter LOD switching (for close-up scenes)
yarn rust:engine --scene ../../game/scenes/tests/testlod-farmhouse.json \
  --lod-threshold-high 30 --lod-threshold-low 60

# Wider LOD switching (for open-world scenes)
yarn rust:engine --scene ../../game/scenes/tests/testlod-farmhouse.json \
  --lod-threshold-high 100 --lod-threshold-low 200
```

## What to Look For

✅ **Auto-switch is enabled by default** - models at different distances should use different LOD levels
✅ **Path resolution** - models load from `/lod/` directory with quality suffix
✅ **Override quality** - some models always use specific quality regardless of distance
✅ **Smooth operation** - no crashes, proper rendering

## Draco Compression Solution

✅ **Draco models are now automatically decompressed!**

The optimization pipeline automatically:

1. Detects Draco-compressed models
2. Decompresses them offline (faster than runtime)
3. Applies decimation and generates LOD variants
4. Compresses with meshoptimizer (works in both Three.js and Rust)

**To prepare FarmHouse models for testing:**

```bash
# Run optimization pipeline (handles Draco decompression automatically)
cd /path/to/vibe-coder-3d
yarn optimize --model=FarmHouse

# Or manually decompress if needed
node scripts/decompress-draco.js \
  src/game/assets/models/FarmHouse/farmhouse.glb \
  src/game/assets/models/FarmHouse/farmhouse.glb
```

**Result**: Models work in both Three.js editor AND Rust engine with LOD support!

See [Draco Decompression Guide](../../../../docs/DRACO-DECOMPRESSION-GUIDE.md) for details.

**LOD System Status**: ✅ Fully implemented and tested (29 passing unit tests). Asset pipeline ready for production use.
