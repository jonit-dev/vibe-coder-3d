# Quick Start: LOD + Smallest File Sizes

## TL;DR

**Goal**: Smallest files that work in both Three.js and Rust with LOD support

**Solution**: One command!

```bash
yarn optimize --model=FarmHouse
```

This automatically:

- ✅ Decompresses Draco (if present)
- ✅ Decimates geometry (90%+ reduction)
- ✅ Generates LOD variants
- ✅ Result: Smaller than original + works everywhere

## File Size Reality Check

### Don't Worry About the Intermediate Size!

Yes, decompressing increases file size temporarily:

- Draco compressed: 3.8MB → Decompressed: 4.8MB

But after decimation, you get MUCH smaller:

- **Base model**: ~1.5MB (84% fewer triangles)
- **LOD high**: ~600KB
- **LOD low**: ~200KB

**Total for all 3 variants**: ~2.3MB vs 3.8MB original!

## Why Decimation Beats Compression

### File Size Breakdown

```
Draco (high-poly):     3.8MB, 39,888 triangles ❌ Rust won't load
Uncompressed (decim):  1.2MB,  6,000 triangles ✅ Works everywhere
Compressed (decim):    0.8MB,  6,000 triangles ✅ Even better!
```

**Key insight**: Removing 90% of triangles saves more space than any compression!

## Step-by-Step Example

### 1. Check Current Model

```bash
node scripts/decompress-draco.js --check src/game/assets/models/FarmHouse/glb/farm_house_basic_shaded.glb
```

Output:

```
📦 farm_house_basic_shaded.glb
   Draco: ✅ Yes (required)
   Triangles: 39,888
```

### 2. Run Optimization

```bash
yarn optimize --model=FarmHouse
```

What happens:

```
🔓 Decompressing Draco model: farm_house_basic_shaded.glb
✅ Decompressed (now uncompressed)
🔧 Decimating to 6,000 triangles...
✅ Generated glb/farm_house_basic_shaded.glb (1.5MB)
📊 Generating high_fidelity LOD (40% of base)...
✅ Generated lod/farm_house_basic_shaded.high_fidelity.glb (600KB)
📊 Generating low_fidelity LOD (10% of base)...
✅ Generated lod/farm_house_basic_shaded.low_fidelity.glb (200KB)
```

### 3. Verify Results

```bash
ls -lh src/game/assets/models/FarmHouse/glb/
ls -lh src/game/assets/models/FarmHouse/lod/
```

### 4. Test in Both Editors

```bash
# Three.js editor (uses LOD automatically)
yarn dev

# Rust engine (LOD enabled by default)
yarn rust:engine --scene testlod-farmhouse
```

## Configuration for Best Results

Add to `.env`:

```bash
# Decimation (for smallest file sizes)
USE_BLENDER_DECIMATION=true        # Best quality decimation
AUTO_DECIMATE_MODELS=true          # Auto-process all models
AUTO_DECIMATE_RATIO=0.15           # Keep 15% of triangles

# LOD generation
ENABLE_LOD_GENERATION=true
LOD_HIGH_RATIO=0.4                 # 40% of base
LOD_LOW_RATIO=0.1                  # 10% of base
```

## Comparison: Compression Methods

| Method                 | File Size | Triangle Count | Three.js | Rust | LOD |
| ---------------------- | --------- | -------------- | -------- | ---- | --- |
| **Draco (original)**   | 3.8MB     | 39,888         | ✅       | ❌   | ❌  |
| **Uncompressed**       | 12MB      | 39,888         | ✅       | ✅   | ❌  |
| **Decimate only**      | 1.2MB     | 6,000          | ✅       | ✅   | ✅  |
| **Decimate + Meshopt** | 0.8MB     | 6,000          | ✅       | ✅   | ✅  |

**Winner**: Decimate + meshopt (or just decimate if meshopt not available)

## FAQ

### Q: Why does decompressing make the file larger?

**A**: Draco compresses the geometry data, so removing compression temporarily increases size. But decimation (removing triangles) reduces it far more than compression ever could!

### Q: Do I lose quality?

**A**: Not visibly! The decimation targets are based on industry best practices:

- **Hero props**: 50K → 40K triangles (you won't notice)
- **Environment**: 20K → 5K triangles (looks the same from normal distance)
- **Background**: 5K → 1K triangles (never close enough to see detail)

### Q: What if I want maximum quality?

```bash
# Less aggressive decimation
AUTO_DECIMATE_RATIO=0.3  # Keep 30% instead of 15%
```

### Q: What if I want maximum compression?

```bash
# More aggressive decimation
AUTO_DECIMATE_RATIO=0.05  # Keep only 5%
MAX_TEXTURE_SIZE=512      # Smaller textures too
```

## The Bottom Line

| Concern                             | Solution                                      |
| ----------------------------------- | --------------------------------------------- |
| "Decompressing makes files larger!" | ✅ Temporary - decimation makes them smaller  |
| "I need it to work in Rust"         | ✅ Decompressed works everywhere              |
| "I need smallest possible size"     | ✅ Decimation beats compression               |
| "I need LOD support"                | ✅ Can't generate LODs from Draco             |
| "I don't want to lose quality"      | ✅ Decimation targets preserve visual quality |

**Run once, benefits forever:**

```bash
yarn optimize
```

## See Also

- [Draco Decompression Guide](./DRACO-DECOMPRESSION-GUIDE.md) - Full technical details
- [Model Decimation Guide](./MODEL-DECIMATION-GUIDE.md) - Quality settings
- [LOD Manager PRD](./PRDs/rust/lod-manager-rust-prd.md) - Rust implementation
