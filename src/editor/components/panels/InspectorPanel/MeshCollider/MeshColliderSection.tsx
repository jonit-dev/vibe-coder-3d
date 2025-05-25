import React, { useState } from 'react';
import { FiShield } from 'react-icons/fi';

import { InspectorSection } from '@/editor/components/shared/InspectorSection';
import { isComponentRemovable } from '@/editor/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';

import { ColliderFields } from './ColliderFields';

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

export const MeshColliderSection: React.FC<IMeshColliderSectionProps> = ({
  meshCollider,
  setMeshCollider,
  isPlaying,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const removable = isComponentRemovable(KnownComponentTypes.MESH_COLLIDER);

  const handleRemoveMeshCollider = () => {
    setMeshCollider(null);
  };

  // This function only toggles the enabled state, not the component existence
  const handleToggleEnabled = () => {
    if (meshCollider) {
      updateMeshCollider({ enabled: !meshCollider.enabled });
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

  // Don't render the section if meshCollider is null
  if (!meshCollider) {
    return null;
  }

  return (
    <InspectorSection
      title="Mesh Collider"
      icon={<FiShield />}
      headerColor="green"
      collapsible
      defaultCollapsed={false}
      removable={removable}
      onRemove={removable ? handleRemoveMeshCollider : undefined}
    >
      <div className="space-y-3">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Enable Collider</span>
          <button
            onClick={handleToggleEnabled}
            disabled={isPlaying}
            className={`
              relative inline-flex h-5 w-8 items-center rounded-full transition-colors
              ${meshCollider.enabled ? 'bg-green-500' : 'bg-gray-600'}
              ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                ${meshCollider.enabled ? 'translate-x-4' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Collider Type */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Collider Type</label>
          <select
            value={meshCollider.colliderType}
            onChange={(e) => updateMeshCollider({ colliderType: e.target.value as ColliderType })}
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
                onChange={(e) => updateSize({ radius: parseFloat(e.target.value) || 0.01 })}
                disabled={isPlaying}
                step={0.01}
                min={0.01}
                className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
              />
            </div>
          </div>
        )}

        {meshCollider.colliderType === 'capsule' && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-400">Size</div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Radius</label>
              <input
                type="number"
                value={meshCollider.size.capsuleRadius}
                onChange={(e) => updateSize({ capsuleRadius: parseFloat(e.target.value) || 0.01 })}
                disabled={isPlaying}
                step={0.01}
                min={0.01}
                className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Height</label>
              <input
                type="number"
                value={meshCollider.size.capsuleHeight}
                onChange={(e) => updateSize({ capsuleHeight: parseFloat(e.target.value) || 0.01 })}
                disabled={isPlaying}
                step={0.01}
                min={0.01}
                className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
              />
            </div>
          </div>
        )}

        {(meshCollider.colliderType === 'mesh' || meshCollider.colliderType === 'convex') && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
            <div className="text-xs text-blue-300">
              💡 {meshCollider.colliderType === 'mesh' ? 'Mesh' : 'Convex'} colliders use the
              entity's mesh geometry
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
          {showAdvanced ? '▼' : '▶'} Advanced Settings
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
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500">Restitution</label>
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
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500">Density</label>
                <input
                  type="number"
                  value={meshCollider.physicsMaterial.density}
                  onChange={(e) =>
                    updatePhysicsMaterial({ density: parseFloat(e.target.value) || 0.1 })
                  }
                  disabled={isPlaying}
                  step={0.1}
                  min={0.1}
                  className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </InspectorSection>
  );
};
