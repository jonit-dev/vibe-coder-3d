# Project Roadmap: Vibe Coder 3D - AI-First Game Engine

This document outlines the development roadmap for transforming Vibe Coder 3D into the first truly conversational game engine. Our goal is to enable natural language-driven game development while maintaining the power and flexibility of traditional engines.

> **Status Update (December 2024):** Foundation phase complete. Beginning AI Copilot integration with enhanced timeline and objectives.

**Current Focus: Initiating AI Copilot Core Functionality**

Following the completion of Phase 1, our immediate focus is on implementing the core capabilities for the AI Copilot. This involves starting key tasks from Phase 2, specifically:

- **AI Command Parser:** Developing the system to translate natural language into engine commands.
- **AI Scene Manipulation:** Enabling the AI to create, modify, and manage scene objects.

These tasks are crucial for bringing the conversational game development experience to life. While Phase 2 also includes Physics and ECS integration, the current priority is to establish the AI command and manipulation pipeline. The "enhanced timeline and objectives" mentioned in the status update should be integrated here as details become available.

## Timeline Visualization (Mermaid)

```mermaid
gantt
    title Vibe Coder 3D - AI-First Development Roadmap
    dateFormat  YYYY-MM-DD
    axisFormat %m/%d

    section Phase 1: Foundation & Core AI Research
    Project Setup & Pivot    :p1_setup, 2023-01-01, 7d
    Core Rendering Loop      :p1_render, after p1_setup, 7d
    AI Copilot Tech Spike    :p1_ai_spike, after p1_setup, 14d
    Initial Editor UI        :p1_editor_ui, after p1_render, 14d

    section Phase 2: Physics, ECS & Basic AI Integration
    Rapier Integration       :p2_physics, after p1_render, 14d
    bitecs Integration       :p2_ecs, after p1_render, 14d
    AI Command Parser        :p2_ai_parser, after p1_ai_spike, 21d
    AI Scene Manipulation    :p2_ai_scene, after p2_ai_parser, 21d
    Debug Utilities          :p2_debug, after p2_ecs, 7d

    section Phase 3: AI-Assisted Content & Gameplay
    AI Asset Generation      :p3_ai_assets, after p2_ai_scene, 28d
    AI Scripting Helper      :p3_ai_script, after p2_ai_scene, 28d
    UI & Audio (AI Assisted) :p3_ui_audio, after p2_debug, 14d
    Input & Basic Controls   :p3_input, after p3_ui_audio, 7d
    Character Controller (AI):p3_controller, after p3_input, 14d
    AI-Driven Game Example   :p3_game, after p3_controller, 21d

    section Phase 4: Advanced AI & Multiplayer
    Contextual AI Assistant  :p4_context_ai, after p3_game, 28d
    AI Behavior Trees        :p4_ai_behavior, after p3_game, 28d
    Colyseus Setup           :p4_colyseus, after p3_game, 7d
    Networked AI Agents      :p4_network_ai, after p4_colyseus, 21d

    section Phase 5: Polish & Build Pipeline
    Editor UX Refinement     :p5_editor_ux, after p4_context_ai, 14d
    AI Model Optimization    :p5_ai_opt, after p4_context_ai, 14d
    Binary Build Pipeline    :p5_build, after p5_editor_ux, 21d
    End-to-End Testing       :p5_e2e_test, after p5_build, 14d

    section Future
    Advanced AI Features     :milestone, after p5_e2e_test, 0d
    Community AI Tools       :milestone, after p5_e2e_test, 0d
    Core Library Packaging   :milestone, after p5_e2e_test, 0d
```

## Guiding Principles

- **AI-First, User-Centric:** AI features should enhance, not replace, developer creativity and control.
- **Iterative AI Development:** Build and refine AI capabilities incrementally, based on user feedback and technical feasibility.
- **Core First:** Prioritize the development and stabilization of the `src/core` framework with robust AI integration points.
- **Test Early, Test Often:** Integrate basic testing (unit, integration) from the beginning, including tests for AI interactions.
- **Documentation:** Maintain clear documentation for both engine features and AI Copilot usage.

## Proposed Phases

### Phase 1: Foundation & Core AI Research (Estimated: 2-3 Sprints)

_Goal: Establish the project structure, tooling, basic rendering, and research core AI technologies for the Copilot._

