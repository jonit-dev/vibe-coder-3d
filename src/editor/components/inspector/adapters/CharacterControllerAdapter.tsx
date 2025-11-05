import React from 'react';

import { IComponent, KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ICharacterControllerData } from '@/core/lib/ecs/components/accessors/types';
import { CharacterControllerSection } from '@/editor/components/panels/InspectorPanel/CharacterController/CharacterControllerSection';

interface ICharacterControllerAdapterProps {
  component: IComponent<ICharacterControllerData> | null;
  updateComponent: (type: string, data: ICharacterControllerData | null) => boolean;
  removeComponent: (type: string) => boolean;
  addComponent: (type: string, data: unknown) => IComponent<unknown> | null;
  hasComponent: (type: string) => boolean;
  isPlaying: boolean;
  isGrounded?: boolean;
}

export const CharacterControllerAdapter: React.FC<ICharacterControllerAdapterProps> = ({
  component,
  updateComponent,
  removeComponent,
  addComponent,
  hasComponent,
  isPlaying,
  isGrounded = false,
}) => {
  const data = component?.data;

  // Don't render if no component data exists
  if (!data) return null;

  const setData = (nextData: ICharacterControllerData | null) => {
    if (nextData === null) {
      // Remove the character controller component
      removeComponent(KnownComponentTypes.CHARACTER_CONTROLLER);
    } else {
      // Update the character controller component
      updateComponent(KnownComponentTypes.CHARACTER_CONTROLLER, nextData);
    }
  };

  // Check if required physics components exist
  const hasMeshCollider = hasComponent(KnownComponentTypes.MESH_COLLIDER);

  const handleAddPhysicsComponents = () => {
    // Add MeshCollider with Capsule type (best for characters)
    // CharacterController does NOT use RigidBody - only collider for detection
    // This matches Unity's CharacterController behavior
    if (!hasMeshCollider) {
      addComponent(KnownComponentTypes.MESH_COLLIDER, {
        enabled: true,
        colliderType: 'capsule',
        isTrigger: false,
        center: [0, 0, 0], // Centered on mesh
        size: {
          width: 1,
          height: 1,
          depth: 1,
          radius: 0.25,
          capsuleRadius: 0.25, // Conservative: diameter = 0.5 (half of cube width)
          capsuleHeight: 0.5, // Cylinder portion (total with hemisphere caps ≈ 1.0)
        },
        physicsMaterial: {
          friction: 0.6,
          restitution: 0,
          density: 1,
        },
      });
    }
  };

  return (
    <CharacterControllerSection
      data={data}
      setData={setData}
      isPlaying={isPlaying}
      isGrounded={isGrounded}
      hasMeshCollider={hasMeshCollider}
      onAddPhysicsComponents={handleAddPhysicsComponents}
    />
  );
};
