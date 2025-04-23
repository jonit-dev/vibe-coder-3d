# Core Components

This document details the primary libraries and technologies that form the foundation of Vibe Coder 3D, as outlined in our [Technical Stack](./technical-stack.md).

## Rendering Layer

- **React Three Fiber (R3F):** The core renderer that allows us to define and manipulate Three.js scenes using React's component model and JSX syntax. It handles the main render loop efficiently.
- **@react-three/drei:** A collection of essential helpers, abstractions, and components for R3F. We use it for camera controls, asset loading, post-processing effects, and common 3D object primitives, significantly speeding up development.

## State and Data Management

- **Zustand:** Used for managing global application state in a simple, reactive way. It integrates seamlessly with React hooks and is particularly useful for managing state outside the direct R3F scene graph (e.g., UI state, game settings).
- **bitecs (Entity Component System - ECS):** Manages the state of in-game entities (like players, objects, NPCs) in a highly performant, data-oriented manner. This is crucial for handling large numbers of entities and complex game logic efficiently by separating data (components) from logic (systems).

## Physics and Interaction

- **Rapier:** Provides realistic physics simulation (gravity, collisions, forces) for objects within the 3D world. Its determinism is vital for ensuring consistent physics across clients in multiplayer scenarios.
- **three-mesh-ui:** Used for creating user interfaces directly within the 3D scene (e.g., floating menus, information panels attached to objects). This allows for UI that feels integrated with the game world, especially important for VR experiences.

## Supporting Systems

- **Howler.js:** Manages all audio playback, including background music, sound effects, and spatial audio linked to object positions within the scene.
- **Colyseus:** Handles the real-time networking aspects for multiplayer functionality. It manages game rooms, synchronizes player states between clients and the server, and handles communication protocols.

## Gameplay Components

The engine provides minimal reference implementations of gameplay components that developers can use as a starting point:

- **`<CharacterController>`** (`src/core/components/CharacterController.tsx`): A reference implementation of a basic character controller:
  - Provides WASD-style movement using the input system
  - Implements jumping via the physics system
  - Integrates with ECS via entity references
  - Serves as example of how game code can combine core systems (input, physics, ECS)

Note that these components are intentionally minimal. Game developers are expected to:

- Create their own game-specific controllers in their game code
- Extend or replace these components based on their specific gameplay needs
- Implement more advanced features (e.g., character abilities, animations) in their game code

## Development Tooling

- **Vite:** Our build tool and development server. It provides extremely fast Hot Module Replacement (HMR) for instant feedback during development and optimizes the final build for production.
- **TypeScript:** Ensures type safety throughout the codebase, reducing runtime errors and improving code maintainability and developer confidence.

## Optional Editor

- **Rogue Engine:** A visual editor that can be used to design and lay out scenes, configure components, and preview the game. It streamlines the level design and asset integration process, exporting configurations compatible with our Three.js/R3F setup.
