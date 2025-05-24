# Architecture Research

Building a web-first game engine on top of Three.js, we recommend a **data-oriented, entity–component–system (ECS) runtime wrapped by an optional React/JSX façade, plus a plug-in layer and a visual "scene tree" editor.**  
This hybrid mirrors what developers like about Godot's intuitive node tree while retaining Unity/Unreal-style composition and the raw performance that modern ECS libraries deliver. It keeps render/physics/input/networking fully decoupled, so any subsystem can be swapped or run in a Web Worker/WASM thread later. Below is a complete architecture document you can hand to contributors.

---

## 1 Guiding principles

### 1.1 Composition over inheritance

Unity's **GameObject + Component** design popularised replacing deep hierarchies with reusable behaviours cite. Godot achieves the same via a scene-tree of Nodes and Signals cite, Unreal via Actors that own Components cite. We follow that pattern but store the data in flat **typed-array component pools** (bitecs/ecs-lib) for cache-friendly iteration.

### 1.2 Data-oriented design

Moving behaviour to "systems that iterate plain data" scales better on modern CPUs/GPUs and is a core benefit of ECS cite.

### 1.3 Decoupled subsystems

Subsystem boundaries (render, physics, audio, UI, networking) communicate through an event bus, never by calling each other's internals. This mirrors Rapier's WASM physics running in a worker while Three.js stays on the main thread cite.

---

## 2 Runtime layers

| Layer          | Responsibilities                                                        | Key tech                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**       | World, Entity IDs, Component stores, System scheduler, global event bus | **bitecs / ecs-lib** (ultra-small, TypeScript) cite                                                                                           |
| **Rendering**  | Frame loop, materials, post-processing                                  | **Three.js r175** + optional **React Three Fiber v9** façade; R3F's reconciler runs **outside React's commit phase**, so zero VDOM cost cite. |
| **Physics**    | Broad-phase, narrow-phase, constraints                                  | **Rapier WASM** (deterministic 2-D/3-D) cite                                                                                                  |
| **UI**         | 3-D panels, text layout, VR cursors                                     | **three-mesh-ui** cite                                                                                                                        |
| **Audio**      | 2-D/3-D spatial sound, mixing                                           | **Howler.js**                                                                                                                                 |
| **Networking** | Client prediction, authoritative room state                             | **Colyseus 0.16** cite                                                                                                                        |
| **Scripting**  | Behaviour trees, finite-state machines                                  | Runs in the same ECS loop or via a visual node graph plug-in                                                                                  |

---

## 3 Scene representation

- **ECS-first:** A scene is just a JSON Blob (list of entities & components).
- **Editor-friendly tree:** For designers, we expose a **tree wrapper** that groups entities like Godot's SceneTree cite. The wrapper is translated to ECS data at build/run time, giving us "drag-and-drop nodes" without sacrificing runtime speed.

---

## 4 System scheduling & threading

1. **Main thread**: Render & input (Three.js / R3F).
2. **Worker thread**: Physics (Rapier) and heavy AI systems—communicate via transferable buffers.
3. **Deterministic tick**: Fixed-delta physics tick decoupled from variable-rate render tick.
4. **Job queue**: Systems can enqueue tasks; a simple round-robin job runner is adequate for web.

---

## 5 Plug-in architecture

- Any subsystem can register new **Components**, **Systems**, and **Asset handlers** through a tiny manifest (inspired by Godot's "addons" and recent JavaScript plug-in discussions cite).
- Plug-ins are ES modules auto-discovered at build time; no NPM publish required.
- Each plug-in lives in its own namespace to avoid symbol clashes.

---

## 6 Tooling & editor

| Tool                    | Purpose                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Custom editor tools** | Scene authoring tools built with our React/Web stack                                                        |
| **Graph editor**        | Node-based shader graph and behaviour scripting—parallels Godot's VisualScript citeturn2search4             |
| **Hot-reload**          | Vite 5 HMR feeds changes straight into R3F or vanilla render loop with sub-300 ms rebuilds citeturn0search8 |

---

## 7 Comparison with mainstream engines

| Engine                                                                   | Core metaphor                                                               | Our equivalent |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------- | -------------- |
| **Godot** – SceneTree of Nodes plus Signals cite                         | Designer-facing Node tree that compiles into ECS                            |
| **Unity** – GameObject + Components cite                                 | Entities + Components; Systems = scripts                                    |
| **Unreal** – Actors own Components; gameplay code in Blueprints/C++ cite | Entities own Components; high-level logic in JS/TS + optional visual graphs |

Our hybrid keeps the _composition_ benefits those engines share, but stores the data in a cache-friendly ECS and exposes the hierarchy only where humans need it.

---

## 8 Roadmap (abridged)

1. **MVP (6 weeks)**: ECS core, Rapier integration, R3F renderer, basic input.
2. **Alpha (3 months)**: Colyseus multiplayer, three-mesh-ui menus, Vite-powered hot-reload.
3. **Beta (6 months)**: Visual editor & node graph, asset import pipeline, plug-in marketplace.
4. **1.0**: WebGPU renderer path, worker-thread job scheduler, asset-bundle encryption.

---

### Appendix A – Key references

1. Godot scene tree & node docs citeturn0search0turn2search1turn2search5
2. Unity component manual citeturn0search1
3. Unreal actor-component discussion citeturn0search2
4. ECS advantages & bitecs repo citeturn0search3turn0search4
5. React Three Fiber docs citeturn1search0turn1search1
6. Rapier physics engine citeturn0search6
7. Colyseus framework citeturn0search7
8. three-mesh-ui in web-XR list citeturn0search8
9. Vite 5/HMR & plugin architecture discussion citeturn0search8turn0search11

This architecture balances **developer joy** (React/Zustand JSX, hot-reload), **runtime performance** (ECS + Rapier), and **designer usability** (scene tree editor). It is flexible enough to target Chrome, WebGPU, native Electron shells, or even future XR runtimes—yet simple enough for any JavaScript dev to grok in a weekend.
