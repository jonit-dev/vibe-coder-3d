# AI Copilot Architecture & End-to-End Workflow

**⚠️ PLANNED FEATURE - NOT YET IMPLEMENTED**

This document outlines the planned architecture for the AI Copilot within Vibe Coder 3D and the envisioned end-to-end workflow from development to a playable build. This is a future enhancement to the current Unity-like editor.

## Core Principles

- **User in Control:** The AI is an assistant. The user always has the final say and can manually override or modify anything the AI does.
- **Conversational Interface:** Interaction with the AI should be primarily through natural language, making complex operations more intuitive.
- **Context Awareness:** The AI should be aware of the current project, scene, selected objects, and conversation history to provide relevant assistance.
- **Extensibility:** The system should be designed to allow for new AI capabilities and integrations over time.
- **Feedback Loop:** The system should allow users to provide feedback on AI suggestions to help improve the AI over time.

## High-Level Architecture

```mermaid
graph TD
    User[Developer] -->|1. Describes Intent (Text/Voice)| EditorUI[Editor UI (React)]
    EditorUI -->|2. Sends Command to AI Service| AIService[AI Copilot Service (Backend/LLM)]
    AIService -->|3. Parses Command & Queries Engine State| EngineAPI[Engine API (TypeScript)]
    EngineAPI -->|4. Accesses/Modifies| SceneGraph[Scene Graph (ECS - bitecs)]
    EngineAPI -->|4. Accesses/Modifies| AssetDB[Asset Database]
    EngineAPI -->|4. Accesses/Modifies| ProjectFiles[Project Files (Scripts, Configs)]
    EngineAPI -->|5. Returns Structured Data/Confirmation| AIService
    AIService -->|6. Generates Response/Suggestions| EditorUI
    EditorUI -->|7. Displays to User / Applies Changes| User
    User -->|8. Refines/Manually Edits| EditorUI

    subgraph "Vibe Coder 3D Engine (Client-Side)"
        EditorUI
        EngineAPI
        SceneGraph
        AssetDB
        ProjectFiles
        Renderer[Rendering Engine (R3F)]
        Physics[Physics Engine (Rapier)]
    end

    SceneGraph --> Renderer
    SceneGraph --> Physics

    AIService -->|May directly invoke| AssetGeneration[Asset Generation Services (Text-to-3D, etc.)]
    AssetGeneration -->|Generated Assets| AssetDB
```

### Components:

1.  **Editor UI (React + TailwindCSS):**

    - Provides the primary interface for the developer.
    - Includes a dedicated panel for interacting with the AI Copilot (chat interface, suggestion display).
    - Visualizes the 3D scene, hierarchy, inspector, etc.
    - Sends user commands (natural language) to the AI Copilot Service.
    - Receives structured responses or suggestions from the AI and updates the UI/engine state accordingly.

2.  **AI Copilot Service (Backend / LLM Integration):**

    - Could be a dedicated backend service or a direct integration with a Large Language Model (LLM) API (e.g., OpenAI, Claude, Vertex AI).
    - **Natural Language Processing (NLP):** Parses user's natural language input to understand intent.
    - **Command Generation:** Translates user intent into specific, actionable commands for the game engine.
    - **State Management:** Maintains conversation history and context.
    - **Knowledge Base:** May have access to engine documentation, project-specific information, and general game development knowledge.
    - **Suggestion Engine:** Generates suggestions for code, asset creation, scene modifications, etc.
    - Potentially interfaces with external services (e.g., for asset generation).

3.  **Engine API (TypeScript):**

    - A well-defined TypeScript API that exposes engine functionalities to the AI Copilot Service and the Editor UI.
    - Allows for querying and manipulating the scene graph (ECS), assets, project files, and other engine systems.
    - Ensures that changes made by the AI are consistent and valid.
    - Examples of API calls:
      - `createEntity({ components: { transform: { position: [0,1,0] }, mesh: { type: 'sphere', color: 'red' } }})`
      - `updateComponent(entityId, 'material', { roughness: 0.2 })`
      - `findAssetsByType('texture', { keywords: ['wood', 'dark'] })`
      - `generateScriptScaffold('PlayerController', { events: ['onCollision'] })`

4.  **Scene Graph (ECS - `bitecs`):**

    - The core data structure representing the 3D scene and its entities/components.
    - The AI Copilot will primarily interact with the scene by instructing the Engine API to modify this graph.

5.  **Asset Database:**

    - Manages all project assets (models, textures, materials, audio, scripts).
    - The AI should be able to query assets, suggest assets, and potentially trigger the import or generation of new assets.

6.  **Project Files:**

    - Scripts (TypeScript/JavaScript), configuration files, scene definitions.
    - The AI may assist in creating, modifying, or debugging these files.

