import React from 'react';
import { FiEye, FiImage, FiSliders } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { IMeshRendererData } from '@/core/lib/ecs/components/MeshRendererComponent';
import { AssetSelector } from '@/editor/components/shared/AssetSelector';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { ColorField } from '@/editor/components/shared/ColorField';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { ToggleField } from '@/editor/components/shared/ToggleField';

export interface IMeshRendererSectionProps {
  meshRenderer: IMeshRendererData | null;
  setMeshRenderer: (data: IMeshRendererData | null) => void;
  isPlaying: boolean;
}

export const MeshRendererSection: React.FC<IMeshRendererSectionProps> = ({
  meshRenderer,
  setMeshRenderer,
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
    if (meshRenderer && meshRenderer.material) {
      setMeshRenderer({
        ...meshRenderer,
        material: { ...meshRenderer.material, ...updates },
      });
    }
  };

  // Don't render the section if meshRenderer is null or material is undefined
  if (!meshRenderer || !meshRenderer.material) {
    return null;
  }

  const isTextureMode = meshRenderer.material.materialType === 'texture';

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
        value={meshRenderer.enabled ?? true}
        onChange={(value: boolean) => updateMeshRenderer({ enabled: value })}
        resetValue={true}
        color="cyan"
      />

      <ComponentField
        label="Mesh"
        type="select"
        value={meshRenderer.meshId}
        onChange={(value) => updateMeshRenderer({ meshId: value as string })}
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

      {/* Material Type Section */}
      <CollapsibleSection title="Material" icon={<FiImage />} defaultExpanded={true} badge="Color">
        <ComponentField
          label="Type"
          type="select"
          value={meshRenderer.material.materialType || 'solid'}
          onChange={(value) => updateMaterial({ materialType: value as 'solid' | 'texture' })}
          options={[
            { value: 'solid', label: 'Solid Color' },
            { value: 'texture', label: 'Texture' },
          ]}
        />

        {isTextureMode ? (
          <div className="space-y-3">
            <AssetSelector
              label="Albedo Texture"
              value={meshRenderer.material.albedoTexture}
              onChange={(assetPath) => updateMaterial({ albedoTexture: assetPath })}
              placeholder="No texture selected"
              buttonTitle="Select Texture"
              basePath="/assets/textures"
              allowedExtensions={['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp']}
              showPreview={true}
            />

            <AssetSelector
              label="Normal Map"
              value={meshRenderer.material.normalTexture}
              onChange={(assetPath) => updateMaterial({ normalTexture: assetPath })}
              placeholder="No normal map"
              buttonTitle="Select Normal Map"
              basePath="/assets/textures"
              allowedExtensions={['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp']}
              showPreview={true}
            />

            {meshRenderer.material.normalTexture && (
              <SingleAxisField
                label="Normal Strength"
                value={meshRenderer.material.normalScale || 1}
                onChange={(value) =>
                  updateMaterial({ normalScale: Math.max(0, Math.min(2, value)) })
                }
                min={0}
                max={2}
                step={0.1}
                sensitivity={0.1}
                resetValue={1}
                axisLabel="NRM"
                axisColor="#8e44ad"
              />
            )}

            {/* Texture Offset Controls */}
            {(meshRenderer.material.albedoTexture || meshRenderer.material.normalTexture) && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-300 mb-2">Texture Offset</div>
                <div className="grid grid-cols-2 gap-2">
                  <SingleAxisField
                    label="Offset X"
                    value={meshRenderer.material.textureOffsetX || 0}
                    onChange={(value) => updateMaterial({ textureOffsetX: value })}
                    min={-2}
                    max={2}
                    step={0.1}
                    sensitivity={0.1}
                    resetValue={0}
                    axisLabel="X"
                    axisColor="#ff6b6b"
                  />
                  <SingleAxisField
                    label="Offset Y"
                    value={meshRenderer.material.textureOffsetY || 0}
                    onChange={(value) => updateMaterial({ textureOffsetY: value })}
                    min={-2}
                    max={2}
                    step={0.1}
                    sensitivity={0.1}
                    resetValue={0}
                    axisLabel="Y"
                    axisColor="#4ecdc4"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <ColorField
            label="Color"
            value={meshRenderer.material.color || '#cccccc'}
            onChange={(value: string) => updateMaterial({ color: value })}
            resetValue="#cccccc"
            placeholder="#cccccc"
          />
        )}
      </CollapsibleSection>

      {/* Material Properties Section */}
      <CollapsibleSection
        title="Material Properties"
        icon={<FiSliders />}
        defaultExpanded={false}
        badge="PBR"
      >
        <SingleAxisField
          label="Metalness"
          value={meshRenderer.material.metalness || 0}
          onChange={(value) => updateMaterial({ metalness: Math.max(0, Math.min(1, value)) })}
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
          value={meshRenderer.material.roughness || 0.7}
          onChange={(value) => updateMaterial({ roughness: Math.max(0, Math.min(1, value)) })}
          min={0}
          max={1}
          step={0.1}
          sensitivity={0.1}
          resetValue={0.7}
          axisLabel="ROU"
          axisColor="#34495e"
        />
      </CollapsibleSection>

      {/* Shadow Settings */}
      <CollapsibleSection title="Shadow Settings" defaultExpanded={false} badge="2">
        <CheckboxField
          label="Cast Shadows"
          value={meshRenderer.castShadows ?? true}
          onChange={(value: boolean) => updateMeshRenderer({ castShadows: value })}
          description="Cast shadows on other objects"
          resetValue={true}
          color="purple"
        />

        <CheckboxField
          label="Receive Shadows"
          value={meshRenderer.receiveShadows ?? true}
          onChange={(value: boolean) => updateMeshRenderer({ receiveShadows: value })}
          description="Receive shadows from other objects"
          resetValue={true}
          color="purple"
        />
      </CollapsibleSection>
    </GenericComponentSection>
  );
};
