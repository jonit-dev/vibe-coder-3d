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
