# UI Implementation

This document covers the approaches for creating User Interfaces (UI).

## In-World UI (three-mesh-ui)

- **Library:** Utilizes `three-mesh-ui` for rendering UI elements within the 3D scene.
- **Core Components:** Document any wrapper components created in `src/core/components/ui` to simplify `three-mesh-ui` usage (e.g., `<UIButton>`, `<UIText>`, `<UIPanel>`).
- **Layout:** Explain layout principles (block, inline-block, flex-like properties).
- **Interaction:** Describe how interactions (hover, click) with in-world UI elements are handled (likely involving raycasting).
- **Usage:** Provide examples of creating simple menus or HUD elements using the core components.

### Interaction Flow Example (Click)

```mermaid
sequenceDiagram
    participant User
    participant PointerEvents as R3F Pointer Events
    participant Raycaster
    participant InWorldUI as three-mesh-ui Component
    participant GameLogic

    User->>PointerEvents: Click on screen
    PointerEvents->>Raycaster: Perform raycast from camera
    Raycaster->>InWorldUI: Check intersection
    alt Hit UI Element
        InWorldUI-->>Raycaster: Intersection data
        Raycaster-->>PointerEvents: Hit UI element
        PointerEvents->>InWorldUI: Trigger onClick handler
        InWorldUI->>GameLogic: Execute associated action (e.g., update state)
    else Missed UI Element
        Raycaster-->>PointerEvents: No relevant intersection
    end
```

## DOM UI

- **Purpose:** Used for overlays, menus, debug panels, or interfaces that don't need to be part of the 3D world.
- **Implementation:** Standard React components styled with Tailwind CSS, rendered outside the R3F Canvas (typically in `App.tsx`).
- **State Management:** The engine is agnostic about UI state; game-specific UI should use game-specific state stores.

### Reference Implementation

The engine provides a reference implementation to demonstrate patterns:

- **`<Hud>`** (`src/core/components/ui/Hud.tsx`): A basic Heads-Up Display component showing how game UI might be structured with Tailwind CSS. This is intended as an example only - games should implement their own UI components that connect to their specific game state.

### Game-Specific UI

Games should implement their own UI components in their game code (e.g., `src/game/components/ui/`), which would:

- Connect to game-specific state (e.g., `useGameState` from `src/game/state/gameState.ts`)
- Implement game-specific UI/UX requirements
- Follow the game's visual design language

## Integration

- Discuss when to use In-World UI vs. DOM UI.
- How communication happens between the two (e.g., via Zustand state).

```mermaid
graph TD
    subgraph Browser DOM
        direction LR
        ReactUI[React DOM UI<br/>(Overlays, Menus)]
    end

    subgraph ThreeJS Scene
        direction LR
        InWorldUI_G[In-World UI<br/>(three-mesh-ui)]
    end

    subgraph Shared State
        Zustand[Zustand Store]
    end

    ReactUI <-- Reads/Writes --> Zustand
    InWorldUI_G <-- Reads/Writes --> Zustand

    style Zustand fill:#f9f,stroke:#333,stroke-width:2px
```
