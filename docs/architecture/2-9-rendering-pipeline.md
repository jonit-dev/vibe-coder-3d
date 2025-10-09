# Rendering System

This document outlines the rendering architecture for the Vibe Coder 3D engine, primarily based on **React Three Fiber (R3F)** and its underlying **Three.js** library.

## Core Principles

- **Declarative Scene Definition:** We leverage R3F's JSX syntax to define 3D scenes within the React component hierarchy. This promotes composability and integrates well with React's state management.
- **Performance:** R3F's render loop operates outside of React, minimizing reconciliation overhead. We further optimize using techniques like `frameloop="demand"` where appropriate, and leverage utilities from `@react-three/drei` for instancing, merging, and level-of-detail (LOD).
- **Ecosystem Integration:** The system is designed to work seamlessly with other chosen stack components like Zustand for state and Rapier for physics visualization (if needed).

## Key Components & Considerations

- **React Three Fiber (R3F) v9:** The core renderer abstraction.
  - Manages the Three.js scene, camera, and render loop.
  - Provides hooks (`useThree`, `useFrame`) for interacting with the render state.
- **Three.js:** The underlying WebGL rendering library.
  - Handles low-level graphics operations, materials, geometries, lighting, etc.
- **@react-three/drei:** A collection of helper components and hooks.
  - Used for controls (e.g., OrbitControls), loaders (GLTF, textures), environment maps, text rendering, performance monitors, and more.
- **Shaders & Materials:**
  - Primarily use standard Three.js materials (MeshStandardMaterial, etc.).
  - Custom shaders can be integrated using `shaderMaterial` from Drei or directly with Three.js APIs when necessary.
- **Lighting:**
  - Define standard Three.js light types (Directional, Point, Spot, Ambient) declaratively in JSX.
  - Environment maps (HDRIs) handled via Drei helpers.
- **Post-processing:**
  - Integration of post-processing effects (e.g., bloom, SSAO) can be achieved using R3F's effect composer capabilities or libraries like `postprocessing`. _(Decision on specific library/approach TBD)_
- **Scene Management:**
  - Scene graph managed implicitly through the React component hierarchy.
  - Culling (frustum, potentially occlusion) handled by Three.js.
- **In-World UI:**
  - Rendered using `three-mesh-ui` for UI elements integrated directly into the 3D scene.

## WebGPU Support

The engine now includes experimental WebGPU support alongside WebGL:

- **WebGL**: Default renderer, widely supported across all browsers
- **WebGPU**: Modern GPU API offering better performance (experimental, opt-in)

### Enabling WebGPU

WebGPU can be enabled using the `useAdaptiveRenderer` prop on GameEngine:

```tsx
<GameEngine
  useAdaptiveRenderer={true}
  rendererType="auto"
>
  {/* scene content */}
</GameEngine>
```

The engine will automatically detect WebGPU support and fall back to WebGL if unavailable.

### Browser Requirements

- Chrome/Edge 113+
- Safari 18+
- Firefox 127+ (requires `dom.webgpu.enabled` flag)

**Note**: WebGPU support in Three.js is experimental. The infrastructure is in place for future adoption.

See [WebGPU Integration Guide](../guides/webgpu-integration.md) for detailed usage instructions.

## Future Considerations

- Advanced rendering techniques (Deferred rendering, custom pipelines) if required for specific visual targets.
- Optimization strategies for large scenes (impostors, advanced culling).
- Full WebGPU implementation when Three.js support is stable.
- WebGPU compute shader integration for physics and particle systems.