- **Tasks:**
  - Update project documentation to reflect the AI-first pivot (Vision, Goals, Audience). [COMPLETED]
  - Initialize project using Vite + React + TypeScript template (if not already done). [COMPLETED]
  - Set up repository, CI/CD basics (linting, testing hooks). [COMPLETED]
  - Implement the `src/core`, `src/editor`, and `src/game` directory structure. [COMPLETED]
  - Configure Vite, TypeScript (`tsconfig.json`), ESLint, Prettier. [COMPLETED]
  - Install core dependencies: `three`, `react-three-fiber`, `@react-three/drei`, `zustand`. [COMPLETED]
  - Set up basic R3F Canvas and render loop in `src/core`. [COMPLETED]
  - **Technical Spike: AI Copilot Integration:** [COMPLETED]
    - Research and select core AI model/platform (e.g., LLMs like GPT, Claude; open-source alternatives). [COMPLETED]
    - Define initial API for communication between the editor and the AI Copilot. [COMPLETED]
    - Prototype a simple conversational interface in the editor. [COMPLETED]
  - Create a minimal "Hello Cube" scene in `src/game` using the core setup. [COMPLETED]
  - Implement basic camera controls (`OrbitControls` from `drei`). [COMPLETED]
  - Set up basic global state management with Zustand (`src/core/state`). [COMPLETED]
  - Develop initial UI for the editor, including a panel for AI Copilot interaction. [COMPLETED]

### Phase 2: Physics, ECS & Basic AI Integration (Estimated: 3-4 Sprints)

_Goal: Integrate Rapier physics, bitecs ECS, and enable basic AI-driven scene manipulation. **Current priority is on AI command parsing and scene manipulation.**_

- **Tasks:**
  - Install `rapier3d-compat` and `@dimforge/rapier3d-compat`. [LIKELY DONE - Core physics files exist]
  - Install `bitecs`. [LIKELY DONE - Core ECS files exist]
  - Set up Rapier physics world within the R3F loop (`src/core/lib/physics.ts`). [PARTIALLY IMPLEMENTED - `physics.ts` exists]
  - Create core R3F components for rigid bodies (`<PhysicsBody>`) that sync with Rapier (`src/core/components`). [PARTIALLY IMPLEMENTED - `src/core/components/physics/` exists]
  - Implement basic physics stepping and synchronization. [PARTIALLY IMPLEMENTED - `PhysicsSyncSystem.ts` exists]
  - Set up `bitecs` world and basic component types (`src/core/lib/ecs.ts`, `src/core/types`). [SUBSTANTIALLY IMPLEMENTED - Core ECS libs and types exist]
  - Define core ECS components (e.g., `Position`, `Velocity`, `Renderable`, `AIControllable`). [PARTIALLY IMPLEMENTED - `src/core/types/ecs.ts` likely defines many. `AIControllable` might be missing or need review]
  - Create core ECS systems (e.g., `MovementSystem`, `PhysicsSyncSystem`, `AISystem`) (`src/core/systems`). [PARTIALLY IMPLEMENTED - `transformSystem`, `VelocitySystem`, `PhysicsSyncSystem` exist. `AISystem` is a key missing piece for AI control.]
  - **AI Command Parser:** Develop a system to parse natural language commands from the AI Copilot into actionable engine commands (e.g., "create a red sphere at 0,5,0", "make this object bouncy"). **[IMMEDIATE NEXT STEP - No direct evidence of implementation]**
  - **AI Scene Manipulation:** Implement functionality for the AI to: **[IMMEDIATE NEXT STEP - Editor-side foundations exist (hooks, menus), AI-driven part pending Command Parser]**
    - Create, delete, and modify basic geometric primitives.
    - Change properties of existing objects (transform, material, physics properties).
    - Group and parent objects.
  - Develop core hooks for interacting with physics, ECS, and the AI command system (`src/core/hooks`). [SUBSTANTIALLY IMPLEMENTED - Many relevant hooks exist]
  - Refactor the "Hello Cube" example to be controllable via AI commands (`src/game`). [BLOCKED by AI Command Parser & Scene Manipulation]
  - Add basic debug utilities for physics, ECS state, and AI command execution. [PARTIALLY IMPLEMENTED - Debug components and hooks exist]

### Phase 3: AI-Assisted Content & Gameplay (Estimated: 4-5 Sprints)

_Goal: Enable AI to assist with content generation (assets, scripts) and build a simple AI-driven game example._

