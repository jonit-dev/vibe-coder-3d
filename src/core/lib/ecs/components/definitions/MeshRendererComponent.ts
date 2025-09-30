/**
 * MeshRenderer Component Definition
 * Handles 3D mesh rendering with materials
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';
import { getRgbAsHex, setRgbValues } from '../../utils/colorUtils';
import { getStringFromHash, storeString } from '../../utils/stringHashUtils';

// MeshRenderer Schema
const MeshRendererSchema = z.object({
  meshId: z.string(),
  materialId: z.string(),
  materials: z.array(z.string()).optional(), // Optional array for multi-submesh support
  enabled: z.boolean().default(true),
  castShadows: z.boolean().default(true),
  receiveShadows: z.boolean().default(true),
  modelPath: z.string().optional(),
  material: z
    .object({
      shader: z.enum(['standard', 'unlit']).default('standard'),
      materialType: z.enum(['solid', 'texture']).default('solid'),
      // Main Maps
      color: z.string().default('#cccccc'),
      albedoTexture: z.string().optional(),
      normalTexture: z.string().optional(),
      normalScale: z.number().default(1),
      // Material Properties
      metalness: z.number().default(0),
      metallicTexture: z.string().optional(),
      roughness: z.number().default(0.7),
      roughnessTexture: z.string().optional(),
      // Emission
      emissive: z.string().default('#000000'),
      emissiveIntensity: z.number().default(0),
      emissiveTexture: z.string().optional(),
      // Secondary Maps
      occlusionTexture: z.string().optional(),
      occlusionStrength: z.number().default(1),
      // Texture Transform
      textureOffsetX: z.number().default(0),
      textureOffsetY: z.number().default(0),
      textureRepeatX: z.number().default(1),
      textureRepeatY: z.number().default(1),
    })
    .optional(),
});

// MeshRenderer Component Definition
export const meshRendererComponent = ComponentFactory.create({
  id: 'MeshRenderer',
  name: 'Mesh Renderer',
  category: ComponentCategory.Rendering,
  schema: MeshRendererSchema,
  incompatibleComponents: ['Camera', 'Light'], // Mesh renderers shouldn't be on camera or light entities
  fields: {
    enabled: Types.ui8,
    castShadows: Types.ui8,
    receiveShadows: Types.ui8,
    hasOverrides: Types.ui8, // Flag to track if this entity has material overrides
    shader: Types.ui8, // 0 = standard, 1 = unlit
    materialType: Types.ui8, // 0 = solid, 1 = texture
    materialColorR: Types.f32,
    materialColorG: Types.f32,
    materialColorB: Types.f32,
    normalScale: Types.f32,
    metalness: Types.f32,
    roughness: Types.f32,
    emissiveR: Types.f32,
    emissiveG: Types.f32,
    emissiveB: Types.f32,
    emissiveIntensity: Types.f32,
    occlusionStrength: Types.f32,
    textureOffsetX: Types.f32,
    textureOffsetY: Types.f32,
    textureRepeatX: Types.f32,
    textureRepeatY: Types.f32,
    meshIdHash: Types.ui32,
    materialIdHash: Types.ui32,
    modelPathHash: Types.ui32,
    // Texture hashes
    albedoTextureHash: Types.ui32,
    normalTextureHash: Types.ui32,
    metallicTextureHash: Types.ui32,
    roughnessTextureHash: Types.ui32,
    emissiveTextureHash: Types.ui32,
    occlusionTextureHash: Types.ui32,
  },
  serialize: (eid: EntityId, component: unknown) => {
    const comp = component as Record<string, Float32Array | Uint8Array | Uint32Array>;
    const result: Record<string, unknown> = {
      meshId: getStringFromHash(comp.meshIdHash[eid]),
      materialId: getStringFromHash(comp.materialIdHash[eid]),
      enabled: Boolean(comp.enabled[eid]),
      castShadows: Boolean(comp.castShadows[eid]),
      receiveShadows: Boolean(comp.receiveShadows[eid]),
      modelPath: getStringFromHash(comp.modelPathHash[eid]),
    };

    // Check if this entity has material overrides by checking if any override flag is set
    // We'll use a special flag in the component to track this
    const hasOverrides = Boolean(comp.hasOverrides?.[eid]);

    if (hasOverrides) {
      const color = getRgbAsHex(
        {
          r: comp.materialColorR as Float32Array,
          g: comp.materialColorG as Float32Array,
          b: comp.materialColorB as Float32Array,
        },
        eid,
      );

      const emissive = getRgbAsHex(
        {
          r: comp.emissiveR as Float32Array,
          g: comp.emissiveG as Float32Array,
          b: comp.emissiveB as Float32Array,
        },
        eid,
      );

      result.material = {
        shader: comp.shader[eid] === 0 ? 'standard' : 'unlit',
        materialType: comp.materialType[eid] === 0 ? 'solid' : 'texture',
        color,
        metalness: comp.metalness[eid],
        roughness: comp.roughness[eid],
        emissive,
        emissiveIntensity: comp.emissiveIntensity[eid],
        normalScale: comp.normalScale[eid],
        occlusionStrength: comp.occlusionStrength[eid],
        textureOffsetX: comp.textureOffsetX[eid],
        textureOffsetY: comp.textureOffsetY[eid],
        textureRepeatX: comp.textureRepeatX[eid],
        textureRepeatY: comp.textureRepeatY[eid],
        albedoTexture: getStringFromHash(comp.albedoTextureHash[eid]),
        normalTexture: getStringFromHash(comp.normalTextureHash[eid]),
        metallicTexture: getStringFromHash(comp.metallicTextureHash[eid]),
        roughnessTexture: getStringFromHash(comp.roughnessTextureHash[eid]),
        emissiveTexture: getStringFromHash(comp.emissiveTextureHash[eid]),
        occlusionTexture: getStringFromHash(comp.occlusionTextureHash[eid]),
      };
    }

    return result;
  },
  deserialize: (eid: EntityId, data: Record<string, unknown>, component: unknown) => {
    const comp = component as Record<string, Float32Array | Uint8Array | Uint32Array>;
    const meshData = data as Partial<MeshRendererData>;

    comp.enabled[eid] = (meshData.enabled ?? true) ? 1 : 0;
    comp.castShadows[eid] = (meshData.castShadows ?? true) ? 1 : 0;
    comp.receiveShadows[eid] = (meshData.receiveShadows ?? true) ? 1 : 0;
    comp.meshIdHash[eid] = storeString(meshData.meshId || '');
    comp.materialIdHash[eid] = storeString(meshData.materialId || '');
    comp.modelPathHash[eid] = storeString(meshData.modelPath || '');

    // Set the hasOverrides flag based on whether material data is provided
    comp.hasOverrides[eid] = meshData.material ? 1 : 0;

    if (meshData.material) {
      const material = meshData.material;

      // Set shader and material type
      comp.shader[eid] = material.shader === 'unlit' ? 1 : 0;
      comp.materialType[eid] = material.materialType === 'texture' ? 1 : 0;

      // Set override values
      setRgbValues(
        {
          r: comp.materialColorR as Float32Array,
          g: comp.materialColorG as Float32Array,
          b: comp.materialColorB as Float32Array,
        },
        eid,
        material.color || '#cccccc',
      );

      setRgbValues(
        {
          r: comp.emissiveR as Float32Array,
          g: comp.emissiveG as Float32Array,
          b: comp.emissiveB as Float32Array,
        },
        eid,
        material.emissive || '#000000',
      );

      comp.metalness[eid] = material.metalness ?? 0;
      comp.roughness[eid] = material.roughness ?? 0.7;
      comp.emissiveIntensity[eid] = material.emissiveIntensity ?? 0;
      comp.normalScale[eid] = material.normalScale ?? 1;
      comp.occlusionStrength[eid] = material.occlusionStrength ?? 1;
      comp.textureOffsetX[eid] = material.textureOffsetX ?? 0;
      comp.textureOffsetY[eid] = material.textureOffsetY ?? 0;
      comp.textureRepeatX[eid] = material.textureRepeatX ?? 1;
      comp.textureRepeatY[eid] = material.textureRepeatY ?? 1;

      // Store texture hashes
      comp.albedoTextureHash[eid] = material.albedoTexture
        ? storeString(material.albedoTexture)
        : 0;
      comp.normalTextureHash[eid] = material.normalTexture
        ? storeString(material.normalTexture)
        : 0;
      comp.metallicTextureHash[eid] = material.metallicTexture
        ? storeString(material.metallicTexture)
        : 0;
      comp.roughnessTextureHash[eid] = material.roughnessTexture
        ? storeString(material.roughnessTexture)
        : 0;
      comp.emissiveTextureHash[eid] = material.emissiveTexture
        ? storeString(material.emissiveTexture)
        : 0;
      comp.occlusionTextureHash[eid] = material.occlusionTexture
        ? storeString(material.occlusionTexture)
        : 0;
    }
    // Note: When no overrides, we don't set any material values - let the viewport get them from registry
  },
  dependencies: ['Transform'],
  conflicts: ['Camera', 'Light'], // MeshRenderer conflicts with Camera and Light
  metadata: {
    description: 'Renders 3D mesh geometry with materials',
    version: '1.0.0',
  },
});

export type MeshRendererData = z.infer<typeof MeshRendererSchema>;
