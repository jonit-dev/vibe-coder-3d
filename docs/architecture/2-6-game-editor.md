# Web-Based Three-js / React-Three-Fiber Game Editor

_Updated 26 Apr 2025_

---

## 1 Mission & Scope

Build a **browser-native visual editor** that lets designers and developers assemble and tweak 3-D scenes, game-play logic and assets for an R3F-powered game runtime with immedi\xadate WYSIWYG feedback.

> **Why now?** Community tools such as the original _three.js editor_, _Babylon Inspector_, _Lewcid_ and _ThreeStudio_ prove that performant, single-page editors are viable; we will borrow their patterns while keeping the stack 100 % React/TypeScript.

---

## 2 Guiding Principles

| ID   | Principle                     | Implication                                                                            |
| ---- | ----------------------------- | -------------------------------------------------------------------------------------- |
| P-01 | **Everything is a component** | Mirror the game ECS so that editor → runtime is loss-less.                             |
| P-02 | **Instant feedback**          | All property changes patch the live Zustand store → React re-renders → R3F reconciles. |
| P-03 | **Small, flat state**         | Use a lean store (Zustand + Immer) to avoid render storms; no Redux boiler-plate.      |
| P-04 | **Pluggable panels**          | Golden-Layout style docking; panels register, persist layout, hot-reload in dev.       |
| P-05 | **Opt-in collaboration**      | When Yjs provider is active, all JSON patches are CRDT-merged.                         |

---

## 3 Technical Stack

| Concern    | Lib / Tool                                   | Notes                                                 |
| ---------- | -------------------------------------------- | ----------------------------------------------------- |
| Framework  | **React 18**                                 | Functional components, hooks.                         |
| Renderer   | **@react-three/fiber**                       | Thin React bridge over three.js.                      |
| Helpers    | **@react-three/drei**                        | OrbitControls, TransformControls, GizmoHelper, etc.   |
| GUI        | **leva**                                     | Auto-generates Inspector controls from plain objects. |
| State      | **Zustand + Immer**                          | Central scene graph + UI state.                       |
| ECS        | Thin wrapper over **bitecs** style functions | Runtime speed & tiny bundle.                          |
| Docking UI | **Golden-Layout 2**                          | Detachable / resizable / persist-to-JSON.             |
| Collab     | **Yjs** + websocket provider                 | Optional multi-user editing.                          |
| Build      | **Vite + pnpm workspaces**                   | Shared code between _engine_ and _editor_.            |
| Lint / Fmt | **eslint, prettier, typescript-eslint**      | Consistent code-base.                                 |

---

## 4 High-Level Architecture

```
┌─────────────┐   Pub/Sub   ┌─────────────┐
│  Hierarchy  │◀──────────▶│  SceneStore │◀── ECS Systems & R3F Canvas
├─────────────┤            └─────────────┘
│  Inspector  │
├─────────────┤            ┌─────────────┐
│  Viewport   │──────────▶ │   Runtime   │
└─────────────┘            └─────────────┘
```

- **SceneStore** (Zustand) is the single source of truth and serializes to JSON.
- Panels subscribe to slices and fire actions; no panel talks to another directly.
- Runtime hooks (`useFrame`, physics ticks) read the same store—no bridging code.

---

## 5 Current Functionality

The editor currently provides the following core features:

- **Scene Viewport:** Displays the 3D scene using `@react-three/fiber`. Includes basic camera controls (`OrbitControls`) and visual helpers (`GizmoHelper`, Grid).
- **Hierarchy Panel:** Lists entities present in the scene. Allows selecting entities. (Basic implementation, tree view and drag-reparent TBD).
- **Inspector Panel:** Uses `leva` to display and edit properties of the selected entity's components. Currently supports `Transform` and `MeshType`.
- **Object Addition:** A simple menu allows adding predefined shapes (Cube, Sphere, etc.) to the scene.
- **Scene Serialization:**
  - **Save:** Exports the scene's entities (with `Transform` and `MeshType` components) to a `scene.json` file via browser download. (`useSceneSerialization` hook).
  - **Load:** Imports a `scene.json` file selected by the user, clearing the existing scene and recreating entities from the file.
  - **Clear:** Resets the scene to an empty state.

---

## 6 Development Road-map

### Phase 0 — Spike & Harvest (2 days)

1. Clone and review _three.js editor_ and _Lewcid_; list reusable code/snippets.
2. Build tiny PoC: Yjs <-> Zustand sync in CodeSandbox.

### Phase 1 — Core Skeleton (Week 1)

- Vite monorepo (`packages/engine`, `packages/editor`).
- R3F canvas inside Golden-Layout shell.
- Define store schema → render empty scene & default camera/light.
- Hierarchy panel (tree view) with drag-to-reparent.

### Phase 2 — Viewport Tools (Week 2)

- drei `TransformControls` bound to selected entity's `Transform`.
- Visual helpers: grid, axes, camera frustum, light gizmos.

### Phase 3 — Inspector Generator (Week 3)

- Component schema → leva field mapper; hot-update on type changes.
- **Add Component** dropdown; register custom schemas at start-up.
- Integrate Name component editing.

### Phase 4 — Assets & Serialization (Weeks 4-5)

- Drag-&-drop glTF/GLB; auto-center & unit-scale (Babylon Sandbox heuristics).
- **Implement Save/Load:**
  - Refine `useSceneSerialization` to handle more components (initially `Name`).
  - Implement robust error handling for file reading and JSON parsing.
  - Add basic format validation (e.g., checking for `entities` array).
  - Implement UI feedback (loading indicators, success/error messages).
- Save/Load project to localStorage (as a backup or alternative).

### Phase 5 — Serialization Enhancements & Extensibility (Week 6)

- **Advanced Serialization:**
  - Add support for more component types (e.g., Materials, Physics, custom components).
  - Implement schema validation (e.g., Zod) for loaded scene data.
  - Introduce versioning to the scene file format.
- **Plugin API:** Define basic API for registering custom panels, components, gizmos.
- **Script Component:** Basic Monaco editor integration for attaching simple behaviors.

### Phase 6 — Collaboration & Undo/Redo (Weeks 7-8)

- Wire Yjs provider; smoke-test two browsers.
- Transaction stack gives deterministic Undo/Redo (CRDT-aware).

---

## 7 Near-Term Enhancements (Post-Roadmap / Opportunities)

- **Material Editor:** Visual node editor or enhanced Inspector section for materials/shaders.
- **Physics Authoring:** Integrate `@react-three/rapier` for adding/configuring colliders and joints visually.
- **Asset Browser:** Panel for managing imported assets (models, textures).
- **Advanced Hierarchy:** Implement drag-and-drop reparenting, entity duplication.
- **Improved Gizmos:** Add gizmos for lights, cameras, colliders.
- **Scene Settings:** Panel for global settings (background, fog, ambient light).
- **Standalone Export:** Build process for Electron/Tauri desktop app.
- **WebGPU Renderer:** Option to switch renderer backend when R3F support is stable.
- **Entity Templates/Prefabs:** Saving and instantiating groups of entities.

---

## 8 Next Actions for You 🚀

1. **Set-up repo** → `pnpm create vite@latest game-editor --template react-ts`.
2. **Add R3F & drei** → `pnpm add three @react-three/fiber @react-three/drei zustand immer leva`.
3. **Copy boiler-plate** from `/examples/r3f-editor-poc` (link to come).
4. Ping me once Phase 1 skeleton builds & runs; we'll wire the Hierarchy.

---

_Document prepared by ChatGPT – ready for iterative edits._
