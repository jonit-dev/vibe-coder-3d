import React, { useState } from 'react';
import { FiShield } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { FieldGroup } from '@/editor/components/shared/FieldGroup';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';

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

  const handleRemoveMeshCollider = () => {
    setMeshCollider(null);
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
    <GenericComponentSection
      title="Mesh Collider"
      icon={<FiShield />}
      headerColor="green"
      componentId={KnownComponentTypes.MESH_COLLIDER}
      onRemove={handleRemoveMeshCollider}
    >
      <ComponentField
        label="Enable Collider"
        type="checkbox"
        value={meshCollider.enabled}
        onChange={(value) => updateMeshCollider({ enabled: value })}
        placeholder="Enable collision detection"
        resetValue={true}
        disabled={isPlaying}
      />

      <ComponentField
        label="Collider Type"
        type="select"
        value={meshCollider.colliderType}
        onChange={(value) => updateMeshCollider({ colliderType: value as ColliderType })}
        disabled={isPlaying}
        options={[
          { value: 'box', label: 'Box Collider' },
          { value: 'sphere', label: 'Sphere Collider' },
          { value: 'capsule', label: 'Capsule Collider' },
          { value: 'convex', label: 'Convex Hull' },
          { value: 'mesh', label: 'Mesh Collider' },
        ]}
      />

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
        <FieldGroup label="Size">
          <ComponentField
            label="Radius"
            type="number"
            value={meshCollider.size.radius}
            onChange={(value) => updateSize({ radius: value })}
            disabled={isPlaying}
            step={0.01}
            min={0.01}
            resetValue={0.5}
          />
        </FieldGroup>
      )}

      {meshCollider.colliderType === 'capsule' && (
        <FieldGroup label="Size">
          <ComponentField
            label="Radius"
            type="number"
            value={meshCollider.size.capsuleRadius}
            onChange={(value) => updateSize({ capsuleRadius: value })}
            disabled={isPlaying}
            step={0.01}
            min={0.01}
            resetValue={0.5}
          />
          <ComponentField
            label="Height"
            type="number"
            value={meshCollider.size.capsuleHeight}
            onChange={(value) => updateSize({ capsuleHeight: value })}
            disabled={isPlaying}
            step={0.01}
            min={0.01}
            resetValue={2}
          />
        </FieldGroup>
      )}

      {(meshCollider.colliderType === 'mesh' || meshCollider.colliderType === 'convex') && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
          <div className="text-xs text-blue-300">
            💡 {meshCollider.colliderType === 'mesh' ? 'Mesh' : 'Convex'} colliders use the entity's
            mesh geometry
          </div>
        </div>
      )}

      <ComponentField
        label="Is Trigger"
        type="checkbox"
        value={meshCollider.isTrigger}
        onChange={(value) => updateMeshCollider({ isTrigger: value })}
        disabled={isPlaying}
        placeholder="Trigger events without physical collision"
        resetValue={false}
      />

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-xs text-green-400 hover:text-green-300 text-left"
      >
        {showAdvanced ? '▼' : '▶'} Advanced Settings
      </button>

      {showAdvanced && (
        <div className="space-y-3 pl-2 border-l border-gray-600/30">
          <FieldGroup label="Physics Material">
            <ComponentField
              label="Friction"
              type="number"
              value={meshCollider.physicsMaterial.friction}
              onChange={(value) => updatePhysicsMaterial({ friction: value })}
              disabled={isPlaying}
              step={0.1}
              min={0}
              max={2}
              resetValue={0.7}
            />

            <ComponentField
              label="Restitution"
              type="number"
              value={meshCollider.physicsMaterial.restitution}
              onChange={(value) => updatePhysicsMaterial({ restitution: value })}
              disabled={isPlaying}
              step={0.1}
              min={0}
              max={1}
              resetValue={0.3}
            />

            <ComponentField
              label="Density"
              type="number"
              value={meshCollider.physicsMaterial.density}
              onChange={(value) => updatePhysicsMaterial({ density: value })}
              disabled={isPlaying}
              step={0.1}
              min={0.1}
              resetValue={1}
            />
          </FieldGroup>
        </div>
      )}
    </GenericComponentSection>
  );
};
