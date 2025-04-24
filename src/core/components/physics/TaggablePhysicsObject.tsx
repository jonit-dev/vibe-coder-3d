import { RapierRigidBody, RigidBody, RigidBodyProps } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import { Quaternion, Vector3 } from 'three';

import { EntityMesh } from '@/core/components/EntityMesh';
import { useTag } from '@/core/hooks/useTag';

export interface ITaggablePhysicsObjectProps extends RigidBodyProps {
  objectId: number | string;
  tags?: string[];
  onStateChange?: (
    id: number | string,
    state: 'default' | 'fallen' | 'active' | 'disabled',
    data?: any,
  ) => void;
  children?: React.ReactNode;
  fallenAngleThreshold?: number;
  activeTags?: Record<string, boolean>;
  performance?: 'low' | 'medium' | 'high';
}

/**
 * A physics object component that integrates with the tagging system
 * Automatically tracks object state (fallen, active, etc.) and applies tags
 */
const TaggablePhysicsObject = ({
  objectId,
  tags = [],
  onStateChange,
  children,
  fallenAngleThreshold = 45,
  activeTags = {},
  performance = 'medium',
  ...rigidBodyProps
}: ITaggablePhysicsObjectProps) => {
  const bodyRef = useRef<RapierRigidBody>(null);
  const [objectState, setObjectState] = useState<'default' | 'fallen' | 'active' | 'disabled'>(
    'default',
  );

  // Apply base tags
  useEffect(() => {
    // Apply all provided base tags
    tags.forEach((tag) => useTag(tag, bodyRef));
  }, [tags]);

  // Apply dynamic tags based on state and activeTags
  useTag('object-fallen', bodyRef, objectState === 'fallen');
  useTag('object-active', bodyRef, objectState === 'active');
  useTag('object-default', bodyRef, objectState === 'default');
  useTag('object-disabled', bodyRef, objectState === 'disabled');

  // Apply custom active tags
  Object.entries(activeTags).forEach(([tag, isActive]) => {
    useTag(tag, bodyRef, isActive);
  });

  // Update object state based on physics
  useEffect(() => {
    // Logic to check object state (e.g., if fallen)
    const checkObjectState = () => {
      if (bodyRef.current) {
        const rotation = bodyRef.current.rotation();
        const quat = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        const up = new Vector3(0, 1, 0);
        const objectUp = new Vector3(0, 1, 0).applyQuaternion(quat);
        const angle = up.angleTo(objectUp) * (180 / Math.PI);

        // Check if object has fallen
        if (angle > fallenAngleThreshold && objectState !== 'fallen') {
          setObjectState('fallen');
          if (onStateChange) onStateChange(objectId, 'fallen', { angle });
        }
      }
    };

    // Set up interval for checking state
    const interval = setInterval(checkObjectState, 100);
    return () => clearInterval(interval);
  }, [objectId, fallenAngleThreshold, objectState, onStateChange]);

  return (
    <RigidBody ref={bodyRef} {...rigidBodyProps}>
      <EntityMesh performance={performance}>{children}</EntityMesh>
    </RigidBody>
  );
};

export default TaggablePhysicsObject;
