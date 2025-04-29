import React from 'react';

import {
  IMeshRendererSettings,
  meshRendererDefaults,
  MeshRendererSection,
} from '@/editor/components/panels/InspectorPanel/Mesh/MeshRendererSection';
import { MeshTypeSection } from '@/editor/components/panels/InspectorPanel/Mesh/MeshTypeSection';
import { TransformSection } from '@/editor/components/panels/InspectorPanel/Transform/TransformSection';
import { useEntityInfo } from '@/editor/hooks/useEntityInfo';
import { useMesh } from '@/editor/hooks/useMesh';
import { useTransform } from '@/editor/hooks/useTransform';
import { useEditorStore } from '@/editor/store/editorStore';

import { Card } from '../../common/Card';

export const InspectorPanel: React.FC = () => {
  const selectedEntity = useEditorStore((s: { selectedId: number | null }) => s.selectedId);
  const { meshType, setMeshType } = useMesh(selectedEntity);
  const { position, rotation, scale, setPosition, setRotation, setScale } =
    useTransform(selectedEntity);
  const { entityId, entityName } = useEntityInfo(selectedEntity);
  const [meshRenderer, setMeshRenderer] =
    React.useState<IMeshRendererSettings>(meshRendererDefaults);

  if (selectedEntity == null) {
    return (
      <Card title="Inspector" className="max-w-md w-full mx-auto shadow-none">
        <div className="text-base-content text-opacity-50">No entity selected</div>
      </Card>
    );
  }

  return (
    <Card title="Inspector" className="max-w-md w-[380px] mx-auto shadow-none">
      <div className="h-[calc(100vh-120px)] overflow-y-auto pr-2">
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
        <MeshRendererSection meshRenderer={meshRenderer} setMeshRenderer={setMeshRenderer} />
      </div>
    </Card>
  );
};

// Entity Info Section
export const EntityInfoSection: React.FC<{ entityId: number | null; entityName: string }> = ({
  entityId,
  entityName,
}) => (
  <div className="mb-2">
    <div className="flex items-center mb-1">
      <span className="label-text text-xs font-medium mr-2">Entity ID:</span>
      <span className="bg-base-300 rounded px-2 py-1 text-xs font-mono text-base-content/80">
        {entityId}
      </span>
    </div>
    <div className="flex items-center mb-1">
      <span className="label-text text-xs font-medium mr-2">Name:</span>
      <span className="bg-base-300 rounded px-2 py-1 text-xs text-base-content/80">
        {entityName}
      </span>
    </div>
  </div>
);
