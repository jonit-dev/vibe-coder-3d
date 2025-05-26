# Proposed Folder Refactoring

This document outlines a proposed folder structure reorganization for the project, focusing on improving clarity and separation of concerns, especially within the `src/core` and `src/editor` directories.

## Current Concerns

- **`src/core` is a bit of a monolith:** It contains a wide range of concerns: low-level engine components, physics, UI elements, state management, helper functions, and the dynamic component system. This can make it harder to navigate and understand the distinct responsibilities within the core engine.
- **`src/core/components` is very broad:** It mixes fundamental engine components (like `Entity`, `GameEngine`) with more specific ones (like `CharacterController`, `PhysicsBall`) and even UI elements (`GameUI`, `Hud`).
- **`src/core/lib` is also very broad:** This seems to be a collection of various modules related to ECS, events, physics, rendering, etc. It might benefit from more specific categorization.
- **`src/editor/components` has good panel-based organization, but common UI and physics could be clearer.** The `common` directory is good, but the `physics` integration might be better placed or named for clarity.
- **Top-level `src/components` vs. `src/core/components` vs. `src/editor/components` vs. `src/game/components`:** The distinction between these isn't immediately obvious. It seems `src/components` holds high-level demo-switching UI, while the others are more domain-specific.

## Proposed Reorganization

