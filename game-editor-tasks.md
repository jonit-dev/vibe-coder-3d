# Game Editor Functional Integration Plan

## Overview

This plan outlines the steps to evolve the current editor into a fully functional, ECS-driven game editor, deeply integrated with the core engine abstractions and runtime. The goal is to enable real-time editing, component management, and scene serialization using the same systems as the game runtime.

---

## 1. Current State

- Editor manages its own `ISceneObject[]` in localStorage, not the ECS world.
- Core engine uses ECS (bitecs) for all runtime entity/component management.
- No direct integration between editor UI and ECS world/components.

---

## 2. Target Functionalities

### A. Scene Graph & Entity Management

- Directly create, update, and delete ECS entities using core engine APIs.
- Reflect ECS world state in the editor UI (hierarchy, inspector, viewport).
- Support for prefabs/composition (reusable entity setups).

### B. Component Editing

- Inspector edits ECS components (Transform, Mesh, Material, Physics, etc.) in real time.
- Add/remove components (collider, rigidbody, scripts, etc.) via UI.

### C. Viewport

- Render the actual ECS-driven scene using `Entity`, `EntityMesh`, and physics components.
- Selection in the viewport highlights/selects the corresponding ECS entity.

### D. Serialization

- Scene save/load serializes/deserializes the ECS world (or a subset) to/from JSON, using the runtime-compatible format.

### E. Extensibility

- UI for adding/removing arbitrary components.
- Support for prefabs and reusable entity setups.

---

## 3. Implementation Steps

### Step 1: Sync Editor State with ECS World

- Replace local `ISceneObject[]` state with ECS-driven state.
- Use `useECS`, `useEntity`, and ECS queries to drive the UI.
- On add object, call `createEntity` and add required components.

### Step 2: Inspector/Component Editing

- Inspector updates ECS component arrays directly.
- Add/remove components using ECS APIs.

### Step 3: Hierarchy & Selection

- Hierarchy panel lists ECS entities (query for those with `Name` or `Transform`).
- Selection stores selected entity ID.

### Step 4: Viewport

- Render scene using ECS-driven components (`Entity`, `EntityMesh`, physics, etc.).
- Pass selected entity for highlighting.

### Step 5: Serialization

- Implement ECS world (or filtered subset) serialization/deserialization to JSON.
- Use runtime-compatible format for maximum compatibility.

### Step 6: Extensibility

- Add UI for adding/removing arbitrary components (colliders, scripts, etc.).
- Support for prefabs and reusable entity setups.

---

## 4. Example: Adding a Cube in the Editor

1. User clicks "Add Cube".
2. Editor calls `createEntity()` from ECS.
3. Adds `Transform`, `Mesh`, and (optionally) `Physics` components to the entity.
4. Entity appears in the hierarchy and viewport, driven by ECS.
5. Inspector edits update the ECS component arrays directly.

---

## 5. Next Steps

- [ ] Start with minimal ECS-driven editor (replace local state with ECS, basic add/edit/delete)
- [ ] Add component add/remove UI
- [ ] Implement ECS-driven serialization
- [ ] Add prefab/reusable entity support
- [ ] Iterate and refine based on user feedback
