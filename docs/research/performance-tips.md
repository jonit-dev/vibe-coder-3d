# Three.js Performance Tips

## Summary

Optimizing performance in Three.js and React Three Fiber (R3F) involves strategies such as reducing draw calls, reusing geometries and materials, leveraging instancing and level-of-detail techniques, optimizing textures and lights, controlling render loops, avoiding unnecessary reactive updates, and employing robust profiling tools to identify bottlenecks.

## Three.js Performance Best Practices

### Reduce Draw Calls and Polygons

- Minimizing draw calls is crucial as each call incurs CPU overhead; merging meshes can dramatically reduce draw calls.
- Using geometry instancing allows the GPU to render numerous identical objects in a single draw call, boosting performance when rendering many similar meshes.
  ```tsx
  // Use OptimizedEntityMesh with instancing for repeated objects
  <OptimizedEntityMesh instanced={true} instanceCount={100} instanceMatrix={instanceMatrixArray}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial />
  </OptimizedEntityMesh>
  ```
- Combining multiple BufferGeometries into one mesh using `BufferGeometryUtils.mergeBufferGeometries()` can significantly reduce the number of objects in a scene.

  ```tsx
  import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

  // In a utility function
  function createMergedGeometry(geometries) {
    return mergeBufferGeometries(geometries);
  }
  ```

- Reducing overall polygon counts by removing invisible or occluded geometry helps lower both CPU culling and GPU rasterization costs.

### Geometry and Material Optimization

- Reusing geometries and materials across multiple meshes prevents redundant GPU buffer and shader bindings.

  ```tsx
  // In a game component, create shared resources outside the component scope
  const sharedGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const sharedMaterial = useMemo(() => new MeshStandardMaterial({ color: 'red' }), []);

  // Then use them for multiple entities
  <EntityMesh geometry={sharedGeometry} material={sharedMaterial} position={[0, 0, 0]} />
  <EntityMesh geometry={sharedGeometry} material={sharedMaterial} position={[2, 0, 0]} />
  ```

- Avoid creating new geometry or material instances during render loops to prevent unnecessary memory churn and GPU uploads.
  - Leverage the `useECS` hook for managing entity transforms instead of creating new Three.js objects.

### Culling and Level of Detail

- Frustum culling automatically skips rendering objects outside of the camera's view, but ensuring default `frustumCulled` settings are enabled can help maintain this optimization.
  - Our rendering system already implements frustum culling through the `isCulled` utility in `src/core/lib/rendering.ts`.
  ```tsx
  // Enable frustum culling in OptimizedEntityMesh
  <OptimizedEntityMesh frustumCulled={true}>{/* Mesh content */}</OptimizedEntityMesh>
  ```
- Implementing Level of Detail (LOD) swaps high-detail meshes for lower-detail versions at greater distances to reduce triangle throughput.
  ```tsx
  // Use LOD with OptimizedEntityMesh
  <OptimizedEntityMesh
    lodLevels={[
      { distance: 10, detail: <HighDetailModel /> },
      { distance: 50, detail: <MediumDetailModel /> },
      { distance: 100, detail: <LowDetailModel /> },
    ]}
  />
  ```

### Texture and Resource Optimization

- Using texture atlases consolidates multiple small textures into a single large texture, reducing costly texture binds.

  ```tsx
  // Instead of multiple texture loads
  const spriteMap = useTexture('textures/sprite-atlas.jpg');

  // Configure UVs to use different parts of the atlas
  const material = useMemo(() => {
    const mat = new MeshStandardMaterial({ map: spriteMap });
    material.map.offset.set(0.25, 0.25); // Select sprite position
    material.map.repeat.set(0.25, 0.25); // Select sprite size (1/4 of atlas)
    return mat;
  }, [spriteMap]);
  ```

- Compressing textures with modern formats like KTX2 (Basis Universal) can lower memory bandwidth and improve load times.

  ```tsx
  // Load compressed textures
  // Add basis loader to asset loading system in src/core/lib/assets.ts
  import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

  // Then use in components
  const compressedTexture = useTexture('textures/compressed.ktx2');
  ```

### Lighting and Shadows

- Minimizing dynamic lights and shadows reduces the number of lighting calculations per frame; baking static shadows into textures can offload work from the GPU.
  ```tsx
  // Prefer fewer lights with wider influence
  <ambientLight intensity={0.5} />
  <directionalLight
    position={[10, 10, 10]}
    castShadow
    shadow-mapSize={[1024, 1024]}
  />
  ```
- Simplifying materials, for example by using `MeshBasicMaterial` instead of physically-based materials, can cut shader complexity and rendering time.
  ```tsx
  // For distant objects or performance-critical areas
  <mesh>
    <boxGeometry />
    <meshBasicMaterial color="blue" />
  </mesh>
  ```

