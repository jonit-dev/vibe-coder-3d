import React from 'react';

import { IComponent } from '@/core/lib/ecs/IComponent';
import { ICharacterControllerData } from '@/core/lib/ecs/components/accessors/types';
import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { LightData } from '@/core/lib/ecs/components/definitions/LightComponent';
import { MeshColliderData } from '@/core/lib/ecs/components/definitions/MeshColliderComponent';
import { MeshRendererData } from '@/core/lib/ecs/components/definitions/MeshRendererComponent';
import { RigidBodyData } from '@/core/lib/ecs/components/definitions/RigidBodyComponent';
import { TransformData } from '@/core/lib/ecs/components/definitions/TransformComponent';
import { CameraAdapter } from '@/editor/components/inspector/adapters/CameraAdapter';
import { CharacterControllerAdapter } from '@/editor/components/inspector/adapters/CharacterControllerAdapter';
import { LightAdapter } from '@/editor/components/inspector/adapters/LightAdapter';
import { MeshColliderAdapter } from '@/editor/components/inspector/adapters/MeshColliderAdapter';
import { MeshRendererAdapter } from '@/editor/components/inspector/adapters/MeshRendererAdapter';
import { RigidBodyAdapter } from '@/editor/components/inspector/adapters/RigidBodyAdapter';
// TerrainAdapter is rendered outside in InspectorPanelContent
import { TransformAdapter } from '@/editor/components/inspector/adapters/TransformAdapter';
// Terrain adapter integration pending

interface IComponentListProps {
  selectedEntity: number;
  isPlaying: boolean;
  hasTransform: boolean;
  hasMeshRenderer: boolean;
  hasRigidBody: boolean;
  hasMeshCollider: boolean;
  hasCamera: boolean;
  hasLight: boolean;
  hasCharacterController: boolean;
  // hasTerrain?: boolean;
  getTransform: () => IComponent<TransformData> | null;
  getMeshRenderer: () => IComponent<MeshRendererData> | null;
  getRigidBody: () => IComponent<RigidBodyData> | null;
  getMeshCollider: () => IComponent<MeshColliderData> | null;
  getCamera: () => IComponent<CameraData> | null;
  getLight: () => IComponent<LightData> | null;
  getCharacterController: () => IComponent<ICharacterControllerData> | null;
  // getTerrain?: () => IComponent<any> | null;
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
  hasCharacterController,
  getTransform,
  getMeshRenderer,
  getRigidBody,
  getMeshCollider,
  getCamera,
  getLight,
  getCharacterController,
  addComponent,
  updateComponent,
  removeComponent,
}) => {
  // Create hasComponent helper function
  const hasComponent = (type: string): boolean => {
    switch (type) {
      case 'Transform':
        return hasTransform;
      case 'MeshRenderer':
        return hasMeshRenderer;
      case 'RigidBody':
        return hasRigidBody;
      case 'MeshCollider':
        return hasMeshCollider;
      case 'Camera':
        return hasCamera;
      case 'Light':
        return hasLight;
      case 'CharacterController':
        return hasCharacterController;
      default:
        return false;
    }
  };

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
          addComponent={addComponent as (type: string, data: any) => IComponent<any> | null}
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

      {/* Light Component */}
      {hasLight && (
        <LightAdapter
          lightComponent={getLight()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          entityId={selectedEntity}
        />
      )}

      {/* CharacterController Component */}
      {hasCharacterController && (
        <CharacterControllerAdapter
          component={getCharacterController()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          addComponent={addComponent as (type: string, data: any) => IComponent<any> | null}
          hasComponent={hasComponent}
          isPlaying={isPlaying}
          isGrounded={false} // TODO: Connect to runtime state
        />
      )}

      {/* Terrain handled in InspectorPanelContent */}
    </>
  );
};
