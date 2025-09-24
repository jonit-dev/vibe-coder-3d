/**
 * Transform JSX Component - Maps React props to ECS Transform component
 * Provides R3F-style transform properties that sync with ECS system
 */

import React, { useEffect } from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import type { TransformData } from '@/core/lib/ecs/components/definitions/TransformComponent';

import { useEntityContext } from './EntityContext';

export interface ITransformProps {
  /** Position as [x, y, z] array */
  position?: [number, number, number];
  /** Rotation as [x, y, z] Euler angles in radians */
  rotation?: [number, number, number];
  /** Scale as [x, y, z] array */
  scale?: [number, number, number];
}

export const Transform: React.FC<ITransformProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}) => {
  const { entityId } = useEntityContext();

  useEffect(() => {
    const transformData: TransformData = {
      position,
      rotation,
      scale,
    };

    if (componentRegistry.hasComponent(entityId, 'Transform')) {
      // Update existing transform
      componentRegistry.updateComponent(entityId, 'Transform', transformData);
    } else {
      // Add new transform component
      componentRegistry.addComponent(entityId, 'Transform', transformData);
    }
  }, [entityId, position, rotation, scale]);

  // This component doesn't render anything - it just manages ECS data
  return null;
};

// Convenience component for position-only transforms
export const Position: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <Transform position={position} />
);

// Convenience component for rotation-only transforms
export const Rotation: React.FC<{ rotation: [number, number, number] }> = ({ rotation }) => (
  <Transform rotation={rotation} />
);

// Convenience component for scale-only transforms
export const Scale: React.FC<{ scale: [number, number, number] }> = ({ scale }) => (
  <Transform scale={scale} />
);
