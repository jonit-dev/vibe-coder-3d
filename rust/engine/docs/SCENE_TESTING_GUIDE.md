# Scene Testing Guide

## Overview

This guide provides a comprehensive workflow for creating, configuring, and validating test scenes in the Rust engine. Use this for testing new APIs, features, or debugging issues.

## Quick Reference

### Common Commands

```bash
# Test a scene (interactive window)
yarn rust:engine --scene <scene-name>

# Take a screenshot
yarn rust:screenshot --scene <scene-name>

# Screenshot with delay (for physics/animations)
cargo run --bin vibe-engine -- \
  --scene ../game/scenes/tests/<scene-name>.json \
  --screenshot \
  --screenshot-path screenshots/tests/<name>.jpg \
  --screenshot-delay <ms>

# Debug mode (F1-F4 for debug views)
yarn rust:engine --scene <scene-name> --debug
```

### File Locations

- **Scenes**: `rust/game/scenes/tests/`
- **Scripts**: `rust/game/scripts/tests/`
- **Screenshots**: `rust/engine/screenshots/tests/`

## Scene Creation Workflow

### Step 1: Copy a Working Template

**CRITICAL**: Always start from a working scene, NEVER create from scratch.

```bash
# Copy a known-good scene as template
cd rust/game/scenes/tests
cp testscripting.json my_new_test.json
```

**Why?**: Working scenes have correct:

- Light setup (Directional + Ambient)
- Camera configuration
- Material format (hex colors, not RGBA objects)
- Component structure

### Step 2: Update Metadata

```json
{
  "metadata": {
    "name": "my_new_test",
    "version": 1,
    "timestamp": "2025-10-25T00:00:00.000Z",
    "description": "Test scene for [what you're testing]"
  }
}
```

### Step 3: Configure Entities

#### Minimal Scene Structure

Every test scene MUST have:

1. **Main Camera** (entity id: 0)
2. **Directional Light** (entity id: 1)
3. **Ambient Light** (entity id: 2)
4. **Test entities** (entity id: 3+)

#### Camera Setup

```json
{
  "id": 0,
  "name": "Main Camera",
  "components": {
    "PersistentId": { "id": "unique-camera-id" },
    "Transform": {
      "position": [0, 1, -10], // Adjust to see test entities
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    },
    "Camera": {
      "fov": 20, // Increase for wider view, decrease for zoom
      "near": 0.1,
      "far": 100,
      "projectionType": "perspective",
      "isMain": true,
      "clearFlags": "skybox",
      "backgroundColor": { "r": 0, "g": 0, "b": 0, "a": 0 }
      // ... (copy rest from template)
    }
  }
}
```

**Camera Positioning Tips**:

- Looking at origin: `position: [0, 1, -10]`, `rotation: [0, 0, 0]`
- Top-down view: `position: [0, 10, 0]`, `rotation: [-90, 0, 0]`
- Side view: `position: [10, 1, 0]`, `rotation: [0, 90, 0]`

#### Lighting Setup

```json
{
  "id": 1,
  "name": "Directional Light",
  "components": {
    "PersistentId": { "id": "unique-light-id" },
    "Transform": {
      "position": [5, 10, 5],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    },
    "Light": {
      "lightType": "directional",
      "color": { "r": 1, "g": 1, "b": 1 },
      "intensity": 0.8,
      "enabled": true,
      "castShadow": true,
      "directionX": -0.5,
      "directionY": -1,
      "directionZ": -0.5
      // ... (copy rest from template)
    }
  }
}
```

**CRITICAL**: Without lights, scenes render **completely black**!

#### Test Entity Template

```json
{
  "id": 3,
  "name": "Test Cube",
  "components": {
    "PersistentId": { "id": "test-cube-unique-id" },
    "Transform": {
      "position": [0, 1, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    },
    "MeshRenderer": {
      "meshId": "cube",
      "materialId": "blue", // Must exist in materials array
      "enabled": true,
      "castShadows": true,
      "receiveShadows": true
    }
  }
}
```

### Step 4: Add Materials

```json
{
  "materials": [
    {
      "id": "blue",
      "name": "Blue",
      "color": "#0000ff", // ✅ HEX STRING (correct)
      "metalness": 0.1,
      "roughness": 0.8,
      "emissive": "#000000",
      "emissiveIntensity": 0
    }
  ]
}
```

