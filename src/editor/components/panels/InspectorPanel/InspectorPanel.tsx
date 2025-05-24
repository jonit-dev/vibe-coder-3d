import React from 'react';
import { FiInfo, FiSettings } from 'react-icons/fi';

import { MeshRendererSection } from '@/editor/components/panels/InspectorPanel/Mesh/MeshRendererSection';
import { MeshTypeSection } from '@/editor/components/panels/InspectorPanel/Mesh/MeshTypeSection';
import { TransformSection } from '@/editor/components/panels/InspectorPanel/Transform/TransformSection';
import { InspectorSection } from '@/editor/components/ui/InspectorSection';
import { SidePanel } from '@/editor/components/ui/SidePanel';
import { useEntityInfo } from '@/editor/hooks/useEntityInfo';
import { useMaterial } from '@/editor/hooks/useMaterial';
import { useMesh } from '@/editor/hooks/useMesh';
import { useTransform } from '@/editor/hooks/useTransform';
import { useEditorStore } from '@/editor/store/editorStore';

export const InspectorPanel: React.FC = () => {
  const selectedEntity = useEditorStore((s: { selectedId: number | null }) => s.selectedId);
  const { meshType, setMeshType } = useMesh(selectedEntity);
  const { position, rotation, scale, setPosition, setRotation, setScale } =
    useTransform(selectedEntity);
  const { entityId, entityName } = useEntityInfo(selectedEntity);
  const { color, setColor } = useMaterial(selectedEntity);

  if (selectedEntity == null) {
    return (
      <SidePanel title="Inspector" width="w-96" position="right" icon={<FiSettings />}>
        <div className="p-4 text-gray-400 text-center">No entity selected</div>
      </SidePanel>
    );
  }

  return (
    <SidePanel
      title="Inspector"
      subtitle={`Entity ${selectedEntity}`}
      width="w-96"
      position="right"
      icon={<FiSettings />}
    >
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
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
        <MeshRendererSection color={color} setColor={setColor} />
      </div>
    </SidePanel>
  );
};

// Entity Info Section
export const EntityInfoSection: React.FC<{ entityId: number | null; entityName: string }> = ({
  entityId,
  entityName,
}) => (
  <InspectorSection title="Entity Info" icon={<FiInfo />} headerColor="cyan">
    <div className="space-y-1.5">
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
