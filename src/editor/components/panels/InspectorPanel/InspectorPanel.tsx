import React from 'react';

import { useEntityInfo } from '@/editor/hooks/useEntityInfo';
import { useMesh } from '@/editor/hooks/useMesh';
import { useTransform } from '@/editor/hooks/useTransform';
import { useEditorStore } from '@/editor/store/editorStore';

import { Card } from '../../common/Card';
import { Collapsible } from '../../common/Collapsible';

import { MeshRendererField } from './MeshRendererField';
import { TransformFields } from './TransformFields/TransformFields';

// MeshRenderer settings interface
interface IMeshRendererSettings {
  castShadows: boolean;
  staticShadowCaster: boolean;
  contributeGlobalIllum: boolean;
  receiveGlobalIllum: boolean;
  lightProbes: 'Off' | 'Blend Probes' | 'Use Proxy Volume';
  anchorOverride: string | null;
  rayTracingMode: 'Off' | 'Dynamic Transform' | 'Static';
  proceduralGeometry: boolean;
  preferFastTrace: boolean;
  motionVectors: 'Camera Motion' | 'Per Object Motion' | 'Force No Motion';
  dynamicOcclusion: boolean;
  renderingLayer: string;
}

const meshRendererDefaults: IMeshRendererSettings = {
  castShadows: true,
  staticShadowCaster: false,
  contributeGlobalIllum: false,
  receiveGlobalIllum: false,
  lightProbes: 'Blend Probes',
  anchorOverride: null,
  rayTracingMode: 'Dynamic Transform',
  proceduralGeometry: false,
  preferFastTrace: false,
  motionVectors: 'Per Object Motion',
  dynamicOcclusion: true,
  renderingLayer: 'Default',
};

type TabType = 'materials' | 'lighting' | 'probes' | 'ray-tracing' | 'additional';

interface IInspectorPanelProps {
  onTransformChange?: (transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }) => void;
}

export const InspectorPanel: React.FC<IInspectorPanelProps> = ({ onTransformChange }) => {
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

// Mesh Type Section
export const MeshTypeSection: React.FC<{
  meshType: string;
  setMeshType: (type: string) => void;
}> = ({ meshType, setMeshType }) => (
  <Collapsible title="Mesh Type" defaultOpen>
    <div className="form-control mb-1">
      <label className="label py-1">
        <span className="label-text text-xs font-medium">Mesh Type</span>
      </label>
      <select
        value={meshType}
        onChange={(e) => setMeshType(e.target.value)}
        className="select select-bordered select-sm w-full"
      >
        <option value="unknown" disabled>
          Select mesh type
        </option>
        <option value="Cube">Cube</option>
        <option value="Sphere">Sphere</option>
        <option value="Cylinder">Cylinder</option>
        <option value="Cone">Cone</option>
        <option value="Torus">Torus</option>
        <option value="Plane">Plane</option>
      </select>
    </div>
  </Collapsible>
);

// Transform Section
export const TransformSection: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  setPosition: (next: [number, number, number]) => void;
  setRotation: (next: [number, number, number]) => void;
  setScale: (next: [number, number, number]) => void;
}> = ({ position, rotation, scale, setPosition, setRotation, setScale }) => (
  <Collapsible title="Transform" defaultOpen>
    <TransformFields label="Position" value={position} onChange={setPosition} />
    <TransformFields label="Rotation" value={rotation} onChange={setRotation} />
    <TransformFields label="Scale" value={scale} onChange={setScale} />
  </Collapsible>
);

// Mesh Renderer Section (kept as is for now)
export const MeshRendererSection: React.FC<{
  meshRenderer: IMeshRendererSettings;
  setMeshRenderer: React.Dispatch<React.SetStateAction<IMeshRendererSettings>>;
}> = ({ meshRenderer, setMeshRenderer }) => (
  <Collapsible title="Mesh Renderer">
    {/* Materials subsection */}
    <Collapsible title="Materials" defaultOpen>
      <div className="py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs">Materials</span>
          <div className="badge badge-neutral badge-xs">1</div>
        </div>
      </div>
    </Collapsible>
    {/* Lighting subsection */}
    <Collapsible title="Lighting" defaultOpen>
      <MeshRendererField
        label="Cast Shadows"
        value={meshRenderer.castShadows ? 'On' : 'Off'}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, castShadows: value === 'On' }))}
        type="select"
        options={[
          { value: 'On', label: 'On' },
          { value: 'Off', label: 'Off' },
        ]}
      />
      <MeshRendererField
        label="Static Shadow Caster"
        value={meshRenderer.staticShadowCaster}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, staticShadowCaster: value }))}
        type="checkbox"
      />
      <MeshRendererField
        label="Contribute Global Illum"
        value={meshRenderer.contributeGlobalIllum}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, contributeGlobalIllum: value }))}
        type="checkbox"
      />
      <div className="flex items-center justify-between mb-1 opacity-50">
        <span className="text-xs">Receive Global Illum</span>
        <input
          type="checkbox"
          className="checkbox checkbox-xs"
          checked={meshRenderer.receiveGlobalIllum}
          disabled
          readOnly
        />
      </div>
    </Collapsible>
    {/* Probes subsection */}
    <Collapsible title="Probes">
      <MeshRendererField
        label="Light Probes"
        value={meshRenderer.lightProbes}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, lightProbes: value as any }))}
        type="select"
        options={[
          { value: 'Off', label: 'Off' },
          { value: 'Blend Probes', label: 'Blend Probes' },
          { value: 'Use Proxy Volume', label: 'Use Proxy Volume' },
        ]}
      />
      <MeshRendererField
        label="Anchor Override"
        value={meshRenderer.anchorOverride || ''}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, anchorOverride: value || null }))}
        type="text"
      />
    </Collapsible>
    {/* Ray Tracing subsection */}
    <Collapsible title="Ray Tracing">
      <MeshRendererField
        label="Ray Tracing Mode"
        value={meshRenderer.rayTracingMode}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, rayTracingMode: value as any }))}
        type="select"
        options={[
          { value: 'Off', label: 'Off' },
          { value: 'Dynamic Transform', label: 'Dynamic Transform' },
          { value: 'Static', label: 'Static' },
        ]}
      />
      <MeshRendererField
        label="Procedural Geometry"
        value={meshRenderer.proceduralGeometry}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, proceduralGeometry: value }))}
        type="checkbox"
      />
      <MeshRendererField
        label="Prefer Fast Trace"
        value={meshRenderer.preferFastTrace}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, preferFastTrace: value }))}
        type="checkbox"
      />
    </Collapsible>
    {/* Additional subsection */}
    <Collapsible title="Additional">
      <MeshRendererField
        label="Motion Vectors"
        value={meshRenderer.motionVectors}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, motionVectors: value as any }))}
        type="select"
        options={[
          { value: 'Camera Motion', label: 'Camera Motion' },
          { value: 'Per Object Motion', label: 'Per Object Motion' },
          { value: 'Force No Motion', label: 'Force No Motion' },
        ]}
      />
      <MeshRendererField
        label="Dynamic Occlusion"
        value={meshRenderer.dynamicOcclusion}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, dynamicOcclusion: value }))}
        type="checkbox"
      />
      <MeshRendererField
        label="Rendering Layer"
        value={meshRenderer.renderingLayer}
        onChange={(value) => setMeshRenderer((m) => ({ ...m, renderingLayer: value }))}
        type="text"
      />
    </Collapsible>
  </Collapsible>
);