**CRITICAL**: Use hex color strings (`"#ff0000"`), NOT RGBA objects!

❌ **WRONG**: `"color": {"r": 1, "g": 0, "b": 0, "a": 1}`
✅ **CORRECT**: `"color": "#ff0000"`

### Step 5: Add Physics (if needed)

For collision/physics tests, add to test entity:

```json
{
  "RigidBody": {
    "enabled": true,
    "bodyType": "dynamic", // "dynamic", "fixed", or "kinematic"
    "mass": 1,
    "gravityScale": 1,
    "canSleep": true,
    "material": {
      "friction": 0.7,
      "restitution": 0.3,
      "density": 1
    }
  },
  "MeshCollider": {
    "enabled": true,
    "isTrigger": false,
    "colliderType": "box", // "box", "sphere", "capsule"
    "center": [0, 0, 0],
    "size": {
      "width": 1,
      "height": 1,
      "depth": 1,
      "radius": 0.5
    },
    "physicsMaterial": {
      "friction": 0.7,
      "restitution": 0.3,
      "density": 1
    }
  }
}
```

**Body Types**:

- `dynamic` - Affected by gravity/forces (falling objects)
- `fixed` - Never moves (floors, walls)
- `kinematic` - Moves but not affected by forces (moving platforms)

### Step 6: Add Test Script

```json
{
  "Script": {
    "enabled": true,
    "scriptPath": "tests/my_test_script.lua", // ✅ In tests/ subfolder
    "executeInUpdate": true,
    "executeOnStart": true,
    "parameters": {}
  }
}
```

**CRITICAL**: Test scripts go in `rust/game/scripts/tests/`, NOT `rust/game/scripts/`!

## Script Creation

### Script Template

```lua
-- My Test Script
-- Description: Tests [feature name]

function onStart()
    console.log("=== Test Started: " .. entity.name .. " ===")

    -- Check if required API is available
    if not entity.mesh then
        console.log("  [SKIP] Required API not available")
        return
    end

    -- Perform test
    -- ... test code ...

    console.log("=== Test Completed ===")
end

function onUpdate(deltaTime)
    -- Frame-by-frame logic (if needed)
end
```

### Available APIs

```lua
-- Mesh API (requires MeshRenderer component)
entity.mesh:isVisible()
entity.mesh:setVisible(bool)
entity.mesh:setCastShadows(bool)
entity.mesh:setReceiveShadows(bool)

-- Material API (requires MeshRenderer component)
entity.meshRenderer.material:setColor("#ff0000")  -- hex string or number
entity.meshRenderer.material:setMetalness(0.8)     -- 0-1
entity.meshRenderer.material:setRoughness(0.5)     -- 0-1
entity.meshRenderer.material:setEmissive("#00ff00", 2.0)

-- Collision API (requires RigidBody + MeshCollider)
entity.collision:onEnter(function(otherEntityId)
    console.log("Collision with: " .. tostring(otherEntityId))
end)
entity.collision:onExit(function(otherEntityId) end)
entity.collision:onStay(function(otherEntityId) end)

-- GameObject API (always available)
GameObject.create("EntityName")
GameObject.createPrimitive("Cube", "MyCube")
GameObject.destroy(entityId)
GameObject.setPosition(entityId, {0, 5, 0})
GameObject.setRotation(entityId, {0, 45, 0})

-- Transform API
entity.transform:getPosition()
entity.transform:setPosition({x, y, z})
entity.transform:getRotation()
entity.transform:setRotation({x, y, z})  -- Degrees!

-- Input API
Input.isKeyPressed("w")
Input.isKeyDown("space")
Input.isKeyReleased("escape")
```

## Visual Testing Workflow

### Test Pattern: Sequential Screenshots

For features that change over time (physics, animations), take multiple screenshots:

