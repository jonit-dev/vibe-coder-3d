import React, { useState, useMemo } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';

import { Modal } from '@/editor/components/shared/Modal';
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
    id: 'standard_solid',
    name: 'Standard Solid',
    shader: 'standard' as const,
    materialType: 'solid' as const,
    description: 'PBR material with solid color',
    previewMaterial: {
      id: 'preview_standard_solid',
      name: 'Standard Solid Preview',
      shader: 'standard' as const,
      materialType: 'solid' as const,
      color: '#cccccc',
      metalness: 0.1,
      roughness: 0.5,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
    } as IMaterialDefinition,
  },
  {
    id: 'standard_texture',
    name: 'Standard Textured',
    shader: 'standard' as const,
    materialType: 'texture' as const,
    description: 'PBR material with texture maps',
    previewMaterial: {
      id: 'preview_standard_textured',
      name: 'Standard Textured Preview',
      shader: 'standard' as const,
      materialType: 'texture' as const,
      color: '#ffffff',
      metalness: 0.3,
      roughness: 0.4,
      emissive: '#000000',
      emissiveIntensity: 0,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
    } as IMaterialDefinition,
  },
  {
    id: 'unlit_solid',
    name: 'Unlit Solid',
    shader: 'unlit' as const,
    materialType: 'solid' as const,
    description: 'Simple unlit material with solid color',
    previewMaterial: {
      id: 'preview_unlit_solid',
      name: 'Unlit Solid Preview',
      shader: 'unlit' as const,
      materialType: 'solid' as const,
      color: '#ffaa55',
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
  {
    id: 'unlit_texture',
    name: 'Unlit Textured',
    shader: 'unlit' as const,
    materialType: 'texture' as const,
    description: 'Simple unlit material with texture',
    previewMaterial: {
      id: 'preview_unlit_textured',
      name: 'Unlit Textured Preview',
      shader: 'unlit' as const,
      materialType: 'texture' as const,
      color: '#55aaff',
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

  const materialRegistry = MaterialRegistry.getInstance();

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
    if (!selectedTemplate || !materialName.trim() || !materialId.trim()) {
      return;
    }

    const template = MATERIAL_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    // If duplicating from existing material
    let baseMaterial: Partial<IMaterialDefinition> = template;

    if (templateMaterialId) {
      const existingMaterial = materialRegistry.get(templateMaterialId);
      if (existingMaterial) {
        baseMaterial = existingMaterial;
      }
    }

    const newMaterial: IMaterialDefinition = {
      id: materialId.trim(),
      name: materialName.trim(),
      shader: baseMaterial.shader || 'standard',
      materialType: baseMaterial.materialType || 'solid',
      color: baseMaterial.color || '#cccccc',
      metalness: baseMaterial.metalness || 0,
      roughness: baseMaterial.roughness || 0.7,
      emissive: baseMaterial.emissive || '#000000',
      emissiveIntensity: baseMaterial.emissiveIntensity || 0,
      normalScale: baseMaterial.normalScale || 1,
      occlusionStrength: baseMaterial.occlusionStrength || 1,
      textureOffsetX: baseMaterial.textureOffsetX || 0,
      textureOffsetY: baseMaterial.textureOffsetY || 0,
      albedoTexture: baseMaterial.albedoTexture,
      normalTexture: baseMaterial.normalTexture,
      metallicTexture: baseMaterial.metallicTexture,
      roughnessTexture: baseMaterial.roughnessTexture,
      emissiveTexture: baseMaterial.emissiveTexture,
      occlusionTexture: baseMaterial.occlusionTexture,
    };

    try {
      materialRegistry.upsert(newMaterial);
      await materialRegistry.saveToAsset(newMaterial);
      onCreate(newMaterial);
      onClose();

      // Reset form
      setSelectedTemplate('');
      setMaterialName('');
      setMaterialId('');
    } catch (error) {
      console.error('Failed to create material:', error);
      alert('Failed to create material. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedTemplate('');
    setMaterialName('');
    setMaterialId('');
    setTemplateSearchTerm('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Material"
      maxWidth="w-[600px]"
      maxHeight="max-h-[85vh]"
    >
      <div className="flex flex-col h-full">
        {/* Material Name & ID - Fixed at Top */}
        <div className="p-4 border-b border-gray-600">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Material Name
              </label>
              <input
                type="text"
                value={materialName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Material"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Material ID
              </label>
              <input
                type="text"
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                placeholder="my_material"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Unique identifier used in code. Only letters, numbers, and underscores allowed.
          </p>
        </div>

        {/* Template Selection - Scrollable */}
        <div className="p-4 border-b border-gray-600">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Material Template
          </label>

          {/* Search Bar */}
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search templates..."
              value={templateSearchTerm}
              onChange={(e) => setTemplateSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-3">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChange(template.id)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* 3D Preview */}
                    <div className="flex-shrink-0">
                      <MaterialPreviewSphere
                        material={template.previewMaterial}
                        size={64}
                        showControls={false}
                        className="border border-gray-600 rounded"
                      />
                    </div>

                    {/* Template Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white">{template.name}</div>
                      <div className="text-sm text-gray-400">{template.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.shader} • {template.materialType}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {filteredTemplates.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-lg mb-2">No templates found</div>
                  <div className="text-sm">Try a different search term</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions - Fixed at Bottom */}
        <div className="p-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedTemplate || !materialName.trim() || !materialId.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded flex items-center space-x-2"
            >
              <FiPlus size={16} />
              <span>Create Material</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
