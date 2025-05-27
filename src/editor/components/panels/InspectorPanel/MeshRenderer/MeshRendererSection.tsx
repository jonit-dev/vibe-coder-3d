import React from 'react';
import { FiEye } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { ColorField } from '@/editor/components/shared/ColorField';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { FieldGroup } from '@/editor/components/shared/FieldGroup';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { ToggleField } from '@/editor/components/shared/ToggleField';

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
    <GenericComponentSection
      title="Mesh Renderer"
      icon={<FiEye />}
      headerColor="cyan"
      componentId={KnownComponentTypes.MESH_RENDERER}
      onRemove={handleRemoveMeshRenderer}
    >
      <ToggleField
        label="Enabled"
        value={meshRenderer.enabled}
        onChange={(value: boolean) => updateMeshRenderer({ enabled: value })}
        resetValue={true}
        color="cyan"
      />

      <ComponentField
        label="Mesh"
        type="select"
        value={meshRenderer.meshId}
        onChange={(value) => updateMeshRenderer({ meshId: value })}
        options={[
          { value: 'cube', label: 'Cube' },
          { value: 'sphere', label: 'Sphere' },
          { value: 'plane', label: 'Plane' },
          { value: 'cylinder', label: 'Cylinder' },
          { value: 'cone', label: 'Cone' },
          { value: 'torus', label: 'Torus' },
          { value: 'capsule', label: 'Capsule' },
        ]}
      />

      <FieldGroup label="Material">
        <ColorField
          label="Color"
          value={meshRenderer.material.color}
          onChange={(value: string) => updateMaterial({ color: value })}
          resetValue="#ffffff"
          placeholder="#ffffff"
        />
      </FieldGroup>

      <CollapsibleSection title="Material Properties" defaultExpanded={false} badge="PBR">
        <SingleAxisField
          label="Metalness"
          value={meshRenderer.material.metalness}
          onChange={(value) => updateMaterial({ metalness: value })}
          min={0}
          max={1}
          step={0.1}
          sensitivity={0.1}
          resetValue={0}
          axisLabel="MET"
          axisColor="#95a5a6"
        />

        <SingleAxisField
          label="Roughness"
          value={meshRenderer.material.roughness}
          onChange={(value) => updateMaterial({ roughness: value })}
          min={0}
          max={1}
          step={0.1}
          sensitivity={0.1}
          resetValue={0.5}
          axisLabel="ROU"
          axisColor="#34495e"
        />

        <ColorField
          label="Emissive Color"
          value={meshRenderer.material.emissive}
          onChange={(value: string) => updateMaterial({ emissive: value })}
          resetValue="#000000"
          placeholder="#000000"
        />

        <SingleAxisField
          label="Emissive Intensity"
          value={meshRenderer.material.emissiveIntensity}
          onChange={(value) => updateMaterial({ emissiveIntensity: value })}
          min={0}
          max={5}
          step={0.1}
          sensitivity={0.1}
          resetValue={0}
          axisLabel="EMI"
          axisColor="#f39c12"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Shadow Settings" defaultExpanded={false} badge="2">
        <CheckboxField
          label="Cast Shadows"
          value={meshRenderer.castShadows}
          onChange={(value: boolean) => updateMeshRenderer({ castShadows: value })}
          description="Cast shadows on other objects"
          resetValue={true}
          color="purple"
        />

        <CheckboxField
          label="Receive Shadows"
          value={meshRenderer.receiveShadows}
          onChange={(value: boolean) => updateMeshRenderer({ receiveShadows: value })}
          description="Receive shadows from other objects"
          resetValue={true}
          color="purple"
        />
      </CollapsibleSection>
    </GenericComponentSection>
  );
};
