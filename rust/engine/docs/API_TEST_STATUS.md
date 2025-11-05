# API Test Status

## Implemented APIs

### ✅ Mesh API (`crates/scripting/src/apis/mesh_api.rs`)

- `isVisible()` - Check mesh visibility
- `setVisible(bool)` - Toggle mesh visibility
- `setCastShadows(bool)` - Control shadow casting
- `setReceiveShadows(bool)` - Control shadow receiving

**Status**: ✅ **FULLY WORKING** - API modifies SceneManager's live scene and renderer syncs in real-time.
**Test**: `rust/game/scripts/tests/mesh_api_visibility_test.lua` - proves visibility changes work
**Fix Date**: 2025-10-25 - Fixed MeshAPI to use SceneManager instead of cloned scene, renderer now extracts MeshRenderState from live scene each frame.

### ✅ Collision API (`crates/scripting/src/apis/collision_api.rs`)

- `onEnter(callback)` - Register collision enter handler
- `onExit(callback)` - Register collision exit handler
- `onStay(callback)` - Register collision stay handler
- `onTriggerEnter(callback)` - Register trigger enter handler
- `onTriggerExit(callback)` - Register trigger exit handler

**Status**: ✅ **FULLY WORKING** - Collision events now dispatch correctly to Lua scripts.
**Fix Date**: 2025-10-25 - Fixed physics event dispatch integration
**Test**: `rust/game/scripts/tests/collision_api_test.lua` - collision handlers fire correctly
**Visual Test**: `rust/game/scenes/tests/collision_comprehensive_test.json` - multiple collision scenarios tested
**Features**:

- Dynamic objects collide with static objects
- Trigger volumes detect enter/exit events
- Material changes work in collision handlers
- GameObject API integration works with collisions
- Multiple collision types supported simultaneously

### ⚠️ Audio API (`crates/scripting/src/apis/audio_api.rs`)

- All methods stubbed (load, play, pause, stop, setVolume, setSpeed, isPlaying, getDuration)

**Status**: Stubbed implementation, no actual audio playback.
**Test**: `rust/game/scripts/tests/audio_api_test.lua`

## Test Scenes

- `rust/game/scenes/tests/mesh_api_test.json`
- `rust/game/scenes/tests/collision_visual_test.json`
- `rust/game/scenes/tests/collision_api_test.json`
- `rust/game/scenes/tests/collision_comprehensive_test.json`

**Screenshot Location**: `rust/engine/screenshots/tests/`

## Known Issues

1. ~~**Renderer Sync**: Mesh API changes don't affect visible meshes~~ **FIXED 2025-10-25**
2. **Console.log**: Lua console.log() outputs empty strings (argument passing bug)
3. ~~**Visual Testing**: Can't prove APIs work visually~~ **FIXED 2025-10-25**
4. **Collision Events**: Physics system doesn't dispatch collision events to registered handlers (no integration)

## Next Steps

1. ~~Implement renderer sync for Mesh API changes~~ ✅ **DONE**
2. **Integrate physics collision events with Collision API** - physics system needs to call registered handlers
3. Test Material API (setColor, setMetalness, setRoughness) with renderer sync
4. Fix console.log argument passing
5. Implement actual Audio API functionality

## Renderer Sync Implementation (Completed 2025-10-25)

The renderer now reads live scene state every frame to filter visible meshes:

1. **MeshRenderState** - New struct extracts visibility map from scene (`HashMap<EntityId, bool>`)
2. **app_threed.rs** - Extracts `MeshRenderState` from `SceneManager` before calling render()
3. **threed_renderer.rs** - Uses `get_visible_mesh_indices()` to filter based on `MeshRenderer.enabled`
4. **mesh_api.rs** - Now modifies SceneManager's live scene instead of cloned copy

**Key Architecture Decision**: Pass extracted state instead of full scene to avoid borrow conflicts and improve performance.

**Test Proof**: `screenshots/tests/mesh_visibility_fixed.jpg` shows Cube 1 (blue) hidden after `setVisible(false)` call.