```bash
# Frame 0 (initial state)
cargo run --bin vibe-engine -- \
  --scene ../game/scenes/tests/my_test.json \
  --screenshot \
  --screenshot-path screenshots/tests/my_test_0ms.jpg \
  --screenshot-delay 0

# Frame 100ms (early)
cargo run --bin vibe-engine -- \
  --scene ../game/scenes/tests/my_test.json \
  --screenshot \
  --screenshot-path screenshots/tests/my_test_100ms.jpg \
  --screenshot-delay 100

# Frame 500ms (mid)
cargo run --bin vibe-engine -- \
  --scene ../game/scenes/tests/my_test.json \
  --screenshot \
  --screenshot-path screenshots/tests/my_test_500ms.jpg \
  --screenshot-delay 500

# Frame 1000ms (final)
cargo run --bin vibe-engine -- \
  --scene ../game/scenes/tests/my_test.json \
  --screenshot \
  --screenshot-path screenshots/tests/my_test_1000ms.jpg \
  --screenshot-delay 1000
```

### Bash Script for Sequential Screenshots

```bash
#!/bin/bash
# test_screenshots.sh
SCENE=$1
NAME=$2
DELAYS=(0 100 500 1000)

for DELAY in "${DELAYS[@]}"; do
  echo "Capturing screenshot at ${DELAY}ms..."
  cargo run --bin vibe-engine -- \
    --scene ../game/scenes/tests/${SCENE}.json \
    --screenshot \
    --screenshot-path screenshots/tests/${NAME}_${DELAY}ms.jpg \
    --screenshot-delay ${DELAY} \
    --screenshot-quality 85
done

echo "All screenshots captured!"
ls -lh screenshots/tests/${NAME}_*
```

Usage:

```bash
chmod +x test_screenshots.sh
./test_screenshots.sh my_test my_test
```

### What to Look For

#### Mesh API Tests

- ✅ Cubes appear/disappear when `setVisible()` called
- ✅ Shadows appear/disappear when `setCastShadows()` called
- ✅ Changes visible immediately in screenshots

#### Material API Tests

- ✅ Colors change when `setColor()` called
- ✅ Surface properties change (metalness, roughness)
- ✅ Emissive glow appears when set

#### Physics Tests

- ✅ Dynamic objects fall (gravity working)
- ✅ Objects stop on collision (colliders working)
- ✅ Objects bounce/slide based on material properties

#### Collision API Tests (⚠️ Currently Broken)

- ❌ Handlers don't fire (physics integration missing)
- ✅ Objects physically collide
- ⚠️ Need to implement event dispatching

## Common Issues & Fixes

### Issue: Scene Renders Black

**Symptoms**: Screenshots are completely black

**Causes**:

1. No lights in scene
2. Camera facing wrong direction
3. All entities disabled

**Fix**:

```bash
# Verify lights exist
grep -A5 "lightType" rust/game/scenes/tests/my_test.json

# Check if entities have correct materialId
grep "materialId" rust/game/scenes/tests/my_test.json

# Copy lights from working scene
```

### Issue: Wrong Material Colors

**Symptoms**: Materials render as default gray

**Causes**:

1. Using RGBA objects instead of hex strings
2. MaterialId doesn't exist in materials array
3. Material format incorrect

**Fix**:

```json
// ✅ CORRECT
"materials": [
  {
    "id": "red",
    "color": "#ff0000",
    "metalness": 0.1,
    "roughness": 0.8
  }
]

// ❌ WRONG
"materials": [
  {
    "id": "red",
    "color": {"r": 1, "g": 0, "b": 0, "a": 1}  // Don't use objects!
  }
]
```

### Issue: Scripts Not Running

**Symptoms**: No console.log output, test doesn't execute

**Causes**:

1. Script path wrong (not in `tests/` folder)
2. Script component not on entity
3. Script syntax error

**Fix**:

```bash
# Check script exists
ls rust/game/scripts/tests/my_test.lua

# Check script is linked to entity
grep "scriptPath" rust/game/scenes/tests/my_test.json

# Check for Lua errors in output
cargo run --bin vibe-engine -- --scene my_test 2>&1 | grep -i error
```

### Issue: Physics Not Working

**Symptoms**: Objects don't fall, pass through each other

**Causes**:

1. Missing RigidBody or MeshCollider
2. RigidBody disabled or wrong type
3. Collider size wrong

**Fix**:

```json
// Ensure both components exist
{
  "RigidBody": {
    "enabled": true,
    "bodyType": "dynamic" // Must be "dynamic" to fall
  },
  "MeshCollider": {
    "enabled": true,
    "colliderType": "box",
    "size": { "width": 1, "height": 1, "depth": 1 }
  }
}
```

