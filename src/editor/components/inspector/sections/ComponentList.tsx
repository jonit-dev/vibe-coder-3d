import React from 'react';

import { CameraAdapter } from '@/editor/components/inspector/adapters/CameraAdapter';
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
  getTransform: () => any;
  getMeshRenderer: () => any;
  getRigidBody: () => any;
  getMeshCollider: () => any;
  getCamera: () => any;
  addComponent: (type: string, data: any) => any;
  updateComponent: (type: string, data: any) => boolean;
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
  getTransform,
  getMeshRenderer,
  getRigidBody,
  getMeshCollider,
  getCamera,
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
        <CameraAdapter cameraComponent={getCamera()} updateComponent={updateComponent} />
      )}

      {/* MeshRenderer Component */}
      {hasMeshRenderer && (
        <MeshRendererAdapter
          meshRendererComponent={getMeshRenderer()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          isPlaying={isPlaying}
          entityId={selectedEntity}
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

      {/* TODO: Camera and Light components will be added when their adapters are implemented */}
    </>
  );
};
