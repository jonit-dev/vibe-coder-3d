# Test Scenes

This directory contains JSON scene files for testing and validating the Rust engine's rendering and physics capabilities.

## Scene Files

### testphysics.json
**Purpose**: Physics and basic rendering verification
- Tests rigid body physics (dynamic and fixed bodies)
- Tests mesh colliders (box, sphere)
- Tests basic lighting (directional, ambient)
- Tests Transform rotations (degrees → radians conversion)
- 6 entities: camera, 2 lights, 1 plane, 1 cube, 1 sphere

**What to verify**:
- ✓ Sphere and cube should fall due to gravity
- ✓ Objects should collide with the ground plane
- ✓ Plane should be horizontal (rotation [-90, 0, 0] degrees)
- ✓ Basic shadows from directional light

### testlighting.json
**Purpose**: Comprehensive lighting and shadow verification
- Tests multiple light types: directional (2), ambient (1), point (2)
- Tests shadow casting and receiving
- Tests light color mixing and intensity
- Tests shadow map resolution and quality
- 13 entities with various materials and colors

**Scene Layout**:
```
         Camera (0, 5, 15) looking down at -15°
              |
              v

  Red Point   Blue Point     Key Directional (10, 15, 10)
  Light       Light          direction: [-0.5, -1.0, -0.5]
  (-5,3,0)    (5,3,0)        warm white, shadows ON
      |          |
      v          v

Red Sphere    Tall Cube    Blue Sphere
  (-3,1,-2)    (0,2.5,0)    (3,1,-2)
                 (5 units tall)

Green Cube              Yellow Cube
  (-2,0.5,3)             (2,0.5,3)
  rotated 45°            rotated -45°

================== Ground Plane (20x20) ==================
                    (receives shadows)

              Back Wall (0,3,-8)
            (15x6 wall, receives shadows)
```

**Light Configuration**:
1. **Key Directional Light** (warm white)
   - Position: (10, 15, 10)
   - Direction: [-0.5, -1.0, -0.5] (down and left)
   - Intensity: 1.2
   - Shadows: ON (2048x2048 shadow map)
   - Color: Warm white (1.0, 0.95, 0.9)

2. **Fill Directional Light** (cool blue)
   - Position: (-8, 10, -5)
   - Direction: [0.3, -0.8, 0.2]
   - Intensity: 0.4
   - Shadows: OFF
   - Color: Cool blue (0.7, 0.8, 1.0)

3. **Ambient Light** (blue-gray)
   - Global illumination
   - Intensity: 0.6
   - Color: Blue-gray (0.3, 0.35, 0.4)

4. **Red Point Light** (left side)
   - Position: (-5, 3, 0)
   - Range: 15, Decay: 2
   - Intensity: 2.0
   - Shadows: ON (512x512)
   - Color: Red (1.0, 0.3, 0.3)

5. **Blue Point Light** (right side)
   - Position: (5, 3, 0)
   - Range: 15, Decay: 2
   - Intensity: 2.0
   - Shadows: ON (512x512)
   - Color: Blue (0.3, 0.5, 1.0)

**What to verify**:

**Shadow Quality**:
- ✓ Tall cube should cast long shadow on ground from key directional light
- ✓ Spheres and cubes should cast shadows on ground
- ✓ Shadow edges should be slightly soft (shadowRadius: 1.5 on key light)
- ✓ Back wall should show shadows from objects
- ✓ Point lights should cast radial shadows

**Light Mixing**:
- ✓ Left side objects should have red tint from point light
- ✓ Right side objects should have blue tint from point light
- ✓ Center tall cube should show both red (left) and blue (right) lighting
- ✓ All objects should show warm key light + cool fill light mix
- ✓ Ambient light should prevent pure black shadows

**Light Direction**:
- ✓ Key light direction [-0.5, -1.0, -0.5] should create diagonal shadows
- ✓ Fill light direction [0.3, -0.8, 0.2] should subtly lighten shadows
- ✓ Point light positions should match their visual effect locations

**Material Interaction**:
- ✓ White materials (tall cube, wall) should show light colors clearly
- ✓ Colored materials (red/blue spheres, green/yellow cubes) should mix with light colors
- ✓ Ground material (gray, roughness 0.9) should show diffuse lighting

