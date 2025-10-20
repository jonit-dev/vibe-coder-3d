import * as THREE from 'three';
import { type IGeometryMeta, type IAccessor, type AttributeType } from './IGeometryMeta';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('exportBufferGeometryToMeta');

interface IExportOptions {
  inline?: boolean; // If true, embed data inline; if false, use external URIs (not yet supported)
  name?: string;
  tags?: string[];
}

/**
 * Convert TypedArray to AttributeType string
 */
function getAttributeType(array: ArrayLike<number>): AttributeType {
  if (array instanceof Float32Array) return 'float32';
  if (array instanceof Uint32Array) return 'uint32';
  if (array instanceof Uint16Array) return 'uint16';
  if (array instanceof Uint8Array) return 'uint8';
  if (array instanceof Int32Array) return 'int32';
  if (array instanceof Int16Array) return 'int16';
  if (array instanceof Int8Array) return 'int8';
  // Default to float32 for regular arrays
  return 'float32';
}

/**
 * Convert THREE.BufferAttribute to IAccessor
 */
function attributeToAccessor(attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): IAccessor {
  if (attribute instanceof THREE.InterleavedBufferAttribute) {
    throw new Error('Interleaved buffer attributes not yet supported');
  }

  const array = Array.from(attribute.array);
  const type = getAttributeType(attribute.array);

  return {
    itemSize: attribute.itemSize,
    normalized: attribute.normalized,
    array,
    type,
  };
}

/**
 * Export THREE.BufferGeometry to geometry metadata
 */
export function exportBufferGeometryToMeta(
  geometry: THREE.BufferGeometry,
  options: IExportOptions = {},
): IGeometryMeta {
  const { inline = true, name, tags } = options;

  if (!inline) {
    throw new Error('External URI export not yet implemented; use inline: true');
  }

  // Get position attribute (required)
  const positionAttr = geometry.getAttribute('position');
  if (!positionAttr) {
    throw new Error('Geometry must have position attribute');
  }

  const meta: IGeometryMeta = {
    meta: {
      version: '1.0.0',
      generator: 'vibe-geometry-exporter',
      name: name || geometry.name || undefined,
      tags: tags || undefined,
    },
    attributes: {
      position: attributeToAccessor(positionAttr),
    },
  };

  // Add optional attributes
  const normalAttr = geometry.getAttribute('normal');
  if (normalAttr) {
    meta.attributes.normal = attributeToAccessor(normalAttr);
  }

  const uvAttr = geometry.getAttribute('uv');
  if (uvAttr) {
    meta.attributes.uv = attributeToAccessor(uvAttr);
  }

  const colorAttr = geometry.getAttribute('color');
  if (colorAttr) {
    meta.attributes.color = attributeToAccessor(colorAttr);
  }

  const tangentAttr = geometry.getAttribute('tangent');
  if (tangentAttr) {
    meta.attributes.tangent = attributeToAccessor(tangentAttr);
  }

  // Add index if present
  const index = geometry.getIndex();
  if (index) {
    meta.index = attributeToAccessor(index);
  }

  // Add groups if present
  if (geometry.groups.length > 0) {
    meta.groups = geometry.groups.map((group) => ({
      start: group.start,
      count: group.count,
      materialIndex: group.materialIndex,
    }));
  }

  // Add draw range if non-default
  if (geometry.drawRange.count !== Infinity) {
    meta.drawRange = {
      start: geometry.drawRange.start,
      count: geometry.drawRange.count,
    };
  }

  // Compute and add bounds
  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }
  if (!geometry.boundingSphere) {
    geometry.computeBoundingSphere();
  }

  if (geometry.boundingBox && geometry.boundingSphere) {
    meta.bounds = {
      aabb: [
        [geometry.boundingBox.min.x, geometry.boundingBox.min.y, geometry.boundingBox.min.z],
        [geometry.boundingBox.max.x, geometry.boundingBox.max.y, geometry.boundingBox.max.z],
      ],
      sphere: {
        center: [
          geometry.boundingSphere.center.x,
          geometry.boundingSphere.center.y,
          geometry.boundingSphere.center.z,
        ],
        radius: geometry.boundingSphere.radius,
      },
    };
  }

  logger.debug('Exported geometry to metadata', {
    name: meta.meta.name,
    vertexCount: positionAttr.count,
    hasNormals: !!meta.attributes.normal,
    hasUVs: !!meta.attributes.uv,
    hasIndex: !!meta.index,
  });

  return meta;
}
