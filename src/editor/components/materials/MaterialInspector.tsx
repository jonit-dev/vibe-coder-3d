import React, { useEffect, useState } from 'react';
import { FiRefreshCw, FiSave, FiSettings, FiImage, FiMap } from 'react-icons/fi';

import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { MaterialRegistry } from '@/core/materials/MaterialRegistry';
import { AssetSelector } from '@/editor/components/shared/AssetSelector';
import { ColorField } from '@/editor/components/shared/ColorField';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { Modal } from '@/editor/components/shared/Modal';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { InternalTabs, useInternalTabs } from '@/editor/components/shared/InternalTabs';
import { useMaterialsStore } from '@/editor/store/materialsStore';
import { MaterialPreviewSphere } from './MaterialPreviewSphere';

export interface IMaterialInspectorProps {
  materialId: string | null;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
  onSave?: (material: IMaterialDefinition) => void;
}

export const MaterialInspector: React.FC<IMaterialInspectorProps> = ({
  materialId,
  isOpen,
  onClose,
  readOnly = false,
  onSave,
}) => {
  const [material, setMaterial] = useState<IMaterialDefinition | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const materialRegistry = MaterialRegistry.getInstance();
  const refreshMaterials = useMaterialsStore((state) => state._refreshMaterials);
  const { activeTab, changeTab } = useInternalTabs('basic');

  useEffect(() => {
    if (materialId) {
      const materialDef = materialRegistry.get(materialId);
      if (materialDef) {
        setMaterial({ ...materialDef });
        setHasUnsavedChanges(false);
      }
    } else {
      setMaterial(null);
      setHasUnsavedChanges(false);
    }
  }, [materialId, materialRegistry]);

  const updateMaterial = (updates: Partial<IMaterialDefinition>) => {
    if (!material) return;

    setMaterial((prev) => {
      if (!prev) return prev;

      let updated = { ...prev, ...updates };

      // When switching from texture to solid, clear texture-specific properties
      if (updates.materialType === 'solid' && prev.materialType === 'texture') {
        updated = {
          ...updated,
          albedoTexture: undefined,
          normalTexture: undefined,
          metallicTexture: undefined,
          roughnessTexture: undefined,
          emissiveTexture: undefined,
          occlusionTexture: undefined,
          // Reset texture transform properties to defaults
          normalScale: 1,
          occlusionStrength: 1,
          textureOffsetX: 0,
          textureOffsetY: 0,
        };
      }

      setHasUnsavedChanges(true);
      return updated;
    });
  };

  const handleSave = async () => {
    if (!material) return;

    try {
      materialRegistry.upsert(material);
      // Refresh materials store to trigger reactive updates in viewport
      refreshMaterials();
      // Materials now persist via scene saves
      setHasUnsavedChanges(false);
      onSave?.(material);
    } catch (error) {
      console.error('Failed to save material:', error);
      alert('Failed to save material. Please try again.');
    }
  };

  const handleReset = () => {
    if (materialId) {
      const originalMaterial = materialRegistry.get(materialId);
      if (originalMaterial) {
        setMaterial({ ...originalMaterial });
        setHasUnsavedChanges(false);
      }
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        setHasUnsavedChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!materialId || !material) {
    return null;
  }

  // Define tab content
  const basicTab = (
    <div className="space-y-3 p-4">
      <ComponentField
        label="Shader"
        type="select"
        value={material.shader}
        onChange={(value) => updateMaterial({ shader: value as 'standard' | 'unlit' })}
        options={[
          { value: 'standard', label: 'Standard (PBR)' },
          { value: 'unlit', label: 'Unlit' },
        ]}
        disabled={readOnly}
      />

      <ComponentField
        label="Type"
        type="select"
        value={material.materialType}
        onChange={(value) => updateMaterial({ materialType: value as 'solid' | 'texture' })}
        options={[
          { value: 'solid', label: 'Solid Color' },
          { value: 'texture', label: 'Texture' },
        ]}
        disabled={readOnly}
      />

      {/* Color - only show for solid materials */}
      {material.materialType === 'solid' && (
        <ColorField
          label="Color"
          value={material.color}
          onChange={(value) => updateMaterial({ color: value })}
          resetValue="#cccccc"
          placeholder="#cccccc"
        />
      )}
    </div>
  );

  const pbrTab = (
    <div className="space-y-3 p-4">
      {material.shader === 'standard' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <SingleAxisField
              label="Metalness"
              value={material.metalness}
              onChange={(value) => updateMaterial({ metalness: value })}
              min={0}
              max={1}
              step={0.01}
              disabled={readOnly}
            />

            <SingleAxisField
              label="Roughness"
              value={material.roughness}
              onChange={(value) => updateMaterial({ roughness: value })}
              min={0}
              max={1}
              step={0.01}
              disabled={readOnly}
            />
          </div>

          <ColorField
            label="Emissive Color"
            value={material.emissive}
            onChange={(value) => updateMaterial({ emissive: value })}
          />

          <SingleAxisField
            label="Emissive Intensity"
            value={material.emissiveIntensity}
            onChange={(value) => updateMaterial({ emissiveIntensity: value })}
            min={0}
            max={10}
            step={0.1}
            disabled={readOnly}
          />
        </>
      ) : (
        <div className="text-center text-gray-400 py-8">
          <div className="text-lg mb-2">PBR Not Available</div>
          <div className="text-sm">Switch to Standard shader to access PBR properties</div>
        </div>
      )}
    </div>
  );

  const texturesTab = (
    <div className="space-y-3 p-4">
      <AssetSelector
        label="Albedo Texture"
        value={material.albedoTexture}
        onChange={(assetPath) => updateMaterial({ albedoTexture: assetPath })}
        placeholder="No texture selected"
        buttonTitle="Select Texture"
        basePath="/assets/textures"
        allowedExtensions={['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp']}
        showPreview={true}
      />

      {material.shader === 'standard' && (
        <>
          <AssetSelector
            label="Normal Map"
            value={material.normalTexture}
            onChange={(assetPath) => updateMaterial({ normalTexture: assetPath })}
            placeholder="No normal map"
            buttonTitle="Select Normal Map"
            basePath="/assets/textures"
            allowedExtensions={['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp']}
            showPreview={true}
          />

          {material.normalTexture && (
            <SingleAxisField
              label="Normal Strength"
              value={material.normalScale}
              onChange={(value) => updateMaterial({ normalScale: value })}
              min={0}
              max={5}
              step={0.1}
              disabled={readOnly}
            />
          )}

          <AssetSelector
            label="Metallic Map"
            value={material.metallicTexture}
            onChange={(assetPath) => updateMaterial({ metallicTexture: assetPath })}
            placeholder="No metallic map"
            buttonTitle="Select Metallic Map"
            basePath="/assets/textures"
            allowedExtensions={['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp']}
            showPreview={true}
          />

          <AssetSelector
            label="Roughness Map"
            value={material.roughnessTexture}
            onChange={(assetPath) => updateMaterial({ roughnessTexture: assetPath })}
            placeholder="No roughness map"
            buttonTitle="Select Roughness Map"
            basePath="/assets/textures"
            allowedExtensions={['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp']}
            showPreview={true}
          />

          <AssetSelector
            label="Emissive Map"
            value={material.emissiveTexture}
            onChange={(assetPath) => updateMaterial({ emissiveTexture: assetPath })}
            placeholder="No emissive map"
            buttonTitle="Select Emissive Map"
            basePath="/assets/textures"
            allowedExtensions={['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp']}
            showPreview={true}
          />

          <AssetSelector
            label="Occlusion Map"
            value={material.occlusionTexture}
            onChange={(assetPath) => updateMaterial({ occlusionTexture: assetPath })}
            placeholder="No occlusion map"
            buttonTitle="Select Occlusion Map"
            basePath="/assets/textures"
            allowedExtensions={['jpg', 'jpeg', 'png', 'webp', 'tga', 'bmp']}
            showPreview={true}
          />

          {material.occlusionTexture && (
            <SingleAxisField
              label="Occlusion Strength"
              value={material.occlusionStrength}
              onChange={(value) => updateMaterial({ occlusionStrength: value })}
              min={0}
              max={2}
              step={0.1}
              disabled={readOnly}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <SingleAxisField
              label="Texture Offset X"
              value={material.textureOffsetX}
              onChange={(value) => updateMaterial({ textureOffsetX: value })}
              min={-10}
              max={10}
              step={0.01}
              disabled={readOnly}
            />

            <SingleAxisField
              label="Texture Offset Y"
              value={material.textureOffsetY}
              onChange={(value) => updateMaterial({ textureOffsetY: value })}
              min={-10}
              max={10}
              step={0.01}
              disabled={readOnly}
            />
          </div>
        </>
      )}

      {material.shader !== 'standard' && (
        <div className="text-center text-gray-400 py-4 border-t border-gray-600">
          <div className="text-sm">Advanced texture maps require Standard shader</div>
        </div>
      )}
    </div>
  );

  const tabs = [
    {
      id: 'basic',
      label: 'Basic',
      content: basicTab,
      icon: <FiSettings size={14} />,
    },
    {
      id: 'pbr',
      label: 'PBR',
      content: pbrTab,
      icon: <FiImage size={14} />,
      disabled: material.shader !== 'standard',
      badge: material.shader !== 'standard' ? 'N/A' : undefined,
    },
    {
      id: 'textures',
      label: 'Textures',
      content: texturesTab,
      icon: <FiMap size={14} />,
      badge:
        material.albedoTexture ||
        material.normalTexture ||
        material.metallicTexture ||
        material.roughnessTexture ||
        material.emissiveTexture ||
        material.occlusionTexture
          ? '●'
          : undefined,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Material: ${material.name}`}
      maxWidth="w-[700px]"
      maxHeight="max-h-[75vh]"
    >
      <div className="flex flex-col h-full max-h-[70vh]">
        {/* Header Section */}
        <div className="flex-shrink-0 border-b border-gray-600">
          {/* Preview */}
          <div className="flex justify-center p-3">
            <MaterialPreviewSphere
              material={material}
              size={100}
              showControls={true}
              className="border-2 border-gray-600"
            />
          </div>

          {/* Material Info & Actions */}
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{material.name}</h3>
              <p className="text-sm text-gray-400">{material.id}</p>
            </div>

            {!readOnly && (
              <div className="flex space-x-2">
                <button
                  onClick={handleReset}
                  disabled={!hasUnsavedChanges}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reset Changes"
                >
                  <FiRefreshCw size={16} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded flex items-center space-x-2"
                >
                  <FiSave size={16} />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="flex-1 min-h-0">
          <InternalTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={changeTab}
            variant="underline"
            size="md"
            className="h-full"
          />
        </div>

        {/* Changes indicator */}
        {hasUnsavedChanges && (
          <div className="flex-shrink-0 p-4 border-t border-gray-600">
            <div className="text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded p-2">
              You have unsaved changes. Click Save to apply them.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
