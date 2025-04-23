# Project Structure

This document outlines the standard folder structure for the Vibe Coder 3D project. We follow conventions common in Vite + React + TypeScript projects to ensure consistency and maintainability.

```
vibe-coder-3d/
├── public/              # Static assets directly served (e.g., favicons, robots.txt)
├── src/                 # Main application source code
│   ├── core/            # Reusable core engine/framework code
│   │   ├── assets/      # Core assets (e.g., default materials, shaders)
│   │   ├── components/  # Core R3F components (e.g., PhysicsBody, PlayerController)
│   │   ├── hooks/       # Core hooks (e.g., usePhysics, useECSQuery)
│   │   ├── lib/         # Core utilities (math, physics helpers, ECS setup)
│   │   ├── systems/     # Core ECS systems (movement, basic AI)
│   │   ├── state/       # Core state management (e.g., engine settings store)
│   │   └── types/       # Core type definitions
│   ├── game/            # Game-specific implementation
│   │   ├── assets/      # Game-specific assets (models, textures, sounds)
│   │   ├── components/  # Game-specific components (UI, world objects)
│   │   │   ├── ui/      # Game UI components
│   │   │   └── world/   # Game world components
│   │   ├── hooks/       # Game-specific hooks
│   │   ├── systems/     # Game-specific ECS systems (quest logic, scoring)
│   │   ├── scenes/      # Definitions for different game levels or scenes
│   │   ├── state/       # Game-specific state (player progress, game status)
│   │   └── config/      # Game configuration files (levels, items)
│   ├── styles/          # Global styles, themes (shared between core/game if needed)
│   ├── App.tsx          # Root React application component (integrates core + game)
│   └── main.tsx         # Application entry point
├── docs/                # Project documentation (Markdown files)
│   ├── architecture/    # Architectural decisions and diagrams
│   └── research/        # Initial research documents
├── .env                 # Environment variables (local, untracked)
├── .env.example         # Example environment variables
├── .gitignore           # Specifies intentionally untracked files git should ignore
├── index.html           # Main HTML entry point (Vite injects scripts here)
├── package.json         # Project metadata and dependencies
├── tsconfig.json        # TypeScript compiler options
├── tsconfig.node.json   # TypeScript config for Node.js context (e.g., Vite config)
└── vite.config.ts       # Vite build tool configuration
```

## Key Directory Explanations

- **`public/`**: Files in this directory are served at the root path during development and copied to the root of the build output directory as-is. Use this for assets that must retain their exact filename or path structure (like `favicon.ico`).
- **`src/`**: Contains all the source code that is processed by Vite. This is where most of the development happens.
  - **`core/`**: Houses the reusable 3D game framework/engine code. This should be designed to be potentially extractable into a separate package later. It contains the foundational elements built upon our chosen stack (R3F, Rapier, bitecs, etc.).
    - `assets/`: Default or common assets used by the core engine.
    - `components/`: Generic, reusable R3F components forming the engine's building blocks.
    - `hooks/`: Core React hooks providing access to engine functionalities.
    - `lib/`: Core utility functions, classes, and setup logic for libraries like ECS or physics.
    - `systems/`: Fundamental ECS systems required for basic engine operation.
    - `state/`: Zustand stores for managing the engine's internal state or configuration.
    - `types/`: Shared TypeScript types specifically for the core engine API.
  - **`game/`**: Contains the specific implementation logic, assets, and configuration for _this particular game_ built using the `core` engine.
    - `assets/`: Assets unique to this game (character models, level textures, game sounds).
    - `components/`: Game-specific React components, both for UI (`ui/`) and the 3D world (`world/`), often composing `core` components.
    - `hooks/`: Custom hooks specific to the game's logic or state management.
    - `systems/`: ECS systems that implement game-specific rules and behaviors.
    - `scenes/`: Components or configurations defining different game levels, areas, or states.
    - `state/`: Zustand stores for managing game-specific state (e.g., score, inventory, quest status).
    - `config/`: Configuration files defining game parameters, level layouts, item stats, etc.
  - **`styles/`**: Global CSS, themes, or styles potentially shared across `core` and `game`.
  - **`App.tsx`**: The main application component that initializes the `core` engine and mounts the `game` logic and UI.
  - **`main.tsx`**: The absolute entry point, responsible for rendering the `App` component into the DOM.
- **`docs/`**: All project-related documentation, including architectural decisions, setup guides, and research findings.
- **Root Configuration Files**: Files like `package.json`, `vite.config.ts`, `tsconfig.json`, and `.gitignore` configure the project's dependencies, build process, TypeScript compilation, and version control behavior.