## React Three Fiber Performance Tips

### On-Demand Rendering and Frame Loop Control

- Using on-demand rendering (`frameloop="demand"`) prevents continuous rerendering, only updating the canvas when necessary.
  ```tsx
  // In GameEngine.tsx for UI-heavy scenes
  <Canvas frameloop="demand">
    <EngineLoop />
    {children}
  </Canvas>
  ```
- Manually invoking `invalidate()` lets you trigger renders on specific interactions, optimizing CPU/GPU usage.

  ```tsx
  // In an interaction handler
  import { useThree } from '@react-three/fiber';

  function InteractiveComponent() {
    const { invalidate } = useThree();

    const handleInteraction = () => {
      // Update state
      invalidate(); // Request a single render
    };

    return <mesh onClick={handleInteraction} />;
  }
  ```

### Avoid Unnecessary Reactive State Updates

- Avoid using `setState` inside the `useFrame` loop; frequent state updates can cause React reconciliation overhead and degrade performance.

  ```tsx
  // Instead of this (bad):
  useFrame(() => {
    setPosition([x, y, z]); // Triggers React reconciliation every frame
  });

  // Do this (good):
  const positionRef = useRef([0, 0, 0]);
  useFrame(() => {
    positionRef.current = [x, y, z]; // No React updates
    mesh.current.position.set(x, y, z); // Direct Three.js update
  });
  ```

- Instead of binding fast-changing values to React state, directly mutate object properties or use refs to bypass React's update cycle.
  - Our ECS system already follows this pattern by storing entity data in typed arrays via bitECS.

### Resource Re-Use and Memoization

- Define and reuse geometries and materials outside component scopes to avoid recreating resources on every render.

  ```tsx
  // In a shared utilities file (src/game/lib/sharedResources.ts)
  import { createContext, useContext } from 'react';
  import { BoxGeometry, MeshStandardMaterial } from 'three';

  export const SharedResources = createContext({
    geometries: {
      box: new BoxGeometry(1, 1, 1),
      // Add more geometries...
    },
    materials: {
      standard: new MeshStandardMaterial({ color: 'white' }),
      // Add more materials...
    },
  });

  export const useSharedResources = () => useContext(SharedResources);
  ```

- Wrap static mesh components in `React.memo` to prevent unnecessary re-renders when their props do not change.
  ```tsx
  const StaticScenery = React.memo(function StaticScenery(props) {
    return (
      <group>
        <mesh position={[0, 0, 0]}>
          <boxGeometry />
          <meshStandardMaterial />
        </mesh>
        {/* More static elements */}
      </group>
    );
  });
  ```

### ECS-Specific Optimizations

- Use bitECS queries efficiently by caching results when possible rather than running queries every frame.

  ```tsx
  // In a system
  const entitiesCache = useRef<number[]>([]);
  const lastQueryTime = useRef(0);

  useFrame(({ clock }) => {
    // Only requery every 30 frames or when needed
    if (clock.elapsedTime - lastQueryTime.current > 0.5) {
      entitiesCache.current = velocityQuery(world);
      lastQueryTime.current = clock.elapsedTime;
    }

    // Process cached entities
    entitiesCache.current.forEach((entity) => {
      // Process entity
    });
  });
  ```

- Batch entity operations to minimize overhead.

  ```tsx
  // Instead of creating entities in a loop
  const createEntities = (count: number, positions: Vector3[]) => {
    // Prepare data first
    const batch = positions.map((pos) => {
      const entity = createEntity();
      Transform.position[entity][0] = pos.x;
      Transform.position[entity][1] = pos.y;
      Transform.position[entity][2] = pos.z;
      return entity;
    });

    // Apply components or other operations in batches
    return batch;
  };
  ```

### Monitoring and Profiling

- Integrate the **R3F-Perf** panel to monitor key metrics like draw calls, vertex count, and calls per frame for real-time performance insights.

  ```tsx
  import { Perf } from 'r3f-perf';

  <Canvas>
    <Perf position="top-left" />
    <EngineLoop />
    {children}
  </Canvas>;
  ```

- Use Chrome DevTools **Performance** tab to profile and attribute CPU/GPU time to specific scripts and WebGL calls.
- Leverage the built-in performance monitoring in `EngineLoop.tsx` which tracks system execution times.
  ```tsx
  // Enable performance monitoring
  <EngineLoop perfMonitoring={true} debug={true} />
  ```

### Game Loop Optimization

- Take advantage of the fixed timestep option in `EngineLoop` for physics and other simulation systems:
  ```tsx
  <EngineLoop useFixedTimeStep={true} fixedTimeStep={1 / 60} maxTimeStep={1 / 30} />
  ```
