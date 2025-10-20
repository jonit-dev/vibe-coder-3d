/**
 * GeometryAsset Component Definition
 * Handles rendering of geometry loaded from .shape.json metadata files
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';
import { getStringFromHash, storeString } from '../../utils/stringHashUtils';

// GeometryAsset Schema
const GeometryAssetSchema = z.object({
  // Path to the .shape.json file (e.g., "/src/game/geometry/example_box.shape.json")
  path: z.string(),
  // Optional geometry ID for referencing by name
  geometryId: z.string().optional(),
  // Optional material ID override
  materialId: z.string().optional(),
  // Rendering flags
  enabled: z.boolean().default(true),
  castShadows: z.boolean().default(true),
  receiveShadows: z.boolean().default(true),
  // Geometry processing options
  options: z
    .object({
      recomputeNormals: z.boolean().default(false), // Recompute normals from geometry
      recomputeTangents: z.boolean().default(false), // Recompute tangents for normal mapping
      recenter: z.boolean().default(false), // Center geometry at origin
      computeBounds: z.boolean().default(true), // Compute bounding box/sphere
      flipNormals: z.boolean().default(false), // Flip normal direction
      scale: z.number().default(1.0), // Additional scale factor
    })
    .optional(),
});

// GeometryAsset Component Definition
export const geometryAssetComponent = ComponentFactory.create({
  id: 'GeometryAsset',
  name: 'Geometry Asset',
  category: ComponentCategory.Rendering,
  schema: GeometryAssetSchema,
  incompatibleComponents: ['MeshRenderer', 'Camera', 'Light'], // GeometryAsset replaces MeshRenderer
  fields: {
    pathHash: Types.ui32,
    geometryIdHash: Types.ui32,
    materialIdHash: Types.ui32,
    enabled: Types.ui8,
    castShadows: Types.ui8,
    receiveShadows: Types.ui8,
    // Options flags
    recomputeNormals: Types.ui8,
    recomputeTangents: Types.ui8,
    recenter: Types.ui8,
    computeBounds: Types.ui8,
    flipNormals: Types.ui8,
    optionsScale: Types.f32,
  },
  serialize: (eid: EntityId, component: unknown) => {
    const comp = component as Record<string, Float32Array | Uint8Array | Uint32Array>;

    const pathString = getStringFromHash(comp.pathHash[eid]);

    const result: Record<string, unknown> = {
      path: pathString,
      geometryId: getStringFromHash(comp.geometryIdHash[eid]),
      materialId: getStringFromHash(comp.materialIdHash[eid]),
      enabled: Boolean(comp.enabled[eid]),
      castShadows: Boolean(comp.castShadows[eid]),
      receiveShadows: Boolean(comp.receiveShadows[eid]),
    };

    // DEBUG LOGGING
    console.log('[GeometryAsset] Serializing entity', eid, 'path:', pathString);

    // Check if any options are non-default
    const hasOptions =
      comp.recomputeNormals[eid] ||
      comp.recomputeTangents[eid] ||
      comp.recenter[eid] ||
      !comp.computeBounds[eid] ||
      comp.flipNormals[eid] ||
      comp.optionsScale[eid] !== 1.0;

    if (hasOptions) {
      result.options = {
        recomputeNormals: Boolean(comp.recomputeNormals[eid]),
        recomputeTangents: Boolean(comp.recomputeTangents[eid]),
        recenter: Boolean(comp.recenter[eid]),
        computeBounds: Boolean(comp.computeBounds[eid]),
        flipNormals: Boolean(comp.flipNormals[eid]),
        scale: comp.optionsScale[eid],
      };
    }

    return result;
  },
  deserialize: (eid: EntityId, data: Record<string, unknown>, component: unknown) => {
    const comp = component as Record<string, Float32Array | Uint8Array | Uint32Array>;
    const geomData = data as Partial<GeometryAssetData>;

    // DEBUG LOGGING
    console.log('[GeometryAsset] Deserializing for entity', eid, 'with data:', geomData);

    comp.pathHash[eid] = storeString(geomData.path || '');
    comp.geometryIdHash[eid] = storeString(geomData.geometryId || '');
    comp.materialIdHash[eid] = storeString(geomData.materialId || '');
    comp.enabled[eid] = (geomData.enabled ?? true) ? 1 : 0;
    comp.castShadows[eid] = (geomData.castShadows ?? true) ? 1 : 0;
    comp.receiveShadows[eid] = (geomData.receiveShadows ?? true) ? 1 : 0;

    // Deserialize options with defaults
    const options = (geomData.options || {}) as Partial<{
      recomputeNormals: boolean;
      recomputeTangents: boolean;
      recenter: boolean;
      computeBounds: boolean;
      flipNormals: boolean;
      scale: number;
    }>;
    comp.recomputeNormals[eid] = (options.recomputeNormals ?? false) ? 1 : 0;
    comp.recomputeTangents[eid] = (options.recomputeTangents ?? false) ? 1 : 0;
    comp.recenter[eid] = (options.recenter ?? false) ? 1 : 0;
    comp.computeBounds[eid] = (options.computeBounds ?? true) ? 1 : 0;
    comp.flipNormals[eid] = (options.flipNormals ?? false) ? 1 : 0;
    comp.optionsScale[eid] = options.scale ?? 1.0;

    console.log('[GeometryAsset] Deserialized successfully. Path hash:', comp.pathHash[eid]);
  },
  dependencies: ['Transform'],
  conflicts: ['MeshRenderer', 'Camera', 'Light'], // GeometryAsset conflicts with MeshRenderer
  metadata: {
    description: 'Renders geometry loaded from .shape.json metadata files',
    version: '1.0.0',
  },
});

export type GeometryAssetData = z.infer<typeof GeometryAssetSchema>;
