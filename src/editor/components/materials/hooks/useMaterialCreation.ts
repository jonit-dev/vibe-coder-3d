import { useCallback } from 'react';
import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { MaterialRegistry } from '@/core/materials/MaterialRegistry';
import type { IMaterialFormState } from './useMaterialForm';
import type { IMaterialTemplate } from '../constants/materialTemplates';

export interface IMaterialCreationActions {
  generateUniqueId: (baseId: string) => string;
  slugify: (text: string) => string;
  createMaterialFromScratch: (formState: IMaterialFormState) => IMaterialDefinition;
  createMaterialFromTemplate: (
    formState: IMaterialFormState,
    template: IMaterialTemplate,
    templateMaterialId?: string
  ) => IMaterialDefinition;
  validateForm: (
    formState: IMaterialFormState,
    activeTab: string,
    selectedTemplate: string
  ) => boolean;
}

export const useMaterialCreation = (): IMaterialCreationActions => {
  const materialRegistry = MaterialRegistry.getInstance();

  const slugify = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }, []);

  const generateUniqueId = useCallback((baseId: string): string => {
    if (!baseId) return '';

    let id = baseId;
    let counter = 1;

    while (materialRegistry.get(id)) {
      id = `${baseId}_${counter}`;
      counter++;
    }

    return id;
  }, [materialRegistry]);

  const createMaterialFromScratch = useCallback((formState: IMaterialFormState): IMaterialDefinition => {
    return {
      id: formState.materialId.trim(),
      name: formState.materialName.trim(),
      shader: formState.shader,
      materialType: formState.materialType,
      color: formState.color,
      metalness: formState.metalness,
      roughness: formState.roughness,
      emissive: formState.emissive,
      emissiveIntensity: formState.emissiveIntensity,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
      albedoTexture: formState.albedoTexture,
      normalTexture: formState.normalTexture,
      metallicTexture: formState.metallicTexture,
      roughnessTexture: formState.roughnessTexture,
      emissiveTexture: formState.emissiveTexture,
      occlusionTexture: formState.occlusionTexture,
    };
  }, []);

  const createMaterialFromTemplate = useCallback((
    formState: IMaterialFormState,
    template: IMaterialTemplate,
    templateMaterialId?: string
  ): IMaterialDefinition => {
    let baseMaterial: Partial<IMaterialDefinition> = template.previewMaterial;

    if (templateMaterialId) {
      const existingMaterial = materialRegistry.get(templateMaterialId);
      if (existingMaterial) {
        baseMaterial = existingMaterial;
      }
    }

    return {
      id: formState.materialId.trim(),
      name: formState.materialName.trim(),
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
  }, [materialRegistry]);

  const validateForm = useCallback((
    formState: IMaterialFormState,
    activeTab: string,
    selectedTemplate: string
  ): boolean => {
    if (!formState.materialName.trim() || !formState.materialId.trim()) return false;
    if (activeTab === 'template' && !selectedTemplate) return false;
    return true;
  }, []);

  return {
    generateUniqueId,
    slugify,
    createMaterialFromScratch,
    createMaterialFromTemplate,
    validateForm,
  };
};