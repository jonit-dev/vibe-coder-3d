import React, { useState } from 'react';
import { FiEye } from 'react-icons/fi';

import { InspectorSection } from '@/editor/components/shared/InspectorSection';
import { isComponentRemovable } from '@/editor/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';

export interface IMeshRendererData {
  meshId: string;
  materialId: string;
  enabled: boolean;
  castShadows: boolean;
  receiveShadows: boolean;
  material: {
    color: string;
    metalness: number;
    roughness: number;
    emissive: string;
    emissiveIntensity: number;
  };
}

export interface IMeshRendererSectionProps {
  meshRenderer: IMeshRendererData | null;
  setMeshRenderer: (data: IMeshRendererData | null) => void;
  isPlaying: boolean;
}

export const MeshRendererSection: React.FC<IMeshRendererSectionProps> = ({
  meshRenderer,
  setMeshRenderer,
  isPlaying: _isPlaying,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const removable = isComponentRemovable(KnownComponentTypes.MESH_RENDERER);

  const handleRemoveMeshRenderer = () => {
    setMeshRenderer(null);
  };

  const updateMeshRenderer = (updates: Partial<IMeshRendererData>) => {
    if (meshRenderer) {
      setMeshRenderer({ ...meshRenderer, ...updates });
    }
  };

  const updateMaterial = (updates: Partial<IMeshRendererData['material']>) => {
    if (meshRenderer) {
      setMeshRenderer({
        ...meshRenderer,
        material: { ...meshRenderer.material, ...updates },
      });
    }
  };

  // Don't render the section if meshRenderer is null
  if (!meshRenderer) {
    return null;
  }

  return (
    <InspectorSection
      title="Mesh Renderer"
      icon={<FiEye />}
      headerColor="cyan"
      collapsible
      defaultCollapsed={false}
      removable={removable}
      onRemove={removable ? handleRemoveMeshRenderer : undefined}
    >
      <div className="space-y-3">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Enabled</span>
          <input
            type="checkbox"
            checked={meshRenderer.enabled}
            onChange={(e) => updateMeshRenderer({ enabled: e.target.checked })}
            className="rounded border-gray-600 bg-black/30 text-cyan-500 focus:ring-cyan-500"
          />
        </div>

        {/* Mesh Selection */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Mesh</label>
          <select
            value={meshRenderer.meshId}
            onChange={(e) => updateMeshRenderer({ meshId: e.target.value })}
            className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200"
          >
            <option value="cube">Cube</option>
            <option value="sphere">Sphere</option>
            <option value="plane">Plane</option>
            <option value="cylinder">Cylinder</option>
            <option value="cone">Cone</option>
            <option value="torus">Torus</option>
            <option value="capsule">Capsule</option>
          </select>
        </div>

        {/* Material Properties */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-400">Material</div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Color</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={meshRenderer.material.color}
                onChange={(e) => updateMaterial({ color: e.target.value })}
                className="w-12 h-8 rounded border border-gray-600/30 bg-black/30"
              />
              <input
                type="text"
                value={meshRenderer.material.color}
                onChange={(e) => updateMaterial({ color: e.target.value })}
                className="flex-1 bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-xs text-cyan-400 hover:text-cyan-300 text-left"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Settings
        </button>

        {showAdvanced && (
          <div className="space-y-3 pl-2 border-l border-gray-600/30">
            {/* Advanced Material Properties */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Metalness</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={meshRenderer.material.metalness}
                  onChange={(e) => updateMaterial({ metalness: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">
                  {meshRenderer.material.metalness.toFixed(1)}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500">Roughness</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={meshRenderer.material.roughness}
                  onChange={(e) => updateMaterial({ roughness: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500">
                  {meshRenderer.material.roughness.toFixed(1)}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500">Emissive Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={meshRenderer.material.emissive}
                    onChange={(e) => updateMaterial({ emissive: e.target.value })}
                    className="w-12 h-8 rounded border border-gray-600/30 bg-black/30"
                  />
                  <input
                    type="text"
                    value={meshRenderer.material.emissive}
                    onChange={(e) => updateMaterial({ emissive: e.target.value })}
                    className="flex-1 bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500">Emissive Intensity</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={meshRenderer.material.emissiveIntensity}
                  onChange={(e) =>
                    updateMaterial({ emissiveIntensity: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="text-xs text-gray-500">
                  {meshRenderer.material.emissiveIntensity.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Cast Shadows */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Cast Shadows</span>
              <input
                type="checkbox"
                checked={meshRenderer.castShadows}
                onChange={(e) => updateMeshRenderer({ castShadows: e.target.checked })}
                className="rounded border-gray-600 bg-black/30 text-cyan-500 focus:ring-cyan-500"
              />
            </div>

            {/* Receive Shadows */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Receive Shadows</span>
              <input
                type="checkbox"
                checked={meshRenderer.receiveShadows}
                onChange={(e) => updateMeshRenderer({ receiveShadows: e.target.checked })}
                className="rounded border-gray-600 bg-black/30 text-cyan-500 focus:ring-cyan-500"
              />
            </div>
          </div>
        )}
      </div>
    </InspectorSection>
  );
};
