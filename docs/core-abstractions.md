# Core Abstractions Plan: Recreating Engine Fundamentals

This document outlines the plan for creating high-level abstractions in `src/core` to facilitate game development, drawing parallels to concepts found in engines like Unity and Godot.

## Goal

Provide ergonomic and reusable components, hooks, and systems that abstract away the complexities of the underlying libraries (`@react-three/fiber`, `@react-three/rapier`, `bitecs`, `zustand`, etc.), offering a developer experience closer to a traditional game engine.

These abstractions should remain agnostic about gameplay mechanics and game-specific concepts, focusing only on providing the technical foundation that any game might need. Game-specific functionality should be built on top of these abstractions in game-specific code.

## Core Concepts & Proposed Abstractions

### 1. Scene Graph & Entities (Unity: GameObject/Prefab, Godot: Node/Scene)

- **Concept:** Representing objects in the world hierarchy.
- **R3F Base:** `react-three-fiber` already provides a declarative scene graph using React components.
- **Proposed Abstractions (`src/core/components`):**
  - `<Entity>`: A potential base component that combines R3F's `group` or `object3D` with integrated ECS entity management and optional physics body linkage. It could automatically handle adding/removing the corresponding ECS entity.
  - `<Prefab>` / Composition: Leverage React's composition model. Define reusable entity setups as React components (e.g., `<Player>`, `<Collectable>`). No specific `<Prefab>` component might be needed, just a convention.

### 2. Component System (Unity: MonoBehaviour, Godot: Script)

- **Concept:** Attaching behavior and data to entities.
- **Approach:** Combine React components and `bitecs` ECS.
- **Proposed Abstractions:**
  - **React Components (`src/core/components`):** For rendering, complex interactions, and view-layer logic (e.g., `<CharacterController>`, `<GunLogic>`, `<HealthBarUI>`). These components can interact with ECS via hooks.
  - **ECS Components (`src/core/components/ecs` or `src/core/ecs/components`):** Pure data components managed by `bitecs` for performance-critical data (e.g., `Position`, `Velocity`, `Health`, `PlayerTag`). Define these using `bitecs` `defineComponent`.
  - **ECS Systems (`src/core/systems` or `src/core/ecs/systems`):** Pure functions operating on ECS entities and components for core game logic (e.g., `MovementSystem`, `PhysicsSyncSystem`, `CollisionSystem`). These run within the game loop.
  - **Hooks (`src/core/hooks`):**
    - `useEntity(entityId)`: Hook to get/subscribe to ECS component data for a specific entity within React components.
    - `useECSQurey([...components])`: Hook to query entities matching certain components.
    - `usePhysics()`: Access Rapier world instance.
    - `useECS()`: Access `bitecs` world instance.

### 3. Physics (Unity: Rigidbody/Collider, Godot: PhysicsBody/CollisionShape)

- **Concept:** Simulating physics interactions.
- **Library:** `@react-three/rapier`.
- **Proposed Abstractions (`src/core/components/physics`):**
  - `<RigidBody>`: Wrapper around `RapierRigidBody` potentially adding easier configuration, defaults, or integration with the proposed `<Entity>` component.
  - `<Collider>`: Wrapper around `RapierCollider` components (`CuboidCollider`, `BallCollider`, etc.) for simplified setup and potential integration with `<Entity>`.
  - `<Sensor>` / `<Trigger>`: Specialized collider configurations for non-colliding detection zones.
  - **Hooks (`src/core/hooks`):**
    - `useCollisionEvents(entityId?, callback)`: Hook to easily subscribe to collision/sensor enter/exit events for a specific body or globally.
    - `useRaycast()`: Simplified API for performing raycasts/shapecasts against the physics world.

### 4. State Management (Unity: ScriptableObject/Singletons, Godot: Autoload/Globals)

- **Concept:** Managing global and persistent game state.
- **Library:** `zustand`.
- **Proposed Abstractions (`src/core/state`):**
  - Define core state stores (e.g., `useGameStore`, `useSettingsStore`, `usePlayerStore`).
  - Provide clear patterns/guidelines for creating game-specific stores (`src/game/state`).
  - Potentially create helper functions or hooks for common state patterns (e.g., persisting state to local storage).

