import React, { useEffect, useState } from 'react';

import { Card } from '@/editor/components/ui/inspector/InspectorCard';
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
const fieldLabel = 'text-xs text-gray-300 w-20 mb-1';

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

export const InspectorPanel: React.FC<IInspectorPanelProps> = ({ selectedEntity, onTransformChange }) => {
  const [meshType, setMeshType] = useState<string>('unknown');
  const [entityName, setEntityName] = useState<string>('');
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [scale, setScale] = useState<[number, number, number]>([1, 1, 1]);
  const [meshRenderer, setMeshRenderer] = useState<IMeshRendererSettings>(meshRendererDefaults);
  const [activeTab, setActiveTab] = useState<string>('materials');

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
            <span className="bg-base-300 rounded px-2 py-1 text-xs font-mono text-base-content/80">{selectedEntity}</span>
          </div>
          <div className="flex items-center mb-1">
            <span className="label-text text-xs font-medium mr-2">Name:</span>
            <span className="bg-base-300 rounded px-2 py-1 text-xs text-base-content/80">{entityName}</span>
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
        <div className="collapse collapse-arrow bg-transparent border border-base-300 rounded mb-2 shadow-none">
          <input type="checkbox" className="peer" defaultChecked />
          <div className="collapse-title flex items-center min-h-0 text-xs font-semibold py-0 px-1 bg-transparent">Transform</div>
          <div className="collapse-content px-2 pb-2">
            <TransformFields label="Position" value={position} onChange={handlePositionChange} />
            <TransformFields label="Rotation" value={rotation} onChange={handleRotationChange} />
            <TransformFields label="Scale" value={scale} onChange={handleScaleChange} />
          </div>
        </div>

        {/* Mesh Renderer Section */}
        <div className="collapse collapse-arrow bg-transparent border border-base-300 rounded mb-2 shadow-none">
          <input type="checkbox" className="peer" />
          <div className="collapse-title flex items-center min-h-0 text-xs font-semibold py-0 px-1 bg-transparent">Mesh Renderer</div>
          <div className="collapse-content px-2 pb-2">
            {/* Tabs */}
            <div className="tabs tabs-boxed text-xs mb-2">
              <a
                className={`tab ${activeTab === 'materials' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('materials')}
              >
                Materials
              </a>
              <a
                className={`tab ${activeTab === 'lighting' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('lighting')}
              >
                Lighting
              </a>
              <a
                className={`tab ${activeTab === 'probes' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('probes')}
              >
                Probes
              </a>
              <a
                className={`tab ${activeTab === 'ray-tracing' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('ray-tracing')}
              >
                Ray
              </a>
              <a
                className={`tab ${activeTab === 'additional' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('additional')}
              >
                More
              </a>
            </div>

            {/* Materials Tab */}
            {activeTab === 'materials' && (
              <div className="py-1">
                <div className="text-xs font-medium mb-1">Materials</div>
                <div className="badge badge-neutral badge-sm">1</div>
              </div>
            )}

            {/* Lighting Tab */}
            {activeTab === 'lighting' && (
              <div>
                <div className="form-control mb-1">
                  <label className="label py-1">
                    <span className="label-text text-xs">Cast Shadows</span>
                    <select
                      className="select select-bordered select-xs"
                      value={meshRenderer.castShadows ? 'On' : 'Off'}
                      onChange={e => setMeshRenderer(m => ({ ...m, castShadows: e.target.value === 'On' }))}
                    >
                      <option value="On">On</option>
                      <option value="Off">Off</option>
                    </select>
                  </label>
                </div>

                <div className="form-control mb-1">
                  <label className="label py-1 cursor-pointer">
                    <span className="label-text text-xs">Static Shadow Caster</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={meshRenderer.staticShadowCaster}
                      onChange={e => setMeshRenderer(m => ({ ...m, staticShadowCaster: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="form-control mb-1">
                  <label className="label py-1 cursor-pointer">
                    <span className="label-text text-xs">Contribute Global Illum</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={meshRenderer.contributeGlobalIllum}
                      onChange={e => setMeshRenderer(m => ({ ...m, contributeGlobalIllum: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="form-control opacity-50">
                  <label className="label py-1 cursor-pointer">
                    <span className="label-text text-xs">Receive Global Illum</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={meshRenderer.receiveGlobalIllum}
                      disabled
                      readOnly
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Probes Tab */}
            {activeTab === 'probes' && (
              <div>
                <div className="form-control mb-1">
                  <label className="label py-1">
                    <span className="label-text text-xs">Light Probes</span>
                    <select
                      className="select select-bordered select-xs"
                      value={meshRenderer.lightProbes}
                      onChange={e => setMeshRenderer(m => ({ ...m, lightProbes: e.target.value as any }))}
                    >
                      <option value="Off">Off</option>
                      <option value="Blend Probes">Blend Probes</option>
                      <option value="Use Proxy Volume">Use Proxy Volume</option>
                    </select>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs">Anchor Override</span>
                    <input
                      className="input input-bordered input-xs w-24"
                      type="text"
                      value={meshRenderer.anchorOverride || ''}
                      onChange={e => setMeshRenderer(m => ({ ...m, anchorOverride: e.target.value }))}
                      placeholder="None (Transform)"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Ray Tracing Tab */}
            {activeTab === 'ray-tracing' && (
              <div>
                <div className="form-control mb-1">
                  <label className="label py-1">
                    <span className="label-text text-xs">Ray Tracing Mode</span>
                    <select
                      className="select select-bordered select-xs"
                      value={meshRenderer.rayTracingMode}
                      onChange={e => setMeshRenderer(m => ({ ...m, rayTracingMode: e.target.value as any }))}
                    >
                      <option value="Off">Off</option>
                      <option value="Dynamic Transform">Dynamic Transform</option>
                      <option value="Static">Static</option>
                    </select>
                  </label>
                </div>

                <div className="form-control mb-1">
                  <label className="label py-1 cursor-pointer">
                    <span className="label-text text-xs">Procedural Geometry</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={meshRenderer.proceduralGeometry}
                      onChange={e => setMeshRenderer(m => ({ ...m, proceduralGeometry: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label py-1 cursor-pointer">
                    <span className="label-text text-xs">Prefer Fast Trace</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={meshRenderer.preferFastTrace}
                      onChange={e => setMeshRenderer(m => ({ ...m, preferFastTrace: e.target.checked }))}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Additional Settings Tab */}
            {activeTab === 'additional' && (
              <div>
                <div className="form-control mb-1">
                  <label className="label py-1">
                    <span className="label-text text-xs">Motion Vectors</span>
                    <select
                      className="select select-bordered select-xs"
                      value={meshRenderer.motionVectors}
                      onChange={e => setMeshRenderer(m => ({ ...m, motionVectors: e.target.value as any }))}
                    >
                      <option value="Camera Motion">Camera Motion</option>
                      <option value="Per Object Motion">Per Object Motion</option>
                      <option value="Force No Motion">Force No Motion</option>
                    </select>
                  </label>
                </div>

                <div className="form-control mb-1">
                  <label className="label py-1 cursor-pointer">
                    <span className="label-text text-xs">Dynamic Occlusion</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={meshRenderer.dynamicOcclusion}
                      onChange={e => setMeshRenderer(m => ({ ...m, dynamicOcclusion: e.target.checked }))}
                    />
                  </label>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs">Rendering Layer</span>
                    <select
                      className="select select-bordered select-xs"
                      value={meshRenderer.renderingLayer}
                      onChange={e => setMeshRenderer(m => ({ ...m, renderingLayer: e.target.value }))}
                    >
                      <option value="Default">Default</option>
                      {/* Add more layers as needed */}
                    </select>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
