import React from 'react';
import { FiInfo } from 'react-icons/fi';

console.log('🔥🔥🔥 INSPECTOR PANEL CONTENT IS LOADING - THIS IS A TEST 🔥🔥🔥');

import { TransformSection } from '@/editor/components/panels/InspectorPanel/Transform/TransformSection';
import { InspectorSection } from '@/editor/components/ui/InspectorSection';
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
    removeComponent,
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
        <MeshRendererSection
          meshRendererComponent={getMeshRenderer()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          isPlaying={isPlaying}
        />
      )}

      {/* RigidBody Component */}
      {hasRigidBody && (
        <RigidBodySection
          rigidBodyComponent={getRigidBody()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          isPlaying={isPlaying}
        />
      )}

      {/* MeshCollider Component */}
      {hasMeshCollider && (
        <MeshColliderSection
          meshColliderComponent={getMeshCollider()}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
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

// Simplified component sections for now - can be enhanced later
const MeshRendererSection: React.FC<{
  meshRendererComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  removeComponent: (type: string) => boolean;
  isPlaying: boolean;
}> = ({ meshRendererComponent, removeComponent, isPlaying }) => {
  const data = meshRendererComponent?.data;

  if (!data) return null;

  return (
    <InspectorSection
      title="Mesh Renderer"
      icon={<FiInfo />}
      headerColor="green"
      removable={!isPlaying}
      onRemove={() => removeComponent(KnownComponentTypes.MESH_RENDERER)}
    >
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-400">Mesh ID:</label>
          <div className="text-xs text-white">{data.meshId}</div>
        </div>
        <div>
          <label className="text-xs text-gray-400">Material ID:</label>
          <div className="text-xs text-white">{data.materialId}</div>
        </div>
      </div>
    </InspectorSection>
  );
};

const RigidBodySection: React.FC<{
  rigidBodyComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  removeComponent: (type: string) => boolean;
  isPlaying: boolean;
}> = ({ rigidBodyComponent, removeComponent, isPlaying }) => {
  const data = rigidBodyComponent?.data;

  if (!data) return null;

  return (
    <InspectorSection
      title="Rigid Body"
      icon={<FiInfo />}
      headerColor="orange"
      removable={!isPlaying}
      onRemove={() => removeComponent(KnownComponentTypes.RIGID_BODY)}
    >
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-400">Type:</label>
          <div className="text-xs text-white">{data.bodyType || data.type}</div>
        </div>
        <div>
          <label className="text-xs text-gray-400">Mass:</label>
          <div className="text-xs text-white">{data.mass}</div>
        </div>
        {data.isStatic && <div className="text-xs text-blue-400">Static Body</div>}
      </div>
    </InspectorSection>
  );
};

const MeshColliderSection: React.FC<{
  meshColliderComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  removeComponent: (type: string) => boolean;
  isPlaying: boolean;
}> = ({ meshColliderComponent, removeComponent, isPlaying }) => {
  const data = meshColliderComponent?.data;

  if (!data) return null;

  return (
    <InspectorSection
      title="Mesh Collider"
      icon={<FiInfo />}
      headerColor="purple"
      removable={!isPlaying}
      onRemove={() => removeComponent(KnownComponentTypes.MESH_COLLIDER)}
    >
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-400">Type:</label>
          <div className="text-xs text-white">{data.colliderType || data.type}</div>
        </div>
        {data.meshId && (
          <div>
            <label className="text-xs text-gray-400">Mesh ID:</label>
            <div className="text-xs text-white">{data.meshId}</div>
          </div>
        )}
        {data.isTrigger && <div className="text-xs text-green-400">Trigger</div>}
      </div>
    </InspectorSection>
  );
};
