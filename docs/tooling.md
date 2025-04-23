# Tooling

This document describes the tools and development workflow used for the Vibe Coder 3D engine and associated projects.

## Development Environment

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

## Core Development Workflow

1.  **Code Editing:** Developers use their preferred IDE/editor with TypeScript support (e.g., VS Code).
2.  **Running Dev Server:** Start the Vite development server (`npm run dev` or `yarn dev`).
3.  **Iteration:** Make code changes. Vite HMR automatically updates the running application in the browser without a full page reload.
4.  **Debugging:** Utilize browser developer tools (console, debugger, network inspector) and React/Three.js specific devtools extensions.
5.  **Building for Production:** Run the Vite build command (`npm run build` or `yarn build`) to create optimized assets.

## Editor & Asset Pipeline

- **Optional Visual Editor:** **Rogue Engine**
  - Can be used for visual scene assembly, component configuration, and potentially basic scripting.
  - Offers export to vanilla JS or integration with React, aligning with our R3F stack.
  - _Current Status: Evaluation / Optional Integration. Not a core requirement for engine development itself._
- **Asset Handling:**
  - Models, textures, audio files, etc., are typically imported directly into the project structure.
  - R3F/Drei provide loaders for common formats (e.g., GLTF, JPG, PNG).
  - Specific asset processing or optimization steps might be added to the Vite build process if needed (e.g., texture compression).

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
