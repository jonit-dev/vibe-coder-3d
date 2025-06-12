# Project Overview: Vibe Coder 3D - Unity-like Game Editor/Engine

## Vision

Vibe Coder 3D is a **Unity-like game editor and engine** built with modern web technologies, designed to provide a powerful, browser-based game development environment. It combines the familiar workflow of Unity's editor with the performance and flexibility of React Three Fiber, offering both visual editing tools and a robust runtime engine for 3D game development.

Our mission is to create a professional-grade game development platform that leverages web technologies to enable rapid prototyping, collaborative development, and seamless deployment across platforms, with planned AI-assisted features to enhance the development experience.

## Goals

- **Unity-like Editor Experience:** Provide a familiar game development interface with hierarchy panels, inspector views, and visual scene editing tools.
- **Professional 3D Development:** Enable creation of high-quality 3D games and experiences using modern web technologies and performant rendering.
- **Component-based Architecture:** Implement a robust Entity Component System (ECS) for scalable, maintainable game development.
- **Visual Development Tools:** Offer intuitive scene editing, asset management, and property manipulation through a comprehensive editor interface.
- **Modern Web Stack:** Build on proven technologies like React Three Fiber, BitECS, Rapier physics, and TypeScript for reliable development.
- **Cross-platform Deployment:** Support game deployment across web, desktop, and mobile platforms through modern build tools.
- **Extensible Architecture:** Design a plugin-friendly system that allows for custom components, tools, and workflow extensions.
- **Planned AI Integration:** Future AI-assisted development features to accelerate common development tasks while preserving full developer control.

## Target Audience

This Unity-like editor serves game developers and 3D content creators who want a powerful, web-based development environment:

**Primary Audiences:**

- **Indie Game Developers:** Solo developers and small teams creating 3D games who need professional-grade tools without complex setup
- **Web Developers:** React/TypeScript developers looking to enter 3D game development with familiar technologies
- **Rapid Prototypers:** Developers who need to quickly create and iterate on 3D game concepts and demos
- **Educational Users:** Students and teachers learning 3D game development with modern, accessible tools

**Secondary Audiences:**

- **Game Studios:** Teams looking for browser-based collaborative development tools and rapid prototyping capabilities
- **Creative Professionals:** Artists and designers who want to create interactive 3D experiences with visual editing tools
- **Technical Artists:** Professionals bridging the gap between art and programming who need flexible, customizable workflows

## Core Technology

Our Unity-like editor is built on modern web technologies and proven game development libraries:

**Game Engine Foundation:**

- **Rendering:** React Three Fiber (R3F) built on Three.js for high-performance 3D graphics and WebGL rendering
- **Physics:** Rapier.js via WebAssembly for realistic physics simulation and collision detection
- **Entity Component System:** BitECS for scalable, data-oriented game architecture with excellent performance
- **State Management:** Zustand for reactive, predictable application state management
- **Asset Pipeline:** Optimized loading and processing of GLTF/GLB models, textures, and audio assets

**Editor Interface:**

- **UI Framework:** React with TypeScript for type-safe, component-based editor interface development
- **Styling:** Tailwind CSS for rapid, consistent UI development with utility-first approach
- **3D Controls:** React Three Drei for interactive 3D controls, gizmos, and camera management
- **Forms & Validation:** Type-safe component property editing with real-time validation

**Development Infrastructure:**

- **Build System:** Vite for lightning-fast development server and optimized production builds
- **Package Management:** Yarn for reliable dependency management and workspace support
- **Testing:** Vitest for unit testing with React Testing Library for component testing
- **Code Quality:** ESLint and Prettier for consistent code formatting and quality enforcement

**Planned Integrations:**

- **AI Assistance:** Future integration with language models for development assistance
- **Collaboration:** Planned Yjs integration for real-time collaborative editing
- **Deployment:** Multi-platform build targets for web, desktop (Electron/Tauri), and mobile

For detailed technical specifications, see the [Technical Stack](../architecture/2-2-technical-stack.md) and [Project Structure](../architecture/2-3-project-structure.md) documentation.

## Architecture

