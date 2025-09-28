import React, { useState, useMemo } from 'react';
import { FiPlus, FiSearch, FiEdit3, FiGrid, FiUpload, FiX } from 'react-icons/fi';

import { Modal } from '@/editor/components/shared/Modal';
import { InternalTabs, useInternalTabs } from '@/editor/components/shared/InternalTabs';
import { MaterialRegistry } from '@/core/materials/MaterialRegistry';
import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { MaterialPreviewSphere } from './MaterialPreviewSphere';

export interface IMaterialCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (material: IMaterialDefinition) => void;
  templateMaterialId?: string; // Optional material to duplicate
}

const MATERIAL_TEMPLATES = [
  {
    id: 'plastic',
    name: 'Plastic',
    shader: 'standard' as const,
    materialType: 'solid' as const,
    description: 'Smooth plastic material',
    previewMaterial: {
      id: 'preview_plastic',
      name: 'Plastic Preview',
      shader: 'standard' as const,
      materialType: 'solid' as const,
      color: '#4a90e2',
      metalness: 0.0,
      roughness: 0.2,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
    } as IMaterialDefinition,
  },
  {
    id: 'metal',
    name: 'Metal',
    shader: 'standard' as const,
    materialType: 'solid' as const,
    description: 'Metallic material with high reflectance',
    previewMaterial: {
      id: 'preview_metal',
      name: 'Metal Preview',
      shader: 'standard' as const,
      materialType: 'solid' as const,
      color: '#888888',
      metalness: 1.0,
      roughness: 0.1,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
    } as IMaterialDefinition,
  },
  {
    id: 'glass',
    name: 'Glass',
    shader: 'standard' as const,
    materialType: 'solid' as const,
    description: 'Transparent glass-like material',
    previewMaterial: {
      id: 'preview_glass',
      name: 'Glass Preview',
      shader: 'standard' as const,
      materialType: 'solid' as const,
      color: '#ffffff',
      metalness: 0.0,
      roughness: 0.05,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
    } as IMaterialDefinition,
  },
  {
    id: 'emissive',
    name: 'Emissive',
    shader: 'standard' as const,
    materialType: 'solid' as const,
    description: 'Glowing emissive material',
    previewMaterial: {
      id: 'preview_emissive',
      name: 'Emissive Preview',
      shader: 'standard' as const,
      materialType: 'solid' as const,
      color: '#ffffff',
      metalness: 0.0,
      roughness: 0.5,
      emissive: '#00ff88',
      emissiveIntensity: 1.5,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
    } as IMaterialDefinition,
  },
  {
    id: 'rubber',
    name: 'Rubber',
    shader: 'standard' as const,
    materialType: 'solid' as const,
    description: 'Matte rubber material',
    previewMaterial: {
      id: 'preview_rubber',
      name: 'Rubber Preview',
      shader: 'standard' as const,
      materialType: 'solid' as const,
      color: '#2c2c2c',
      metalness: 0.0,
      roughness: 0.9,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
    } as IMaterialDefinition,
  },
  {
    id: 'fabric',
    name: 'Fabric',
    shader: 'standard' as const,
    materialType: 'texture' as const,
    description: 'Textured fabric material',
    previewMaterial: {
      id: 'preview_fabric',
      name: 'Fabric Preview',
      shader: 'standard' as const,
      materialType: 'texture' as const,
      color: '#8b4513',
      metalness: 0.0,
      roughness: 0.8,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
    } as IMaterialDefinition,
  },
  {
    id: 'wood',
    name: 'Wood',
    shader: 'standard' as const,
    materialType: 'texture' as const,
    description: 'Natural wood material',
    previewMaterial: {
      id: 'preview_wood',
      name: 'Wood Preview',
      shader: 'standard' as const,
      materialType: 'texture' as const,
      color: '#8b4513',
      metalness: 0.0,
      roughness: 0.7,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
    } as IMaterialDefinition,
  },
  {
    id: 'unlit_flat',
    name: 'Flat Color',
    shader: 'unlit' as const,
    materialType: 'solid' as const,
    description: 'Flat unlit color for UI elements',
    previewMaterial: {
      id: 'preview_unlit_flat',
      name: 'Flat Color Preview',
      shader: 'unlit' as const,
      materialType: 'solid' as const,
      color: '#ff6b6b',
      metalness: 0,
      roughness: 1,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
    } as IMaterialDefinition,
  },
];

