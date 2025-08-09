# Vibe Coder 3D Project Overview

## Purpose

Vibe Coder 3D is an AI-first game engine where you can build 3D games by simply describing what you want. It combines React Three Fiber with sophisticated AI to transform natural language into fully functional game experiences.

## Tech Stack

### Core Game Engine

- React Three Fiber (R3F) for 3D rendering
- bitecs Entity Component System (ECS) for scalable game architecture
- Rapier physics engine via WebAssembly (@react-three/rapier)
- Three.js for 3D graphics
- Howler.js for audio management

### Development Stack

- TypeScript for type safety
- React 19.1.0 with hooks-based architecture
- Vite for fast development and building
- Zustand for reactive state management
- Zod for schema validation and runtime type checking

### UI & Styling

- TailwindCSS 4.x for styling
- DaisyUI for component library
- React Icons for iconography
- React Resizable Panels for layout

### Testing & Quality

- Vitest for testing
- ESLint + TypeScript ESLint for linting
- Prettier for code formatting
- Husky + lint-staged for pre-commit hooks

### Additional Libraries

- mitt for event system
- dnd-kit for drag and drop
- styled-components for styled components
- react-router-dom for routing

## Project Status

Currently in Foundation Complete phase, moving toward AI Integration phase. Core engine infrastructure is established with editor capabilities, ECS system with physics integration, and scene manipulation capabilities.
