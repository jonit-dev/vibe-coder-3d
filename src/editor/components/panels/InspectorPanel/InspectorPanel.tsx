import React, { useEffect, useState } from 'react';

import { Card } from '@/editor/components/common/Card';
import { Collapsible } from '@/editor/components/common/Collapsible';
import { MeshType, MeshTypeEnum, Transform, updateMeshType } from '@core/lib/ecs';

import { TransformFields } from './TransformFields/TransformFields';

export interface IInspectorPanelProps {
  selectedEntity: number | null;
  onTransformChange: (transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }) => void;
}

const sectionTitle =
  'text-xs uppercase text-gray-400 font-semibold pb-1 mb-3 border-b border-gray-700';
const fieldWrapper = 'flex items-center justify-between mb-1';
const fieldLabel = 'text-xs';
const fieldValue = 'text-xs';
const fieldSelect = 'select select-xs select-bordered min-h-0 h-6 py-0';
const fieldCheckbox = 'checkbox checkbox-xs';

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
    default:
      return undefined;
  }
}

type TabType = 'materials' | 'lighting' | 'probes' | 'ray-tracing' | 'additional';

export const InspectorPanel: React.FC<IInspectorPanelProps> = ({
  selectedEntity,
  onTransformChange,
}) => {
  const [meshType, setMeshType] = useState<string>('unknown');
  const [entityName, setEntityName] = useState<string>('');
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [scale, setScale] = useState<[number, number, number]>([1, 1, 1]);
  const [meshRenderer, setMeshRenderer] = useState<IMeshRendererSettings>(meshRendererDefaults);
  const [activeTab, setActiveTab] = useState<TabType>('materials');

  useEffect(() => {
    if (selectedEntity === null) return;
    const entityMeshType = meshTypeEnumToString(MeshType.type[selectedEntity]);
    setMeshType(entityMeshType);
    setEntityName(`Entity ${selectedEntity}`);
    setPosition([
      Transform.position[selectedEntity][0],
      Transform.position[selectedEntity][1],
      Transform.position[selectedEntity][2],
    ]);
    setRotation([
      Transform.rotation[selectedEntity][0],
      Transform.rotation[selectedEntity][1],
      Transform.rotation[selectedEntity][2],
    ]);
    setScale([
      Transform.scale[selectedEntity][0],
      Transform.scale[selectedEntity][1],
      Transform.scale[selectedEntity][2],
    ]);
  }, [selectedEntity]);

  if (selectedEntity === null) {
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
  };

  const handlePositionChange = (next: [number, number, number]) => {
    setPosition(next);
    Transform.position[selectedEntity][0] = next[0];
    Transform.position[selectedEntity][1] = next[1];
    Transform.position[selectedEntity][2] = next[2];
    Transform.needsUpdate[selectedEntity] = 1;
  };

  const handleRotationChange = (next: [number, number, number]) => {
    setRotation(next);
    Transform.rotation[selectedEntity][0] = next[0];
    Transform.rotation[selectedEntity][1] = next[1];
    Transform.rotation[selectedEntity][2] = next[2];
    Transform.needsUpdate[selectedEntity] = 1;
  };

  const handleScaleChange = (next: [number, number, number]) => {
    setScale(next);
    Transform.scale[selectedEntity][0] = next[0];
    Transform.scale[selectedEntity][1] = next[1];
    Transform.scale[selectedEntity][2] = next[2];
    Transform.needsUpdate[selectedEntity] = 1;
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
              {entityName}
            </span>
          </div>
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
            </select>
          </div>
        </div>

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
              <div className={fieldWrapper}>
                <span className={fieldLabel}>Materials</span>
                <div className="badge badge-neutral badge-xs">1</div>
              </div>
            </div>
          </Collapsible>

          {/* Lighting subsection */}
          <Collapsible title="Lighting" defaultOpen>
            <div className={fieldWrapper}>
              <span className={fieldLabel}>Cast Shadows</span>
              <select
                className={fieldSelect}
                value={meshRenderer.castShadows ? 'On' : 'Off'}
                onChange={(e) =>
                  setMeshRenderer((m) => ({ ...m, castShadows: e.target.value === 'On' }))
                }
              >
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>

            <div className={fieldWrapper}>
              <span className={fieldLabel}>Static Shadow Caster</span>
              <input
                type="checkbox"
                className={fieldCheckbox}
                checked={meshRenderer.staticShadowCaster}
                onChange={(e) =>
                  setMeshRenderer((m) => ({ ...m, staticShadowCaster: e.target.checked }))
                }
              />
            </div>

            <div className={fieldWrapper}>
              <span className={fieldLabel}>Contribute Global Illum</span>
              <input
                type="checkbox"
                className={fieldCheckbox}
                checked={meshRenderer.contributeGlobalIllum}
                onChange={(e) =>
                  setMeshRenderer((m) => ({ ...m, contributeGlobalIllum: e.target.checked }))
                }
              />
            </div>

            <div className={`${fieldWrapper} opacity-50`}>
              <span className={fieldLabel}>Receive Global Illum</span>
              <input
                type="checkbox"
                className={fieldCheckbox}
                checked={meshRenderer.receiveGlobalIllum}
                disabled
                readOnly
              />
            </div>
          </Collapsible>

          {/* Probes subsection */}
          <Collapsible title="Probes">
            <div className={fieldWrapper}>
              <span className={fieldLabel}>Light Probes</span>
              <select
                className={fieldSelect}
                value={meshRenderer.lightProbes}
                onChange={(e) =>
                  setMeshRenderer((m) => ({ ...m, lightProbes: e.target.value as any }))
                }
              >
                <option value="Off">Off</option>
                <option value="Blend Probes">Blend Probes</option>
                <option value="Use Proxy Volume">Use Proxy Volume</option>
              </select>
            </div>

            <div className={fieldWrapper}>
              <span className={fieldLabel}>Anchor Override</span>
              <input
                className="input input-bordered input-xs w-24 h-6 py-0"
                type="text"
                value={meshRenderer.anchorOverride || ''}
                onChange={(e) => setMeshRenderer((m) => ({ ...m, anchorOverride: e.target.value }))}
                placeholder="None (Transform)"
              />
            </div>
          </Collapsible>

          {/* Ray Tracing subsection */}
          <Collapsible title="Ray Tracing">
            <div className={fieldWrapper}>
              <span className={fieldLabel}>Ray Tracing Mode</span>
              <select
                className={fieldSelect}
                value={meshRenderer.rayTracingMode}
                onChange={(e) =>
                  setMeshRenderer((m) => ({ ...m, rayTracingMode: e.target.value as any }))
                }
              >
                <option value="Off">Off</option>
                <option value="Dynamic Transform">Dynamic Transform</option>
                <option value="Static">Static</option>
              </select>
            </div>

            <div className={fieldWrapper}>
              <span className={fieldLabel}>Procedural Geometry</span>
              <input
                type="checkbox"
                className={fieldCheckbox}
                checked={meshRenderer.proceduralGeometry}
                onChange={(e) =>
                  setMeshRenderer((m) => ({ ...m, proceduralGeometry: e.target.checked }))
                }
              />
            </div>

            <div className={fieldWrapper}>
              <span className={fieldLabel}>Prefer Fast Trace</span>
              <input
                type="checkbox"
                className={fieldCheckbox}
                checked={meshRenderer.preferFastTrace}
                onChange={(e) =>
                  setMeshRenderer((m) => ({ ...m, preferFastTrace: e.target.checked }))
                }
              />
            </div>
          </Collapsible>

          {/* Additional Settings subsection */}
          <Collapsible title="Additional Settings">
            <div className={fieldWrapper}>
              <span className={fieldLabel}>Motion Vectors</span>
              <select
                className={fieldSelect}
                value={meshRenderer.motionVectors}
                onChange={(e) =>
                  setMeshRenderer((m) => ({ ...m, motionVectors: e.target.value as any }))
                }
              >
                <option value="Camera Motion">Camera Motion</option>
                <option value="Per Object Motion">Per Object Motion</option>
                <option value="Force No Motion">Force No Motion</option>
              </select>
            </div>

            <div className={fieldWrapper}>
              <span className={fieldLabel}>Dynamic Occlusion</span>
              <input
                type="checkbox"
                className={fieldCheckbox}
                checked={meshRenderer.dynamicOcclusion}
                onChange={(e) =>
                  setMeshRenderer((m) => ({ ...m, dynamicOcclusion: e.target.checked }))
                }
              />
            </div>

            <div className={fieldWrapper}>
              <span className={fieldLabel}>Rendering Layer</span>
              <select
                className={fieldSelect}
                value={meshRenderer.renderingLayer}
                onChange={(e) => setMeshRenderer((m) => ({ ...m, renderingLayer: e.target.value }))}
              >
                <option value="Default">Default</option>
                {/* Add more layers as needed */}
              </select>
            </div>
          </Collapsible>
        </Collapsible>
      </div>
    </Card>
  );
};