**Coordinate System**:
- ✓ Light positions use world coordinates correctly
- ✓ Light directions are in world space (not relative to transform)
- ✓ Point light positions from Transform component work correctly
- ✓ Camera rotation [-15, 0, 0] degrees looks down correctly

**Performance**:
- ✓ Multiple lights (5 total) render efficiently
- ✓ Multiple shadow maps (3 lights with shadows) perform well
- ✓ Scene maintains 60 FPS on target hardware

## Running the Scenes

### Rust Engine
```bash
# Test physics
cargo run --manifest-path rust/engine/Cargo.toml -- --scene testphysics

# Test lighting
cargo run --manifest-path rust/engine/Cargo.toml -- --scene testlighting
```

### Validation
```bash
# Validate scene format
node scripts/validate-scene.cjs rust/game/scenes/testphysics.json
node scripts/validate-scene.cjs rust/game/scenes/testlighting.json
```

## Scene Format Notes

### Transform Component
- **position**: `[x, y, z]` array in world space
- **rotation**: `[x, y, z]` array in **degrees** (Euler angles, XYZ order)
- **scale**: `[x, y, z]` array

**Critical**: Rotation is stored in degrees in JSON but converted to radians in Rust using `vibe_ecs_bridge::transform_utils::rotation_to_quat()`.

### Light Component
- **lightType**: "directional" | "point" | "spot" | "ambient"
- **color**: RGB object `{r, g, b}` with values 0.0-1.0
- **intensity**: Multiplier for light brightness
- **enabled**: Boolean to enable/disable light
- **castShadow**: Boolean for shadow casting
- **directionX/Y/Z**: Direction vector for directional lights (world space)
- **range**: Distance for point/spot lights
- **decay**: Falloff rate for point/spot lights (1=linear, 2=physically correct)
- **shadowMapSize**: Resolution of shadow map (512, 1024, 2048, etc.)
- **shadowBias**: Offset to prevent shadow acne (negative values, e.g., -0.0001)
- **shadowRadius**: Softness of shadow edges

### Camera Component
- **fov**: Field of view in degrees
- **near/far**: Clipping planes
- **viewportRect**: Normalized viewport (x, y, width, height from 0-1)
- **followOffset**: As object `{x, y, z}` for camera positioning
- **skyboxScale/Rotation**: As objects for skybox manipulation

### Material Properties
- **color**: Hex string (e.g., "#ff0000" for red)
- **metalness**: 0.0 (dielectric) to 1.0 (metal)
- **roughness**: 0.0 (smooth/glossy) to 1.0 (rough/matte)
- **emissive**: Hex string for self-illumination color
- **emissiveIntensity**: Multiplier for emissive strength

## Troubleshooting

### Shadows not appearing
1. Check `castShadow: true` on light
2. Check `castShadows: true` on shadow caster MeshRenderer
3. Check `receiveShadows: true` on shadow receiver MeshRenderer
4. Increase `shadowMapSize` if shadows are too pixelated
5. Adjust `shadowBias` if shadow acne or peter-panning occurs

### Wrong lighting colors
1. Verify light `color` RGB values are 0.0-1.0 range
2. Check light `intensity` multiplier
3. Ensure ambient light isn't too strong (overpowering directional/point)
4. Verify material colors don't conflict with light colors

### Incorrect object positions/rotations
1. Check Transform `rotation` is in degrees (not radians)
2. Verify rotation order is XYZ Euler
3. Ensure coordinate system is Y-up, right-handed
4. Check scene graph hierarchy (parent transforms affect children)

### Physics objects not moving
1. Check RigidBody `bodyType` is "dynamic" (not "fixed")
2. Verify `gravityScale` is not 0
3. Check `canSleep` is true to allow physics sleep
4. Ensure colliders are enabled

## Adding New Test Scenes

1. Copy an existing scene as a template
2. Modify entities, materials, lights as needed
3. Update metadata (name, description, timestamp)
4. Validate with `node scripts/validate-scene.cjs`
5. Test in Rust engine
6. Document the scene purpose and what to verify in this README