### Issue: Changes Don't Appear in Screenshots

**Symptoms**: API calls work in logs, but screenshots show no change

**Causes**:

1. API modifies isolated scene copy (not SceneManager)
2. Renderer doesn't sync with scene changes
3. Changes happen after screenshot taken

**Fix**:

- ✅ Mesh API: Fixed (uses SceneManager)
- ⚠️ Material API: Unknown (needs testing)
- ⚠️ Collision API: No event integration
- Use `--screenshot-delay` to capture after changes

## Test Scene Examples

### Example 1: Mesh Visibility Test

**Goal**: Prove `setVisible()` works

**Scene**: 3 cubes, different colors
**Script**: Set middle cube invisible
**Expected**: Screenshot shows only 2 cubes (green, red)

See: `rust/game/scenes/tests/mesh_api_test.json`

### Example 2: Physics Collision Test

**Goal**: Prove physics simulation works

**Scene**: Falling cube + floor platform
**Script**: None needed (pure physics)
**Expected**: Sequential screenshots show cube falling and landing

See: `rust/game/scenes/tests/collision_visual_test.json`

### Example 3: Material Color Change

**Goal**: Prove `setColor()` works in real-time

**Scene**: 2 cubes, both blue initially
**Script**: Change one cube to red on collision
**Expected**: Screenshot shows one blue, one red (after collision)

**Status**: Needs implementation (collision events don't fire)

## Validation Checklist

Before considering a test complete:

- [ ] Scene compiles without errors: `cargo build --bin vibe-engine`
- [ ] Scene loads without warnings: Check console output
- [ ] Screenshot is NOT black: Lights are working
- [ ] Test entities visible: Camera positioned correctly
- [ ] Script runs: Console.log output appears
- [ ] Visual proof: Screenshots show expected changes
- [ ] Documented: Results added to `API_TEST_STATUS.md`

## Advanced: Screenshot Comparison

For automated testing, compare screenshots:

```bash
#!/bin/bash
# compare_screenshots.sh
BEFORE=$1
AFTER=$2

# Check if images are identical (should be DIFFERENT for working test)
if cmp -s "$BEFORE" "$AFTER"; then
  echo "❌ FAIL: Screenshots are identical (no changes detected)"
  exit 1
else
  echo "✅ PASS: Screenshots differ (changes detected)"
  exit 0
fi
```

Usage:

```bash
./compare_screenshots.sh \
  screenshots/tests/mesh_test_before.jpg \
  screenshots/tests/mesh_test_after.jpg
```

## Known Limitations

### Working Systems

- ✅ Mesh API (setVisible, setCastShadows, setReceiveShadows)
- ✅ Physics simulation (gravity, collisions, rigid bodies)
- ✅ Renderer sync (ECS changes → GPU immediately)
- ✅ GameObject API (create, destroy, setPosition)

### Partially Working

- ⚠️ Collision API (handlers register, events don't fire)
- ⚠️ Material API (unknown if setColor syncs to renderer)
- ⚠️ Console.log (outputs empty strings)

### Not Working

- ❌ Audio API (fully stubbed)
- ❌ Collision event dispatching (no physics integration)

## Quick Start Templates

### Minimal Test Scene

```bash
# 1. Copy template
cp rust/game/scenes/tests/testscripting.json \
   rust/game/scenes/tests/my_test.json

# 2. Create script
cat > rust/game/scripts/tests/my_test.lua << 'EOF'
function onStart()
    console.log("Test running!")
end
function onUpdate(deltaTime) end
EOF

# 3. Update scene to use new script
sed -i 's/testscripting/my_test/g' rust/game/scenes/tests/my_test.json

# 4. Test it
cargo run --bin vibe-engine -- \
  --scene ../game/scenes/tests/my_test.json \
  --screenshot \
  --screenshot-path screenshots/tests/my_test.jpg
```

## Documentation Updates

After completing tests, update:

1. **API_TEST_STATUS.md** - Test results, known issues
2. **ROADMAP.md** - Implementation status
3. **Git commit** - With proof screenshots

---

**Last Updated**: 2025-10-25
**Status**: Living document - update as new testing patterns emerge
