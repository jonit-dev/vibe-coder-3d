# Setting Up a Simple Scene

This guide walks through the fundamental steps to create a basic interactive 3D scene using the Vibe Coder 3D framework, incorporating the Entity Component System (ECS), React Three Fiber (R3F), and the Rapier physics engine.

## Prerequisites

- Basic understanding of React and React Three Fiber.
- Familiarity with the project structure (core engine vs. game-specific code).

## Core Concepts

- **`@react-three/fiber` (`<Canvas>`):** Provides the main rendering context for Three.js in React.
- **`@react-three/rapier` (`<Physics>`, `<RigidBody>`):** Integrates the Rapier physics engine.
- **`@core/components/EngineLoop`:** Initializes and runs the core ECS game loop and systems.
- **`@core/components/physics/PhysicsSystem`:** A core ECS system that integrates Rapier physics updates with the ECS.
- **ECS (`@core/lib/ecs`, `@core/hooks/useECS`):** The foundation for managing game state and logic through entities and components.
- **`@core/systems/PhysicsSyncSystem` (`registerPhysicsBody`):** Links Rapier physics bodies to ECS entities for automatic synchronization.

## Steps

1.  **Create a Scene Component:**
    Create a new React component for your scene, for example, `src/game/scenes/MyScene.tsx`.

2.  **Set up the Canvas (Usually Done Once):**
    Your main application component (`src/App.tsx` or similar) likely already sets up the R3F `<Canvas>`. If not, you'll need one. Often, a container component like `src/game/scenes/MainScene.tsx` handles this setup.

    ```tsx
    // Example structure (e.g., in MainScene.tsx)
    import { Canvas } from '@react-three/fiber';
    import { MyScene } from './MyScene'; // Your new scene component

    export const MainScene = () => {
      return (
        <div style={{ width: '100vw', height: '100vh' }}>
          <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
            <MyScene />
          </Canvas>
        </div>
      );
    };
    ```

3.  **Implement the Scene Component (`MyScene.tsx`):**

    ```tsx
    import React, { useEffect, useRef } from 'react';
    import { OrbitControls } from '@react-three/drei';
    import { Physics, RigidBody, RapierRigidBody } from '@react-three/rapier';
    import { useFrame } from '@react-three/fiber';
    import { Mesh } from 'three';

    // Core Framework Imports
    import { EngineLoop } from '@/core/components/EngineLoop';
    import { PhysicsSystem } from '@/core/components/physics/PhysicsSystem';
    import { useECS } from '@/core/hooks/useECS';
    import { Transform } from '@/core/lib/ecs'; // Assuming Transform component exists
    import { registerPhysicsBody } from '@/core/systems/PhysicsSyncSystem';

    // Simple Floor Component
    const Floor = () => (
      <RigidBody type="fixed" friction={1}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </RigidBody>
    );

    // Simple Box Component integrating with ECS and Physics
    const Box = ({ position }: { position: [number, number, number] }) => {
      const bodyRef = useRef<RapierRigidBody>(null);
      const meshRef = useRef<Mesh>(null); // Optional: Ref for direct mesh manipulation if needed
      const { createEntity, addComponent, removeEntity } = useECS();

      useEffect(() => {
        if (!bodyRef.current) return;

        // 1. Create an ECS Entity
        const entity = createEntity();

        // 2. Add Components (e.g., Transform)
        addComponent(entity, Transform); // Assuming Transform is added automatically or manually
        Transform.position[entity][0] = position[0];
        Transform.position[entity][1] = position[1];
        Transform.position[entity][2] = position[2];
        Transform.needsUpdate[entity] = 1; // Mark for sync

        // 3. Link Physics Body to Entity
        registerPhysicsBody(entity, bodyRef.current);

        // Cleanup function when component unmounts
        return () => {
          removeEntity(entity);
          // Note: Physics body is usually removed automatically by R3F/Rapier unmount
        };
      }, [position, createEntity, addComponent, removeEntity]); // Dependencies

      // Apply a force on frame update for demonstration
      useFrame(() => {
        if (bodyRef.current) {
          // Example: Randomly nudge the box
          if (Math.random() < 0.01) {
            bodyRef.current.applyImpulse({ x: (Math.random() - 0.5) * 2, y: 1, z: 0 }, true);
          }
        }
      });

      return (
        <RigidBody ref={bodyRef} colliders="cuboid" position={position} restitution={0.7}>
          <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </RigidBody>
      );
    };

    // Your Main Scene Component
    export const MyScene: React.FC = () => {
      return (
        <EngineLoop autoStart={true}>
          {' '}
          {/* Start the ECS game loop */}
          {/* Basic Environment */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <OrbitControls />
          <Physics>
            {' '}
            {/* Enable Physics */}
            <PhysicsSystem /> {/* Integrate Physics with ECS */}
            {/* Scene Objects */}
            <Floor />
            <Box position={[0, 2, 0]} />
            <Box position={[1, 4, -1]} />
            <Box position={[-1, 6, 1]} />
          </Physics>
        </EngineLoop>
      );
    };
    ```

4.  **Run the Application:** Start your development server (`yarn dev` or similar). You should see your scene with the floor and interactive physics boxes.

## Explanation

- **`<EngineLoop>`:** Manages the core update cycle, running ECS systems like `PhysicsSyncSystem`.
- **`<Physics>`:** Sets up the Rapier physics world provided by `@react-three/rapier`.
- **`<PhysicsSystem>`:** Ensures physics changes (calculated by Rapier) are reflected in the ECS `Transform` components.
- **`Box` Component:**
  - Uses `<RigidBody>` for physics properties.
  - Creates an ECS `Entity` to represent the box in the game state.
  * Adds a `Transform` component to the entity, initializing its position.
  - Calls `registerPhysicsBody` to link the `RigidBody`'s internal state (position, rotation) to the entity's `Transform` component via the `PhysicsSyncSystem`. This is the key to synchronization.
- **Synchronization:** The `PhysicsSyncSystem` (running within `EngineLoop`) reads the updated positions/rotations from all registered Rapier bodies after each physics step and writes them into the corresponding entity's `Transform` component. Other systems or R3F itself can then read the `Transform` to update the visual representation (`<mesh>`).

This setup provides a robust foundation for building more complex scenes and interactions by leveraging the ECS for state management and Rapier for realistic physics simulation, all integrated within the React Three Fiber environment.
