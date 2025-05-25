import React, { useState } from 'react';
import { FiZap } from 'react-icons/fi';

import { PhysicsBodyType } from '@/core/lib/physics';
import { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { InspectorSection } from '@/editor/components/shared/InspectorSection';

export interface IRigidBodyData {
  enabled: boolean;
  bodyType: PhysicsBodyType;
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

export interface IRigidBodySectionProps {
  rigidBody: IRigidBodyData | null;
  setRigidBody: (data: IRigidBodyData | null) => void;
  meshCollider: IMeshColliderData | null;
  setMeshCollider: (data: IMeshColliderData | null) => void;
  meshType?: string;
  isPlaying: boolean;
}

export const RigidBodySection: React.FC<IRigidBodySectionProps> = ({
  rigidBody,
  setRigidBody,
  meshCollider,
  setMeshCollider,
  meshType,
  isPlaying,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle removal of rigid body and auto-create mesh collider when needed
  const handleRemoveRigidBody = () => {
    setRigidBody(null);
  };

  const handleAutoCreateMeshCollider = () => {
    console.log('[RigidBodySection] Add Mesh Collider button clicked', { meshCollider });
    if (!meshCollider) {
      const getDefaultColliderType = (meshType?: string) => {
        switch (meshType) {
          case 'Sphere':
            return 'sphere' as const;
          case 'Capsule':
            return 'capsule' as const;
          case 'Cylinder':
          case 'Cone':
          case 'Torus':
            return 'convex' as const;
          default:
            return 'box' as const;
        }
      };

      const defaultMeshCollider: IMeshColliderData = {
        enabled: true,
        colliderType: getDefaultColliderType(meshType),
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
      console.log('[RigidBodySection] Calling setMeshCollider with:', defaultMeshCollider);
      setMeshCollider(defaultMeshCollider);
    }
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
      removable={true}
      onRemove={handleRemoveRigidBody}
    >
      <div className="space-y-3">
        {/* Helper for mesh collider */}
        {!meshCollider && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
            <div className="text-xs text-orange-300 mb-2">
              💡 Rigid bodies work best with a collider
            </div>
            <button
              onClick={handleAutoCreateMeshCollider}
              disabled={isPlaying}
              className="text-xs bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-white disabled:opacity-50"
            >
              Add Mesh Collider
            </button>
          </div>
        )}

        {
          <>
            {/* Body Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Body Type</label>
              <select
                value={rigidBody.bodyType}
                onChange={(e) => updateRigidBody({ bodyType: e.target.value as PhysicsBodyType })}
                disabled={isPlaying}
                className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
              >
                <option value="dynamic">Dynamic</option>
                <option value="kinematicPosition">Kinematic (Position)</option>
                <option value="kinematicVelocity">Kinematic (Velocity)</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>

            {/* Mass */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400">Mass</label>
              <input
                type="number"
                value={rigidBody.mass}
                onChange={(e) => updateRigidBody({ mass: parseFloat(e.target.value) || 0 })}
                disabled={isPlaying}
                step={0.1}
                min={0.01}
                className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
              />
            </div>

            {/* Gravity Scale */}
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

            {/* Can Sleep */}
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

            {/* Advanced Settings Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full text-xs text-orange-400 hover:text-orange-300 text-left"
            >
              {showAdvanced ? '▼' : '▶'} Advanced Settings
            </button>

            {showAdvanced && (
              <div className="space-y-3 pl-2 border-l border-gray-600/30">
                {/* Material Properties */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-400">Material</div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Friction</label>
                    <input
                      type="number"
                      value={rigidBody.material.friction}
                      onChange={(e) =>
                        updateMaterial({ friction: parseFloat(e.target.value) || 0 })
                      }
                      disabled={isPlaying}
                      step={0.1}
                      min={0}
                      max={2}
                      className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Restitution (Bounce)</label>
                    <input
                      type="number"
                      value={rigidBody.material.restitution}
                      onChange={(e) =>
                        updateMaterial({ restitution: parseFloat(e.target.value) || 0 })
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
                      value={rigidBody.material.density}
                      onChange={(e) => updateMaterial({ density: parseFloat(e.target.value) || 0 })}
                      disabled={isPlaying}
                      step={0.1}
                      min={0.01}
                      className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Initial Velocity */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-400">Initial Velocity</div>
                  <div className="grid grid-cols-3 gap-1">
                    {['X', 'Y', 'Z'].map((axis, index) => (
                      <div key={axis} className="space-y-1">
                        <label className="text-xs text-gray-500">{axis}</label>
                        <input
                          type="number"
                          value={rigidBody.initialVelocity[index]}
                          onChange={(e) =>
                            updateInitialVelocity(index, parseFloat(e.target.value) || 0)
                          }
                          disabled={isPlaying}
                          step={0.1}
                          className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Initial Angular Velocity */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-400">Initial Angular Velocity</div>
                  <div className="grid grid-cols-3 gap-1">
                    {['X', 'Y', 'Z'].map((axis, index) => (
                      <div key={axis} className="space-y-1">
                        <label className="text-xs text-gray-500">{axis}</label>
                        <input
                          type="number"
                          value={rigidBody.initialAngularVelocity[index]}
                          onChange={(e) =>
                            updateInitialAngularVelocity(index, parseFloat(e.target.value) || 0)
                          }
                          disabled={isPlaying}
                          step={0.1}
                          className="w-full bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 disabled:opacity-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {isPlaying && (
              <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded px-2 py-1">
                ⚠️ Physics settings cannot be modified during play mode
              </div>
            )}
          </>
        }
      </div>
    </InspectorSection>
  );
};
