import { useFrame } from '@react-three/fiber';
import React, { useEffect, useRef } from 'react';
import { Group } from 'three';

import {
  createEntity,
  destroyEntity,
  entityToObject,
  objectToEntity,
  Transform,
} from '@core/lib/ecs';

export interface EntityProps {
  position?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  visible?: boolean;
  children?: React.ReactNode;
  onUpdate?: (entityId: number, delta: number) => void;
}

/**
 * Entity component - Core abstraction for game objects
 *
 * Manages the lifecycle of an ECS entity and connects it to the Three.js scene graph
 */
export const Entity: React.FC<EntityProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0, 1],
  scale = [1, 1, 1],
  visible = true,
  children,
  onUpdate,
}) => {
  // Reference to the Three.js Group object
  const groupRef = useRef<Group>(null);

  // Store entity ID in a ref
  const entityRef = useRef<number | null>(null);

  // Create entity and set up initial transform values
  useEffect(() => {
    if (!groupRef.current) return;

    // Create a new ECS entity
    const entity = createEntity();
    entityRef.current = entity;

    // Initialize transform component with provided values
    Transform.position[entity][0] = position[0];
    Transform.position[entity][1] = position[1];
    Transform.position[entity][2] = position[2];

    Transform.rotation[entity][0] = rotation[0];
    Transform.rotation[entity][1] = rotation[1];
    Transform.rotation[entity][2] = rotation[2];
    Transform.rotation[entity][3] = rotation[3];

    Transform.scale[entity][0] = scale[0];
    Transform.scale[entity][1] = scale[1];
    Transform.scale[entity][2] = scale[2];

    // Link the entity to the Three.js object
    entityToObject.set(entity, groupRef.current);
    objectToEntity.set(groupRef.current, entity);

    return () => {
      // Clean up entity and mappings when component unmounts
      if (entityRef.current !== null) {
        destroyEntity(entityRef.current);
        entityRef.current = null;
      }
    };
  }, []);

  // Update transform when props change
  useEffect(() => {
    const entity = entityRef.current;
    if (entity === null) return;

    // Update position
    Transform.position[entity][0] = position[0];
    Transform.position[entity][1] = position[1];
    Transform.position[entity][2] = position[2];

    // Update rotation
    Transform.rotation[entity][0] = rotation[0];
    Transform.rotation[entity][1] = rotation[1];
    Transform.rotation[entity][2] = rotation[2];
    Transform.rotation[entity][3] = rotation[3];

    // Update scale
    Transform.scale[entity][0] = scale[0];
    Transform.scale[entity][1] = scale[1];
    Transform.scale[entity][2] = scale[2];

    // Mark for update
    Transform.needsUpdate[entity] = 1;
  }, [position, rotation, scale]);

  // Call onUpdate callback if provided
  useFrame((_, delta) => {
    if (entityRef.current !== null && onUpdate) {
      onUpdate(entityRef.current, delta);
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      {children}
    </group>
  );
};