export const MaterialCreateModal: React.FC<IMaterialCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  templateMaterialId,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [materialName, setMaterialName] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');

  // From scratch form state
  const [scratchShader, setScratchShader] = useState<'standard' | 'unlit'>('standard');
  const [scratchMaterialType, setScratchMaterialType] = useState<'solid' | 'texture'>('solid');
  const [scratchColor, setScratchColor] = useState('#cccccc');
  const [scratchMetalness, setScratchMetalness] = useState(0);
  const [scratchRoughness, setScratchRoughness] = useState(0.7);
  const [scratchEmissive, setScratchEmissive] = useState('#000000');
  const [scratchEmissiveIntensity, setScratchEmissiveIntensity] = useState(0);

  // Texture upload state
  const [scratchAlbedoTexture, setScratchAlbedoTexture] = useState<string>('');
  const [scratchNormalTexture, setScratchNormalTexture] = useState<string>('');
  const [scratchMetallicTexture, setScratchMetallicTexture] = useState<string>('');
  const [scratchRoughnessTexture, setScratchRoughnessTexture] = useState<string>('');
  const [scratchEmissiveTexture, setScratchEmissiveTexture] = useState<string>('');
  const [scratchOcclusionTexture, setScratchOcclusionTexture] = useState<string>('');

  // Tab state - default to "From Scratch"
  const { activeTab, changeTab } = useInternalTabs('scratch');

  const materialRegistry = MaterialRegistry.getInstance();

  // Handle texture file upload
  const handleTextureUpload = (file: File, setter: (value: string) => void) => {
    if (!file) return;

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create a data URL for preview (in a real app, you'd upload to a server)
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setter(result);
    };
    reader.readAsDataURL(file);
  };

  // Filter templates based on search term
  const filteredTemplates = useMemo(() => {
    return MATERIAL_TEMPLATES.filter(template =>
      template.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      template.shader.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      template.materialType.toLowerCase().includes(templateSearchTerm.toLowerCase())
    );
  }, [templateSearchTerm]);

  // Slugify function to generate ID from name
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '_') // Replace spaces and hyphens with underscores
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  };

  // Generate unique ID from base ID
  const generateUniqueId = (baseId: string): string => {
    if (!baseId) return '';

    let id = baseId;
    let counter = 1;

    // Ensure uniqueness
    while (materialRegistry.get(id)) {
      id = `${baseId}_${counter}`;
      counter++;
    }

    return id;
  };

  // Handle template selection (only affects template, not name/ID)
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  // Handle name change with auto ID generation
  const handleNameChange = (name: string) => {
    setMaterialName(name);

    // Auto-generate ID from name
    if (name.trim()) {
      const baseId = slugify(name);
      const uniqueId = generateUniqueId(baseId);
      setMaterialId(uniqueId);
    } else {
      setMaterialId('');
    }
  };

  const handleSubmit = async () => {
    if (!materialName.trim() || !materialId.trim()) {
      return;
    }

    // Validate template is selected if using template tab
    if (activeTab === 'template' && !selectedTemplate) {
      return;
    }

    let baseMaterial: Partial<IMaterialDefinition>;

    if (activeTab === 'scratch') {
      // Create from scratch
      baseMaterial = {
        shader: scratchShader,
        materialType: scratchMaterialType,
        color: scratchColor,
        metalness: scratchMetalness,
        roughness: scratchRoughness,
        emissive: scratchEmissive,
        emissiveIntensity: scratchEmissiveIntensity,
        normalScale: 1,
        occlusionStrength: 1,
        textureOffsetX: 0,
        textureOffsetY: 0,
        // Include textures
        albedoTexture: scratchAlbedoTexture || undefined,
        normalTexture: scratchNormalTexture || undefined,
        metallicTexture: scratchMetallicTexture || undefined,
        roughnessTexture: scratchRoughnessTexture || undefined,
        emissiveTexture: scratchEmissiveTexture || undefined,
        occlusionTexture: scratchOcclusionTexture || undefined,
      };
    } else {
      // Create from template
      const template = MATERIAL_TEMPLATES.find(t => t.id === selectedTemplate);
      if (!template) return;

      baseMaterial = template.previewMaterial;

      // If duplicating from existing material
      if (templateMaterialId) {
        const existingMaterial = materialRegistry.get(templateMaterialId);
        if (existingMaterial) {
          baseMaterial = existingMaterial;
        }
      }
    }

    const newMaterial: IMaterialDefinition = {
      id: materialId.trim(),
      name: materialName.trim(),
      shader: baseMaterial.shader || 'standard',
      materialType: baseMaterial.materialType || 'solid',
      color: baseMaterial.color || '#cccccc',
      metalness: baseMaterial.metalness ?? 0,
      roughness: baseMaterial.roughness ?? 0.7,
      emissive: baseMaterial.emissive || '#000000',
      emissiveIntensity: baseMaterial.emissiveIntensity ?? 0,
      normalScale: baseMaterial.normalScale ?? 1,
      occlusionStrength: baseMaterial.occlusionStrength ?? 1,
      textureOffsetX: baseMaterial.textureOffsetX ?? 0,
      textureOffsetY: baseMaterial.textureOffsetY ?? 0,
      albedoTexture: baseMaterial.albedoTexture,
      normalTexture: baseMaterial.normalTexture,
      metallicTexture: baseMaterial.metallicTexture,
      roughnessTexture: baseMaterial.roughnessTexture,
      emissiveTexture: baseMaterial.emissiveTexture,
      occlusionTexture: baseMaterial.occlusionTexture,
    };

    try {
      // Call onCreate which will handle the creation via the hook
      await onCreate(newMaterial);

      // Reset form
      resetForm();

      // Close modal after successful creation
      onClose();
    } catch (error) {
      console.error('Failed to create material:', error);
      alert('Failed to create material. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedTemplate('');
    setMaterialName('');
    setMaterialId('');
    setTemplateSearchTerm('');
    setScratchShader('standard');
    setScratchMaterialType('solid');
    setScratchColor('#cccccc');
    setScratchMetalness(0);
    setScratchRoughness(0.7);
    setScratchEmissive('#000000');
    setScratchEmissiveIntensity(0);
    setScratchAlbedoTexture('');
    setScratchNormalTexture('');
    setScratchMetallicTexture('');
    setScratchRoughnessTexture('');
    setScratchEmissiveTexture('');
    setScratchOcclusionTexture('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Helper to get current scratch material for preview
  const getScratchPreviewMaterial = (): IMaterialDefinition => ({
    id: 'preview_scratch',
    name: 'Scratch Preview',
    shader: scratchShader,
    materialType: scratchMaterialType,
    color: scratchColor,
    metalness: scratchMetalness,
    roughness: scratchRoughness,
    emissive: scratchEmissive,
    emissiveIntensity: scratchEmissiveIntensity,
    normalScale: 1,
    occlusionStrength: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
    albedoTexture: scratchAlbedoTexture || undefined,
    normalTexture: scratchNormalTexture || undefined,
    metallicTexture: scratchMetallicTexture || undefined,
    roughnessTexture: scratchRoughnessTexture || undefined,
    emissiveTexture: scratchEmissiveTexture || undefined,
    occlusionTexture: scratchOcclusionTexture || undefined,
  });

  // Helper to check if create button should be enabled
  const isCreateDisabled = () => {
    if (!materialName.trim() || !materialId.trim()) return true;
    if (activeTab === 'template' && !selectedTemplate) return true;
    return false;
  };

  // Texture Input Component - Compact
  const TextureInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    onUpload: (file: File) => void;
  }> = ({ label, value, onChange, onUpload }) => (
    <div>
      <label className="block text-xs font-medium text-gray-300 mb-1">{label}</label>
      <div className="space-y-1.5">
        {/* URL Input with Upload Button */}
        <div className="flex items-center space-x-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL or upload..."
            className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-xs"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
            className="hidden"
            id={`texture-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <label
            htmlFor={`texture-${label.replace(/\s+/g, '-').toLowerCase()}`}
            className="flex items-center px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white hover:bg-gray-600 cursor-pointer transition-colors"
            title="Upload image"
          >
            <FiUpload size={12} />
          </label>
          {value && (
            <button
              onClick={() => onChange('')}
              className="flex items-center px-2 py-1.5 text-gray-400 hover:text-white"
              title="Clear texture"
            >
              <FiX size={12} />
            </button>
          )}
        </div>

        {/* Preview */}
        {value && (
          <div
            className="w-full h-8 border border-gray-600 rounded bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${value})` }}
          />
        )}
      </div>
    </div>
  );

  const tabs = [
    {
      id: 'scratch',
      label: 'From Scratch',
      icon: <FiEdit3 size={16} />,
      content: (
        <div className="flex flex-col h-full">
          {/* Live Preview & Settings - Compact */}
          <div className="px-3 py-2 border-b border-gray-600 flex-shrink-0">
            <div className="flex items-center gap-4">
              {/* Live Preview */}
              <div className="flex-shrink-0">
                <MaterialPreviewSphere
                  material={getScratchPreviewMaterial()}
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
                    value={scratchShader}
                    onChange={(e) => setScratchShader(e.target.value as 'standard' | 'unlit')}
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
                    value={scratchMaterialType}
                    onChange={(e) => setScratchMaterialType(e.target.value as 'solid' | 'texture')}
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
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">
            {/* Base Color */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Base Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={scratchColor}
                  onChange={(e) => setScratchColor(e.target.value)}
                  className="w-10 h-8 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={scratchColor}
                  onChange={(e) => setScratchColor(e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none font-mono text-xs"
                />
              </div>
            </div>

            {/* Standard Shader Properties */}
            {scratchShader === 'standard' && (
              <>
                {/* Metalness & Roughness - Side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Metalness: {scratchMetalness.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={scratchMetalness}
                      onChange={(e) => setScratchMetalness(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                      <span>Non-metal</span>
                      <span>Metal</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Roughness: {scratchRoughness.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={scratchRoughness}
                      onChange={(e) => setScratchRoughness(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                      <span>Mirror</span>
                      <span>Rough</span>
                    </div>
                  </div>
                </div>

                {/* Emission */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Emission
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={scratchEmissive}
                        onChange={(e) => setScratchEmissive(e.target.value)}
                        className="w-10 h-8 border border-gray-600 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={scratchEmissive}
                        onChange={(e) => setScratchEmissive(e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Intensity: {scratchEmissiveIntensity.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={scratchEmissiveIntensity}
                        onChange={(e) => setScratchEmissiveIntensity(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Textures Section */}
            {scratchMaterialType === 'texture' && (
              <div className="border-t border-gray-600 pt-2">
                <h4 className="text-xs font-medium text-gray-300 mb-2">Textures</h4>
                <div className="space-y-3">
                  {/* Albedo Texture */}
                  <TextureInput
                    label="Albedo (Diffuse)"
                    value={scratchAlbedoTexture}
                    onChange={setScratchAlbedoTexture}
                    onUpload={(file) => handleTextureUpload(file, setScratchAlbedoTexture)}
                  />

                  {scratchShader === 'standard' && (
                    <>
                      {/* Normal Texture */}
                      <TextureInput
                        label="Normal Map"
                        value={scratchNormalTexture}
                        onChange={setScratchNormalTexture}
                        onUpload={(file) => handleTextureUpload(file, setScratchNormalTexture)}
                      />

                      {/* Metallic Texture */}
                      <TextureInput
                        label="Metallic"
                        value={scratchMetallicTexture}
                        onChange={setScratchMetallicTexture}
                        onUpload={(file) => handleTextureUpload(file, setScratchMetallicTexture)}
                      />

                      {/* Roughness Texture */}
                      <TextureInput
                        label="Roughness"
                        value={scratchRoughnessTexture}
                        onChange={setScratchRoughnessTexture}
                        onUpload={(file) => handleTextureUpload(file, setScratchRoughnessTexture)}
                      />

                      {/* Emission Texture */}
                      <TextureInput
                        label="Emission"
                        value={scratchEmissiveTexture}
                        onChange={setScratchEmissiveTexture}
                        onUpload={(file) => handleTextureUpload(file, setScratchEmissiveTexture)}
                      />

                      {/* Occlusion Texture */}
                      <TextureInput
                        label="Occlusion (AO)"
                        value={scratchOcclusionTexture}
                        onChange={setScratchOcclusionTexture}
                        onUpload={(file) => handleTextureUpload(file, setScratchOcclusionTexture)}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'template',
      label: 'From Template',
      icon: <FiGrid size={16} />,
      content: (
        <div className="flex flex-col h-full">
          {/* Search Bar - Compact */}
          <div className="px-3 py-2 border-b border-gray-600 flex-shrink-0">
            <div className="relative">
              <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search templates..."
                value={templateSearchTerm}
                onChange={(e) => setTemplateSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Template Grid - Scrollable */}
          <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
            <div className="grid grid-cols-2 gap-3">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`p-2 border rounded text-left transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    {/* 3D Preview - Smaller */}
                    <MaterialPreviewSphere
                      material={template.previewMaterial}
                      size={40}
                      showControls={false}
                      className="border border-gray-600 rounded"
                    />

                    {/* Template Info - Compact */}
                    <div className="text-center w-full">
                      <div className="font-medium text-white text-xs truncate">{template.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{template.description}</div>
                      <div className="text-[10px] text-gray-500">
                        {template.shader} • {template.materialType}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <div className="text-lg mb-2">No templates found</div>
                <div className="text-sm">Try a different search term</div>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Material"
      maxWidth="w-[650px]"
      maxHeight="max-h-[80vh]"
    >
      <div className="flex flex-col h-full max-h-[calc(80vh-8rem)]">
        {/* Material Name & ID - Fixed at Top */}
        <div className="px-4 py-3 border-b border-gray-600 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Material Name
              </label>
              <input
                type="text"
                value={materialName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Material"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Material ID
              </label>
              <input
                type="text"
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                placeholder="my_material"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            Unique identifier for code reference
          </p>
        </div>

        {/* Tabs Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <InternalTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={changeTab}
            variant="underline"
            className="h-full"
          />
        </div>

        {/* Actions - Fixed at Bottom */}
        <div className="px-4 py-3 border-t border-gray-600 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreateDisabled()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded flex items-center space-x-2 text-sm"
            >
              <FiPlus size={14} />
              <span>Create Material</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
