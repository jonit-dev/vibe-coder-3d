# Model Decimation Quality Guide

This guide helps you choose the right decimation settings to balance file size and visual quality.

## Understanding Decimation

Mesh decimation reduces triangle count by merging vertices and simplifying geometry. The key is finding the sweet spot where you reduce triangles significantly without destroying the model's appearance.

## Recommended Settings by Asset Type

### Hero Characters / Main Props

**Target: 20-50K triangles**

```bash
# Blender (best quality)
USE_BLENDER_DECIMATION=true
BLENDER_QUALITY_PRESET=4  # Good quality
AUTO_DECIMATE_RATIO=0.25  # Keep 25% of triangles

# Meshoptimizer (fallback)
AUTO_DECIMATE_RATIO=0.3
AUTO_DECIMATE_ERROR=0.001
```

**Quality Tips:**

- Preserve silhouette edges
- Keep facial features intact
- Maintain joint deformation areas
- Test with animations if character is rigged

### Environment Props (Buildings, Furniture)

**Target: 5-15K triangles**

```bash
USE_BLENDER_DECIMATION=true
BLENDER_QUALITY_PRESET=3  # Balanced
AUTO_DECIMATE_RATIO=0.15  # Keep 15% of triangles
```

**Quality Tips:**

- Focus on visible surfaces
- Can be more aggressive on flat surfaces
- Preserve architectural features
- Test from typical viewing distances

### Background / Filler Objects

**Target: 1-5K triangles**

```bash
USE_BLENDER_DECIMATION=true
BLENDER_QUALITY_PRESET=2  # High compression
AUTO_DECIMATE_RATIO=0.08  # Keep 8% of triangles
```

**Quality Tips:**

- These are usually far from camera
- Silhouette matters more than detail
- Can sacrifice detail for performance
- Use LOD system aggressively

### Mobile / Web Builds

**Target: Even more aggressive**

```bash
IS_MOBILE=true
USE_BLENDER_DECIMATION=true
BLENDER_QUALITY_PRESET=1  # Ultra compression
AUTO_DECIMATE_RATIO=0.05  # Keep 5% of triangles
MAX_TEXTURE_SIZE=512
```

**Quality Tips:**

- Test on actual target devices
- Mobile users are more tolerant of lower quality
- Network bandwidth matters as much as rendering
- Prioritize load time over visual fidelity

## Quality Preservation Techniques

The Blender decimation script includes several quality preservation features:

### 1. **Smart Decimation**

- Uses Blender's Decimate modifier with collapse mode
- Preserves UV seams and sharp edges
- Maintains material boundaries
- Applies smooth shading to hide triangle edges

### 2. **Normal Map Handling**

- Detects and preserves normal maps at higher resolution
- Normal maps can hide geometry simplification
- Standard practice: geometry at 10%, normals at 50%

### 3. **Texture Resizing**

- Intelligent texture downscaling
- Preserves aspect ratios
- Maintains power-of-two dimensions
- Separate handling for different map types

### 4. **Origin Fixing**

- Maintains proper model pivot point
- Critical for proper placement in scenes
- Ensures consistent scaling

## Testing Decimated Models

### Visual Inspection Checklist

1. **Silhouette Test**

   - View model from all angles
   - Check for broken outlines
   - Verify smooth curves haven't become blocky

2. **Close-up Test**

   - Zoom in on detailed areas
   - Check for collapsed geometry
   - Verify materials are intact

3. **Distance Test**

   - View from typical in-game/app distance
   - Most details invisible from far away
   - Use this to justify aggressive decimation

4. **Animation Test** (if rigged)

   - Test all animation clips
   - Check for collapsed joints
   - Verify deformation quality

5. **LOD Transition Test**
   - View LOD switches in motion
   - Should be imperceptible
   - Adjust distances if pops are visible

### Metrics to Track

```bash
# Use our complexity checker
node scripts/check-model-complexity.js

# Check specific model
npx gltf-transform inspect model.glb
```

Track:

