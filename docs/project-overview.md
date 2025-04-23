# Project Overview: Vibe Coder 3D

## Vision

Vibe Coder 3D aims to be a modern, developer-friendly foundation for creating 3D experiences, games, and interactive applications on the web. It prioritizes a rapid development workflow, leveraging the strengths of the React ecosystem combined with powerful, modern web technologies for 3D rendering, physics, and data management.

## Goals

- **Provide a reusable core framework:** Establish a solid, well-structured core (`src/core`) containing essential 3D functionalities (rendering, physics, ECS, basic components) built on React Three Fiber.
- **Enable rapid prototyping and development:** Utilize Vite for fast HMR and React's component model for quick iteration on both UI and 3D scenes.
- **Leverage modern web standards:** Build upon Three.js, WebAssembly (via Rapier), and TypeScript for performance and type safety.
- **Support data-oriented design:** Integrate `bitecs` for efficient Entity Component System management, suitable for complex scenes.
- **Be multiplayer-ready:** Include Colyseus in the stack choice, anticipating the need for networked experiences.
- **Maintain excellent developer experience (DX):** Focus on clear structure, strong typing, and modern tooling.

## Target Audience

This project primarily targets web developers, especially those familiar with React, who want to build 3D applications or games without the steep learning curve of traditional game engines or the complexities of raw WebGL/Three.js setup.

## Core Technology

We utilize a carefully selected stack based on modern, high-performance libraries:

- **Rendering:** React Three Fiber (R3F) on top of Three.js
- **Physics:** Rapier.js (via WebAssembly)
- **ECS:** bitecs
- **State:** Zustand
- **UI:** React (DOM) and three-mesh-ui (in-world)
- **Multiplayer:** Colyseus
- **Tooling:** Vite & TypeScript

For more details, see the [Technical Stack](./architecture/technical-stack.md) documentation.

## Architecture

The project follows a separation of concerns:

- **`src/core`:** Contains the reusable, game-agnostic engine/framework code.
- **`src/game`:** Contains the specific implementation, assets, and logic for the actual application being built.

This structure promotes modularity and reusability. Refer to the [Project Structure](./architecture/project-structure.md) document for a detailed layout.

## Current Status

_(Placeholder: Add current development stage, e.g., Initial Setup, Core Development, Alpha)_

## Getting Started

_(Placeholder: Link to a future setup guide, e.g., `docs/setup-guide.md`)_
