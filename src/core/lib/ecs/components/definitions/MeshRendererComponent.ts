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
  serialize: (eid: EntityId, component: any) => {
    const result: any = {
      meshId: getStringFromHash(component.meshIdHash[eid]),
      materialId: getStringFromHash(component.materialIdHash[eid]),
      enabled: Boolean(component.enabled[eid]),
      castShadows: Boolean(component.castShadows[eid]),
      receiveShadows: Boolean(component.receiveShadows[eid]),
      modelPath: getStringFromHash(component.modelPathHash[eid]),
    };

    // Check if this entity has material overrides by checking if any override flag is set
    // We'll use a special flag in the component to track this
    const hasOverrides = Boolean(component.hasOverrides?.[eid]);

    if (hasOverrides) {
      const color = getRgbAsHex(
        {
          r: component.materialColorR as Float32Array,
          g: component.materialColorG as Float32Array,
          b: component.materialColorB as Float32Array,
        },
        eid,
      );

      const emissive = getRgbAsHex(
        {
          r: component.emissiveR as Float32Array,
          g: component.emissiveG as Float32Array,
          b: component.emissiveB as Float32Array,
        },
        eid,
      );

      result.material = {
        shader: component.shader[eid] === 0 ? 'standard' : 'unlit',
        materialType: component.materialType[eid] === 0 ? 'solid' : 'texture',
        color,
        metalness: component.metalness[eid],
        roughness: component.roughness[eid],
        emissive,
        emissiveIntensity: component.emissiveIntensity[eid],
        normalScale: component.normalScale[eid],
        occlusionStrength: component.occlusionStrength[eid],
        textureOffsetX: component.textureOffsetX[eid],
        textureOffsetY: component.textureOffsetY[eid],
        textureRepeatX: component.textureRepeatX[eid],
        textureRepeatY: component.textureRepeatY[eid],
        albedoTexture: getStringFromHash(component.albedoTextureHash[eid]),
        normalTexture: getStringFromHash(component.normalTextureHash[eid]),
        metallicTexture: getStringFromHash(component.metallicTextureHash[eid]),
        roughnessTexture: getStringFromHash(component.roughnessTextureHash[eid]),
        emissiveTexture: getStringFromHash(component.emissiveTextureHash[eid]),
        occlusionTexture: getStringFromHash(component.occlusionTextureHash[eid]),
      };
    }

    return result;
  },
  deserialize: (eid: EntityId, data, component: any) => {
    component.enabled[eid] = (data.enabled ?? true) ? 1 : 0;
    component.castShadows[eid] = (data.castShadows ?? true) ? 1 : 0;
    component.receiveShadows[eid] = (data.receiveShadows ?? true) ? 1 : 0;
    component.meshIdHash[eid] = storeString(data.meshId || '');
    component.materialIdHash[eid] = storeString(data.materialId || '');
    component.modelPathHash[eid] = storeString(data.modelPath || '');

    // Set the hasOverrides flag based on whether material data is provided
    component.hasOverrides[eid] = data.material ? 1 : 0;

    if (data.material) {
      const material = data.material;

      // Set shader and material type
      component.shader[eid] = material.shader === 'unlit' ? 1 : 0;
      component.materialType[eid] = material.materialType === 'texture' ? 1 : 0;

      // Set override values
      setRgbValues(
        {
          r: component.materialColorR as Float32Array,
          g: component.materialColorG as Float32Array,
          b: component.materialColorB as Float32Array,
        },
        eid,
        material.color || '#cccccc',
      );

      setRgbValues(
        {
          r: component.emissiveR as Float32Array,
          g: component.emissiveG as Float32Array,
          b: component.emissiveB as Float32Array,
        },
        eid,
        material.emissive || '#000000',
      );

      component.metalness[eid] = material.metalness ?? 0;
      component.roughness[eid] = material.roughness ?? 0.7;
      component.emissiveIntensity[eid] = material.emissiveIntensity ?? 0;
      component.normalScale[eid] = material.normalScale ?? 1;
      component.occlusionStrength[eid] = material.occlusionStrength ?? 1;
      component.textureOffsetX[eid] = material.textureOffsetX ?? 0;
      component.textureOffsetY[eid] = material.textureOffsetY ?? 0;
      component.textureRepeatX[eid] = material.textureRepeatX ?? 1;
      component.textureRepeatY[eid] = material.textureRepeatY ?? 1;

      // Store texture hashes
      component.albedoTextureHash[eid] = material.albedoTexture
        ? storeString(material.albedoTexture)
        : 0;
      component.normalTextureHash[eid] = material.normalTexture
        ? storeString(material.normalTexture)
        : 0;
      component.metallicTextureHash[eid] = material.metallicTexture
        ? storeString(material.metallicTexture)
        : 0;
      component.roughnessTextureHash[eid] = material.roughnessTexture
        ? storeString(material.roughnessTexture)
        : 0;
      component.emissiveTextureHash[eid] = material.emissiveTexture
        ? storeString(material.emissiveTexture)
        : 0;
      component.occlusionTextureHash[eid] = material.occlusionTexture
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