- **Tasks:**
  - **AI Asset Generation (Proof of Concept):**
    - Integrate with APIs or models for generating simple 3D models (e.g., procedural generation guided by AI, or text-to-3D APIs if available and suitable). [AI part PENDING]
    - Implement AI-assisted material/texture generation or selection (e.g., "make this look like rusty metal"). [AI part PENDING]
    - (Foundation for asset definition and handling in `src/core/types/assets.ts` and `src/core/hooks/useAsset.ts` is STRONG)
  - **AI Scripting Helper:**
    - Design a system where AI can suggest or scaffold basic scripts/behaviors (e.g., "make this object move back and forth", "when player touches this, play a sound"). [PENDING]
    - Explore generating simple JavaScript/TypeScript snippets or visual scripting nodes. [PENDING]
  - Define and implement core camera types, potentially with AI assistance for framing or transitions. [Camera controls exist, AI part PENDING]
  - Integrate `three-mesh-ui` for in-world UI and `howler.js` for audio, with AI helping place/trigger them. [Foundations for UI (`uiStore.ts`, `components/ui`) and Audio (`audio.ts`, `useAudio.ts`) exist. AI part PENDING]
  - Develop core input handling system/hook (`src/core/hooks/useInput.ts`). [IMPLEMENTED - `useInput.ts` exists]
  - Implement asset loading utilities, potentially with AI classifying or suggesting asset usage. [Asset loading utilities exist via `useAsset.ts`, AI part PENDING]
  - Create a simple character controller component, with AI helping to tune parameters or suggest behaviors. [`CharacterController.tsx` exists. AI part PENDING]
  - Build a minimal game example in `src/game` (e.g., AI-designed obstacle course, simple puzzle game) showcasing:
    - AI-generated level layout or elements.
    - Player movement (using core controller).
    - AI-scripted interactions.
    - Basic game state management, potentially with AI suggestions for game logic.
    - AI-assisted UI placement or generation.

### Phase 4: Advanced AI & Multiplayer (Estimated: 4-5 Sprints)

_Goal: Enhance AI capabilities with contextual understanding, behavior authoring, and explore networked AI._

- **Tasks:**
  - **Contextual AI Assistant:** Improve AI Copilot to understand conversation history, current scene selection, and project context for more relevant suggestions.
  - **AI Behavior Trees/State Machines:** Research and implement a system for creating more complex AI agent behaviors, potentially with a visual editor or natural language interface (e.g., "make this enemy patrol between these points and attack if it sees the player").
  - Set up Colyseus server and client library.
  - Implement basic room management and connection handling (`src/core/lib/network.ts`).
  - Define core network components/state synchronization strategy.
  - **Networked AI Agents:** Create examples of AI-controlled characters or entities in a multiplayer context, synchronizing their state and behavior.

### Phase 5: Polish, Build Pipeline & End-to-End Workflow (Estimated: 3-4 Sprints)

_Goal: Refine the editor UX, optimize AI performance, establish a binary build pipeline, and define the full end-to-end workflow from AI-assisted editing to a playable build._

- **Tasks:**
  - **Editor UX Refinement:** Gather user feedback and iterate on the AI Copilot interface, command clarity, and overall editor usability.
  - **AI Model Optimization:** Investigate techniques to optimize AI model performance, reduce latency, and manage costs (if using cloud-based AI).
  - **Binary Build Pipeline:**
    - Research and implement a process to package the game into a playable binary (e.g., using Electron, Tauri, or similar technologies for web-based games, or exploring WebAssembly for native-like performance).
    - Ensure assets, scripts, and AI-generated content are correctly bundled.
    - Define how AI configurations or runtime dependencies are handled in the build.
  - **End-to-End Workflow Definition & Testing:**
    - Document and test the complete process: User describes a game concept to AI -> AI assists in scene creation, asset sourcing, scripting -> User refines and tests in editor -> User initiates build process -> Playable game binary is produced.
    - Conduct thorough testing of the entire pipeline.

### Future Phases

- Advanced Rendering (AI-assisted post-processing, shader generation)
- Advanced AI Systems (Learning agents, procedural content generation beyond simple assets)
- Community AI Tools & Model Sharing
- More Sophisticated Game Examples & Templates
- Performance Optimization Pass for AI and Engine
- Packaging `src/core` as a standalone library with AI hooks
