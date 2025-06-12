# Project Structure

This document outlines the current folder structure for the Vibe Coder 3D project - a Unity-like Game Editor/Engine built with Vite + React + TypeScript.

```
vibe-coder-3d/
├── public/              # Static assets directly served
│   ├── assets/          # Game assets (models, textures, skyboxes)
│   │   ├── models/      # 3D models (.glb files)
│   │   ├── skyboxes/    # Environment skybox textures
│   │   └── textures/    # Material textures
│   └── favicon.svg      # Application favicon
├── src/                 # Main application source code
│   ├── core/            # Core game engine framework
│   │   ├── components/  # Core R3F components (cameras, lighting, physics)
│   │   ├── configs/     # Engine configuration files
│   │   ├── engine/      # Core engine systems
│   │   ├── hooks/       # Core engine hooks (ECS, assets, input)
│   │   ├── lib/         # Core utilities and ECS system
│   │   │   ├── ecs/     # Entity Component System implementation
│   │   │   └── ...      # Math, physics, validation utilities
│   │   ├── state/       # Core engine state management
│   │   ├── stores/      # Zustand stores for UI and engine state
│   │   ├── systems/     # Core ECS systems (camera, physics, rendering)
│   │   └── types/       # Core type definitions
│   ├── editor/          # Unity-like Editor Interface
│   │   ├── components/  # Editor UI components
│   │   │   ├── chat/    # AI chat interface (planned)
│   │   │   ├── forms/   # Entity/component editing forms
│   │   │   ├── inspector/ # Inspector panel (component properties)
│   │   │   ├── layout/  # Editor layout components
│   │   │   ├── menus/   # Context menus and dropdowns
│   │   │   ├── panels/  # Main editor panels
│   │   │   │   ├── HierarchyPanel/  # Scene hierarchy tree
│   │   │   │   ├── InspectorPanel/  # Component inspector
│   │   │   │   └── ViewportPanel/   # 3D scene viewport
│   │   │   ├── physics/ # Physics debugging tools
│   │   │   └── shared/  # Reusable UI components
│   │   ├── data/        # Editor configuration and scene data
│   │   ├── hooks/       # Editor-specific hooks
│   │   ├── store/       # Editor state management
│   │   └── types/       # Editor type definitions
│   ├── config/          # Application configuration
│   ├── styles/          # Global styles and themes
│   ├── test/            # Testing utilities and setup
│   ├── utils/           # General utility functions
│   ├── App.tsx          # Root application component (loads Editor)
│   └── main.tsx         # Application entry point
├── docs/                # Comprehensive project documentation
│   ├── architecture/    # Technical architecture docs
│   ├── implementation/  # Implementation guides and status
│   ├── overview/        # Project vision and getting started
│   ├── patterns/        # Design patterns and best practices
│   ├── performance/     # Performance analysis and optimization
│   ├── research/        # Technical research and investigations
│   └── refactoring/     # Code improvement plans
├── __tests__/           # Test files
├── Configuration Files
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configuration
├── vitest.config.ts     # Vitest testing configuration
└── tailwind.config.js   # Tailwind CSS configuration
```

## Key Directory Explanations

### Core Architecture

- **`public/`**: Static assets served directly by Vite. Contains game assets like 3D models, textures, and skyboxes that can be referenced by URL in the editor and runtime.

- **`src/core/`**: The foundational game engine framework built on R3F, Rapier, and BitECS. This layer provides the runtime capabilities for games created in the editor.
  - `components/`: Core R3F components for cameras, lighting, physics bodies, and UI systems
  - `hooks/`: Engine hooks for ECS operations, asset loading, input handling, and game loop management
  - `lib/ecs/`: Complete Entity Component System implementation with BitECS integration
  - `systems/`: Core ECS systems for camera management, physics synchronization, and rendering
  - `state/` & `stores/`: Zustand-based state management for engine configuration and UI state

### Editor Architecture (Unity-like)

- **`src/editor/`**: Complete game development environment similar to Unity's editor interface.
  - `components/panels/`: Main editor interface panels
    - **HierarchyPanel**: Scene tree view for organizing game objects
    - **InspectorPanel**: Component property editor with type-safe forms
    - **ViewportPanel**: Interactive 3D scene view with gizmos and selection tools
  - `components/shared/`: Reusable UI components (modals, forms, color pickers, etc.)
  - `hooks/`: Editor-specific functionality (entity creation, selection management, scene operations)
  - `store/`: Editor state management separate from engine state

### Development Workflow

- **`src/config/`**: Application configuration including asset metadata and engine settings
- **`src/utils/`**: General utilities for math operations, asset scanning, and helper functions
- **`docs/`**: Comprehensive documentation covering architecture, implementation guides, and research
- **`__tests__/`**: Testing infrastructure with utilities for component and integration testing

### Build Configuration

- **Configuration Files**: TypeScript, Vite, Vitest, Tailwind, and ESLint configurations for development workflow
- **Package Management**: Yarn-based dependency management with development and production builds

## Architecture Philosophy

### Unity-like Development Model

The project follows a Unity-inspired architecture where:

1. **Core Engine** provides runtime capabilities (physics, rendering, ECS)
2. **Editor Interface** provides visual development tools
3. **Scene System** manages game objects and components
4. **Asset Pipeline** handles 3D models, textures, and resources
5. **Component-based** entity customization through the inspector

### Development vs Runtime Separation

- **Development Time**: Full editor interface with panels, gizmos, and development tools
- **Runtime**: Lightweight core engine that can run games built in the editor
- **Asset Management**: Public assets accessible to both editor and runtime
- **State Management**: Clear separation between editor state and game state

### Future Extensibility

The structure is designed to support:

- **AI-powered development tools** (chat interface placeholder exists)
- **Plugin system** for custom editor panels and components
- **Build pipeline** for packaging games for different platforms
- **Collaborative editing** through the documented Yjs integration plan
