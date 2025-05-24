# Tooling

This document describes the tools and development workflow used for the Vibe Coder 3D AI-First game engine and associated projects. The **AI Copilot** is a central piece of our tooling strategy.

## Development Environment

- **AI Copilot:** The primary interface for interacting with the engine. Developers use natural language to instruct the AI to perform tasks such as scene creation, asset manipulation, script generation, and debugging.
  - Integrated directly into the Vibe Coder 3D Editor.
  - Provides conversational feedback, suggestions, and can execute commands.
- **Vibe Coder 3D Editor:** A web-based editor built with React and Vite, providing:
  - Visual viewport of the 3D scene.
  - Hierarchy panel for scene objects.
  - Inspector panel for entity components and properties.
  - The AI Copilot interaction panel.
  - Traditional manual controls for users who prefer direct manipulation or need to fine-tune AI-generated results.
- **Build System:** **Vite 5**
  - Provides an extremely fast development server with Hot Module Replacement (HMR) for rapid feedback during development.
  - Handles optimized production builds (bundling, minification, tree-shaking).
  - Configuration managed via `vite.config.ts`.
- **Language:** **TypeScript 5**
  - Used for all engine and game logic code.
  - Provides static typing for improved code safety, maintainability, and developer tooling (autocompletion, refactoring).
  - Configuration managed via `tsconfig.json`.
- **Package Manager:** (Assuming NPM or Yarn - _Needs Confirmation_)
  - Manages project dependencies defined in `package.json`.

## Core Development Workflow with AI Copilot

1.  **Conceptualization & Description:** Developer describes their game idea, scene, or desired functionality to the AI Copilot in natural language within the Vibe Coder 3D Editor.
2.  **AI-Assisted Creation:** The AI Copilot translates the description into engine actions:
    - Generates/modifies scene graph entities and components.
    - Suggests or generates assets (models, materials, textures) or helps find existing ones.
    - Scaffolds or writes scripts (TypeScript) for behaviors and logic.
    - Configures physics, UI elements, audio, etc.
3.  **Real-time Visualization:** The editor provides immediate visual feedback in the 3D viewport as the AI makes changes.
4.  **Iteration & Refinement (User + AI):**
    - Developer observes the results and provides further instructions to the AI for modifications ("Make that cube blue," "Add a bounce component to this sphere").
    - Developer can directly use editor panels (inspector, hierarchy) to manually tweak properties or objects. The AI can observe these manual changes to learn preferences or offer contextual help.
5.  **AI-Assisted Debugging:** If issues arise, the developer can ask the AI for help ("Why is my character falling through the floor?"). The AI analyzes the scene, relevant scripts, and physics state to provide diagnostics and potential solutions.
6.  **Running Dev Server:** The Vite development server (`yarn dev`) is running in the background, powering the editor and enabling HMR for any manually edited scripts or UI components.
7.  **Building for Production (AI-Assisted):** Developer instructs the AI to prepare a build ("Build the game for web deployment"). The AI orchestrates the Vite build process, ensuring all assets and AI-generated content are included.

## Editor & Asset Pipeline with AI

- **Vibe Coder 3D Editor with Integrated AI Copilot:** This is the primary tool. There is no reliance on external visual editors like Rogue Engine, as the AI facilitates visual and logical assembly through conversation and direct engine manipulation.
- **AI-Driven Asset Handling:**
  - The AI Copilot can interface with asset generation tools (e.g., text-to-3D, procedural generators) or search asset libraries based on user descriptions.
  - Assets are managed within the project structure, with the AI assisting in their import, organization, and application.
  - R3F/Drei loaders are used under the hood, potentially invoked by AI-generated code or commands.

## Debugging & Profiling Tools

- **Browser DevTools:** Standard Chrome/Firefox developer tools are the first line of defense.
- **React DevTools:** Browser extension for inspecting the React component hierarchy and state.
- **Three.js DevTools:** Browser extension for inspecting the Three.js scene graph, materials, textures, etc.
- **@react-three/drei `Stats`:** Component for displaying real-time performance metrics (FPS, memory).
- **Vite Analyze Plugin (Optional):** Can be added to visualize bundle sizes.

## Future Considerations

- Development of custom editor tools built with React/Web technologies if Rogue Engine proves insufficient or too restrictive.
- More sophisticated asset pipeline/management system if project scale demands it.
- Integration of automated testing tools (e.g., Vitest, Playwright).
- Standardized logging framework.