- Implement staggered updates for non-critical systems, as demonstrated in `VelocitySystem.ts`:

  ```tsx
  // From VelocitySystem.ts - Frame counter for staggered processing
  frameCounter++;

  // Simple load balancing - process lower priority items less frequently
  const priority = Velocity.priority[eid] || 1;
  if (priority < 2 && frameCounter % 2 !== 0) {
    continue;
  }
  ```

## Physics Optimization

- Use appropriate collision shapes - prefer simple shapes (boxes, spheres) over complex ones.
  ```tsx
  // In PhysicsSyncSystem.ts
  <RigidBody type="dynamic" colliders="cuboid">
    <mesh>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  </RigidBody>
  ```
- Adjust the sleep threshold for physics bodies that don't need to be active constantly.
  ```tsx
  <RigidBody linearSleepThreshold={0.1} angularSleepThreshold={0.1}>
    <mesh>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  </RigidBody>
  ```
- Use the worker-based physics implementation as described in the architecture.

## Conclusion

Applying these Three.js and R3F optimizations—ranging from draw call reduction to state management and profiling—can significantly improve frame rates and lower resource usage across devices. When implementing these optimizations in Vibe Coder 3D, remember to follow the core architecture principles:

1. Leverage the ECS system for efficient entity management
2. Use React Three Fiber's features intelligently to avoid unnecessary renders
3. Follow the fixed timestep pattern for physics and simulations
4. Profile and measure performance consistently to identify bottlenecks

By combining these strategies with our architecture-specific optimizations like frustum culling, LOD, and object pooling, we can build highly performant 3D experiences that scale well across different devices.

Here's a concise overview of Three.js and React Three Fiber (R3F) performance, especially on mobile devices, followed by practical optimization strategies to ensure a smooth experience across a range of hardware.

Three.js leverages WebGL to deliver high-performance 3D graphics, and modern mobile GPUs—particularly in Apple devices—can handle complex scenes with ease, though Android performance varies widely by device class citeturn0search0. Underpowered or older devices may struggle due to limited WebGL support, leading to low frame rates if scenes are unoptimized citeturn0search22. Key strategies such as reducing texture sizes (ideally ≤1024×1024), lowering polygon counts, and capping pixel ratios dramatically improve performance citeturn0search10. Compression tools like DRACO or meshopt (via GLTFPack) can shrink large GLTF assets from hundreds of megabytes to a few megabytes, speeding load times and reducing memory pressure citeturn0search2.

R3F introduces minimal overhead on top of Three.js and includes built-in performance‐scaling APIs to adapt quality dynamically based on device capability citeturn0search1. Avoid frequent mount/unmount cycles—object creation and disposal are costly—by reusing geometries and materials globally citeturn0search6. For scenes with many identical objects, instanced meshes offer near-native draw-call performance, even on mobile citeturn0search18. The R3F "performance" context lets your application automatically reduce detail (e.g., lowering resolution or disabling effects) when frame rates drop citeturn0search19.

On mobile, prioritize on-demand rendering (only redraw frames when the scene changes) to conserve resources and battery citeturn0search1. Implement Level of Detail (LOD) techniques so distant objects use lower-polygon variants citeturn0search15. Control your canvas's pixel ratio—using `Math.min(window.devicePixelRatio, 1.5)` prevents rendering at excessive resolution citeturn0search5. Always test on representative devices: Apple iPhones tend to outperform many Android models, but high-end Android phones can match or exceed iOS GPUs citeturn0search3.

---

## Three.js Performance Characteristics

- **Modern Mobile GPUs Are Capable**  
  Even five-year-old iPhones deliver smooth 3D performance for many scenes citeturn0search0.
- **Android Variability**  
  Android devices span a vast performance spectrum—from flagship SoCs to low-end chips—so benchmark on your target range citeturn0search0.

- **WebGL Support Is Key**  
  Limited or outdated WebGL implementations on some devices can bottleneck GPU access, resulting in poor FPS citeturn0search22.

- **Texture and Polygon Budgets**  
  Keep textures at 1024×1024 or 2048×2048 max and simplify mesh segment counts for mobile to avoid GPU memory thrashing citeturn0search10.

- **Asset Compression**  
  Tools like DRACO and meshopt (with GLTFPack) can reduce GLTF file sizes by 90%+, cutting download times and VRAM usage citeturn0search2.

---

## React Three Fiber (R3F) Specifics

- **Minimal Overhead**  
  R3F's reconciler adds negligible cost on top of Three.js's render loop citeturn0search4.

- **Performance-Scaling Context**  
  Use `<Performance>` or subscribe to the `performance.current` value to adapt scene complexity in real time citeturn0search1.

- **Avoid Expensive Object Lifecycle**  
  Mounting/unmounting meshes or materials triggers shader recompilation and buffer uploads—reuse shared resources when possible citeturn0search6.

- **Instancing for Many Objects**  
  For hundreds of repeated meshes, instanced rendering slashes draw calls and maintains high FPS even on constrained devices citeturn0search18.

