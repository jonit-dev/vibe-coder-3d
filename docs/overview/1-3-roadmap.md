# Project Roadmap: Vibe Coder 3D - AI-First Game Engine

This document outlines the development roadmap for transforming Vibe Coder 3D into the first truly conversational game engine. Our goal is to enable natural language-driven game development while maintaining the power and flexibility of traditional engines.

> **Status Update (December 2024):** Foundation phase complete. Beginning AI Copilot integration with enhanced timeline and objectives.

**Current Focus: Entity Hierarchy & Advanced Features**

Following the completion of Phase 1, Phase 2, and significant portions of Phase 3-6, our immediate focus is on completing advanced content creation systems and AI integration. This involves:

- **Advanced Entity Management:** Completing hierarchical entity relationships with full transform inheritance
- **Asset Pipeline Enhancement:** Advanced asset import/export and management systems
- **AI Command Integration:** Expanding AI assistance for scene manipulation and content creation

These systems will provide a comprehensive foundation for AI-driven game development.

## Timeline Visualization (Mermaid)

```mermaid
gantt
    title Vibe Coder 3D - AI-First Development Roadmap
    dateFormat  YYYY-MM-DD
    axisFormat %m/%d

    section Phase 1: Foundation & Core AI Research
    Project Setup & Pivot    :done, p1_setup, 2023-01-01, 7d
    Core Rendering Loop      :done, p1_render, after p1_setup, 7d
    AI Copilot Tech Spike    :done, p1_ai_spike, after p1_setup, 14d
    Initial Editor UI        :done, p1_editor_ui, after p1_render, 14d

    section Phase 2: AI Command System & Core ECS
    Rapier Integration       :done, p2_physics, after p1_render, 14d
    bitecs Integration       :done, p2_ecs, after p1_render, 14d
    AI Command Parser        :done, p2_ai_parser, after p1_ai_spike, 21d
    AI Scene Manipulation    :done, p2_ai_scene, after p2_ai_parser, 21d
    Dynamic Component System :done, p2_dynamic_ecs, after p2_ecs, 7d

    section Phase 3: Entity Management & Hierarchy
    Entity Creation System   :done, p3_entities, after p2_dynamic_ecs, 5d
    Parent-Child Relationships :active, p3_hierarchy, after p3_entities, 7d
    Multi-Entity Selection   :done, p3_selection, after p3_hierarchy, 5d
    Debug & Visualization    :done, p3_debug, after p3_selection, 7d

    section Phase 4: Project & Asset Management
    Project Management System :done, p4_project, after p2_ai_scene, 10d
    Assets Panel & Management :active, p4_assets_panel, after p4_project, 14d
    Project-Editor Sync      :done, p4_sync, after p4_project, 10d
    Asset Import/Export      :done, p4_asset_io, after p4_assets_panel, 7d

    section Phase 5: Core Rendering Systems
    Materials System         :done, p5_materials, after p4_assets_panel, 14d
    Lighting System          :done, p5_lighting, after p5_materials, 14d
    Enhanced Camera System   :done, p5_camera, after p5_lighting, 10d
    Basic Rendering Pipeline :done, p5_rendering, after p5_camera, 7d

    section Phase 6: Advanced Features & Content Creation
    Prefab System            :active, p6_prefabs, after p3_hierarchy, 14d
    AI Asset Generation      :p6_ai_assets, after p5_materials, 21d
    AI Scripting Helper      :p6_ai_script, after p6_prefabs, 21d
    Content Templates        :p6_templates, after p6_ai_assets, 10d

    section Phase 7: UI Integration & Advanced AI
    React Canvas Integration :p7_react_canvas, after p5_rendering, 14d
    UI & Audio Systems       :active, p7_ui_audio, after p7_react_canvas, 14d
    Contextual AI Assistant  :p7_context_ai, after p6_ai_script, 21d
    AI Behavior Trees        :p7_ai_behavior, after p7_context_ai, 21d

    section Phase 8: Gameplay & Networking
    Input & Controls         :done, p8_input, after p7_ui_audio, 7d
    Character Controller     :p8_controller, after p8_input, 10d
    Colyseus Setup           :p8_colyseus, after p8_controller, 7d
    Networked AI Agents      :p8_network_ai, after p8_colyseus, 14d
    Complete Game Example    :p8_game, after p8_network_ai, 21d

    section Phase 9: Polish & Production
    Editor UX Refinement     :p9_editor_ux, after p7_context_ai, 14d
    Performance Optimization :p9_performance, after p8_game, 14d
    Binary Build Pipeline    :p9_build, after p9_editor_ux, 21d
    End-to-End Testing       :p9_e2e_test, after p9_build, 14d

    section Future
    Advanced AI Features     :milestone, after p9_e2e_test, 0d
    Community Tools          :milestone, after p9_e2e_test, 0d
    Core Library Packaging   :milestone, after p9_e2e_test, 0d
```

