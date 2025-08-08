import React from 'react';
import { FiShield } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ColliderType } from '@/core/lib/ecs/components/definitions/MeshColliderComponent';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { FieldGroup } from '@/editor/components/shared/FieldGroup';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { ToggleField } from '@/editor/components/shared/ToggleField';

import { ColliderFields } from './ColliderFields';

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
      <ToggleField
        label="Enabled"
        value={meshCollider.enabled}
        onChange={(value: boolean) => updateMeshCollider({ enabled: value })}
        resetValue={true}
        color="green"
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
          { value: 'heightfield', label: 'Heightfield (Terrain)' },
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

      {meshCollider.colliderType === 'heightfield' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
          <div className="text-xs text-green-300">
            ✅ Heightfield collider mirrors the terrain heightmap efficiently and updates when
            terrain parameters change.
          </div>
        </div>
      )}

      <CheckboxField
        label="Is Trigger"
        value={meshCollider.isTrigger}
        onChange={(value: boolean) => updateMeshCollider({ isTrigger: value })}
        description="Trigger events without physical collision"
        resetValue={false}
        color="green"
      />

      <CollapsibleSection title="Physics Material" defaultExpanded={false} badge="3">
        <SingleAxisField
          label="Friction"
          value={meshCollider.physicsMaterial.friction}
          onChange={(value: number) => updatePhysicsMaterial({ friction: value })}
          min={0}
          max={2}
          step={0.1}
          sensitivity={0.1}
          resetValue={0.7}
          axisLabel="FRI"
          axisColor="#e74c3c"
        />

        <SingleAxisField
          label="Restitution"
          value={meshCollider.physicsMaterial.restitution}
          onChange={(value: number) => updatePhysicsMaterial({ restitution: value })}
          min={0}
          max={1}
          step={0.1}
          sensitivity={0.1}
          resetValue={0.3}
          axisLabel="RES"
          axisColor="#3498db"
        />

        <SingleAxisField
          label="Density"
          value={meshCollider.physicsMaterial.density}
          onChange={(value: number) => updatePhysicsMaterial({ density: value })}
          min={0.1}
          max={10}
          step={0.1}
          sensitivity={0.1}
          resetValue={1}
          axisLabel="DEN"
          axisColor="#f39c12"
        />
      </CollapsibleSection>
    </GenericComponentSection>
  );
};