The editor follows a Unity-like architecture with clear separation between the core engine and development tools:

**Core Layers:**

- **`src/core`:** Game engine foundation with ECS, physics, rendering, and asset management systems
- **`src/editor`:** Unity-like development environment with hierarchy, inspector, and viewport panels
- **`src/config`:** Application configuration and asset metadata management
- **`src/utils`:** Shared utilities for math operations, validation, and helper functions

**Editor Interface:**

- **Hierarchy Panel:** Scene tree view for organizing and managing game objects with parent-child relationships
- **Inspector Panel:** Component property editor with type-safe forms and real-time validation
- **Viewport Panel:** Interactive 3D scene view with gizmos, selection tools, and camera controls
- **Asset Management:** Drag-and-drop asset loading with automatic optimization and integration

**Development Workflow:**

- **Scene System:** Visual scene composition with save/load functionality and version control support
- **Component System:** Extensible ECS architecture with visual component editing and custom component creation
- **Build Pipeline:** Optimized builds for multiple deployment targets with asset bundling and optimization

This architecture provides a familiar Unity-like development experience while leveraging modern web technologies. See the [Project Structure](../architecture/2-3-project-structure.md) for detailed organization and [Game Editor Architecture](../architecture/2-6-game-editor.md) for editor-specific design.

## Current Status

**Phase: Core Editor Functionality** (January 2025)

- ✅ **Core Engine Infrastructure:** React Three Fiber, BitECS, Rapier physics, and Zustand state management fully implemented
- ✅ **Unity-like Editor Interface:** Complete hierarchy panel, inspector panel, and 3D viewport with gizmos and selection tools
- ✅ **Component System:** Full ECS implementation with visual component editing, Transform, MeshRenderer, RigidBody, and Camera components
- ✅ **Asset Pipeline:** GLTF/GLB loading, texture management, and asset integration with the editor
- ✅ **Scene Management:** Save/load functionality, entity creation/deletion, and scene hierarchy management
- 🚧 **Advanced Features:** Physics debugging, custom geometry creation, and material editing systems
- ⏳ **Planned:** AI integration, collaboration features, and enhanced build pipeline

**Immediate Priorities:**

1. Enhanced physics debugging and visualization tools
2. Custom material and shader system integration
3. Advanced asset management and optimization
4. Performance profiling and optimization tools

## Getting Started

**For Developers:**

```bash
# Clone and setup
git clone <repository-url>
cd vibe-coder-3d
yarn install
yarn dev
```

**For Contributors:**

- Review the [Game Editor Architecture](../architecture/2-6-game-editor.md) for editor development focus
- Check [Core Abstractions](../architecture/2-1-core-abstractions.md) for engine architecture
- See [Implementation Guides](../implementation/) for current development tasks
- Read [Adding New Shapes Guide](../implementation/adding-new-shapes-guide.md) for extending the editor

**For Game Developers:**
The editor provides a Unity-like interface for 3D game development in the browser. Use the hierarchy panel to organize your scene, the inspector to configure components, and the viewport for visual editing. The editor supports standard game development workflows with modern web deployment.

## 🔗 Related Documentation

### Next Steps

- **[Getting Started](./1-4-getting-started.md)** - Set up your development environment
- **[Roadmap](./1-3-roadmap.md)** - See the development timeline and planned features
- **[Technical Stack](../architecture/2-2-technical-stack.md)** - Learn about our technology choices

### Architecture Deep Dive

- **[Game Editor Architecture](../architecture/2-6-game-editor.md)** - Unity-like editor design
- **[Core Abstractions](../architecture/2-1-core-abstractions.md)** - Engine foundation
- **[ECS System](../architecture/2-4-ecs-system.md)** - Entity Component System implementation
- **[Project Structure](../architecture/2-3-project-structure.md)** - Codebase organization

### Development Guides

- **[Adding New Shapes](../implementation/adding-new-shapes-guide.md)** - Extend the editor with custom geometry
- **[Implementation Status](../implementation/)** - Current development progress
- **[Documentation Navigation](../0-navigation.md)** - Find your way around the docs