## Guiding Principles

- **AI-First, User-Centric:** AI features should enhance, not replace, developer creativity and control.
- **Iterative AI Development:** Build and refine AI capabilities incrementally, based on user feedback and technical feasibility.
- **Core First:** Prioritize the development and stabilization of the `src/core` framework with robust AI integration points.
- **Test Early, Test Often:** Integrate basic testing (unit, integration) from the beginning, including tests for AI interactions.
- **Documentation:** Maintain clear documentation for both engine features and AI Copilot usage.

## Refactored Phase Structure

### Phase 1: Foundation & Core AI Research (Estimated: 2-3 Sprints) ✅ COMPLETE

_Goal: Establish the project structure, tooling, basic rendering, and research core AI technologies for the Copilot._

- **Tasks:**
  - ✅ Update project documentation to reflect the AI-first pivot (Vision, Goals, Audience).
  - ✅ Initialize project using Vite + React + TypeScript template.
  - ✅ Set up repository, CI/CD basics (linting, testing hooks).
  - ✅ Implement the `src/core`, `src/editor`, and `src/game` directory structure.
  - ✅ Configure Vite, TypeScript (`tsconfig.json`), ESLint, Prettier.
  - ✅ Install core dependencies: `three`, `react-three-fiber`, `@react-three/drei`, `zustand`.
  - ✅ Set up basic R3F Canvas and render loop in `src/core`.
  - ✅ **Technical Spike: AI Copilot Integration:**
    - ✅ Research and select core AI model/platform.
    - ✅ Define initial API for communication between the editor and the AI Copilot.
    - ✅ Prototype a simple conversational interface in the editor.
    - ✅ Implement comprehensive chat UI with message history and typing indicators.
  - ✅ Create a minimal "Hello Cube" scene in `src/game` using the core setup.
  - ✅ Implement basic camera controls (`OrbitControls` from `drei`).
  - ✅ Set up basic global state management with Zustand (`src/core/state`).
  - ✅ Develop initial UI for the editor, including a panel for AI Copilot interaction.
  - ✅ Implement comprehensive editor layout with resizable panels (Hierarchy, Inspector, Viewport, Chat).

### Phase 2: AI Command System & Core ECS (Estimated: 3-4 Sprints) ✅ COMPLETE

_Goal: Establish the AI command parsing foundation and core ECS/Physics integration to enable AI-driven scene manipulation._

- **Tasks:**

  - ✅ Install `@react-three/rapier` (for Rapier physics) and `bitecs`.
  - ✅ Set up Rapier physics world within the R3F loop (`src/core/lib/physics.ts`).
  - ✅ Create core R3F components for rigid bodies (`<PhysicsBody>`) that sync with Rapier (`src/core/components/physics/`).
  - ✅ Implement basic physics stepping and synchronization (`PhysicsSyncSystem.ts`).
  - ✅ Set up `bitecs` world and basic component types (`src/core/lib/ecs.ts`, `src/core/types/ecs.ts`).
  - ✅ Define core ECS components (e.g., `Position`, `Velocity`, `Renderable`, `AIControllable`).
  - ✅ Create core ECS systems (`transformSystem`, `VelocitySystem`, `PhysicsSyncSystem`, `AISystem`).

  - ✅ **Dynamic Component System:** Implement a flexible system where entities can have components added on demand, including component registry and runtime management.
  - ✅ Develop core hooks for interacting with physics, ECS (`src/core/hooks`).

