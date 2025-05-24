import React, { useState } from 'react';
import { FiZap } from 'react-icons/fi';

import { PhysicsBodyType } from '@/core/lib/physics';
import { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { InspectorSection } from '@/editor/components/ui/InspectorSection';

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

const DEFAULT_RIGID_BODY: IRigidBodyData = {
  enabled: true,
  bodyType: 'dynamic',
  mass: 1,
  gravityScale: 1,
  canSleep: true,
  linearDamping: 0.01,
  angularDamping: 0.05,
  initialVelocity: [0, 0, 0],
  initialAngularVelocity: [0, 0, 0],
  material: {
    friction: 0.3,
    restitution: 0.3,
    density: 1,
  },
};

export const RigidBodySection: React.FC<IRigidBodySectionProps> = ({
  rigidBody,
  setRigidBody,
  meshCollider,
  setMeshCollider,
  meshType,
  isPlaying,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleRigidBody = () => {
    if (rigidBody) {
      setRigidBody(null);
    } else {
      setRigidBody(DEFAULT_RIGID_BODY);

      // Auto-create mesh collider when enabling rigid body (Unity-like behavior)
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
        setMeshCollider(defaultMeshCollider);
      }
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

  return (
    <InspectorSection
      title="Rigid Body"
      icon={<FiZap />}
      headerColor="orange"
      collapsible
      defaultCollapsed={false}
    >
      <div className="space-y-3">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Enable Physics</span>
          <button
            onClick={handleToggleRigidBody}
            disabled={isPlaying}
            className={`
              relative inline-flex h-5 w-8 items-center rounded-full transition-colors
              ${rigidBody ? 'bg-orange-500' : 'bg-gray-600'}
              ${isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                ${rigidBody ? 'translate-x-4' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {rigidBody && (
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
        )}
      </div>
    </InspectorSection>
  );
};
