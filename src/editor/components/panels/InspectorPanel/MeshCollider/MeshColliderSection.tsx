import React, { useState } from 'react';
import { FiShield } from 'react-icons/fi';

import { InspectorSection } from '@/editor/components/ui/InspectorSection';

import { ColliderFields } from './ColliderFields';
import { ColliderScalarField } from './ColliderScalarField';

export type ColliderType = 'box' | 'sphere' | 'capsule' | 'mesh' | 'convex';

export interface IMeshColliderData {
  enabled: boolean;
  colliderType: ColliderType;
  isTrigger: boolean;
  center: [number, number, number];
  size: {
    // Box collider
    width: number;
    height: number;
    depth: number;
    // Sphere collider
    radius: number;
    // Capsule collider
    capsuleRadius: number;
    capsuleHeight: number;
  };
  physicsMaterial: {
    friction: number;
    restitution: number;
    density: number;
  };
}

export interface IMeshColliderSectionProps {
  meshCollider: IMeshColliderData | null;
  setMeshCollider: (data: IMeshColliderData | null) => void;
  meshType?: string;
  isPlaying: boolean;
}

const DEFAULT_MESH_COLLIDER: IMeshColliderData = {
  enabled: true,
  colliderType: 'box',
  isTrigger: false,
  center: [0, 0, 0],
  size: {
    width: 1,
    height: 1,
    depth: 1,
    radius: 0.5,
    capsuleRadius: 0.5,
    capsuleHeight: 2,
  },
  physicsMaterial: {
    friction: 0.3,
    restitution: 0.3,
    density: 1,
  },
};

// Auto-detect appropriate collider type based on mesh type
const getDefaultColliderType = (meshType?: string): ColliderType => {
  switch (meshType) {
    case 'Sphere':
      return 'sphere';
    case 'Capsule':
      return 'capsule';
    case 'Cylinder':
    case 'Cone':
    case 'Torus':
      return 'convex';
    default:
      return 'box';
  }
};

