import React from 'react';

import { IComponent, KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { MeshColliderData } from '@/core/lib/ecs/components/definitions/MeshColliderComponent';
import { RigidBodyData } from '@/core/lib/ecs/components/definitions/RigidBodyComponent';
import { RigidBodySection } from '@/editor/components/panels/InspectorPanel/RigidBody/RigidBodySection';

interface IRigidBodyAdapterProps {
  rigidBodyComponent: IComponent<RigidBodyData> | null;
  addComponent: (
    type: string,
    data: RigidBodyData | MeshColliderData,
  ) => IComponent<RigidBodyData | MeshColliderData> | null;
  updateComponent: (type: string, data: RigidBodyData | MeshColliderData) => boolean;
  removeComponent: (type: string) => boolean;
  isPlaying: boolean;
  hasMeshCollider: boolean;
  getMeshCollider: () => IComponent<MeshColliderData> | null;
}

export const RigidBodyAdapter: React.FC<IRigidBodyAdapterProps> = ({
  rigidBodyComponent,
  addComponent,
  updateComponent,
  removeComponent,
  isPlaying,
  hasMeshCollider,
  getMeshCollider,
}) => {
  const data = rigidBodyComponent?.data;

  if (!data) return null;

  // Convert ECS data to the format expected by RigidBodySection
  const rigidBodyData = {
    enabled: data.enabled ?? true,
    bodyType: data.bodyType || data.type || 'dynamic',
    mass: data.mass || 1,
    gravityScale: data.gravityScale || 1,
    canSleep: data.canSleep ?? true,
    linearDamping: data.linearDamping || 0,
    angularDamping: data.angularDamping || 0,
    initialVelocity: data.initialVelocity || [0, 0, 0],
    initialAngularVelocity: data.initialAngularVelocity || [0, 0, 0],
    material: {
      friction: data.material?.friction || 0.7,
      restitution: data.material?.restitution || 0.3,
      density: data.material?.density || 1,
    },
  };

  // Get mesh collider data if it exists
  const meshColliderComponent = hasMeshCollider ? getMeshCollider() : null;
  const meshColliderData = meshColliderComponent?.data
    ? {
        enabled: meshColliderComponent.data.enabled ?? true,
        colliderType: meshColliderComponent.data.colliderType || 'box',
        isTrigger: meshColliderComponent.data.isTrigger ?? false,
        center: meshColliderComponent.data.center || [0, 0, 0],
        size: {
          width: meshColliderComponent.data.size?.width || 1,
          height: meshColliderComponent.data.size?.height || 1,
          depth: meshColliderComponent.data.size?.depth || 1,
          radius: meshColliderComponent.data.size?.radius || 0.5,
          capsuleRadius: meshColliderComponent.data.size?.capsuleRadius || 0.5,
          capsuleHeight: meshColliderComponent.data.size?.capsuleHeight || 2,
        },
        physicsMaterial: {
          friction: meshColliderComponent.data.physicsMaterial?.friction || 0.7,
          restitution: meshColliderComponent.data.physicsMaterial?.restitution || 0.3,
          density: meshColliderComponent.data.physicsMaterial?.density || 1,
        },
      }
    : null;

  const handleRigidBodyUpdate = (newData: RigidBodyData | null) => {
    if (newData === null) {
      // Remove rigid body component
      removeComponent(KnownComponentTypes.RIGID_BODY);
    } else {
      // Update rigid body component
      updateComponent(KnownComponentTypes.RIGID_BODY, newData);
    }
  };

  const handleMeshColliderUpdate = (newData: MeshColliderData | null) => {
    console.log('[RigidBodyAdapter] Mesh collider update:', { newData, hasMeshCollider });
    if (newData === null) {
      // Remove mesh collider component
      removeComponent(KnownComponentTypes.MESH_COLLIDER);
    } else {
      // Add or update mesh collider component
      if (hasMeshCollider) {
        console.log('[RigidBodyAdapter] Updating existing mesh collider');
        updateComponent(KnownComponentTypes.MESH_COLLIDER, newData);
      } else {
        console.log('[RigidBodyAdapter] Adding new mesh collider');
        addComponent(KnownComponentTypes.MESH_COLLIDER, newData);
      }
    }
  };

  return (
    <RigidBodySection
      rigidBody={rigidBodyData}
      setRigidBody={handleRigidBodyUpdate}
      meshCollider={meshColliderData}
      setMeshCollider={handleMeshColliderUpdate}
      isPlaying={isPlaying}
    />
  );
};
