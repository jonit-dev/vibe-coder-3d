# Vibe Coder 3D - Game Engine Patterns

This document outlines the core architectural and design patterns adopted for the Vibe Coder 3D project, largely inspired by established game engine practices (like those found in Godot and Unity) but translated into the context of React and React-Three-Fiber (R3F). The central concept is the "Blueprint Engine".

## Core Concept: Blueprint Engine

A "Blueprint" is analogous to a _Scene_ in Godot or a _Prefab_ in Unity. It represents a reusable, composable entity or system within the game, defined primarily using React components (JSX).

## Core Patterns

| Feature                | Traditional Analog                             | Purpose                                           | R3F Implementation                                                                                                              |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Node Composition**   | Godot Nodes/Scenes, Unity GameObject/Component | Build behaviour via composition, not inheritance. | Pure JSX. Each file typically represents one Blueprint root. Children are functional components with single concerns.           |
| **Blueprint Variant**  | Godot Inherited Scene, Unity Prefab Variant    | Create variations without duplicating code.       | A `Blueprint(BaseComponent, overrideProps)` factory function allows creating tuned instances.                                   |
| **Signals / Events**   | Godot Signals, UnityEvent                      | Enable decoupled communication between systems.   | A global event bus using `mitt` + a `useSignal(event, callback)` hook for subscribing components.                               |
| **Groups / Tags**      | Godot Groups, Unity Tags                       | Query collections of objects efficiently.         | A `useTag("tag-name", ref)` hook registers objects; `getNodes("tag-name")` retrieves refs array.                                |
| **Singleton / Global** | Godot Autoload, Unity Singletons               | Provide globally accessible state or services.    | React Context (e.g., `<GameStateProvider>`, `<InputProvider>`).                                                                 |
| **Data Assets**        | Godot Resource, Unity ScriptableObject         | Allow designer-friendly data editing.             | Type-safe JSON files (e.g., `data/items/sword.json`) validated using Zod schemas, loaded via a `useAsset` hook.                 |
| **Addressables**       | Unity Addressables                             | Load assets asynchronously by ID.                 | A manifest mapping IDs to URLs (`{id: url}`). Assets loaded via `import(url)` + Three.js loaders, potentially cached.           |
| **Input Map**          | Godot InputMap, Unity Input System Action Maps | Abstract input devices from actions.              | A central `useInput(actions)` hook maps raw inputs (keys, gamepad) to named actions (e.g., "jump", "interact").                 |
| **Scene Loading**      | Unity Additive Scene Loading                   | Stream large worlds or manage complex UIs.        | Potentially mount multiple R3F `<Canvas>` roots; lazy-load Blueprints as needed (e.g., based on world chunks).                  |
| **ECS (Optional)**     | Unity DOTS/ECS                                 | Optimize performance for massive object counts.   | Integrate an ECS library like `bitecs` if performance profiling indicates a bottleneck.                                         |
| **Build Slices**       | Unity Assembly Definitions (.asmdef)           | Improve build times and code organization.        | Utilize Monorepo workspaces (e.g., Yarn/PNPM workspaces) + bundler features (Vite/Turbopack) for incremental builds.            |
| **Editor Tools**       | Godot `@tool` scripts, Unity Custom Inspectors | Automate tasks, provide in-game debugging.        | Leverage tools like Storybook or create custom in-browser editors that import game Blueprints directly. Hot-reloading via Vite. |

## Pattern Impact Ratings (1-5 stars)

Based on their potential impact and usefulness for this project:

1.  **Node Composition** - ★★★★★
    - Foundation of component-based architecture
    - Enables reusable, maintainable code structure
2.  **Blueprint Variant** - ★★★★★
    - Critical for entity variants without code duplication
    - Immense time-saver for content creation
3.  **Signals / Events** - ★★★★★
    - Essential for decoupled system communication
    - Prevents spaghetti code as complexity grows
4.  **Data Assets** - ★★★★★
    - Enables non-programmers to create/edit game content
    - Critical for rapid iteration and content pipeline
5.  **Groups / Tags** - ★★★★☆
    - Powerful for AI, collision handling, and bulk operations
    - More efficient than manual reference tracking
6.  **Editor Tools** - ★★★★☆
    - Dramatically accelerates content creation workflow
    - Reduces friction between code and design
7.  **Input Map** - ★★★★☆
    - Essential for cross-platform/device support
    - Simplifies control scheme changes
8.  **Addressables** - ★★★★☆
    - Critical for performance in larger games
    - Enables dynamic loading strategies
9.  **Singleton / Global** - ★★★☆☆
    - Useful but already well-covered by React Context
    - Implementation is straightforward
