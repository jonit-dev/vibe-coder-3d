/**
 * Instancing System Example
 * Demonstrates GPU instancing for efficient rendering of repeated geometry
 */

import React, { useState, useEffect } from 'react';
import { Entity, Instanced, Transform } from '@core/components/jsx';
import type { InstanceData } from '@core/lib/ecs/components/definitions/InstancedComponent';

/**
 * Example 1: Static Forest Scene
 * Renders 500 trees using instancing
 */
export function ForestExample() {
  const treeInstances: InstanceData[] = Array.from({ length: 500 }, (_, i) => {
    const angle = (i / 500) * Math.PI * 2;
    const radius = 10 + (i % 10) * 3;

    return {
      position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
      rotation: [0, Math.random() * Math.PI * 2, 0],
      scale: [1, 2 + Math.random(), 1],
    };
  });

  return (
    <Entity name="Forest">
      <Instanced
        baseMeshId="cylinder"
        baseMaterialId="bark"
        instances={treeInstances}
        capacity={500}
        castShadows={true}
        receiveShadows={true}
      />
    </Entity>
  );
}

/**
 * Example 2: Colorful Particle Field
 * Demonstrates per-instance colors
 */
export function ParticleFieldExample() {
  const particleInstances: InstanceData[] = Array.from({ length: 1000 }, () => ({
    position: [Math.random() * 40 - 20, Math.random() * 20, Math.random() * 40 - 20],
    scale: [0.2, 0.2, 0.2],
    color: [Math.random(), Math.random(), Math.random()],
  }));

  return (
    <Entity name="ParticleField">
      <Instanced
        baseMeshId="sphere"
        baseMaterialId="default"
        instances={particleInstances}
        capacity={1000}
        castShadows={false}
        receiveShadows={false}
      />
    </Entity>
  );
}

/**
 * Example 3: Grid of Cubes
 * Simple grid layout demonstration
 */
export function CubeGridExample() {
  const gridSize = 20;
  const spacing = 2;

  const cubeInstances: InstanceData[] = [];
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      cubeInstances.push({
        position: [x * spacing - (gridSize * spacing) / 2, 0, z * spacing - (gridSize * spacing) / 2],
        rotation: [0, (x + z) * 0.1, 0],
        scale: [0.8, 0.8 + Math.sin(x + z) * 0.3, 0.8],
      });
    }
  }

  return (
    <Entity name="CubeGrid">
      <Instanced
        baseMeshId="cube"
        baseMaterialId="default"
        instances={cubeInstances}
        capacity={gridSize * gridSize}
        castShadows={true}
        receiveShadows={true}
      />
    </Entity>
  );
}

/**
 * Example 4: Dynamic Crowd Animation
 * Shows how to update instances dynamically
 */
export function DynamicCrowdExample() {
  const [instances, setInstances] = useState<InstanceData[]>(() =>
    Array.from({ length: 50 }, (_, i) => ({
      position: [Math.cos((i / 50) * Math.PI * 2) * 10, 0, Math.sin((i / 50) * Math.PI * 2) * 10],
      rotation: [0, (i / 50) * Math.PI * 2, 0],
      scale: [0.5, 1, 0.5],
    })),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setInstances((prev) =>
        prev.map((inst, i) => {
          const angle = (i / 50) * Math.PI * 2 + performance.now() * 0.0001;
          return {
            ...inst,
            position: [Math.cos(angle) * 10, 0, Math.sin(angle) * 10],
            rotation: [0, angle, 0],
          };
        }),
      );
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  return (
    <Entity name="DynamicCrowd">
      <Instanced
        baseMeshId="cube"
        baseMaterialId="character"
        instances={instances}
        capacity={50}
        frustumCulled={false}
      />
    </Entity>
  );
}

/**
 * Example 5: Procedural Rock Field
 * Demonstrates natural-looking random placement
 */
export function RockFieldExample() {
  const rockInstances: InstanceData[] = Array.from({ length: 200 }, () => {
    const x = Math.random() * 50 - 25;
    const z = Math.random() * 50 - 25;
    const scale = 0.3 + Math.random() * 0.7;

    return {
      position: [x, 0, z],
      rotation: [
        Math.random() * 0.2,
        Math.random() * Math.PI * 2,
        Math.random() * 0.2,
      ],
      scale: [scale * (0.8 + Math.random() * 0.4), scale, scale * (0.8 + Math.random() * 0.4)],
    };
  });

  return (
    <Entity name="RockField">
      <Instanced
        baseMeshId="sphere"
        baseMaterialId="rock"
        instances={rockInstances}
        capacity={200}
        castShadows={true}
        receiveShadows={true}
      />
    </Entity>
  );
}

/**
 * Complete Demo Scene
 * Combines multiple instancing examples
 */
export function InstancingDemoScene() {
  return (
    <>
      <ForestExample />
      <ParticleFieldExample />
      <CubeGridExample />
      <DynamicCrowdExample />
      <RockFieldExample />

      {/* Ground plane */}
      <Entity name="Ground">
        <Transform position={[0, -0.5, 0]} scale={[100, 1, 100]} />
        <Entity.MeshRenderer meshId="plane" materialId="ground" />
      </Entity>
    </>
  );
}

/**
 * Performance Comparison Example
 * Compare regular entities vs instanced mesh performance
 */
export function PerformanceComparisonExample() {
  const [useInstancing, setUseInstancing] = useState(true);
  const count = 500;

  const positions = Array.from({ length: count }, (_, i) => ({
    x: Math.cos((i / count) * Math.PI * 2) * 15,
    y: 0,
    z: Math.sin((i / count) * Math.PI * 2) * 15,
  }));

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
        }}
      >
        <button onClick={() => setUseInstancing(!useInstancing)}>
          Toggle: {useInstancing ? 'Instancing (1 draw call)' : `Individual (${count} draw calls)`}
        </button>
      </div>

      {useInstancing ? (
        <Entity name="InstancedCubes">
          <Instanced
            baseMeshId="cube"
            baseMaterialId="default"
            instances={positions.map((pos) => ({
              position: [pos.x, pos.y, pos.z],
              scale: [0.5, 0.5, 0.5],
            }))}
            capacity={count}
          />
        </Entity>
      ) : (
        <>
          {positions.map((pos, i) => (
            <Entity key={i} name={`Cube${i}`}>
              <Transform position={[pos.x, pos.y, pos.z]} scale={[0.5, 0.5, 0.5]} />
              <Entity.MeshRenderer meshId="cube" materialId="default" />
            </Entity>
          ))}
        </>
      )}
    </>
  );
}
