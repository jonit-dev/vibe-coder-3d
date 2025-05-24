import React, { useState } from 'react';
import { FiEye } from 'react-icons/fi';

import { InspectorSection } from '@/editor/components/ui/InspectorSection';

export interface IMeshRendererData {
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

const DEFAULT_MESH_RENDERER: IMeshRendererData = {
  enabled: true,
  castShadows: true,
  receiveShadows: true,
  material: {
    color: '#ffffff',
    metalness: 0,
    roughness: 0.5,
    emissive: '#000000',
    emissiveIntensity: 0,
  },
};

export const MeshRendererSection: React.FC<IMeshRendererSectionProps> = ({
  meshRenderer,
  setMeshRenderer,
  isPlaying,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleMeshRenderer = () => {
    if (meshRenderer) {
      setMeshRenderer(null);
    } else {
      setMeshRenderer(DEFAULT_MESH_RENDERER);
    }
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

  return (
    <InspectorSection
      title="Mesh Renderer"
      icon={<FiEye />}
      headerColor="cyan"
      collapsible
      defaultCollapsed={false}
    >
      <div className="space-y-3">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Enable Renderer</span>
          <button
            onClick={handleToggleMeshRenderer}
            className={`
              relative inline-flex h-5 w-8 items-center rounded-full transition-colors
              ${meshRenderer ? 'bg-blue-500' : 'bg-gray-600'}
              cursor-pointer
            `}
          >
            <span
              className={`
                inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                ${meshRenderer ? 'translate-x-4' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {meshRenderer && (
          <>
            {/* Shadow Settings */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-400">Shadows</div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Cast Shadows</span>
                <input
                  type="checkbox"
                  checked={meshRenderer.castShadows}
                  onChange={(e) => updateMeshRenderer({ castShadows: e.target.checked })}
                  className="rounded border-gray-600 bg-black/30 text-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Receive Shadows</span>
                <input
                  type="checkbox"
                  checked={meshRenderer.receiveShadows}
                  onChange={(e) => updateMeshRenderer({ receiveShadows: e.target.checked })}
                  className="rounded border-gray-600 bg-black/30 text-blue-500 focus:ring-blue-500"
                />
              </div>
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

            {/* Advanced Material Settings Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full text-xs text-blue-400 hover:text-blue-300 text-left"
            >
              {showAdvanced ? '▼' : '▶'} Advanced Material
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
                      max="2"
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
              </div>
            )}
          </>
        )}
      </div>
    </InspectorSection>
  );
};