### 5. Assets (Unity: Asset Database, Godot: FileSystem Dock)

- **Concept:** Loading and managing game assets (models, textures, audio).
- **Library:** `three`, `@react-three/drei`.
- **Proposed Abstractions (`src/core/lib/assets.ts`, `src/core/hooks/useAssets.ts`):**
  - `AssetLoader`: A utility class or singleton to handle preloading and caching of assets.
  - `useAsset(url)`: Hook to easily load and access individual assets within components, leveraging Drei's loaders and React Suspense.
  - Define conventions for asset organization within the `public/` or `src/assets/` directory.

### 6. Input (Unity: Input System, Godot: Input Map)

- **Concept:** Handling user input from various devices.
- **Proposed Abstractions (`src/core/hooks/useInput.ts`, `src/core/lib/input.ts`):**
  - `useInput`: A hook that provides a unified API for checking key presses, mouse buttons, mouse position/delta, and potentially gamepad input.
  - Input Map: Define a configuration (maybe a simple object or JSON) to map raw inputs (e.g., "w", "Space", "MouseButton1") to abstract actions (e.g., "moveForward", "jump", "fire"). `useInput` would allow querying these actions.

### 7. UI (Unity: UI Toolkit/UGUI, Godot: Control Nodes)

- **Concept:** Creating user interfaces.
- **Approach:** Combine DOM-based UI (React) and potentially in-world UI.
- **Proposed Abstractions (`src/core/components/ui`):**
  - **DOM UI:** Standard React components styled with Tailwind CSS, rendered in a separate root outside the R3F Canvas. State managed via Zustand or component state.
  - **In-World UI:** Consider integrating `three-mesh-ui` if needed. Create wrapper components (`<WorldButton>`, `<WorldText>`) for easier use within the R3F scene graph.
  - **Hooks/State:** Hooks to connect UI elements to game state (e.g., `useGameStore` for score display).

### 8. Audio (Unity: AudioSource/AudioClip, Godot: AudioStreamPlayer)

- **Concept:** Playing sound effects and music.
- **Library:** Potentially `howler.js` or just Three.js `Audio`.
- **Proposed Abstractions (`src/core/lib/audio.ts`, `src/core/hooks/useAudio.ts`):**
  - `AudioManager`: A utility class or Zustand store to manage loading, playing, pausing, and controlling volume of sounds.
  - `useSoundEffect(url)`: Hook to easily trigger playback of short sound effects.
  - `<PositionalAudio>`: R3F component wrapper around Three.js `PositionalAudio` for spatialized sound attached to entities.

### 9. Lifecycle & Events (Unity: Awake/Start/Update, Godot: \_ready/\_process)

- **Concept:** Standard methods/callbacks for entity initialization, updates, and destruction, plus event bus.
- **Approach:** Leverage React component lifecycle, R3F `useFrame` hook, and potentially a custom event emitter.
- **Proposed Abstractions:**
  - **React Lifecycle:** Use `useEffect` for setup/teardown logic within components.
  - **R3F `useFrame`:** The primary game loop hook for per-frame updates in React components.
  - **ECS Systems:** Handle bulk updates for entities based on data.
  - **Event Bus (`src/core/lib/events.ts`):** A simple pub/sub system (e.g., using `mitt` or a basic custom implementation) for decoupled communication between different parts of the game. `useEvent(eventName, callback)` hook.

### 10. Debugging (Unity: Scene View/Gizmos, Godot: Debug Tools)

- **Concept:** Visualizing game state and physics for development.
- **Library:** `@react-three/rapier` `Debug` component, `@react-three/drei` helpers.
- **Proposed Abstractions (`src/core/components/debug`):**
  - `<DebugLayer>`: A component that conditionally renders various debug visualizations (physics colliders, ECS entity outlines, custom gizmos).
  - Integrate tools like `leva` for tweaking parameters at runtime.
  - Develop custom gizmos using `drei` helpers for specific game mechanics.

## Next Steps

1.  Refine these proposed abstractions based on initial implementation trials.
2.  Start building out the core components, hooks, and systems in `src/core`.
3.  Continuously update this document as the core library evolves.

## Implementation Plan

Based on the existing structure (`src/core/lib/ecs.ts`, `src/core/lib/gameLoop.ts`) and the roadmap, the implementation will proceed as follows:

**Sprint 1: Core Loop & Physics Integration** ✅

1.  **Game Loop Component:** Create a core React component (e.g., `<EngineLoop>`) that uses `useFrame` and integrates with `useGameLoop` state. ✅
2.  **Physics Setup (`src/core/lib/physics.ts`):** Initialize the Rapier world within the R3F context (`<Physics>` component from `@react-three/rapier`). ✅
3.  **ECS System Execution:** Integrate ECS system execution (starting with a basic `PhysicsSyncSystem`) into the `<EngineLoop>` component's `useFrame` callback. ✅
4.  **Basic State Store (`src/core/state/useCoreStore.ts`):** Set up a minimal Zustand store for essential core state (e.g., references to ECS/Physics worlds if needed centrally). ✅
5.  **Core Hooks (`src/core/hooks`):** Implement `useECS()` and `usePhysics()` hooks to provide easy access to the world instances. ✅
6.  **Physics Abstractions (`src/core/components/physics`):** Create components for physics objects, triggers, and joints that integrate with ECS. ✅

**Sprint 2: Entity Abstraction & Basic Components** ✅

1.  **`<Entity>` Component (`src/core/components/Entity.tsx`):** Develop the base `<Entity>` component that manages ECS entity creation/destruction and potentially links to a Three.js `Object3D`. ✅
2.  **ECS Components (`src/core/ecs/components`):** Define more core ECS components (e.g., `Velocity`, `Renderable`, `PhysicsBodyRef`). ✅ (`Transform`, `PhysicsBodyRef`, `Velocity` implemented)
3.  **`<RigidBody>`/`<Collider>` Wrappers (`src/core/components/physics`):** Create wrappers around Rapier components for simplified usage, potentially integrating them with the `<Entity>` component. ✅ (Covered by `PhysicsObject`, `PhysicsBox`, `PhysicsSphere` etc.)
4.  **Physics Sync System (`src/core/ecs/systems/PhysicsSyncSystem.ts`):** Implement the system to sync Rapier physics state with ECS `Transform` components. ✅ (Also added `VelocitySystem.ts`)
5.  **Hook: `useEntity(entityId)`:** Develop the hook to access/subscribe to ECS data within React components. ✅ (Implemented `useEntity` and `useEntityQuery`)

**Sprint 3: Input, Assets & Debugging** ✅

1.  **Input System (`src/core/hooks/useInput.ts`, `src/core/lib/input.ts`):** Implement the `useInput` hook and the action mapping system. ✅
2.  **Asset Loading (`src/core/hooks/useAsset.ts`, `src/core/lib/assets.ts`):** Implement the `useAsset` hook and potentially a simple asset preloading mechanism. ✅
3.  **Debug Layer (`src/core/components/debug/DebugLayer.tsx`):** Create the `<DebugLayer>` component to toggle Rapier debug rendering and potentially other visualizations. ✅
4.  **Hook: `useCollisionEvents()`:** Implement the hook for handling physics collision events. ✅

**Sprint 4+: Gameplay Components, UI, Audio, Events** ✅

1.  **Gameplay Components (`src/core/components`):** Start implementing higher-level components like `<CharacterController>`. ✅ (`CharacterController` implemented as a reference implementation)
2.  **UI Abstractions (`src/core/components/ui`):** Develop wrappers for in-world UI or helpers for DOM UI integration. ✅ (`Hud` component implemented as a reference implementation)
3.  **Audio System (`src/core/lib/audio.ts`, `src/core/hooks/useAudio.ts`):** Implement the `AudioManager` and related hooks. ✅ (`useAudio` hook for global controls implemented)
4.  **Event Bus (`src/core/lib/events.ts`, `src/core/hooks/useEvent.ts`):** Set up the event bus and `useEvent` hook. ✅ (`useEvent` hook implemented)

Note: The components and hooks in Sprint 4 are intentionally designed as minimal reference implementations. They show how to use the engine's core abstractions but remain agnostic of game-specific concepts. Game developers should create their own gameplay components, UI, audio logic, and event handlers tailored to their specific game.

**Ongoing:**

- Refine existing abstractions.
- Add tests for core functionality.
- Maintain documentation.