---

## Mobile-Focused Optimization Strategies

- **On-Demand Rendering**  
  Configure R3F's `frameloop="demand"` so renders occur only on interaction or animation, saving GPU cycles citeturn0search1.

- **Level of Detail (LOD)**  
  Swap in simplified mesh versions based on camera distance to reduce poly count dynamically citeturn0search15.

- **Pixel Ratio Control**  
  Clamp `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))` to prevent over-rendering on high-DPI displays citeturn0search5.

- **Limit Effects**  
  Disable or lower post-processing effects (antialiasing, shadows, bloom) on weaker hardware to maintain responsiveness citeturn0search5.

- **Testing and Profiling**  
  Measure draw calls, memory use, and FPS on real devices; Apple devices often excel, but always include a range of Android handsets in your QA citeturn0search3.

---

## Conclusion

With thoughtful optimizations—asset compression, LOD, instancing, pixel ratio tuning, and leveraging R3F's performance APIs—both Three.js and React Three Fiber can run smoothly on mobile devices citeturn0search12. The key is to understand your target hardware's capabilities, profile regularly, and gracefully degrade visual fidelity when necessary citeturn0search1turn0search19. When done right, mobile 3D experiences built with Three.js/R3F can approach desktop-level performance while delivering immersive, interactive graphics on the go.

---

## @core Implementation Plan

This plan outlines the steps to implement the performance optimizations discussed above within the `src/core` engine components and systems.

**Phase 1: Foundational Setup & Verification**

- **Goal:** Ensure existing documented features are working correctly and add basic loader support.
- **Files:**
  - `src/core/components/OptimizedEntityMesh.tsx`: Verify existing LOD and Frustum Culling props (`lodLevels`, `frustumCulled`) are functional and integrated correctly.
  - `src/core/lib/rendering.ts`: Verify the `isCulled` utility functions as described.
  - `src/core/systems/RenderSystem.ts` (or equivalent): Verify frustum culling logic uses the `isCulled` utility or component flags effectively.
  - `src/core/engine/EngineLoop.tsx`: Verify built-in performance monitoring (`perfMonitoring`) and fixed timestep (`useFixedTimeStep`) options are functional. Investigate if explicit control via `invalidate()` needs exposure for `frameloop="demand"`.
  - `src/core/lib/assets.ts` or `src/core/systems/AssetSystem.ts`: Add `KTX2Loader` support for compressed texture loading.

**Phase 2: Rendering Pipeline Optimizations**

- **Goal:** Implement core rendering optimizations like instancing and potentially provide geometry utilities.
- **Files:**
  - `src/core/components/OptimizedEntityMesh.tsx`: Implement or significantly enhance support for instanced rendering (`instanced`, `instanceCount`, `instanceMatrix`). This likely requires integration with the ECS for managing instance data.
  - `src/core/systems/RenderSystem.ts` (or equivalent): Add logic to detect and render instanced meshes efficiently using data provided by `OptimizedEntityMesh` or the ECS.
  - `src/core/lib/rendering.ts` or new `src/core/lib/geometryUtils.ts`: Consider adding a utility function wrapping `BufferGeometryUtils.mergeBufferGeometries` if mesh merging becomes a common pattern needed by core systems or components.
  - `src/core/lib/assets.ts`: Add helpers or guidance for calculating UV offsets/repeats if texture atlas usage becomes common in core components.

**Phase 3: System & Loop Optimizations**

- **Goal:** Optimize ECS system performance and entity management.
- **Files:**
  - `src/core/systems/*.ts`: Review all core systems (e.g., `VelocitySystem`, `PhysicsSyncSystem`, `RenderSystem`) that perform frequent ECS queries. Implement caching strategies (like the example using `useRef` and timing) where appropriate to avoid redundant queries every frame.
  - `src/core/systems/*.ts`: Identify systems that don't require updates every single frame (e.g., less critical AI, background updates) and implement staggered updates (like the `frameCounter` example) to distribute load.
  - `src/core/lib/ecs.ts` (or equivalent entity management helpers): Add utility functions to facilitate batch creation, modification, or deletion of entities to reduce overhead compared to individual operations in loops.

**Phase 4: Physics & Component Refinements**

- **Goal:** Fine-tune physics integration and apply React-specific optimizations.
- **Files:**
  - `src/core/systems/PhysicsSyncSystem.ts`: Ensure the system correctly reads and applies Rapier configurations set on entities/components for different `colliders` (simple vs. complex) and `*SleepThreshold` values.
  - `src/core/engine/worker/*` (if physics runs in worker): Verify the communication and setup for the physics worker are efficient.
  - `src/core/components/*.tsx`: Identify core React components that render static or infrequently changing sub-trees and wrap them with `React.memo` to prevent unnecessary re-renders.
