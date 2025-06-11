import React from 'react';

import { IComponent } from '@/core/lib/ecs/IComponent';
import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { LightData } from '@/core/lib/ecs/components/definitions/LightComponent';
import { MeshColliderData } from '@/core/lib/ecs/components/definitions/MeshColliderComponent';
import { MeshRendererData } from '@/core/lib/ecs/components/definitions/MeshRendererComponent';
import { RigidBodyData } from '@/core/lib/ecs/components/definitions/RigidBodyComponent';
import { TransformData } from '@/core/lib/ecs/components/definitions/TransformComponent';
import { CameraAdapter } from '@/editor/components/inspector/adapters/CameraAdapter';
import { LightAdapter } from '@/editor/components/inspector/adapters/LightAdapter';
import { MeshColliderAdapter } from '@/editor/components/inspector/adapters/MeshColliderAdapter';
import { MeshRendererAdapter } from '@/editor/components/inspector/adapters/MeshRendererAdapter';
import { RigidBodyAdapter } from '@/editor/components/inspector/adapters/RigidBodyAdapter';
import { TransformAdapter } from '@/editor/components/inspector/adapters/TransformAdapter';

interface IComponentListProps {
  selectedEntity: number;
  isPlaying: boolean;
  hasTransform: boolean;
  hasMeshRenderer: boolean;
  hasRigidBody: boolean;
  hasMeshCollider: boolean;
  hasCamera: boolean;
  hasLight: boolean;
  getTransform: () => IComponent<TransformData> | null;
  getMeshRenderer: () => IComponent<MeshRendererData> | null;
  getRigidBody: () => IComponent<RigidBodyData> | null;
  getMeshCollider: () => IComponent<MeshColliderData> | null;
  getCamera: () => IComponent<CameraData> | null;
  getLight: () => IComponent<LightData> | null;
  addComponent: (type: string, data: unknown) => IComponent<unknown> | null;
  updateComponent: (type: string, data: unknown) => boolean;
  removeComponent: (type: string) => boolean;
}

export const ComponentList: React.FC<IComponentListProps> = ({
  selectedEntity,
  isPlaying,
  hasTransform,
  hasMeshRenderer,
  hasRigidBody,
  hasMeshCollider,
  hasCamera,
  hasLight,
  getTransform,
  getMeshRenderer,
  getRigidBody,
  getMeshCollider,
  getCamera,
  getLight,
  addComponent,
  updateComponent,
  removeComponent,
}) => {
  return (
    <>
      {/* Transform Component */}
      {hasTransform && (
        <TransformAdapter
          transformComponent={getTransform()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          entityId={selectedEntity}
        />
      )}

      {/* Camera Component */}
      {hasCamera && (
        <CameraAdapter
          cameraComponent={getCamera()}
          updateComponent={updateComponent}
          entityId={selectedEntity}
        />
      )}

      {/* MeshRenderer Component */}
      {hasMeshRenderer && (
        <MeshRendererAdapter
          meshRendererComponent={getMeshRenderer()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          isPlaying={isPlaying}
        />
      )}

      {/* RigidBody Component */}
      {hasRigidBody && (
        <RigidBodyAdapter
          rigidBodyComponent={getRigidBody()}
          addComponent={addComponent}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          isPlaying={isPlaying}
          hasMeshCollider={hasMeshCollider}
          getMeshCollider={getMeshCollider}
        />
      )}

      {/* MeshCollider Component */}
      {hasMeshCollider && (
        <MeshColliderAdapter
          meshColliderComponent={getMeshCollider()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          isPlaying={isPlaying}
        />
      )}

      {/* Camera Component */}
      {hasCamera && (
        <CameraAdapter
          cameraComponent={getCamera()}
          updateComponent={updateComponent}
          entityId={selectedEntity}
        />
      )}

      {/* Light Component */}
      {hasLight && (
        <LightAdapter
          lightComponent={getLight()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          entityId={selectedEntity}
        />
      )}
    </>
  );
};
