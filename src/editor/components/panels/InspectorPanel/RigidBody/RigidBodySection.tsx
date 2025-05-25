import React, { useState } from 'react';
import { FiZap } from 'react-icons/fi';

import { InspectorSection } from '@/editor/components/shared/InspectorSection';
import { isComponentRemovable } from '@/editor/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';

import { RigidBodyFields } from './RigidBodyFields';

export type BodyType = 'fixed' | 'kinematicVelocityBased' | 'kinematicPositionBased' | 'dynamic';

export interface IRigidBodyData {
  enabled: boolean;
  bodyType: BodyType;
  mass: number;
  gravityScale: number;
  canSleep: boolean;
  linearDamping: number;
  angularDamping: number;
  initialVelocity: [number, number, number];
  initialAngularVelocity: [number, number, number];
  material: {
    friction: number;
    restitution: number;
    density: number;
  };
}

export interface IMeshColliderData {
  enabled: boolean;
  colliderType: 'box' | 'sphere' | 'capsule' | 'convex' | 'mesh';
  isTrigger: boolean;
  center: [number, number, number];
  size: {
    width: number;
    height: number;
    depth: number;
    radius: number;
    capsuleRadius: number;
    capsuleHeight: number;
  };
  physicsMaterial: {
    friction: number;
    restitution: number;
    density: number;
  };
}

export interface IRigidBodySectionProps {
  rigidBody: IRigidBodyData | null;
  setRigidBody: (data: IRigidBodyData | null) => void;
  meshCollider?: IMeshColliderData | null;
  setMeshCollider?: (data: IMeshColliderData | null) => void;
  isPlaying: boolean;
}

