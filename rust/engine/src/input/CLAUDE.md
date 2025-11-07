# Input Stack

## Responsibilities

- Normalize raw `winit` events into buffered keyboard/mouse state (`KeyboardInput`, `MouseInput`).
- Expose high-level action maps that scripts can query declaratively.
- Mirror the Input API into Lua via `script_bridge.rs`.

## Flow

1. `InputManager::process_event` ingests `WindowEvent`s each frame and updates `KeyboardInput`/`MouseInput`.
2. `InputManager::update` runs once per frame to evaluate action bindings (WASD → vec2, buttons → scalars) through `ActionSystem`.
3. Scripting consumers call into the `InputApiProvider` impl (`script_bridge.rs`), which proxies back into the manager so state stays authoritative.

## Tips

- Always call `clear_frame_state` after `update` inside the main loop, otherwise edge-triggered queries (`is_key_pressed`) will stick for multiple frames.
- Action configs (`actions.rs`) accept JSON; keep bindings data-driven and avoid hardcoding keys in gameplay code.
- Pointer lock state lives on `MouseInput`; keep it in sync with the OS cursor lock status to avoid drift.
