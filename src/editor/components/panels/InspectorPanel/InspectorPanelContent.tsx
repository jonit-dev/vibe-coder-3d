import React from 'react';
import { FiInfo } from 'react-icons/fi';

import { useEntityComponents, useHasComponent } from '@/core/hooks/useComponent';
import { componentRegistry } from '@/core/lib/component-registry';
import { MeshTypeSection } from '@/editor/components/panels/InspectorPanel/Mesh/MeshTypeSection';
import { MeshColliderSection } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { MeshRendererSection } from '@/editor/components/panels/InspectorPanel/MeshRenderer/MeshRendererSection';
import { RigidBodySection } from '@/editor/components/panels/InspectorPanel/RigidBody/RigidBodySection';
import { TransformSection } from '@/editor/components/panels/InspectorPanel/Transform/TransformSection';
import { InspectorSection } from '@/editor/components/ui/InspectorSection';
import { useMesh } from '@/editor/hooks/useMesh';
import { useMeshCollider } from '@/editor/hooks/useMeshCollider';
import { useMeshRenderer } from '@/editor/hooks/useMeshRenderer';
import { useRigidBody } from '@/editor/hooks/useRigidBody';
import { useTransform } from '@/editor/hooks/useTransform';
import { useEditorStore } from '@/editor/store/editorStore';

export const InspectorPanelContent: React.FC = () => {
  const selectedEntity = useEditorStore((s) => s.selectedId);
  const isPlaying = useEditorStore((s) => s.isPlaying);

  // Legacy hooks for existing components
  const { meshType, setMeshType } = useMesh(selectedEntity);
  const { position, rotation, scale, setPosition, setRotation, setScale } =
    useTransform(selectedEntity);
  const { rigidBody, setRigidBody } = useRigidBody(selectedEntity);
  const { meshCollider, setMeshCollider } = useMeshCollider(selectedEntity);
  const { meshRenderer, setMeshRenderer } = useMeshRenderer(selectedEntity);

  // Dynamic component system hooks
  const entityComponents = useEntityComponents(selectedEntity);
  const hasVelocity = useHasComponent(selectedEntity, 'velocity');
  const hasRigidBodyComponent = useHasComponent(selectedEntity, 'rigidBody');
  const hasMeshColliderComponent = useHasComponent(selectedEntity, 'meshCollider');
  const hasMeshRendererComponent = useHasComponent(selectedEntity, 'meshRenderer');

  // Helper function to check if a component is removable
  const isComponentRemovable = (componentId: string): boolean => {
    const component = componentRegistry.getComponent(componentId);
    return component?.removable !== false; // Default to true if not explicitly false
  };

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
      {/* Core Components - Always present but removability depends on component descriptor */}
      <MeshTypeSection meshType={meshType} setMeshType={setMeshType} />
      <TransformSection
        position={position}
        rotation={rotation}
        scale={scale}
        setPosition={setPosition}
        setRotation={setRotation}
        setScale={setScale}
      />

      {/* Dynamic Components - Only show if present, removability depends on component descriptor */}
      {(hasMeshRendererComponent || meshRenderer) && (
        <MeshRendererSection
          meshRenderer={meshRenderer}
          setMeshRenderer={setMeshRenderer}
          isPlaying={isPlaying}
        />
      )}

      {hasVelocity && (
        <VelocitySection entityId={selectedEntity} removable={isComponentRemovable('velocity')} />
      )}

      {(hasRigidBodyComponent || rigidBody) && (
        <RigidBodySection
          rigidBody={rigidBody}
          setRigidBody={setRigidBody}
          meshCollider={meshCollider}
          setMeshCollider={setMeshCollider}
          meshType={meshType}
          isPlaying={isPlaying}
        />
      )}

      {(hasMeshColliderComponent || meshCollider) && (
        <MeshColliderSection
          meshCollider={meshCollider}
          setMeshCollider={setMeshCollider}
          meshType={meshType}
          isPlaying={isPlaying}
        />
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-900 rounded border border-gray-600">
          <div className="text-xs text-gray-400 mb-1">Debug - Entity Components:</div>
          <div className="text-xs text-gray-300">
            {entityComponents.length > 0 ? entityComponents.join(', ') : 'None'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Component Removability:</div>
          <div className="text-xs text-gray-300">
            {entityComponents
              .map((id) => {
                const removable = isComponentRemovable(id);
                return `${id}: ${removable ? 'removable' : 'required'}`;
              })
              .join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

// Velocity Section Component with removability support
const VelocitySection: React.FC<{ entityId: number; removable?: boolean }> = ({
  entityId: _entityId,
  removable = true,
}) => {
  const handleRemoveVelocity = () => {
    // TODO: Implement velocity component removal via dynamic component manager
    console.log('Remove velocity component');
  };

  return (
    <InspectorSection
      title="Velocity"
      icon={<FiInfo />}
      headerColor="orange"
      removable={removable}
      onRemove={removable ? handleRemoveVelocity : undefined}
    >
      <div className="text-xs text-gray-400">Velocity component detected</div>
      <div className="text-xs text-yellow-400">TODO: Implement velocity component UI</div>
    </InspectorSection>
  );
};