### Phase 3: Entity Hierarchy & Scene Management (Estimated: 2-3 Sprints) 🔄 IN PROGRESS

_Goal: Build robust entity management with hierarchical relationships and scene organization._

- **Tasks:**
  - ✅ **Entity Creation & Management:**
    - ✅ Create empty entities functionality with command support
    - ✅ Basic entity lifecycle management (create, destroy, clone)
    - ✅ Entity templates and archetype system
  - 🔄 **Parent-Child Relationship System:**
    - 🔄 Implement hierarchical entity relationships with transform inheritance
    - Scene graph management with grouping capabilities
    - Parent-child synchronization for transforms, visibility, and components
  - ✅ **Multi-Entity Selection System:**
    - ✅ Editor support for selecting multiple entities simultaneously
    - ✅ Bulk operations on selected entities (transform, component modification)
  - ✅ **Debug & Visualization Tools:**
    - ✅ Entity hierarchy visualization in editor
    - ✅ Debug utilities for physics, ECS state
    - ✅ Scene graph inspector with real-time updates

### Phase 4: Core Rendering Systems (Estimated: 2-3 Sprints) ✅ COMPLETE

_Goal: Complete the rendering pipeline with materials, lighting, and camera management._

- **Tasks:**
  - ✅ **Materials System:**
    - ✅ PBR material creation and editing interface
    - ✅ Real-time material preview and testing
    - ✅ Material presets and template library
    - ✅ Material library and sharing system
  - ✅ **Enhanced Lighting System:**
    - ✅ Directional, point, and spot light management
    - ✅ Ambient light support
    - ✅ Shadow configuration and optimization
    - ✅ Dynamic lighting controls with inspector UI
    - ✅ Three.js integration with LightRenderer component
    - ✅ Environment lighting and IBL setup
    - ✅ Light entity creation helpers
  - ✅ **Enhanced Camera System:**
    - ✅ Multiple camera types (perspective, orthographic, cinematic)
    - ✅ Camera animation and interpolation systems
    - ✅ Camera positioning and framing tools
    - ✅ Camera presets and templates
  - ✅ **Basic Rendering Pipeline:**
    - ✅ Post-processing effects integration
    - ✅ Render target management
    - ✅ Performance monitoring and optimization

### Phase 5: Input & Basic Interaction (Estimated: 1-2 Sprints) ✅ COMPLETE

_Goal: Implement comprehensive input handling and basic user interaction systems._

- **Tasks:**
  - ✅ **Input & Controls:**
    - ✅ Core input handling system/hook (`src/core/hooks/useInput.ts`)
    - ✅ Customizable input mapping and configuration
  - 🔄 **Character Controller:**
    - Enhanced character controller component
    - Movement systems and physics integration
    - Basic character physics and collision response
  - ✅ **Interaction Systems:**
    - ✅ Object selection and manipulation
    - ✅ Basic UI interaction handling
    - ✅ Input event management and delegation

### Phase 6: Project & Asset Management (Estimated: 3-4 Sprints) 🔄 IN PROGRESS

_Goal: Establish comprehensive project management and asset handling systems._

- **Tasks:**
  - ✅ **Project Management System:**
    - ✅ Project creation and initialization workflows
    - ✅ Project file structure and metadata management
    - ✅ Project templates and configurations
    - ✅ Save/load project state with toast notification system
    - ✅ Scene serialization and persistence
  - ✅ **Assets Panel & Management:**
    - ✅ Visual asset browser with drag-and-drop functionality (use @src/editor/components/shared/AssetLoaderModal.tsx)
    - Asset categorization, tagging, and search
    - Asset recommendations and organization
    - ✅ Asset preview and metadata display
  - ✅ **Project-Editor Synchronization:**
    - ✅ Real-time synchronization between project files and editor state
    - ✅ Auto-save and recovery mechanisms
    - ✅ Toast notification system for operations
  - ✅ **Asset Import/Export Systems:**
    - ✅ Support for common 3D formats (GLB, GLTF, FBX, OBJ)
    - ✅ Basic texture and material import pipelines
    - ✅ Asset optimization and compression
    - ✅ Drag-and-drop asset import interface

