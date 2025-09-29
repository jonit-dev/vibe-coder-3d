import React from 'react';
import { FiImage, FiLayers, FiSettings } from 'react-icons/fi';
import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { AssetSelector } from '@/editor/components/shared/AssetSelector';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { MaterialPreviewSphere } from '../MaterialPreviewSphere';
import type { IMaterialFormState, IMaterialFormActions } from '../hooks/useMaterialForm';

export interface IScratchMaterialFormProps {
  formState: IMaterialFormState;
  formActions: IMaterialFormActions;
  previewMaterial: IMaterialDefinition;
}

export const ScratchMaterialForm: React.FC<IScratchMaterialFormProps> = ({
  formState,
  formActions,
  previewMaterial,
}) => (
  <div className="flex flex-col h-full min-h-0">
    {/* Live Preview & Settings - Compact */}
    <div className="px-3 py-2 border-b border-gray-600 flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* Live Preview */}
        <div className="flex-shrink-0">
          <MaterialPreviewSphere
            material={previewMaterial}
            size={60}
            showControls={false}
            className="border border-gray-600 rounded"
          />
        </div>

        {/* Shader & Type - Compact */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Shader Type
            </label>
            <select
              value={formState.shader}
              onChange={(e) => formActions.setShader(e.target.value as 'standard' | 'unlit')}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="standard">Standard (PBR)</option>
              <option value="unlit">Unlit (Flat)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Material Type
            </label>
            <select
              value={formState.materialType}
              onChange={(e) => formActions.setMaterialType(e.target.value as 'solid' | 'texture')}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="solid">Solid Color</option>
              <option value="texture">Textured</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    {/* Scrollable Properties */}
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
      {/* Base Color */}
      <CollapsibleSection
        title="Base Color"
        icon={<FiSettings />}
        defaultExpanded={true}
      >
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={formState.color}
            onChange={(e) => formActions.setColor(e.target.value)}
            className="w-10 h-8 border border-gray-600 rounded cursor-pointer"
          />
          <input
            type="text"
            value={formState.color}
            onChange={(e) => formActions.setColor(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none font-mono text-xs"
          />
        </div>
      </CollapsibleSection>

      {/* Standard Shader Properties */}
      {formState.shader === 'standard' && (
        <CollapsibleSection
          title="Surface Properties"
          icon={<FiLayers />}
          defaultExpanded={true}
        >
          {/* Metalness & Roughness - Side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Metalness: {formState.metalness.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={formState.metalness}
                onChange={(e) => formActions.setMetalness(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                <span>Non-metal</span>
                <span>Metal</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Roughness: {formState.roughness.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={formState.roughness}
                onChange={(e) => formActions.setRoughness(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                <span>Mirror</span>
                <span>Rough</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Emission */}
      {formState.shader === 'standard' && (
        <CollapsibleSection
          title="Emission"
          icon={<FiSettings />}
          defaultExpanded={false}
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formState.emissive}
                onChange={(e) => formActions.setEmissive(e.target.value)}
                className="w-10 h-8 border border-gray-600 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formState.emissive}
                onChange={(e) => formActions.setEmissive(e.target.value)}
                className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Intensity: {formState.emissiveIntensity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={formState.emissiveIntensity}
                onChange={(e) => formActions.setEmissiveIntensity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Textures Section */}
      {formState.materialType === 'texture' && (
        <CollapsibleSection
          title="Textures"
          icon={<FiImage />}
          defaultExpanded={true}
        >
          <div className="space-y-3">
            {/* Albedo Texture */}
            <AssetSelector
              label="Albedo (Diffuse)"
              value={formState.albedoTexture}
              onChange={formActions.setAlbedoTexture}
              basePath="/assets/textures"
              allowedExtensions={['.png', '.jpg', '.jpeg', '.webp']}
              showPreview={true}
            />

            {formState.shader === 'standard' && (
              <>
                {/* Normal Texture */}
                <AssetSelector
                  label="Normal Map"
                  value={formState.normalTexture}
                  onChange={formActions.setNormalTexture}
                  basePath="/assets/textures"
                  allowedExtensions={['.png', '.jpg', '.jpeg', '.webp']}
                  showPreview={true}
                />

                {/* Metallic Texture */}
                <AssetSelector
                  label="Metallic"
                  value={formState.metallicTexture}
                  onChange={formActions.setMetallicTexture}
                  basePath="/assets/textures"
                  allowedExtensions={['.png', '.jpg', '.jpeg', '.webp']}
                  showPreview={true}
                />

                {/* Roughness Texture */}
                <AssetSelector
                  label="Roughness"
                  value={formState.roughnessTexture}
                  onChange={formActions.setRoughnessTexture}
                  basePath="/assets/textures"
                  allowedExtensions={['.png', '.jpg', '.jpeg', '.webp']}
                  showPreview={true}
                />

                {/* Emission Texture */}
                <AssetSelector
                  label="Emission"
                  value={formState.emissiveTexture}
                  onChange={formActions.setEmissiveTexture}
                  basePath="/assets/textures"
                  allowedExtensions={['.png', '.jpg', '.jpeg', '.webp']}
                  showPreview={true}
                />

                {/* Occlusion Texture */}
                <AssetSelector
                  label="Occlusion (AO)"
                  value={formState.occlusionTexture}
                  onChange={formActions.setOcclusionTexture}
                  basePath="/assets/textures"
                  allowedExtensions={['.png', '.jpg', '.jpeg', '.webp']}
                  showPreview={true}
                />
              </>
            )}
          </div>
        </CollapsibleSection>
      )}
    </div>
  </div>
);