10. **Scene Loading** - ★★★☆☆
    - Important for larger worlds/levels
    - Less critical for smaller experiences
11. **Build Slices** - ★★☆☆☆
    - Benefits mainly seen in larger codebases
    - Can be implemented later when needed
12. **ECS (Optional)** - ★★☆☆☆
    - Specialized use case for performance-critical scenarios
    - Complexity may not justify benefits initially

## Workflow Recommendations

1.  **Grey-box First:** Start development using simple geometric shapes for Blueprints. Art assets can be swapped in later without significant code changes.
2.  **Component Responsibility:** Keep Blueprint root components focused on high-level logic and state. Delegate visual representation and specific behaviors to child components.
3.  **Decouple Communication:** Avoid direct function calls or prop drilling between distant Blueprints. Use Signals (events) or Tag-based queries instead.
4.  **Thin Contexts:** Keep React Contexts focused and minimal (e.g., configuration, save/load system, global event bus access). Avoid using Context as a general state bucket.
5.  **Data is King:** Treat external JSON data files as the source of truth for configuration, stats, levels, etc. This allows non-programmers to tweak game balance and content.
6.  **Version Assets:** Use version control for all assets, including models (GLTF) and data (JSON). Consider text-based formats where possible for better diffing (e.g., `gltf-pipeline -t` for GLTF).
7.  **Profile Early:** Use browser developer tools and libraries like Spector.js to monitor rendering performance (draw calls, geometry). Only introduce optimizations like ECS when necessary.

## Implementation Phase Plan

This plan outlines a potential order for implementing these patterns:

### Phase 1: Core Foundation (Est. Weeks 1-3)

- **Goal:** Establish the fundamental building blocks.
- **Patterns:**
  - `Node Composition`: Define core component structure and conventions.
  - `Blueprint Pattern`: Implement the base `Blueprint` factory/component logic.
  - `Signals / Events`: Set up `mitt` event bus and `useSignal` hook. Integrate into core systems.
  - `Singleton / Global`: Define initial React Contexts for essential global state/services (e.g., Input, Game State).

### Phase 2: Content & Interaction (Est. Weeks 4-6)

- **Goal:** Enable content creation and basic interactions.
- **Patterns:**
  - `Blueprint Variant`: Refine and utilize the variant pattern for creating diverse entities.
  - `Data Assets`: Implement `useAsset` hook, Zod validation, and establish the JSON data structure for items, characters, etc.
  - `Input Map`: Implement the `useInput` hook and define the initial action map.
  - `Groups / Tags`: Implement `useTag` and `getNodes` for basic entity querying (e.g., finding all "enemies").

### Phase 3: Scaling & Workflow (Est. Weeks 7-9+)

- **Goal:** Enhance performance, developer workflow, and prepare for larger scale.
- **Patterns:**
  - `Addressables`: Implement the asset manifest and async loading logic.
  - `Editor Tools`: Set up Storybook or a basic custom editor for Blueprint visualization and tweaking.
  - `Scene Loading` (If Needed): Implement strategies for loading/unloading parts of the world.
  - `Build Slices` (If Needed): Explore monorepo structure or bundler optimizations if build times become problematic.
  - `ECS` (If Needed): Evaluate and potentially integrate `bitecs` if profiling reveals performance bottlenecks unsolved by other means.

**Note:** This is a flexible plan. Priorities may shift based on project needs and discoveries during development.

## Consistency Check with `docs/architecture`

This patterns document introduces or formalizes concepts that should be reflected in the existing architecture documentation. Potential areas for review and update include:

- **`ecs.md`**: Consistent regarding ECS (`bitecs`) being an _optional_ optimization, not the default state management. The concept of "Blueprint" should potentially replace or augment the "Entity" discussion where appropriate if we lean heavily on the component model first.
- **`event-system.md`**: Needs to be updated to specifically mention the adoption of `mitt` as the event bus implementation and the `useSignal` hook pattern for subscribing.
- **`state-management.md`**: Should be reviewed to ensure it aligns with using React Context for global singletons/services and potentially mention the `useAsset` hook for loading data assets.
- **`assets.md`**: Needs significant updates to reflect the "Addressables" pattern (manifest, async loading) and the use of Zod for validating JSON data assets.
- **`input.md`**: Should be updated to describe the central `useInput` hook pattern for action mapping.
- **`project-structure.md`**: Should incorporate the "Blueprint" terminology and potentially mention the use of Monorepo workspaces for build optimization if applicable.
- **`core-components.md`**: The concept of Blueprints and component composition should be central here.
- **General**: The term "Blueprint" should be considered for adoption across relevant documents to ensure consistent terminology.

**Note:** These are initial observations. A thorough review of each architecture document is recommended to ensure full alignment with these adopted patterns.