### Phase 7: Advanced Content Creation (Estimated: 3-4 Sprints) 🔄 IN PROGRESS

_Goal: Enable advanced content creation with prefabs and reusable systems._

- **Tasks:**
  - 🔄 **Prefab System:**
    - Prefab creation from existing entity hierarchies
    - Prefab instantiation with parameter overrides
    - Prefab suggestions and modifications
    - Prefab versioning and update propagation
  - **Content Templates:**
    - Scene templates and starting points
    - Component and system templates
    - Template recommendations and library
  - 🔄 **UI & Audio Systems:**
    - Integration with `three-mesh-ui` and `howler.js`
    - 3D UI component library
    - ✅ Basic audio system with Howler.js integration
    - Spatial audio management
  - **React Canvas Integration:**
    - System for embedding React components within the 3D scene
    - UI component positioning and interaction in 3D space
    - Integration with existing UI libraries and component systems

### Phase 8: AI Command System & Assistance (Estimated: 4-5 Sprints)

_Goal: Implement comprehensive AI assistance and command processing._

- **Tasks:**
  - **AI Command Parser & Scene Manipulation:**
    - Develop the system to parse natural language commands from the AI Copilot into actionable engine commands
    - Create, delete, and modify basic geometric primitives via AI commands
    - Change properties of existing objects (transform, material, physics properties) through AI
    - Execute batch operations and command sequences
    - AI commands for group selection and manipulation
  - **Contextual AI Assistant:**
    - Conversation history and context awareness
    - Scene selection and project context understanding
    - Proactive suggestions and workflow optimization
  - **AI Asset Generation:**
    - Integration with APIs/models for 3D model generation
    - AI-assisted material/texture generation/selection
    - Procedural content generation with AI guidance
  - **AI Scripting Helper:**
    - System for AI to suggest/scaffold scripts
    - JS/TS snippet generation and visual script nodes
    - Variable passing between editor and runtime scripts
    - Global state management integration with editor

### Phase 9: Networking & Multiplayer (Estimated: 3-4 Sprints)

_Goal: Implement multiplayer capabilities and networked systems._

- **Tasks:**
  - **Colyseus Integration:**
    - Server and client library setup
    - Room management and connection handling
    - Network components and state synchronization
  - **Networked AI Agents:**
    - AI-controlled characters in multiplayer context
    - Synchronized AI behavior and state management
  - **AI Behavior Trees:**
    - System for creating complex AI agent behaviors
    - Visual editor for behavior tree creation
    - Natural language interface for behavior description
  - **Complete Game Example:**
    - Full game showcasing all features
    - End-to-end workflow demonstration

### Phase 10: Polish & Production (Estimated: 3-4 Sprints)

_Goal: Production-ready polish, optimization, and build pipeline._

- **Tasks:**
  - **Editor UX Refinement:**
    - User feedback integration and interface improvements
    - AI Copilot interface optimization
    - Workflow streamlining and usability enhancements
  - **Performance Optimization:**
    - AI model optimization and latency reduction
    - Rendering performance improvements
    - Memory management and asset optimization
  - **Binary Build Pipeline:**
    - Game packaging system (Electron, Tauri, or WebAssembly)
    - Asset bundling and optimization
    - AI configuration handling in builds
  - **End-to-End Testing:**
    - Complete workflow validation
    - Automated testing for AI interactions
    - Performance and reliability testing

### Future Phases

- **Advanced Rendering:** AI-assisted post-processing, shader generation
- **Advanced AI Systems:** Learning agents, procedural content generation
- **Community Tools:** AI model sharing, collaborative features
- **Core Library:** Standalone library packaging with AI hooks
- **Platform Expansion:** Mobile, VR/AR, and console support
