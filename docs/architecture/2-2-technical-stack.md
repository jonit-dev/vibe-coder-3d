# Technical Stack

Based on our research ([Stack Research](../research/3-8-stack-research.md)), we have adopted the **React-centric Stack** for Vibe Coder 3D. This stack leverages the power of React and its ecosystem for building our Unity-like game editor and engine, prioritizing developer experience, modern tooling, and rapid iteration.

## Core Game Engine

Our game engine foundation consists of the following key libraries:

**3D Rendering & Scene Management:**

- **React Three Fiber v8 (R3F)** - Declarative JSX syntax for Three.js scenes with React integration
- **@react-three/drei** - Pre-built components for controls, loaders, gizmos, and common 3D tasks
- **Three.js** - Underlying WebGL rendering engine for high-performance 3D graphics

**Entity Component System:**

- **BitECS** - High-performance, data-oriented ECS with cache-friendly typed arrays (< 6KB)
- **Custom ECS Layer** - TypeScript interfaces and management layer for component operations

**Physics Simulation:**

- **Rapier.js** - High-performance physics engine compiled from Rust to WebAssembly
- **@react-three/rapier** - React integration for physics components and debugging

**State Management:**

- **Zustand** - Lightweight, frame-safe state management for editor and engine state
- **Immer** - Immutable state updates for predictable state mutations

## Editor Interface Technology

**UI Framework & Styling:**

- **React 18** - Component-based UI with TypeScript for type safety
- **Tailwind CSS** - Utility-first CSS framework for rapid, consistent styling
- **Headless UI** - Unstyled, accessible UI primitives for complex editor components

**Editor-Specific Tools:**

- **React Router** - Client-side routing for editor panels and navigation
- **React Hook Form** - Performance forms for component property editing
- **Zod** - Runtime type validation for component schemas and editor data

**3D Editor Controls:**

- **Transform Controls** - Interactive gizmos for object manipulation
- **Orbit Controls** - Camera navigation with pan, zoom, and rotate
- **Selection Outline** - Visual feedback for selected objects

## Development Infrastructure

**Build System & Tooling:**

- **Vite 5** - Lightning-fast development server with Hot Module Replacement
- **TypeScript 5** - Static typing for robust development and better tooling
- **Yarn** - Package management with workspace support for monorepo structure

**Code Quality & Testing:**

- **ESLint** - Code linting with React and TypeScript rules
- **Prettier** - Consistent code formatting across the project
- **Vitest** - Fast unit testing framework with React Testing Library integration

**Asset Pipeline:**

- **GLTF/GLB Support** - Standard 3D model format loading and optimization
- **Texture Loading** - Image asset management with caching and optimization
- **Asset Scanning** - Automatic discovery and metadata generation

## Planned Future Integrations

**AI & Collaboration (Planned):**

- **Language Model APIs** - Integration with OpenAI/Anthropic for AI assistance
- **Yjs** - Real-time collaborative editing with CRDT synchronization
- **WebSocket Provider** - Real-time communication for multiplayer and collaboration

**Extended Platform Support:**

- **Electron/Tauri** - Desktop application packaging for offline development
- **Progressive Web App** - Enhanced web deployment with offline capabilities
- **Mobile Support** - Touch controls and responsive editor interface

## Architecture Benefits

This stack was chosen to support our Unity-like editor vision:

**1. Editor-First Design:**

- React provides familiar component patterns for building complex editor interfaces
- TypeScript ensures type safety across editor and engine boundaries
- Modern tooling enables rapid iteration on editor features

**2. Performance & Scalability:**

- BitECS offers data-oriented performance for complex scenes
- Rapier provides deterministic physics simulation
- R3F minimizes React overhead with frame-loop isolation

**3. Developer Experience:**

- Familiar React/TypeScript development patterns
- Hot module replacement for instant feedback
- Comprehensive type safety and tooling support

**4. Modern Web Platform:**

- Progressive Web App capabilities for offline development
- WebGL-based rendering works across all modern browsers
- Easy deployment without installation requirements

**5. Extensible Architecture:**

- Component-based editor allows for plugin development
- ECS architecture supports custom components and systems
- Modern build tools enable advanced optimization

## Technical Decisions

**Why React Three Fiber over native Three.js?**

- Declarative scene composition fits editor paradigms
- React DevTools integration for debugging
- Ecosystem of pre-built components and helpers

**Why BitECS over alternatives?**

- Minimal bundle size (< 6KB) with maximum performance
- Cache-friendly data layout for complex scenes
- TypeScript integration for editor tooling

**Why Zustand over Redux?**

- Minimal boilerplate for rapid development
- Frame-safe for 3D rendering contexts
- Simple integration with React components

**Why Vite over Webpack?**

- Significantly faster development server startup
- Native ES modules support for modern development
- Optimized production builds with Rollup

By standardizing on this modern, React-centric stack, we achieve a balance of familiar development patterns, high performance, and future extensibility for both editor and runtime needs.
