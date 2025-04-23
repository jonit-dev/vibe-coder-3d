# Camera System Architecture

This document outlines the design for the camera system within Vibe Coder 3D's core framework. The goal is to provide a flexible and extensible system for managing different camera perspectives and behaviors required by various game genres.

## Core Concepts

- **Camera Rig:** A central component or entity responsible for managing the active camera and its properties (position, rotation, target, FOV, etc.).
- **Camera Controllers:** Logic components that define specific camera behaviors (e.g., following a target, orbiting, fixed position).
- **State Management:** Utilize Zustand or ECS state to manage the active camera type, target entity, and other relevant camera parameters.
- **Switching Mechanism:** A clear way to transition between different camera controllers/types, potentially with smooth interpolation.

## Proposed Camera Types / Controllers

### 1. Orbit Camera (`OrbitControls`)

- **Description:** Standard orbit controls, likely leveraging `@react-three/drei`'s `OrbitControls`. Useful for development, debugging, and certain game types (e.g., strategy, model viewers).
- **Core Functionality:**
  - Orbit around a target point.
  - Pan (translate) the view.
  - Zoom in/out.
- **Configuration:** Target point, min/max distance, min/max polar angle, damping.

### 2. Third-Person Follow Camera

- **Description:** Follows a target entity (e.g., the player character) from a configurable distance and angle.
- **Core Functionality:**
  - Maintain a specific offset from the target.
  - Optionally rotate to match target's orientation or allow independent player rotation.
  - Smooth damping/lag for movement and rotation.
  - Obstacle avoidance/collision handling (prevent camera clipping through walls).
- **Configuration:** Target entity, offset vector, damping factors, look-at offset, collision layers.

### 3. First-Person Camera

- **Description:** Simulates the view from the eyes of an entity (e.g., player character). Often attached directly to the character model's head bone or a specific camera entity.
- **Core Functionality:**
  - Position and rotation match the target entity/bone.
  - Optional head bob/sway effects.
  - Field of View (FOV) control.
- **Configuration:** Target entity/bone, vertical offset, FOV.

### 4. Fixed Camera

- **Description:** A static camera placed in the world. Useful for specific scenes, cutscenes, or specific game styles (e.g., classic survival horror).
- **Core Functionality:**
  - Remains at a predefined position and orientation.
  - May optionally track a target entity (pan/tilt) without changing position.
- **Configuration:** Position, rotation/look-at target.

### 5. Cinematic Camera (`CinematicCamera` / Sequencer)

- **Description:** Designed for scripted camera movements, cutscenes, or dynamic sequences. Might involve moving along predefined paths or animating properties over time.
- **Core Functionality:**
  - Follow paths (splines).
  - Animate position, rotation, FOV over time.
  - Triggered by game events.
- **Configuration:** Path data, animation curves, triggers.

## Implementation Notes

- The `CameraRig` component could manage the active `PerspectiveCamera` instance.
- Different controllers could be implemented as separate React components or ECS systems that update the `CameraRig`'s state or the camera's properties directly.
- A central `useCamera` hook or system could provide access to camera state and switching functions.
- Consider using libraries like `camera-controls` for more advanced control implementations beyond basic `drei` helpers if needed.
