import { Logger } from '@core/lib/logger';
import { MeshRendererData } from '@core/lib/ecs/components/definitions/MeshRendererComponent';

const logger = Logger.create('AgentMaterialService');

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface IMaterialSpec {
  materialId?: string;
  color?: string;
  metalness?: number;
  roughness?: number;
}

const DEFAULT_MATERIAL_VALUES = {
  shader: 'standard' as const,
  materialType: 'solid' as const,
  defaultColor: '#ffffff',
  defaultMetalness: 0,
  defaultRoughness: 0.7,
  emissive: '#000000',
  emissiveIntensity: 0,
  normalScale: 1,
  occlusionStrength: 1,
  textureOffsetX: 0,
  textureOffsetY: 0,
  textureRepeatX: 1,
  textureRepeatY: 1,
};

export class AgentMaterialService {
  buildMeshUpdate(material: IMaterialSpec): Partial<MeshRendererData> {
    const meshUpdate: Partial<MeshRendererData> = {};

    if (material.materialId) {
      meshUpdate.materialId = material.materialId;
    }

    const hasOverrides =
      material.color || material.metalness !== undefined || material.roughness !== undefined;

    if (hasOverrides) {
      meshUpdate.material = {
        shader: DEFAULT_MATERIAL_VALUES.shader,
        materialType: DEFAULT_MATERIAL_VALUES.materialType,
        color: material.color || DEFAULT_MATERIAL_VALUES.defaultColor,
        metalness: material.metalness ?? DEFAULT_MATERIAL_VALUES.defaultMetalness,
        roughness: material.roughness ?? DEFAULT_MATERIAL_VALUES.defaultRoughness,
        emissive: DEFAULT_MATERIAL_VALUES.emissive,
        emissiveIntensity: DEFAULT_MATERIAL_VALUES.emissiveIntensity,
        normalScale: DEFAULT_MATERIAL_VALUES.normalScale,
        occlusionStrength: DEFAULT_MATERIAL_VALUES.occlusionStrength,
        textureOffsetX: DEFAULT_MATERIAL_VALUES.textureOffsetX,
        textureOffsetY: DEFAULT_MATERIAL_VALUES.textureOffsetY,
        textureRepeatX: DEFAULT_MATERIAL_VALUES.textureRepeatX,
        textureRepeatY: DEFAULT_MATERIAL_VALUES.textureRepeatY,
      };

      logger.debug('Material overrides built', {
        color: material.color,
        metalness: material.metalness,
        roughness: material.roughness,
      });
    }

    return meshUpdate;
  }
}