- **Triangle count reduction**: Aim for 80-95% reduction
- **File size reduction**: Typically 50-90% with compression
- **Visual quality score**: Subjective but important
- **Render performance**: FPS improvement on target hardware

## Common Issues & Solutions

### Issue: Model looks "blocky"

**Causes:**

- Ratio too aggressive for model complexity
- Not enough triangles for curved surfaces
- Smooth shading not applied

**Solutions:**

```bash
# Increase ratio
AUTO_DECIMATE_RATIO=0.2  # instead of 0.05

# Use Blender (better smoothing)
USE_BLENDER_DECIMATION=true

# Rely on normal maps
# Keep geometry low but textures higher
```

### Issue: UV seams visible / textures broken

**Causes:**

- Decimation merged vertices with different UVs
- Texture resolution too low
- Material boundaries collapsed

**Solutions:**

```bash
# Use Blender (better UV handling)
USE_BLENDER_DECIMATION=true

# Keep higher texture resolution
MAX_TEXTURE_SIZE=2048

# Less aggressive decimation
AUTO_DECIMATE_RATIO=0.25
```

### Issue: Animations look broken

**Causes:**

- Joint areas over-simplified
- Weight painting issues after decimation
- Bone influence lost

**Solutions:**

```bash
# Use higher quality preset
BLENDER_QUALITY_PRESET=4

# Manual weight paint touch-up in Blender
# Lock vertices near joints before decimating
# Test each animation after decimation
```

### Issue: Normal maps don't hide simplification

**Causes:**

- Decimation too aggressive even for normal maps
- Normal map resolution too low
- Lighting angle reveals geometry

**Solutions:**

```bash
# Higher geometry but lower textures
AUTO_DECIMATE_RATIO=0.15  # More geometry
MAX_TEXTURE_SIZE=512       # Smaller textures

# Generate new normal maps from high-poly source
# Use better compression instead of decimation
```

## Workflow: Iterative Decimation

1. **Start Conservative**

   ```bash
   AUTO_DECIMATE_RATIO=0.5  # 50% - very safe
   ```

2. **Test and Measure**

   - Check visual quality
   - Measure performance
   - Note file size

3. **Increase Aggression**

   ```bash
   AUTO_DECIMATE_RATIO=0.3  # 30% - moderate
   ```

4. **Find the Sweet Spot**

   - Where visual quality starts to degrade noticeably
   - Usually 1-2 steps back from "too aggressive"
   - Document per model type

5. **Create LOD Levels**
   ```bash
   LOD0: ratio=0.5  # High quality
   LOD1: ratio=0.25 # Medium
   LOD2: ratio=0.1  # Low
   ```

## Example: Optimizing the Farmhouse

**Original:** 500K triangles, 18MB

```bash
# Step 1: Use Blender with balanced preset
USE_BLENDER_DECIMATION=true
BLENDER_QUALITY_PRESET=3
AUTO_DECIMATE_RATIO=0.04  # Target ~20K triangles

# This gives us:
# - ~20K triangles (96% reduction)
# - 1024px textures
# - ~2-3MB final size
# - Visually acceptable from 5+ meters
```

**Result:** Suitable for environment prop, maintains building silhouette, good performance.

## When NOT to Decimate

Some models should skip decimation:

- **Low-poly stylized art** - Already optimized
- **Procedural geometry** - Re-generate instead
- **Physics meshes** - Need accuracy
- **UI elements** - Usually quads/simple shapes
- **Reference models** - Keep for baking normal maps

## Tools Reference

```bash
# Check model complexity
node scripts/check-model-complexity.js

# Decimate with meshoptimizer
node scripts/pre-decimate.js input.glb output.glb 0.1

# Decimate with Blender (better quality)
node scripts/blender-decimate.js input.glb output.glb 0.1

# Run full optimization pipeline
USE_BLENDER_DECIMATION=true yarn optimize
```

## Further Reading

- [meshoptimizer docs](https://meshoptimizer.org/)
- [Blender Decimate Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html)
- [glTF-Transform decimation](https://gltf-transform.dev/functions.html#simplify)
- [LOD Best Practices](https://docs.unity3d.com/Manual/LevelOfDetail.html)
