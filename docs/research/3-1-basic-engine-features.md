# Basic Engine Features for Vibe Coder 3D

This document outlines the basic features identified as necessary to get the Vibe Coder 3D game engine up and running in its initial, usable form, with a focus on enabling the AI-first vision.

## Core Feature Set

To achieve a functional baseline, the following features are prioritized:

1.  **Core Rendering:**

    - Ability to display basic 3D primitives (e.g., cubes, spheres).
    - Support for importing and rendering GLTF models.
    - (Leverages React Three Fiber as per existing technical stack).

2.  **Scene Management:**

    - Implementation of a simple scene graph or hierarchy.
    - Functionality to add, remove, and select objects within the scene.

3.  **Entity Component System (ECS):**

    - Utilize the chosen `bitecs` library.
    - Define core components (e.g., `Position`, `Rotation`, `Scale`, `MeshRenderer`).
    - Enable entity creation and component attachment/detachment.
    - Develop basic systems to process these components (e.g., a `RenderSystem`).

4.  **Basic Physics:**

    - Integrate `Rapier.js` for physics simulation.
    - Enable application of rigid body physics to entities.
    - Implement basic collision detection.

5.  **Editor UI Shell (Initial Version):**

    - A 3D viewport for scene visualization.
    - A hierarchy panel to display the list of scene objects.
    - An inspector panel for viewing and editing basic properties of selected objects (e.g., transform: position, rotation, scale).

6.  **AI Command Interface (Rudimentary):**

    - A text input field within the editor for users to type basic commands.
    - Initial Natural Language Processing (NLP) to map a limited set of hardcoded commands to engine actions.
      - Example: "create a cube" → engine creates an entity with a cube mesh and default transform.
    - This serves as the foundational step for the AI Copilot.

7.  **Asset Management (Basic):**
    - Ability to import a GLTF model.
    - Mechanism for the imported model to appear in the scene, either via an AI command or a simple UI action.

These features align with the "Phase 1: Foundation & Planning Complete" and "Immediate Priorities" sections of the `project-overview.md`, establishing the groundwork for the AI-driven development workflow.
