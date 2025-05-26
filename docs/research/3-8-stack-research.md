# Stack Research

**Bottom line (up front)** – for a modern, _developer-friendly_ Three.js game-engine starter, two well-validated architectural paths exist.  
If your team is already React-savvy (or wants JSX ergonomics) choose the **React Three Fiber stack**; if you value total rendering control or a non-React UI choose the **Vanilla Three.js + ECS stack**.  
Both converge on the same "golden" support libraries: **Rapier** for physics, **bitecs (or ecs-lib)** for data-oriented entity management, **three-mesh-ui** for 3-D interfaces, **Colyseus** for multiplayer, **Howler.js** for audio, and **TypeScript 5 + Vite 5** for tooling.  
The table at the end summarises why each item made the cut.

---

## 1 What "dev-friendly" really means

1. **Rapid feedback loop** – hot-reload builds in < 300 ms and incremental scene updates. citeturn0search8
2. **Typed safety** – TS 5's const-type-parameter inference prevents many runtime mistakes. citeturn0search8
3. **Composable abstraction** – either React components (R3F) or pure-data ECS (bitecs/ecslib). citeturn0search4turn0search5
4. **Ops-ready** – a multiplayer framework that already handles rooms, state sync, and reconnection (Colyseus). citeturn0search6

---

## 2 Foundation – Three.js r175

Three.js r175 (Mar 2025) brings WebGPU experiments, skinned-mesh GPU morph targets, and unified animation mixer fixes, so build on this tag or newer. citeturn0search3

---

## 3 Two proven architectural paths

### 3.1 React-centric Stack (R3F v9)

| Layer           | Choice                                              | Reason                                                                                                                                                             |
| --------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Renderer**    | **React Three Fiber v9**                            | JSX scene graph; render-loop runs outside React so zero extra overhead and often better scaling than plain Three.js ﻿citeturn0search0turn1search0turn1search8 |
| **Helpers**     | **@react-three/drei**                               | ready-made controls, loaders, instanced meshes.                                                                                                                    |
| **State**       | **Zustand**                                         | built in to R3F, bundle-size-free and frame-safe ﻿citeturn2search0turn2search1                                                                                 |
| **Physics**     | **Rapier**                                          | Rust-compiled WASM; 2-D/3-D, deterministic, TypeScript typings ﻿citeturn0search1                                                                                |
| **ECS**         | **bitecs** (or **ecs-lib** if you need OOP helpers) | cache-friendly typed-array storage, < 6 kB ﻿citeturn0search4turn1search5                                                                                       |
| **UI**          | **three-mesh-ui**                                   | 3-D, VR-ready panels; no DOM reliance ﻿citeturn0search2                                                                                                         |
| **Audio**       | **Howler.js 2.2**                                   | cross-platform, spatial-audio helpers ﻿citeturn0search7                                                                                                            |
| **Multiplayer** | **Colyseus 0.16**                                   | authority server, delta patch sync ﻿citeturn0search6                                                                                                               |
| **Tooling**     | **Vite 5 + TS 5**                                   | fast HMR, Rollup 4 bundling ﻿citeturn0search8                                                                                                                      |

_Pros_ – devs write "<Box position={[0,1,0]} />" instead of imperative code; hook-based game logic lives in ordinary React files; vast React ecosystem.  
_Cons_ – React is still in your bundle; SSR is non-trivial; shader authors may grumble about JSX.

### 3.2 Vanilla Three.js + ECS Stack

For teams that prefer explicit loops or plan to embed the engine inside non-React canvases (e.g. Web Components, Svelte, Solid):

| Layer                                   | Choice                                  | Reason                                                                                               |
| --------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Renderer**                            | **Three.js r175**                       | direct control of renderer, materials, passes.                                                       |
| **ECS**                                 | **bitecs** or **ecs-lib**               | identical to R3F stack, but you drive them from your tick function. citeturn0search4turn0search5 |
| **Physics / UI / Audio / MP / Tooling** | Same Rapier-to-Colyseus lineup as above | all libraries are renderer-agnostic.                                                                 |
| **UI overlay**                          | DOM / Solid.js / Lit                    | choose what matches your front-end; three-mesh-ui still covers in-world panels.                      |

_Pros_ – minimal dependencies, easier to integrate with non-React frameworks or existing WebGL code; one render loop you fully own.  
_Cons_ – you must build your own scene-graph abstraction or editor; less plug-and-play compared to R3F+drei.

---

## 4 Side-by-side comparison

| Criterion               | R3F Stack                                                                | Vanilla ECS Stack                          |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------ |
| **Learning curve**      | Low for React devs; JSX scene graph                                      | Slightly steeper; imperative or custom DSL |
| **Bundle size**         | + ≈ 18 kB (React + R3F)                                                  | leaner                                     |
| **Hot-reload**          | out-of-the-box via React Fast Refresh                                    | needs manual HMR hooks                     |
| **Editor support**      | Custom editor tools, Storybook style demos                               | Custom editors or standalone tools         |
| **Performance ceiling** | Comparable; R3F loop outside React avoids VDOM cost ﻿citeturn1search8 | Full control for micro-optimisations       |

---

## 5 Recommendation

Because you already research R3F and you work daily in React code-bases, adopt **Stack 3.1** as the canonical starting point.  
Guard against React overhead by enabling `frameloop="demand"` and using instancing/merge utilities provided by drei. ﻿citeturn1search6  
Pair it with **bitecs** for data-oriented entities and **Rapier** for deterministic physics; those two decisions will outlive whatever UI wrapper you choose.

Keep the core small, expose an API that returns plain Three.js objects so advanced users can drop to the metal when needed. Your engine can still offer a non-React "headless" build later because the heavy lifting (physics, ECS, networking) is renderer-agnostic.

---

## 6 Why these libraries made the cut

| Area      | Library              | Killer feature                                                        |
| --------- | -------------------- | --------------------------------------------------------------------- |
| Rendering | React Three Fiber v9 | React 19 compatible; render loop decoupled from React; huge ecosystem |
| Physics   | Rapier.js            | Rust speed, WASM, broad-phase SIMD, deterministic                     |
| ECS       | bitecs               | < 6 kB, cache-friendly, TS types, blazing benchmark scores            |
| UI        | three-mesh-ui        | VR-first, text-layout engine, style sheets                            |
| State     | Zustand              | hook API, zero-boilerplate, used by R3F itself                        |
| Netcode   | Colyseus             | Room orchestration & delta sync                                       |
| Audio     | Howler.js            | sprites + spatial panning                                             |
| Tooling   | Vite 5 + TS 5        | sub-second HMR, Rollup 4 output                                       |

Adopt this stack **as-is**, then swap individual layers only when a concrete requirement demands it (e.g. PlayCanvas physics => keep Rapier). This keeps your engine lean, modern, and instantly approachable for any web developer in 2025.