export const RigidBodySection: React.FC<IRigidBodySectionProps> = ({
  rigidBody,
  setRigidBody,
  meshCollider,
  setMeshCollider,
  isPlaying,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const removable = isComponentRemovable(KnownComponentTypes.RIGID_BODY);

  const handleRemoveRigidBody = () => {
    setRigidBody(null);
  };

  const updateRigidBody = (updates: Partial<IRigidBodyData>) => {
    if (rigidBody) {
      setRigidBody({ ...rigidBody, ...updates });
    }
  };

  const updateMaterial = (updates: Partial<IRigidBodyData['material']>) => {
    if (rigidBody) {
      setRigidBody({
        ...rigidBody,
        material: { ...rigidBody.material, ...updates },
      });
    }
  };

  const updateInitialVelocity = (index: number, value: number) => {
    if (rigidBody) {
      const newVelocity = [...rigidBody.initialVelocity] as [number, number, number];
      newVelocity[index] = value;
      updateRigidBody({ initialVelocity: newVelocity });
    }
  };

  const updateInitialAngularVelocity = (index: number, value: number) => {
    if (rigidBody) {
      const newVelocity = [...rigidBody.initialAngularVelocity] as [number, number, number];
      newVelocity[index] = value;
      updateRigidBody({ initialAngularVelocity: newVelocity });
    }
  };

  // Don't render the section if rigidBody is null
  if (!rigidBody) {
    return null;
  }

  return (
    <InspectorSection
      title="Rigid Body"
      icon={<FiZap />}
      headerColor="orange"
      collapsible
      defaultCollapsed={false}
      removable={removable}
      onRemove={removable ? handleRemoveRigidBody : undefined}
    >
      <div className="space-y-3">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Enabled</span>
          <input
            type="checkbox"
            checked={rigidBody.enabled}
            onChange={(e) => updateRigidBody({ enabled: e.target.checked })}
            disabled={isPlaying}
            className="rounded border-gray-600 bg-black/30 text-orange-500 focus:ring-orange-500 disabled:opacity-50"
          />
        </div>

        {/* Body Type */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Body Type</label>
          <select
            value={rigidBody.bodyType}
            onChange={(e) => updateRigidBody({ bodyType: e.target.value as BodyType })}
            disabled={isPlaying}
            className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
          >
            <option value="fixed">Fixed (Immovable)</option>
            <option value="kinematicVelocityBased">Kinematic Velocity-Based</option>
            <option value="kinematicPositionBased">Kinematic Position-Based</option>
            <option value="dynamic">Dynamic (Physics Controlled)</option>
          </select>
        </div>

        {/* Missing Mesh Collider Warning */}
        {rigidBody.enabled && !meshCollider && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
            <div className="flex items-start space-x-2">
              <div className="text-yellow-400 text-sm">⚠️</div>
              <div className="flex-1">
                <div className="text-xs font-medium text-yellow-300 mb-1">
                  Missing Mesh Collider
                </div>
                <div className="text-xs text-yellow-200 mb-2">
                  A Rigid Body requires a Mesh Collider to participate in physics interactions.
                </div>
                {setMeshCollider && (
                  <button
                    onClick={() => {
                      const defaultCollider = {
                        enabled: true,
                        colliderType: 'box' as const,
                        isTrigger: false,
                        center: [0, 0, 0] as [number, number, number],
                        size: {
                          width: 1,
                          height: 1,
                          depth: 1,
                          radius: 0.5,
                          capsuleRadius: 0.5,
                          capsuleHeight: 2,
                        },
                        physicsMaterial: {
                          friction: 0.7,
                          restitution: 0.3,
                          density: 1,
                        },
                      };
                      setMeshCollider(defaultCollider);
                    }}
                    className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded transition-colors"
                  >
                    Add Mesh Collider
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mass (only for dynamic bodies) */}
        {rigidBody.bodyType === 'dynamic' && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Mass</label>
            <input
              type="number"
              value={rigidBody.mass}
              onChange={(e) => updateRigidBody({ mass: parseFloat(e.target.value) || 0.1 })}
              disabled={isPlaying}
              step={0.1}
              min={0.1}
              className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
            />
          </div>
        )}

        {/* Gravity Scale (only for dynamic bodies) */}
        {rigidBody.bodyType === 'dynamic' && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400">Gravity Scale</label>
            <input
              type="number"
              value={rigidBody.gravityScale}
              onChange={(e) => updateRigidBody({ gravityScale: parseFloat(e.target.value) || 0 })}
              disabled={isPlaying}
              step={0.1}
              className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
            />
          </div>
        )}

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-xs text-orange-400 hover:text-orange-300 text-left"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Settings
        </button>

        {showAdvanced && (
          <div className="space-y-3 pl-2 border-l border-gray-600/30">
            {/* Can Sleep (only for dynamic bodies) */}
            {rigidBody.bodyType === 'dynamic' && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Can Sleep</span>
                <input
                  type="checkbox"
                  checked={rigidBody.canSleep}
                  onChange={(e) => updateRigidBody({ canSleep: e.target.checked })}
                  disabled={isPlaying}
                  className="rounded border-gray-600 bg-black/30 text-orange-500 focus:ring-orange-500 disabled:opacity-50"
                />
              </div>
            )}

            {/* Damping (only for dynamic bodies) */}
            {rigidBody.bodyType === 'dynamic' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Linear Damping</label>
                  <input
                    type="number"
                    value={rigidBody.linearDamping}
                    onChange={(e) =>
                      updateRigidBody({ linearDamping: parseFloat(e.target.value) || 0 })
                    }
                    disabled={isPlaying}
                    step={0.1}
                    min={0}
                    max={10}
                    className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Angular Damping</label>
                  <input
                    type="number"
                    value={rigidBody.angularDamping}
                    onChange={(e) =>
                      updateRigidBody({ angularDamping: parseFloat(e.target.value) || 0 })
                    }
                    disabled={isPlaying}
                    step={0.1}
                    min={0}
                    max={10}
                    className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                  />
                </div>
              </>
            )}

            {/* Initial Velocities (only for dynamic bodies) */}
            {rigidBody.bodyType === 'dynamic' && (
              <>
                <RigidBodyFields
                  label="Initial Velocity"
                  value={rigidBody.initialVelocity}
                  onChange={updateInitialVelocity}
                  step={0.1}
                  sensitivity={0.1}
                />

                <RigidBodyFields
                  label="Initial Angular Velocity"
                  value={rigidBody.initialAngularVelocity}
                  onChange={updateInitialAngularVelocity}
                  step={0.1}
                  sensitivity={0.1}
                />
              </>
            )}

            {/* Physics Material Properties */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-400">Physics Material</div>

              <div className="space-y-1">
                <label className="text-xs text-gray-500">Friction</label>
                <input
                  type="number"
                  value={rigidBody.material.friction}
                  onChange={(e) => updateMaterial({ friction: parseFloat(e.target.value) || 0 })}
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
                  value={rigidBody.material.restitution}
                  onChange={(e) => updateMaterial({ restitution: parseFloat(e.target.value) || 0 })}
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
                  value={rigidBody.material.density}
                  onChange={(e) => updateMaterial({ density: parseFloat(e.target.value) || 0.1 })}
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
