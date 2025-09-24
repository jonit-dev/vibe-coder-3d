/**
 * Camera JSX Component - Maps React props to ECS Camera component
 * Provides R3F-style camera properties that sync with ECS system
 */

import React, { useEffect } from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import type { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';

import { useEntityContext } from './EntityContext';

export interface ICameraProps {
  /** Field of view in degrees */
  fov?: number;
  /** Near clipping plane */
  near?: number;
  /** Far clipping plane */
  far?: number;
  /** Projection type */
  projectionType?: 'perspective' | 'orthographic';
  /** Orthographic camera size */
  orthographicSize?: number;
  /** Camera depth for layering */
  depth?: number;
  /** Whether this is the main camera */
  isMain?: boolean;
  /** Clear flags */
  clearFlags?: 'skybox' | 'solidColor' | 'depthOnly' | 'dontClear';
  /** Background color */
  backgroundColor?: { r: number; g: number; b: number; a: number };
}

export const Camera: React.FC<ICameraProps> = ({
  fov = 50,
  near = 0.1,
  far = 100,
  projectionType = 'perspective',
  orthographicSize = 10,
  depth = 0,
  isMain = false,
  clearFlags = 'skybox',
  backgroundColor = { r: 0.0, g: 0.0, b: 0.0, a: 0 },
}) => {
  const { entityId } = useEntityContext();

  useEffect(() => {
    const cameraData: CameraData = {
      fov,
      near,
      far,
      projectionType,
      orthographicSize,
      depth,
      isMain,
      clearFlags,
      backgroundColor,
    };

    if (componentRegistry.hasComponent(entityId, 'Camera')) {
      // Update existing camera
      componentRegistry.updateComponent(entityId, 'Camera', cameraData);
    } else {
      // Add new camera component
      componentRegistry.addComponent(entityId, 'Camera', cameraData);
    }
  }, [
    entityId,
    fov,
    near,
    far,
    projectionType,
    orthographicSize,
    depth,
    isMain,
    clearFlags,
    backgroundColor,
  ]);

  // This component doesn't render anything - it just manages ECS data
  return null;
};

// Convenience component for perspective camera
export const PerspectiveCamera: React.FC<Omit<ICameraProps, 'projectionType'>> = (props) => (
  <Camera {...props} projectionType="perspective" />
);

// Convenience component for orthographic camera
export const OrthographicCamera: React.FC<Omit<ICameraProps, 'projectionType'>> = (props) => (
  <Camera {...props} projectionType="orthographic" />
);
