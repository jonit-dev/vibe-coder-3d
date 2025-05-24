# Project Overview: Vibe Coder 3D - The AI-First Game Engine

## Vision

Vibe Coder 3D is an **AI-first game engine** designed to revolutionize 3D experience creation. It empowers developers by integrating a powerful AI Copilot directly into the engine, enabling intuitive, conversational game development while preserving full user autonomy for fine-grained control. Think of it as **Unity3D meets an intelligent AI assistant.**

Our goal is to make game development more accessible, faster, and more intuitive, allowing creators to focus on their vision by simply describing what they want to achieve.

## Goals

- **Pioneer AI-Driven Development:** Integrate a sophisticated AI Copilot at the core of the engine to assist with all aspects of game creation, from scene design and asset generation to scripting and debugging.
- **Preserve User Autonomy:** Ensure that developers can always intervene, override, or manually adjust any AI-generated content or behavior.
- **Provide a reusable core framework:** Establish a solid, well-structured core (`src/core`) containing essential 3D functionalities (rendering, physics, ECS, basic components) built on React Three Fiber, and augmented by AI capabilities.
- **Enable rapid prototyping and development:** Utilize Vite for fast HMR and React\'s component model for quick iteration, supercharged by AI-assisted workflows.
- **Leverage modern web standards:** Build upon Three.js, WebAssembly (via Rapier), and TypeScript for performance and type safety.
- **Support data-oriented design:** Integrate `bitecs` for efficient Entity Component System management, suitable for complex scenes, with AI assistance for managing entities and components.
- **Be multiplayer-ready:** Include Colyseus in the stack choice, anticipating the need for networked experiences, potentially with AI-driven NPC behaviors.
- **Maintain excellent developer experience (DX):** Focus on clear structure, strong typing, modern tooling, and an intuitive conversational interface with the AI Copilot.

## Target Audience

This project targets web developers, game designers, and creative individuals who want to build 3D applications or games. It's especially suited for:

- Those familiar with React looking to enter 3D development.
- Developers seeking to accelerate their workflow through AI assistance.
- Teams wanting to prototype and iterate on ideas rapidly.
- Individuals who prefer a more intuitive, conversational approach to game engine interaction.

## Core Technology

We utilize a carefully selected stack based on modern, high-performance libraries, with AI at its center:

- **AI Copilot:** [To be defined - placeholder for the core AI model/platform, e.g., OpenAI API, custom-trained models]
- **Rendering:** React Three Fiber (R3F) on top of Three.js
- **Physics:** Rapier.js (via WebAssembly)
- **ECS:** bitecs
- **State:** Zustand
- **UI:** React (DOM) and three-mesh-ui (in-world)
- **Multiplayer:** Colyseus
- **Tooling:** Vite & TypeScript

For more details, see the [Technical Stack](./architecture/technical-stack.md) documentation.

## Architecture

The project follows a separation of concerns, with the AI Copilot interacting across layers:

- **`src/core`:** Contains the reusable, game-agnostic engine/framework code, including AI integration points.
- **`src/editor`:** The development environment where the AI Copilot assists the user.
- **`src/game`:** Contains the specific implementation, assets, and logic for the actual application being built, potentially with AI-generated or AI-assisted content.

This structure promotes modularity and reusability. Refer to the [Project Structure](./architecture/project-structure.md) document for a detailed layout.

## Current Status

_(Placeholder: Add current development stage, e.g., Pivoting to AI-First, Core AI Integration, Alpha)_

## Getting Started

_(Placeholder: Link to a future setup guide, e.g., `docs/setup-guide.md`)_
