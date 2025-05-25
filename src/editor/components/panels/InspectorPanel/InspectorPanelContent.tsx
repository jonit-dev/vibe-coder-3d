import React from 'react';

console.log('🔥🔥🔥 INSPECTOR PANEL CONTENT IS LOADING - THIS IS A TEST 🔥🔥🔥');

import { MeshColliderSection } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { MeshRendererSection } from '@/editor/components/panels/InspectorPanel/MeshRenderer/MeshRendererSection';
import { RigidBodySection } from '@/editor/components/panels/InspectorPanel/RigidBody/RigidBodySection';
import { TransformSection } from '@/editor/components/panels/InspectorPanel/Transform/TransformSection';
import { useEntityComponents } from '@/editor/hooks/useEntityComponents';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { useEditorStore } from '@/editor/store/editorStore';

export const InspectorPanelContent: React.FC = () => {
  const selectedEntity = useEditorStore((s) => s.selectedId);
  const isPlaying = useEditorStore((s) => s.isPlaying);

  // Use new ECS system
  const {
    components,
    hasTransform,
    hasMeshRenderer,
    hasRigidBody,
    hasMeshCollider,
    getTransform,
    getMeshRenderer,
    getRigidBody,
    getMeshCollider,
    updateComponent,
  } = useEntityComponents(selectedEntity);

  React.useEffect(() => {
    if (selectedEntity != null) {
      console.log(`[Inspector] 🔍 Selected entity: ${selectedEntity}`);
      console.log(`[Inspector] - Entity components:`, components);
    }
  }, [selectedEntity, components]);

  if (selectedEntity == null) {
    return (
      <div className="p-3 text-gray-400 text-center">
        <div className="text-xs">No entity selected</div>
        <div className="text-xs text-gray-500 mt-1">Select an object from the hierarchy</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2 pb-4">
      {/* Transform Component */}
      {hasTransform && (
        <ProperTransformSection
          transformComponent={getTransform()}
          updateComponent={updateComponent}
          entityId={selectedEntity}
        />
      )}

      {/* MeshRenderer Component */}
      {hasMeshRenderer && (
        <ProperMeshRendererSection
          meshRendererComponent={getMeshRenderer()}
          updateComponent={updateComponent}
          isPlaying={isPlaying}
        />
      )}

      {/* RigidBody Component */}
      {hasRigidBody && (
        <ProperRigidBodySection
          rigidBodyComponent={getRigidBody()}
          updateComponent={updateComponent}
          isPlaying={isPlaying}
        />
      )}

      {/* MeshCollider Component */}
      {hasMeshCollider && (
        <ProperMeshColliderSection
          meshColliderComponent={getMeshCollider()}
          updateComponent={updateComponent}
          isPlaying={isPlaying}
        />
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-900 rounded border border-gray-600">
          <div className="text-xs text-gray-400 mb-1">Debug - Entity {selectedEntity}:</div>
          <div className="text-xs text-gray-300 mb-2">
            <strong>Components ({components.length}):</strong>{' '}
            {components.map((c) => c.type).join(', ') || 'None'}
          </div>
          <div className="text-xs text-gray-300 mb-2">
            <strong>Component Details:</strong>
            <ul className="ml-2 mt-1">
              {components.map((component) => (
                <li key={component.type} className="text-xs">
                  {component.type}: {JSON.stringify(component.data).substring(0, 50)}...
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Proper Transform section that uses the real TransformFields with drag functionality
const ProperTransformSection: React.FC<{
  transformComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  entityId: number;
}> = ({ transformComponent, updateComponent, entityId }) => {
  const data = transformComponent?.data;

  if (!data) return null;

  const handlePositionChange = React.useCallback(
    (position: [number, number, number]) => {
      console.log(`[Transform] Position changed for entity ${entityId}:`, position);
      updateComponent(KnownComponentTypes.TRANSFORM, {
        ...data,
        position,
      });
    },
    [data, updateComponent, entityId],
  );

  const handleRotationChange = React.useCallback(
    (rotation: [number, number, number]) => {
      console.log(`[Transform] Rotation changed for entity ${entityId}:`, rotation);
      updateComponent(KnownComponentTypes.TRANSFORM, {
        ...data,
        rotation,
      });
    },
    [data, updateComponent, entityId],
  );

  const handleScaleChange = React.useCallback(
    (scale: [number, number, number]) => {
      console.log(`[Transform] Scale changed for entity ${entityId}:`, scale);
      updateComponent(KnownComponentTypes.TRANSFORM, {
        ...data,
        scale,
      });
    },
    [data, updateComponent, entityId],
  );

  return (
    <TransformSection
      position={data.position || [0, 0, 0]}
      rotation={data.rotation || [0, 0, 0]}
      scale={data.scale || [1, 1, 1]}
      setPosition={handlePositionChange}
      setRotation={handleRotationChange}
      setScale={handleScaleChange}
    />
  );
};

// Adapter components to bridge ECS system with the proper component sections
const ProperMeshRendererSection: React.FC<{
  meshRendererComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  isPlaying: boolean;
}> = ({ meshRendererComponent, updateComponent, isPlaying }) => {
  const data = meshRendererComponent?.data;

  if (!data) return null;

  // Convert ECS data to the format expected by MeshRendererSection
  const meshRendererData = {
    enabled: data.enabled ?? true,
    castShadows: data.castShadows ?? true,
    receiveShadows: data.receiveShadows ?? true,
    material: {
      color: data.color || '#ffffff',
      metalness: data.metalness || 0.0,
      roughness: data.roughness || 0.5,
      emissive: data.emissive || '#000000',
      emissiveIntensity: data.emissiveIntensity || 0.0,
    },
  };

  const handleUpdate = (newData: any) => {
    updateComponent(KnownComponentTypes.MESH_RENDERER, newData);
  };

  return (
    <MeshRendererSection
      meshRenderer={meshRendererData}
      setMeshRenderer={handleUpdate}
      isPlaying={isPlaying}
    />
  );
};

const ProperRigidBodySection: React.FC<{
  rigidBodyComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  isPlaying: boolean;
}> = ({ rigidBodyComponent, updateComponent, isPlaying }) => {
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

  const handleUpdate = (newData: any) => {
    updateComponent(KnownComponentTypes.RIGID_BODY, newData);
  };

  return (
    <RigidBodySection
      rigidBody={rigidBodyData}
      setRigidBody={handleUpdate}
      meshCollider={null} // TODO: Get from ECS
      setMeshCollider={() => {}} // TODO: Implement
      isPlaying={isPlaying}
    />
  );
};

const ProperMeshColliderSection: React.FC<{
  meshColliderComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  isPlaying: boolean;
}> = ({ meshColliderComponent, updateComponent, isPlaying }) => {
  const data = meshColliderComponent?.data;

  if (!data) return null;

  // Convert ECS data to the format expected by MeshColliderSection
  const meshColliderData = {
    enabled: data.enabled ?? true,
    colliderType: data.colliderType || 'box',
    isTrigger: data.isTrigger ?? false,
    center: data.center || [0, 0, 0],
    size: {
      width: data.size?.width || 1,
      height: data.size?.height || 1,
      depth: data.size?.depth || 1,
      radius: data.size?.radius || 0.5,
      capsuleRadius: data.size?.capsuleRadius || 0.5,
      capsuleHeight: data.size?.capsuleHeight || 2,
    },
    physicsMaterial: {
      friction: data.physicsMaterial?.friction || 0.7,
      restitution: data.physicsMaterial?.restitution || 0.3,
      density: data.physicsMaterial?.density || 1,
    },
  };

  const handleUpdate = (newData: any) => {
    updateComponent(KnownComponentTypes.MESH_COLLIDER, newData);
  };

  return (
    <MeshColliderSection
      meshCollider={meshColliderData}
      setMeshCollider={handleUpdate}
      isPlaying={isPlaying}
    />
  );
};
