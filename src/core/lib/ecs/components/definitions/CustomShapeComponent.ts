/**
 * CustomShape Component Definition
 * Stores dynamic shape data (shapeId and params) for custom shapes from the shape registry
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import type { EntityId } from '../../types';
import { storeString, getStringFromHash } from '../../utils/stringHashUtils';

/**
 * CustomShape Schema
 * Stores the shape ID and parameters for dynamic custom shapes
 */
const CustomShapeSchema = z.object({
  /** Unique shape identifier from the shape registry */
  shapeId: z.string(),
  /** Shape-specific parameters (validated by the shape's paramsSchema) */
  params: z.record(z.unknown()).default({}),
});

/**
 * CustomShape Component
 * Associates an entity with a custom shape from the registry
 */
export const customShapeComponent = ComponentFactory.create({
  id: 'CustomShape',
  name: 'Custom Shape',
  category: ComponentCategory.Rendering,
  schema: CustomShapeSchema,
  incompatibleComponents: ['Camera', 'Light'], // Custom shapes shouldn't be on camera or light entities
  fields: {
    shapeIdHash: Types.ui32, // Hash of the shape ID string
    paramsHash: Types.ui32, // Hash of JSON-serialized params
  },
  serialize: (eid: EntityId, component: unknown) => {
    const comp = component as Record<string, Uint32Array>;

    const shapeId = getStringFromHash(comp.shapeIdHash[eid]);
    const paramsJson = getStringFromHash(comp.paramsHash[eid]);

    // Parse params from JSON string
    let params: Record<string, unknown> = {};
    if (paramsJson) {
      try {
        params = JSON.parse(paramsJson);
      } catch (error) {
        console.error(`Failed to parse params for entity ${eid}:`, error);
      }
    }

    return {
      shapeId,
      params,
    };
  },
  deserialize: (eid: EntityId, data: Record<string, unknown>, component: unknown) => {
    const comp = component as Record<string, Uint32Array>;
    const shapeData = data as Partial<CustomShapeData>;

    // Store shape ID hash
    comp.shapeIdHash[eid] = storeString(shapeData.shapeId || '');

    // Serialize params to JSON and store hash
    const paramsJson = JSON.stringify(shapeData.params || {});
    comp.paramsHash[eid] = storeString(paramsJson);
  },
  dependencies: ['Transform'], // Custom shapes need a transform
  conflicts: ['Camera', 'Light'], // Cannot coexist with these components
  metadata: {
    description: 'References a custom shape from the shape registry with parameters',
    version: '1.0.0',
  },
});

export type CustomShapeData = z.infer<typeof CustomShapeSchema>;