export const MeshColliderSection: React.FC<IMeshColliderSectionProps> = ({
  meshCollider,
  setMeshCollider,
  meshType,
  isPlaying,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleMeshCollider = () => {
    if (meshCollider) {
      setMeshCollider(null);
    } else {
      const defaultCollider = {
        ...DEFAULT_MESH_COLLIDER,
        colliderType: getDefaultColliderType(meshType),
      };
      setMeshCollider(defaultCollider);
    }
  };

  const updateMeshCollider = (updates: Partial<IMeshColliderData>) => {
    if (meshCollider) {
      setMeshCollider({ ...meshCollider, ...updates });
    }
  };

  const updatePhysicsMaterial = (updates: Partial<IMeshColliderData['physicsMaterial']>) => {
    if (meshCollider) {
      setMeshCollider({
        ...meshCollider,
        physicsMaterial: { ...meshCollider.physicsMaterial, ...updates },
      });
    }
  };

  const updateSize = (updates: Partial<IMeshColliderData['size']>) => {
    if (meshCollider) {
      setMeshCollider({
        ...meshCollider,
        size: { ...meshCollider.size, ...updates },
      });
    }
  };

  const updateCenter = (index: number, value: number) => {
    if (meshCollider) {
      const newCenter = [...meshCollider.center] as [number, number, number];
      newCenter[index] = value;
      updateMeshCollider({ center: newCenter });
    }
  };

  return (
    <InspectorSection
      title="Mesh Collider"
      icon={<FiShield />}
      headerColor="green"
      collapsible
      defaultCollapsed={false}
    >
      <div className="space-y-3">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Enable Collider</span>
          <button
            onClick={handleToggleMeshCollider}
            disabled={isPlaying}
            className={`
              relative inline-flex h-5 w-8 items-center rounded-full transition-colors
              ${meshCollider ? 'bg-green-500' : 'bg-gray-600'}
              ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                ${meshCollider ? 'translate-x-4' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {meshCollider && (
          <>
            {/* Collider Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Collider Type</label>
              <select
                value={meshCollider.colliderType}
                onChange={(e) =>
                  updateMeshCollider({ colliderType: e.target.value as ColliderType })
                }
                disabled={isPlaying}
                className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
              >
                <option value="box">Box Collider</option>
                <option value="sphere">Sphere Collider</option>
                <option value="capsule">Capsule Collider</option>
                <option value="convex">Convex Hull</option>
                <option value="mesh">Mesh Collider</option>
              </select>
            </div>

            {/* Collider Center */}
            <ColliderFields
              label="Center"
              value={meshCollider.center}
              onChange={(center: [number, number, number]) => updateMeshCollider({ center })}
              step={0.01}
              sensitivity={0.1}
            />

            {/* Collider Size - varies by type */}
            {meshCollider.colliderType === 'box' && (
              <ColliderFields
                label="Size"
                value={[meshCollider.size.width, meshCollider.size.height, meshCollider.size.depth]}
                onChange={(size: [number, number, number]) =>
                  updateSize({ width: size[0], height: size[1], depth: size[2] })
                }
                step={0.01}
                sensitivity={0.1}
              />
            )}

            {meshCollider.colliderType === 'sphere' && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-400">Size</div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Radius</label>
                  <input
                    type="number"
                    value={meshCollider.size.radius}
                    onChange={(e) => updateSize({ radius: parseFloat(e.target.value) || 0 })}
                    disabled={isPlaying}
                    step={0.1}
                    min={0.01}
                    className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {meshCollider.colliderType === 'capsule' && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-400">Size</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Radius</label>
                    <input
                      type="number"
                      value={meshCollider.size.capsuleRadius}
                      onChange={(e) =>
                        updateSize({ capsuleRadius: parseFloat(e.target.value) || 0 })
                      }
                      disabled={isPlaying}
                      step={0.1}
                      min={0.01}
                      className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Height</label>
                    <input
                      type="number"
                      value={meshCollider.size.capsuleHeight}
                      onChange={(e) =>
                        updateSize({ capsuleHeight: parseFloat(e.target.value) || 0 })
                      }
                      disabled={isPlaying}
                      step={0.1}
                      min={0.01}
                      className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {(meshCollider.colliderType === 'convex' || meshCollider.colliderType === 'mesh') && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1">
                  ℹ️ {meshCollider.colliderType === 'convex' ? 'Convex Hull' : 'Mesh'} colliders use
                  the original mesh geometry. Only center offset can be adjusted.
                </div>
              </div>
            )}

            {meshCollider.colliderType === 'sphere' && (
              <ColliderScalarField
                label="Radius"
                value={meshCollider.size.radius}
                onChange={(radius: number) => updateSize({ radius })}
                step={0.01}
                sensitivity={0.1}
                min={0.01}
                defaultValue={0.5}
              />
            )}

            {meshCollider.colliderType === 'capsule' && (
              <>
                <ColliderScalarField
                  label="Radius"
                  value={meshCollider.size.capsuleRadius}
                  onChange={(capsuleRadius: number) => updateSize({ capsuleRadius })}
                  step={0.01}
                  sensitivity={0.1}
                  min={0.01}
                  defaultValue={0.5}
                />
                <ColliderScalarField
                  label="Height"
                  value={meshCollider.size.capsuleHeight}
                  onChange={(capsuleHeight: number) => updateSize({ capsuleHeight })}
                  step={0.01}
                  sensitivity={0.1}
                  min={0.01}
                  defaultValue={2}
                />
              </>
            )}

            {(meshCollider.colliderType === 'convex' || meshCollider.colliderType === 'mesh') && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1">
                  ℹ️ {meshCollider.colliderType === 'convex' ? 'Convex Hull' : 'Mesh'} colliders use
                  the original mesh geometry. Only center offset can be adjusted.
                </div>
              </div>
            )}

            {/* Is Trigger */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Is Trigger</span>
              <input
                type="checkbox"
                checked={meshCollider.isTrigger}
                onChange={(e) => updateMeshCollider({ isTrigger: e.target.checked })}
                disabled={isPlaying}
                className="rounded border-gray-600 bg-black/30 text-green-500 focus:ring-green-500 disabled:opacity-50"
              />
            </div>

            {/* Advanced Settings Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full text-xs text-green-400 hover:text-green-300 text-left"
            >
              {showAdvanced ? '▼' : '▶'} Physics Material
            </button>

            {showAdvanced && (
              <div className="space-y-3 pl-2 border-l border-gray-600/30">
                {/* Physics Material Properties */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-400">Physics Material</div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Friction</label>
                    <input
                      type="number"
                      value={meshCollider.physicsMaterial.friction}
                      onChange={(e) =>
                        updatePhysicsMaterial({ friction: parseFloat(e.target.value) || 0 })
                      }
                      disabled={isPlaying}
                      step={0.1}
                      min={0}
                      max={2}
                      className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                    />
                    <div className="text-xs text-gray-500">How much friction this surface has</div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Bounciness</label>
                    <input
                      type="number"
                      value={meshCollider.physicsMaterial.restitution}
                      onChange={(e) =>
                        updatePhysicsMaterial({ restitution: parseFloat(e.target.value) || 0 })
                      }
                      disabled={isPlaying}
                      step={0.1}
                      min={0}
                      max={1}
                      className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                    />
                    <div className="text-xs text-gray-500">How bouncy this surface is</div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Density</label>
                    <input
                      type="number"
                      value={meshCollider.physicsMaterial.density}
                      onChange={(e) =>
                        updatePhysicsMaterial({ density: parseFloat(e.target.value) || 0 })
                      }
                      disabled={isPlaying}
                      step={0.1}
                      min={0.01}
                      className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                    />
                    <div className="text-xs text-gray-500">Mass per unit volume</div>
                  </div>
                </div>
              </div>
            )}

            {isPlaying && (
              <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded px-2 py-1">
                ⚠️ Collider settings cannot be modified during play mode
              </div>
            )}
          </>
        )}
      </div>
    </InspectorSection>
  );
};
