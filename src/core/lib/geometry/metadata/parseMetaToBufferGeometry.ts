import * as THREE from 'three';
import { type IGeometryMeta, type IAccessor, type AttributeType } from './IGeometryMeta';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('parseMetaToBufferGeometry');

/**
 * Create a TypedArray from accessor data
 */
function createTypedArray(accessor: IAccessor): TypedArray {
  if (!accessor.array) {
    throw new Error('Accessor must have array data (external URIs not yet supported)');
  }

  const { type, array } = accessor;

  switch (type) {
    case 'float32':
      return new Float32Array(array);
    case 'float16':
      // THREE.js doesn't support Float16Array for attributes yet, use Float32
      logger.warn('float16 not fully supported, converting to float32');
      return new Float32Array(array);
    case 'uint32':
      return new Uint32Array(array);
    case 'uint16':
      return new Uint16Array(array);
    case 'uint8':
      return new Uint8Array(array);
    case 'int32':
      return new Int32Array(array);
    case 'int16':
      return new Int16Array(array);
    case 'int8':
      return new Int8Array(array);
    default:
      throw new Error(`Unsupported attribute type: ${type}`);
  }
}

/**
 * Convert geometry metadata to THREE.BufferGeometry
 */
export function parseMetaToBufferGeometry(meta: IGeometryMeta): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Add position attribute (required)
  if (!meta.attributes.position) {
    throw new Error('Geometry metadata must have position attribute');
  }

  const positionArray = createTypedArray(meta.attributes.position);
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positionArray, meta.attributes.position.itemSize, meta.attributes.position.normalized),
  );

  // Add optional attributes
  if (meta.attributes.normal) {
    const normalArray = createTypedArray(meta.attributes.normal);
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(normalArray, meta.attributes.normal.itemSize, meta.attributes.normal.normalized),
    );
  }

  if (meta.attributes.uv) {
    const uvArray = createTypedArray(meta.attributes.uv);
    geometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(uvArray, meta.attributes.uv.itemSize, meta.attributes.uv.normalized),
    );
  }

  if (meta.attributes.color) {
    const colorArray = createTypedArray(meta.attributes.color);
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colorArray, meta.attributes.color.itemSize, meta.attributes.color.normalized),
    );
  }

  if (meta.attributes.tangent) {
    const tangentArray = createTypedArray(meta.attributes.tangent);
    geometry.setAttribute(
      'tangent',
      new THREE.BufferAttribute(tangentArray, meta.attributes.tangent.itemSize, meta.attributes.tangent.normalized),
    );
  }

  // Add index if present
  if (meta.index) {
    const indexArray = createTypedArray(meta.index);
    geometry.setIndex(new THREE.BufferAttribute(indexArray, meta.index.itemSize));
  }

  // Add groups if present
  if (meta.groups) {
    for (const group of meta.groups) {
      geometry.addGroup(group.start, group.count, group.materialIndex);
    }
  }

  // Set draw range if present
  if (meta.drawRange) {
    geometry.setDrawRange(meta.drawRange.start, meta.drawRange.count);
  }

  // Set bounding box/sphere if present
  if (meta.bounds) {
    if (meta.bounds.aabb) {
      const [min, max] = meta.bounds.aabb;
      geometry.boundingBox = new THREE.Box3(
        new THREE.Vector3(min[0], min[1], min[2]),
        new THREE.Vector3(max[0], max[1], max[2]),
      );
    }
    if (meta.bounds.sphere) {
      const { center, radius } = meta.bounds.sphere;
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(center[0], center[1], center[2]), radius);
    }
  }

  logger.debug('Parsed geometry from metadata', {
    name: meta.meta.name,
    vertexCount: positionArray.length / meta.attributes.position.itemSize,
    hasNormals: !!meta.attributes.normal,
    hasUVs: !!meta.attributes.uv,
    hasIndex: !!meta.index,
  });

  return geometry;
}

type TypedArray =
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Uint8ClampedArray;