7.  **Asset Generation Services (External/Integrated):**
    - Third-party APIs or integrated models for generating 3D models, textures, audio, etc., based on AI prompts.
    - The AI Copilot Service would orchestrate calls to these services.

## End-to-End Workflow: Editor to Playable Build

Here's a conceptual flow of how a developer might use the AI-first engine:

1.  **Project Initialization & Setup:**

    - User: "Create a new project for a futuristic racing game."
    - AI: Sets up project structure, installs relevant core packages, suggests initial scene templates, and configures basic lighting.

2.  **Scene Creation & Layout:**

    - User: "Add a long, winding track to the scene."
    - AI: Generates a procedural track mesh or uses pre-built segments. Places it in the scene.
    - User: "Surround the track with neon-lit skyscrapers."
    - AI: (Potentially using asset generation) Creates or sources simple skyscraper models, applies emissive materials, and distributes them along the track.
    - User: "Select the third skyscraper and make it twice as tall."
    - AI: Identifies the object, updates its scale transform via the Engine API.

3.  **Asset Integration & Material Editing:**

    - User: "Find a sports car model and add it to the start line."
    - AI: Searches the Asset Database (or suggests web search/generation). User confirms, AI imports and places the model.
    - User: "Make the car's paint metallic red and a bit scratched."
    - AI: Modifies the car's material properties or suggests appropriate PBR textures.

4.  **Scripting & Behavior Definition:**

    - User: "Make the car drivable with keyboard arrows."
    - AI: Generates a basic character/vehicle controller script (TypeScript) with input handling and physics integration. Attaches it to the car entity.
    - User: "Add an enemy drone that follows the player car but explodes if it gets too close."
    - AI:
      - Helps design the drone's appearance (or generates a simple one).
      - Generates a script for the drone with follow behavior (e.g., using vector math or a simple state machine) and collision detection for the explosion trigger.
      - Suggests explosion particle effects and sound effects.

5.  **UI Elements:**

    - User: "Display the player's speed on the screen."
    - AI: Adds a UI component (React DOM or in-world UI) and a script to update it with the car's current velocity.

6.  **Iteration & Refinement:**

    - The user continuously tests the game in the editor.
    - User: "The drone is too fast, make it 50% slower."
    - AI: Adjusts the speed parameter in the drone's script or relevant component.
    - User manually selects an object and tweaks its material in the inspector panel. The AI observes this and might learn preferences.

7.  **Debugging:**

    - User: "My car falls through the track sometimes."
    - AI: Suggests debugging steps: checking colliders, physics settings, or analyzing console logs. Might offer to highlight colliders visually or log specific physics events.

8.  **Optimization:**

    - User: "The game is running slow when there are many drones."
    - AI: Suggests optimization techniques: object pooling for drones, simplifying drone models or physics, baking lighting, or analyzing performance metrics.

9.  **Building the Game:**

    - User: "Prepare a build of the game for Windows."
    - AI:
      - Initiates the build process.
      - Asks for any build-specific configurations (e.g., version number, icon).
      - Ensures all assets, scripts, and AI-generated content are correctly bundled.
      - Handles any necessary compilation or packaging steps (e.g., using Electron, Tauri, or similar for web tech; or specific steps if targeting other platforms via WebAssembly/native shells).
      - May run pre-build checks or tests.
    - Output: A playable binary (e.g., an `.exe` file or a zipped package).

10. **Post-Build:**
    - User: "The explosion sound is missing in the build."
    - AI: Helps troubleshoot build issues, checking asset bundling logs or build configurations.

## Technical Challenges & Considerations

- **Natural Language Understanding Precision:** Accurately interpreting diverse and potentially ambiguous user commands.
- **Context Management:** Maintaining and utilizing context effectively throughout a development session.
- **Mapping Intent to Engine Actions:** The complexity of translating high-level creative requests into concrete engine operations.
- **AI Model Choice & Cost:** Selecting the right AI models (LLMs, generative models) and managing API costs if using cloud services. Fine-tuning vs. prompt engineering.
- **Determinism vs. Creativity:** Balancing the AI's ability to produce creative results with the need for predictable and controllable behavior.
- **User Interface for AI Interaction:** Designing an intuitive and non-intrusive way for users to communicate with the AI.
- **Preserving User Autonomy:** Ensuring the AI empowers rather than dictates, with clear ways for users to inspect, modify, or reject AI suggestions.
- **Data Security and Privacy:** If cloud-based AI services are used, handling project data securely.
- **Scalability:** Ensuring the AI system can handle complex projects and a growing set of capabilities.
- **Version Control for AI Changes:** How do AI-driven changes interact with traditional version control systems like Git? Changes should ideally be human-readable and diff-able.

This architecture and workflow provide a starting point. It will evolve significantly as development progresses and we gain more insights into the practicalities of building an AI-first game engine.
