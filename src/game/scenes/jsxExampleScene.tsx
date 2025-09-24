/**
 * JSX Example Scene - Demonstrates R3F-style scene authoring with JSX ECS components
 * Shows how to write scenes using React/R3F patterns that integrate with ECS
 */

import React from 'react';

import {
  AmbientLight,
  Cube,
  DirectionalLight,
  Entity,
  PerspectiveCamera,
  Sphere,
  Transform,
} from '@/core/components/jsx';
import { defineScene } from '@core';
import type { ISceneContext } from '@core';

/**
 * JSX Scene Component - Define scenes using React/R3F style
 */
export const JSXExampleScene: React.FC = () => {
  return (
    <>
      {/* Main Camera */}
      <Entity name="Main Camera" persistentId="main-camera">
        <Transform position={[5, 5, -10]} rotation={[0, -30, 0]} />
        <PerspectiveCamera
          fov={30}
          near={0.1}
          far={100}
          isMain={true}
          clearFlags="skybox"
          backgroundColor={{ r: 0.2, g: 0.3, b: 0.4, a: 1 }}
        />
      </Entity>

      {/* Sun Light */}
      <Entity name="Sun Light" persistentId="sun-light">
        <Transform position={[10, 20, 10]} rotation={[45, -45, 0]} />
        <DirectionalLight
          color={{ r: 1.0, g: 0.95, b: 0.8 }}
          intensity={1.0}
          castShadow={true}
          directionX={-0.5}
          directionY={-1.0}
          directionZ={-0.5}
          shadowMapSize={2048}
        />
      </Entity>

      {/* Ambient Light */}
      <Entity name="Ambient Light" persistentId="ambient-light">
        <AmbientLight color={{ r: 0.4, g: 0.4, b: 0.4 }} intensity={0.5} />
      </Entity>

      {/* Ground */}
      <Entity name="Ground" persistentId="ground">
        <Transform position={[0, -0.5, 0]} scale={[20, 0.1, 20]} />
        <Cube
          material={{
            color: '#4a7c59',
            metalness: 0,
            roughness: 0.9,
          }}
          castShadows={false}
          receiveShadows={true}
        />
      </Entity>

      {/* Red Cube */}
      <Entity name="Red Cube" persistentId="red-cube">
        <Transform position={[-2, 1, 0]} rotation={[0, 45, 0]} />
        <Cube
          material={{
            color: '#e63946',
            metalness: 0.2,
            roughness: 0.5,
          }}
        />
      </Entity>

      {/* Blue Sphere */}
      <Entity name="Blue Sphere" persistentId="blue-sphere">
        <Transform position={[2, 1.5, 0]} scale={[1.5, 1.5, 1.5]} />
        <Sphere
          material={{
            color: '#457b9d',
            metalness: 0.8,
            roughness: 0.2,
          }}
        />
      </Entity>

      {/* Grouped Objects */}
      <Entity name="Group Container" persistentId="group-container">
        <Transform position={[0, 3, -3]} />

        {/* Child Cube 1 */}
        <Entity name="Child Cube 1" persistentId="child-cube-1">
          <Transform position={[-1, 0, 0]} scale={[0.5, 0.5, 0.5]} />
          <Cube
            material={{
              color: '#a663cc',
            }}
          />
        </Entity>

        {/* Child Cube 2 */}
        <Entity name="Child Cube 2" persistentId="child-cube-2">
          <Transform position={[1, 0, 0]} scale={[0.5, 0.5, 0.5]} />
          <Cube
            material={{
              color: '#6c5ce7',
            }}
          />
        </Entity>
      </Entity>
    </>
  );
};

/**
 * Register the JSX scene using a React renderer
 */
