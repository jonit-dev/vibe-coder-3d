import React from 'react';
import { FiInfo } from 'react-icons/fi';

import { MaterialSection } from '@/editor/components/panels/InspectorPanel/Material/MaterialSection';
import { MeshTypeSection } from '@/editor/components/panels/InspectorPanel/Mesh/MeshTypeSection';
import { RigidBodySection } from '@/editor/components/panels/InspectorPanel/RigidBody/RigidBodySection';
import { TransformSection } from '@/editor/components/panels/InspectorPanel/Transform/TransformSection';
import { InspectorSection } from '@/editor/components/ui/InspectorSection';
import { useEntityInfo } from '@/editor/hooks/useEntityInfo';
import { useMaterial } from '@/editor/hooks/useMaterial';
import { useMesh } from '@/editor/hooks/useMesh';
import { useRigidBody } from '@/editor/hooks/useRigidBody';
import { useTransform } from '@/editor/hooks/useTransform';
import { useEditorStore } from '@/editor/store/editorStore';

export const InspectorPanelContent: React.FC = () => {
  const selectedEntity = useEditorStore((s) => s.selectedId);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const { meshType, setMeshType } = useMesh(selectedEntity);
  const { position, rotation, scale, setPosition, setRotation, setScale } =
    useTransform(selectedEntity);
  const { entityId, entityName } = useEntityInfo(selectedEntity);
  const { color, setColor } = useMaterial(selectedEntity);
  const { rigidBody, setRigidBody } = useRigidBody(selectedEntity);

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
      <EntityInfoSection entityId={entityId} entityName={entityName} />
      <MeshTypeSection meshType={meshType} setMeshType={setMeshType} />
      <TransformSection
        position={position}
        rotation={rotation}
        scale={scale}
        setPosition={setPosition}
        setRotation={setRotation}
        setScale={setScale}
      />
      <RigidBodySection rigidBody={rigidBody} setRigidBody={setRigidBody} isPlaying={isPlaying} />
      <MaterialSection color={color} setColor={setColor} />
    </div>
  );
};

// Compact Entity Info Section
export const EntityInfoSection: React.FC<{ entityId: number | null; entityName: string }> = ({
  entityId,
  entityName,
}) => (
  <InspectorSection title="Entity Info" icon={<FiInfo />} headerColor="cyan">
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">ID:</span>
        <div className="bg-black/30 border border-gray-600/30 rounded px-2 py-0.5">
          <span className="text-xs font-mono text-cyan-300">{entityId}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">Name:</span>
        <div className="bg-black/30 border border-gray-600/30 rounded px-2 py-0.5">
          <span className="text-xs text-gray-200">{entityName}</span>
        </div>
      </div>
    </div>
  </InspectorSection>
);
