# Technical Stack

Based on our research ([Stack Research](../research/stack-research.md)), we have adopted the **React-centric Stack** for Vibe Coder 3D. This stack leverages the power of React and its ecosystem for building our 3D game engine, prioritizing developer experience and rapid iteration.

## Core Components

Our stack consists of the following key libraries and technologies:

- **Renderer:** **React Three Fiber v9 (R3F)**
  - _Reason:_ Provides a declarative JSX syntax for defining Three.js scenes, integrating seamlessly with the React ecosystem. Its render loop operates outside of React, ensuring minimal overhead and excellent performance.
- **Helpers:** **@react-three/drei**
  - _Reason:_ Offers a collection of pre-built, reusable components and hooks for common Three.js tasks like controls, loaders, and instanced meshes, accelerating development.
- **State Management:** **Zustand**
  - _Reason:_ A lightweight, fast, and scalable state management solution built into R3F. It's frame-safe and requires minimal boilerplate.
- **Physics Engine:** **Rapier**
  - _Reason:_ A high-performance physics engine compiled from Rust to WebAssembly (WASM). It offers 2D/3D capabilities, deterministic results crucial for multiplayer, and robust TypeScript typings.
- **Entity Component System (ECS):** **bitecs**
  - _Reason:_ A highly performant, data-oriented ECS library with a small footprint (< 6 kB). It uses cache-friendly typed arrays for optimal performance. (_ecs-lib_ remains an alternative if OOP helpers are needed).
- **In-World UI:** **three-mesh-ui**
  - _Reason:_ Enables the creation of 3D user interfaces directly within the Three.js scene, suitable for VR and complex interactions without relying on the DOM.
- **Audio:** **Howler.js 2.2**
  - _Reason:_ A reliable, cross-platform audio library with features like audio sprites and spatial audio helpers, simplifying sound management.
- **Multiplayer:** **Colyseus 0.16**
  - _Reason:_ A battle-tested framework for multiplayer game servers, providing features like room management, state synchronization (delta patching), and client prediction.
- **Build Tooling:** **Vite 5 + TypeScript 5**
  - _Reason:_ Vite offers extremely fast Hot Module Replacement (HMR) for a rapid development feedback loop, while TypeScript provides static typing for improved code safety and maintainability.
- **Editor (Optional):** **Rogue Engine**
  - _Reason:_ A visual, Unity-like editor for Three.js scenes. It can export vanilla JavaScript or work with React, providing a visual authoring workflow.

## Rationale

This stack was chosen for its:

1.  **Developer Experience:** Leveraging React allows developers familiar with the ecosystem to quickly become productive. JSX provides a clean way to structure scenes.
2.  **Performance:** R3F's architecture and the use of performant libraries like Rapier and bitecs ensure the engine can handle complex scenes and interactions.
3.  **Modern Tooling:** Vite and TypeScript provide a fast and safe development environment.
4.  **Strong Ecosystem:** R3F and its supporting libraries have active communities and are well-maintained.
5.  **Multiplayer-Ready:** Colyseus provides a solid foundation for networked experiences.

By standardizing on this stack, we aim for a lean, modern, and approachable engine foundation. We will guard against potential React overhead by utilizing techniques like `frameloop="demand"` and leveraging instancing/merging utilities from `@react-three/drei`.