export const registerJSXExampleScene = () => {
  defineScene(
    'game.jsx-example',
    async ({ createEntity, addComponent }: ISceneContext) => {
      // For JSX scenes, we need to render the React component to execute the ECS operations
      // This is a simplified approach - in a full implementation, we'd use a proper React renderer

      console.log('[JSX Scene] JSX scenes require React rendering - this is a demonstration');

      // For now, fall back to imperative ECS calls that match the JSX structure
      // Camera
      const camera = createEntity('Main Camera');
      addComponent(camera, 'Transform', {
        position: [5, 5, -10],
        rotation: [0, -30, 0],
        scale: [1, 1, 1],
      });
      addComponent(camera, 'Camera', {
        fov: 30,
        near: 0.1,
        far: 100,
        projectionType: 'perspective',
        orthographicSize: 10,
        depth: 0,
        isMain: true,
        clearFlags: 'skybox',
        backgroundColor: { r: 0.2, g: 0.3, b: 0.4, a: 1 },
      });

      // Sun Light
      const sunLight = createEntity('Sun Light');
      addComponent(sunLight, 'Transform', {
        position: [10, 20, 10],
        rotation: [45, -45, 0],
        scale: [1, 1, 1],
      });
      addComponent(sunLight, 'Light', {
        lightType: 'directional',
        color: { r: 1.0, g: 0.95, b: 0.8 },
        intensity: 1.0,
        enabled: true,
        castShadow: true,
        directionX: -0.5,
        directionY: -1.0,
        directionZ: -0.5,
        shadowMapSize: 2048,
      });

      // Ambient Light (matches JSX component)
      const ambient = createEntity('Ambient Light');
      addComponent(ambient, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
      addComponent(ambient, 'Light', {
        lightType: 'ambient',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        intensity: 0.5,
        enabled: true,
        castShadow: false,
      });

      // Ground
      const ground = createEntity('Ground');
      addComponent(ground, 'Transform', {
        position: [0, -0.5, 0],
        rotation: [0, 0, 0],
        scale: [20, 0.1, 20],
      });
      addComponent(ground, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: false,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#4a7c59',
          normalScale: 1,
          metalness: 0,
          roughness: 0.9,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });

      // Red Cube
      const redCube = createEntity('Red Cube');
      addComponent(redCube, 'Transform', {
        position: [-2, 1, 0],
        rotation: [0, 45, 0],
        scale: [1, 1, 1],
      });
      addComponent(redCube, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#e63946',
          normalScale: 1,
          metalness: 0.2,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });

      // Blue Sphere
      const blueSphere = createEntity('Blue Sphere');
      addComponent(blueSphere, 'Transform', {
        position: [2, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1.5, 1.5, 1.5],
      });
      addComponent(blueSphere, 'MeshRenderer', {
        meshId: 'sphere',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#457b9d',
          normalScale: 1,
          metalness: 0.8,
          roughness: 0.2,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });

      // Grouped Objects
      const group = createEntity('Group Container');
      addComponent(group, 'Transform', {
        position: [0, 3, -3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const childCube1 = createEntity('Child Cube 1', group);
      addComponent(childCube1, 'Transform', {
        position: [-1, 0, 0],
        rotation: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
      });
      addComponent(childCube1, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#a663cc',
          normalScale: 1,
          metalness: 0,
          roughness: 0.7,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });

      const childCube2 = createEntity('Child Cube 2', group);
      addComponent(childCube2, 'Transform', {
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        scale: [0.5, 0.5, 0.5],
      });
      addComponent(childCube2, 'MeshRenderer', {
        meshId: 'cube',
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        material: {
          shader: 'standard',
          materialType: 'solid',
          color: '#6c5ce7',
          normalScale: 1,
          metalness: 0,
          roughness: 0.7,
          emissive: '#000000',
          emissiveIntensity: 0,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        },
      });
    },
    {
      name: 'JSX Example Scene',
      description: 'Demonstrates JSX-style scene authoring (fallback to imperative ECS)',
      metadata: {
        author: 'System',
        tags: ['jsx', 'react', 'r3f-style'],
      },
    },
  );
};
