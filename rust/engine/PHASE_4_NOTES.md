# Phase 4: Render Graph - Implementation Notes

## Status: Deferred

Phase 4 (Render Graph) from the integration plan has been evaluated and **deferred** to a later phase when more complex rendering features are needed.

## Rationale

The current rendering architecture with Phases 1-3 complete is **fully functional** and working well:

- ✅ Scene graph with transform hierarchy
- ✅ Component registry with typed decoders
- ✅ Renderable instance extraction
- ✅ Basic geometry rendering with materials and lighting

A full render graph abstraction adds complexity that isn't justified yet. It becomes valuable when we need:

- Shadow mapping (multiple render passes)
- Post-processing effects (blur, bloom, etc.)
- Deferred rendering
- Complex resource dependencies between passes

## Investigated Libraries

### screen-13

- **URL**: https://github.com/attackgoat/screen-13
- **Pros**: Clean API, designed for render graphs
- **Cons**: Vulkan-only (not wgpu), may be overkill for current needs

### rafx

- **URL**: https://github.com/aclysma/rafx
- **Pros**: Full-featured, wgpu support, excellent docs
- **Cons**: Heavy dependency, complex for our simple use case

### DIY Simple Abstraction

Creating a minimal render graph ourselves:

- **Pros**: Tailored to our needs, no external deps
- **Cons**: Reinventing the wheel, maintenance burden

## Recommendation

**Keep current architecture** until we need multi-pass rendering. When that time comes:

1. **Option A**: Integrate `rafx` render graph (if wgpu support improves)
2. **Option B**: Build minimal pass abstraction around existing pipeline
3. **Option C**: Use wgpu's `RenderPass` API directly with better organization

## Current Architecture (Working Well)

```rust
// Scene loading
let scene = load_scene(json)?;
let graph = SceneGraph::build(&scene)?;

// Rendering
let instances = graph.extract_renderables(&scene);
for instance in instances {
    // Bind pipeline, upload uniforms, draw
}
```

This is **clean, simple, and sufficient** for Phase 5 (Assets/GLTF) and Phase 6 (Live Bridge).

## Next Steps

Skip to **Phase 5: Assets** - add GLTF loading and texture support using the existing renderer.
