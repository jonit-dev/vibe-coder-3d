import { useState } from 'react';
import type { IMaterialDefinition } from '@/core/materials/Material.types';

export interface IMaterialFormState {
  materialName: string;
  materialId: string;
  shader: 'standard' | 'unlit';
  materialType: 'solid' | 'texture';
  color: string;
  metalness: number;
  roughness: number;
  emissive: string;
  emissiveIntensity: number;
  albedoTexture?: string;
  normalTexture?: string;
  metallicTexture?: string;
  roughnessTexture?: string;
  emissiveTexture?: string;
  occlusionTexture?: string;
}

export interface IMaterialFormActions {
  setMaterialName: (name: string) => void;
  setMaterialId: (id: string) => void;
  setShader: (shader: 'standard' | 'unlit') => void;
  setMaterialType: (type: 'solid' | 'texture') => void;
  setColor: (color: string) => void;
  setMetalness: (metalness: number) => void;
  setRoughness: (roughness: number) => void;
  setEmissive: (emissive: string) => void;
  setEmissiveIntensity: (intensity: number) => void;
  setAlbedoTexture: (texture?: string) => void;
  setNormalTexture: (texture?: string) => void;
  setMetallicTexture: (texture?: string) => void;
  setRoughnessTexture: (texture?: string) => void;
  setEmissiveTexture: (texture?: string) => void;
  setOcclusionTexture: (texture?: string) => void;
  resetForm: () => void;
  createPreviewMaterial: () => IMaterialDefinition;
}

const initialState: IMaterialFormState = {
  materialName: '',
  materialId: '',
  shader: 'standard',
  materialType: 'solid',
  color: '#cccccc',
  metalness: 0,
  roughness: 0.7,
  emissive: '#000000',
  emissiveIntensity: 0,
  albedoTexture: undefined,
  normalTexture: undefined,
  metallicTexture: undefined,
  roughnessTexture: undefined,
  emissiveTexture: undefined,
  occlusionTexture: undefined,
};

export const useMaterialForm = (): [IMaterialFormState, IMaterialFormActions] => {
  const [state, setState] = useState<IMaterialFormState>(initialState);

  const actions: IMaterialFormActions = {
    setMaterialName: (materialName: string) => setState(prev => ({ ...prev, materialName })),
    setMaterialId: (materialId: string) => setState(prev => ({ ...prev, materialId })),
    setShader: (shader: 'standard' | 'unlit') => setState(prev => ({ ...prev, shader })),
    setMaterialType: (materialType: 'solid' | 'texture') => setState(prev => ({ ...prev, materialType })),
    setColor: (color: string) => setState(prev => ({ ...prev, color })),
    setMetalness: (metalness: number) => setState(prev => ({ ...prev, metalness })),
    setRoughness: (roughness: number) => setState(prev => ({ ...prev, roughness })),
    setEmissive: (emissive: string) => setState(prev => ({ ...prev, emissive })),
    setEmissiveIntensity: (emissiveIntensity: number) => setState(prev => ({ ...prev, emissiveIntensity })),
    setAlbedoTexture: (albedoTexture?: string) => setState(prev => ({ ...prev, albedoTexture })),
    setNormalTexture: (normalTexture?: string) => setState(prev => ({ ...prev, normalTexture })),
    setMetallicTexture: (metallicTexture?: string) => setState(prev => ({ ...prev, metallicTexture })),
    setRoughnessTexture: (roughnessTexture?: string) => setState(prev => ({ ...prev, roughnessTexture })),
    setEmissiveTexture: (emissiveTexture?: string) => setState(prev => ({ ...prev, emissiveTexture })),
    setOcclusionTexture: (occlusionTexture?: string) => setState(prev => ({ ...prev, occlusionTexture })),

    resetForm: () => setState(initialState),

    createPreviewMaterial: (): IMaterialDefinition => ({
      id: 'preview_scratch',
      name: 'Scratch Preview',
      shader: state.shader,
      materialType: state.materialType,
      color: state.color,
      metalness: state.metalness,
      roughness: state.roughness,
      emissive: state.emissive,
      emissiveIntensity: state.emissiveIntensity,
      normalScale: 1,
      occlusionStrength: 1,
      textureOffsetX: 0,
      textureOffsetY: 0,
      albedoTexture: state.albedoTexture,
      normalTexture: state.normalTexture,
      metallicTexture: state.metallicTexture,
      roughnessTexture: state.roughnessTexture,
      emissiveTexture: state.emissiveTexture,
      occlusionTexture: state.occlusionTexture,
    }),
  };

  return [state, actions];
};