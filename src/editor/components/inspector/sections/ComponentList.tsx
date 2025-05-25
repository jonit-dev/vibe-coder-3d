import React from 'react';

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
  getTransform: () => any;
  getMeshRenderer: () => any;
  getRigidBody: () => any;
  getMeshCollider: () => any;
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
  getTransform,
  getMeshRenderer,
  getRigidBody,
  getMeshCollider,
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
          entityId={selectedEntity}
        />
      )}

      {/* MeshRenderer Component */}
      {hasMeshRenderer && (
        <MeshRendererAdapter
          meshRendererComponent={getMeshRenderer()}
          updateComponent={updateComponent}
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
          isPlaying={isPlaying}
        />
      )}
    </>
  );
};
