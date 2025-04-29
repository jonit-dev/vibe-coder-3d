import React, { useEffect, useState } from 'react';

import { useEditorStore } from '@/editor/store/editorStore';
import {
  getEntityName,
  incrementWorldVersion,
  MeshType,
  MeshTypeEnum,
  Transform,
  updateMeshType,
} from '@core/lib/ecs';
import { transformSystem } from '@core/systems/transformSystem';

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

function meshTypeEnumToString(type: MeshTypeEnum | undefined): string {
  switch (type) {
    case MeshTypeEnum.Cube:
      return 'Cube';
    case MeshTypeEnum.Sphere:
      return 'Sphere';
    case MeshTypeEnum.Cylinder:
      return 'Cylinder';
    case MeshTypeEnum.Cone:
      return 'Cone';
    case MeshTypeEnum.Torus:
      return 'Torus';
    case MeshTypeEnum.Plane:
      return 'Plane';
    default:
      return 'unknown';
  }
}

function meshTypeStringToEnum(type: string): MeshTypeEnum | undefined {
  switch (type) {
    case 'Cube':
      return MeshTypeEnum.Cube;
    case 'Sphere':
      return MeshTypeEnum.Sphere;
    case 'Cylinder':
      return MeshTypeEnum.Cylinder;
    case 'Cone':
      return MeshTypeEnum.Cone;
    case 'Torus':
      return MeshTypeEnum.Torus;
    case 'Plane':
      return MeshTypeEnum.Plane;
    default:
      return undefined;
  }
}

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
  const [, forceUpdate] = useState(0);
  const [meshType, setMeshType] = useState<string>('unknown');
  const [meshRenderer, setMeshRenderer] = useState<IMeshRendererSettings>(meshRendererDefaults);
  const [activeTab, setActiveTab] = useState<TabType>('materials');

  // Always derive transform values from ECS
  const getVec3 = (arr: Float32Array | undefined): [number, number, number] =>
    arr && arr.length >= 3 ? [arr[0], arr[1], arr[2]] : [0, 0, 0];

  const position: [number, number, number] =
    selectedEntity != null ? getVec3(Transform.position[selectedEntity]) : [0, 0, 0];
  const rotation: [number, number, number] =
    selectedEntity != null ? getVec3(Transform.rotation[selectedEntity]) : [0, 0, 0];
  const scale: [number, number, number] =
    selectedEntity != null ? getVec3(Transform.scale[selectedEntity]) : [1, 1, 1];

  useEffect(() => {
    if (
      selectedEntity == null ||
      !Transform.position[selectedEntity] ||
      !Transform.rotation[selectedEntity] ||
      !Transform.scale[selectedEntity]
    ) {
      return;
    }
    const entityMeshType = meshTypeEnumToString(MeshType.type[selectedEntity]);
    setMeshType(entityMeshType);
  }, [selectedEntity]);

  if (
    selectedEntity == null ||
    !Transform.position[selectedEntity] ||
    !Transform.rotation[selectedEntity] ||
    !Transform.scale[selectedEntity]
  ) {
    return (
      <Card title="Inspector" className="max-w-md w-full mx-auto shadow-none">
        <div className="text-base-content text-opacity-50">No entity selected</div>
      </Card>
    );
  }

  const handleMeshTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    const meshTypeEnum = meshTypeStringToEnum(newType);
    if (meshTypeEnum === undefined) return;
    updateMeshType(selectedEntity, meshTypeEnum);
    setMeshType(newType);
    forceUpdate((v) => v + 1);
  };

  const handlePositionChange = (next: [number, number, number]) => {
    Transform.position[selectedEntity][0] = next[0];
    Transform.position[selectedEntity][1] = next[1];
    Transform.position[selectedEntity][2] = next[2];
    Transform.needsUpdate[selectedEntity] = 1;
    incrementWorldVersion();
    forceUpdate((v) => v + 1);
    if (onTransformChange) onTransformChange({ position: next, rotation, scale });
  };

  const handleRotationChange = (next: [number, number, number]) => {
    Transform.rotation[selectedEntity][0] = next[0];
    Transform.rotation[selectedEntity][1] = next[1];
    Transform.rotation[selectedEntity][2] = next[2];
    Transform.needsUpdate[selectedEntity] = 1;
    incrementWorldVersion();
    forceUpdate((v) => v + 1);
    if (onTransformChange) onTransformChange({ position, rotation: next, scale });
  };

  const handleScaleChange = (next: [number, number, number]) => {
    Transform.scale[selectedEntity][0] = next[0];
    Transform.scale[selectedEntity][1] = next[1];
    Transform.scale[selectedEntity][2] = next[2];
    Transform.needsUpdate[selectedEntity] = 1;
    incrementWorldVersion();
    forceUpdate((v) => v + 1);
    if (onTransformChange) onTransformChange({ position, rotation, scale: next });
    transformSystem();
  };

  return (
    <Card title="Inspector" className="max-w-md w-[380px] mx-auto shadow-none">
      <div className="h-[calc(100vh-120px)] overflow-y-auto pr-2">
        {/* Entity Info */}
        <div className="mb-2">
          <div className="flex items-center mb-1">
            <span className="label-text text-xs font-medium mr-2">Entity ID:</span>
            <span className="bg-base-300 rounded px-2 py-1 text-xs font-mono text-base-content/80">
              {selectedEntity}
            </span>
          </div>
          <div className="flex items-center mb-1">
            <span className="label-text text-xs font-medium mr-2">Name:</span>
            <span className="bg-base-300 rounded px-2 py-1 text-xs text-base-content/80">
              {getEntityName(selectedEntity) || `Entity ${selectedEntity}`}
            </span>
          </div>
        </div>

        {/* Mesh Type Section */}
        <Collapsible title="Mesh Type" defaultOpen>
          <div className="form-control mb-1">
            <label className="label py-1">
              <span className="label-text text-xs font-medium">Mesh Type</span>
            </label>
            <select
              value={meshType}
              onChange={handleMeshTypeChange}
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

        {/* Transform Section */}
        <Collapsible title="Transform" defaultOpen>
          <TransformFields label="Position" value={position} onChange={handlePositionChange} />
          <TransformFields label="Rotation" value={rotation} onChange={handleRotationChange} />
          <TransformFields label="Scale" value={scale} onChange={handleScaleChange} />
        </Collapsible>

        {/* Mesh Renderer Section */}
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
              onChange={(value) =>
                setMeshRenderer((m) => ({ ...m, anchorOverride: value || null }))
              }
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
      </div>
    </Card>
  );
};