```
src/
├── App.tsx
├── main.tsx
├── styles/
│   └── index.css
├── vite-env.d.ts
│
├── core/                  # Core engine functionalities, decoupled from game/editor specifics
│   ├── ecs/               # Entity Component System (ECS) core logic
│   │   ├── components/    # Base component definitions, interfaces (e.g., IComponent)
│   │   ├── entities/      # Entity management
│   │   ├── systems/       # Core systems (TransformSystem, PhysicsSyncSystem, etc.)
│   │   ├── archetypes/
│   │   ├── events/
│   │   └── manager.ts     # ECSManager
│   ├── physics/           # Physics engine integration and core components
│   │   ├── components/    # Physics-specific components (RigidBody, Collider)
│   │   ├── world/         # PhysicsWorld, broadphase, narrowphase
│   │   ├── utils/
│   │   └── types.ts
│   ├── rendering/         # Rendering pipeline, materials, lights, camera
│   │   ├── components/    # MeshRenderer, Light, Camera
│   │   ├── materials/
│   │   ├── shaders/       # If applicable
│   │   └── utils/
│   ├── assets/            # Asset loading, management, and types (decoupled from specific game assets)
│   │   ├── loaders/
│   │   ├── managers/
│   │   └── types.ts
│   ├── scene/             # Scene graph, scene management
│   │   ├── components/    # Scene-related components
│   │   └── SceneManager.ts
│   ├── input/             # Input handling (keyboard, mouse, gamepad)
│   ├── audio/             # Audio engine integration
│   ├── state/             # Core engine state (e.g., engineStore, not UI or game specific)
│   ├── dynamic-components/ # (Seems well-structured, keep as is or integrate parts into ecs/components)
│   │   ├── components/
│   │   ├── groups/
│   │   ├── manager/
│   │   ├── registry/
│   │   ├── types/
│   │   └── validation/
│   ├── engine/            # Core engine loop, initialization
│   │   └── GameEngine.tsx
│   ├── helpers/           # Generic utility functions for the core engine
│   ├── hooks/             # Core engine hooks (useECS, useEvent, etc.) - re-evaluate if some belong elsewhere
│   └── types/             # Core engine-wide types and interfaces
│
├── editor/                # Editor-specific UI, logic, and components
│   ├── components/        # UI components specific to the editor
│   │   ├── common/        # Reusable UI components within the editor (Card, Collapsible, etc.)
│   │   ├── panels/        # (Keep existing structure: Hierarchy, Inspector, Viewport)
│   │   │   ├── HierarchyPanel/
│   │   │   ├── InspectorPanel/ # Component-specific inspector sections remain here
│   │   │   └── ViewportPanel/
│   │   ├── menus/         # Context menus, AddObjectMenu
│   │   │   ├── AddObjectMenu.tsx
│   │   │   └── EnhancedAddObjectMenu.tsx
│   │   ├── ui/            # General editor UI elements (SidePanel, TopBar, StatusBar, etc.) - some items from current editor/components/ui might move here
│   │   └── icons/         # Editor icons
│   ├── features/          # Editor-specific features/modules
│   │   ├── scene-management/ # Save, load, new scene logic
│   │   ├── entity-manipulation/ # Create, delete, duplicate entities
│   │   ├── physics-integration/ # EditorPhysicsIntegration.tsx and related logic
│   │   ├── asset-browser/   # If you plan to have one
│   │   └── console/         # Editor console
│   ├── hooks/             # Editor-specific hooks (useEntitySelection, useTransform, etc.)
│   ├── store/             # Editor state management (editorStore.ts)
│   ├── data/              # Editor-specific data (e.g., default scene layouts, editor configs)
│   │   └── scene/
│   │       └── scene.json
│   ├── services/          # Services used by the editor (e.g., serialization, undo/redo)
│   └── utils/             # Editor-specific utility functions
│   └── Editor.tsx         # Main editor component
│
├── game/                  # Game-specific logic, components, scenes, and assets
│   ├── components/        # Components specific to the game (not reusable in the core engine/editor)
│   │   ├── ui/            # Game-specific UI (HUD, menus, etc.) - DebugMenu.tsx
│   │   ├── world/         # Game world elements (HelloCube.tsx)
│   │   └── characters/    # Game character controllers, AI
│   ├── scenes/            # Game scenes/levels
│   │   ├── MainScene.tsx
│   │   ├── bowling-demo/  # (Keep existing structure)
│   │   └── ...other_scenes
│   ├── assets/            # Game-specific assets (models, textures, sounds used by the game)
│   │   ├── models/
│   │   └── textures/
│   ├── config/            # Game-specific configurations
│   ├── hooks/             # Game-specific hooks (useCameraPosition.ts)
│   ├── state/             # Game-specific state (gameState.ts)
│   ├── stores/            # Game-specific stores (demoStore.ts)
│   └── systems/           # Game-specific systems
│
├── components/            # SHARED UI components (usable by core, editor, and game)
│   ├── layout/            # Layout components (Grid, Stack, etc.)
│   ├── forms/             # Input fields, buttons, forms
│   ├── feedback/          # Modals, tooltips, notifications
│   └── navigation/        # Menus, tabs (if generic enough)
│   └── DemoSelector.tsx   # Example - this seems like a high-level app shell component
│   └── MenuBackground.tsx # Example
│
├── config/                # Global application configuration (distinct from core/game/editor configs)
│   ├── assets/            # Asset metadata (nightStalkerAssetsMetadata.ts)
│   └── assets.ts
│
├── lib/                   # External libraries or truly generic, standalone utilities (rarely needed)
│
├── utils/                 # Truly global utility functions, not specific to core, editor, or game
│
└── features/              # (Optional) For larger, self-contained features that span across core/editor/game
```

## Key Rationale for Changes

1.  **Clearer Separation of Concerns:**

    - `core` focuses on the reusable, underlying engine technology.
    - `editor` focuses on the tools and UI for creating and modifying scenes/games.
    - `game` focuses on the specific game being built (or demos).
    - `components` (top-level) becomes a place for genuinely shared UI components if any, or could be absorbed if components are always context-specific.

2.  **Domain-Driven Structure within `core`:**

    - Instead of a generic `components` and `lib` in `core`, we have folders like `ecs`, `physics`, `rendering`, `assets`, `scene`. This makes it easier to find code related to a specific engine domain.
    - Core components (like `Entity`, `Transform`) would live within their respective domains (e.g., `core/ecs/components`, `core/rendering/components`).

3.  **Feature-Based Structure for `editor`:**

    - Introducing a `features` directory within `editor` can help organize complex editor functionalities (e.g., `scene-management`, `physics-integration`). This makes the `editor/components` directory less cluttered with logic and more focused on UI.

4.  **Hooks and Stores Proximity:**
    - Hooks and stores are generally kept close to the domain they serve (e.g., `editor/hooks`, `editor/store`, `core/hooks`, `core/state`).

```

```
