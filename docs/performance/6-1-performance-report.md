# Performance Report: NightStalkerDemo CPU Usage

This report details the investigation into the high CPU usage observed in the `NightStalkerDemo` component.

## Summary of Findings (Updated)

**Recent profiling with Chrome DevTools reveals that the primary CPU bottleneck is in WebGL rendering and the animation loop, not in React or JS logic.**

- **Call Tree Analysis:**
  - The majority of time is spent in the animation frame loop and WebGL draw calls (`drawElements`, `bindVertexArray`, etc.).
  - React/JS overhead is minor compared to rendering.
  - The main animation loop (`loop(timestamp)`) spends significant time updating all objects every frame.
- **Root Cause:**
  - Too many draw calls and/or too many objects/components being updated every frame.
  - Excessive use of `useFrame` or per-frame updates in components.
  - High number of unique meshes/materials and dynamic lights.

## Potential Causes (Ranked by Certainty)

1. **High Number of Draw Calls (Environment Complexity):**
   - **Certainty:** ⭐️⭐️⭐️⭐️⭐️
   - **Evidence:** WebGL `drawElements` and related calls dominate the call tree. Many individual meshes and materials in the scene.
2. **Multiple Shadow-Casting Lights & Other Lights:**
   - **Certainty:** ⭐️⭐️⭐️⭐️⭐️
   - **Evidence:** Dynamic lights increase shader and draw call complexity.
3. **Excessive useFrame Hooks / Per-Frame Updates:**
   - **Certainty:** ⭐️⭐️⭐️⭐️
   - **Evidence:** Main animation loop spends significant time updating all objects every frame.
4. **Complex Geometry or Materials:**
   - **Certainty:** ⭐️⭐️⭐️⭐️
   - **Evidence:** High time in WebGL calls suggests complex or numerous geometries/materials.
5. **Physics/Velocity System Overhead:**
   - **Certainty:** ⭐️⭐️
   - **Evidence:** Throttling these systems has little effect on overall CPU usage.

## Recommendations (Actionable)

1. **Reduce Draw Calls:**
   - Batch static geometry using `THREE.InstancedMesh` or geometry merging.
   - Group similar objects/materials to minimize state changes.
2. **Limit Per-Frame Updates:**
   - Remove unnecessary `useFrame` hooks.
   - Throttle or debounce non-critical updates.
3. **Reduce Number of Lights and Materials:**
   - Limit dynamic/shadow-casting lights.
   - Use baked lighting for static scenes.
4. **Profile and Optimize Scene Complexity:**
   - Log or visualize the number of meshes/entities in the scene.
   - Use three.js inspector or similar tools to analyze draw calls.
5. **Use LOD (Level of Detail):**
   - Use simpler geometry or hide distant objects.

## Next Steps

- Refactor scene components to use instancing and batch static geometry.
- Audit and minimize per-frame updates in all components.
- Profile again after changes to confirm improvement.

---

**If you want targeted help, specify which scene or component to optimize first (e.g., NightStalkerDemo, BowlingRoom, etc.).**
