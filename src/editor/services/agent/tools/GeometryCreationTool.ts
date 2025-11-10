/**
 * Geometry Creation Tool
 * Allows the AI to create custom 3D geometry using the .shape.json format
 */

import { Logger } from '@core/lib/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = Logger.create('GeometryCreationTool');

export const geometryCreationTool = {
  name: 'geometry_creation',
  description: `Create custom 3D geometry using vertex positions, normals, UVs, and indices. Saves as .shape.json file compatible with the engine.

IMPORTANT RULES:
- positions array MUST have length divisible by 3 (groups of x,y,z)
- indices array MUST have length divisible by 3 (groups of 3 vertices per triangle)
- Each index must be less than the number of vertices
- Example: For a triangle, positions=[0,0,0, 1,0,0, 0,1,0] (3 vertices * 3 coords = 9 numbers), indices=[0,1,2] (1 triangle * 3 indices = 3 numbers)`,
  input_schema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'Name of the geometry (e.g., "Custom Pyramid", "House")',
      },
      positions: {
        type: 'array',
        items: { type: 'number' },
        description:
          'Vertex positions as flat array [x1, y1, z1, x2, y2, z2, ...]. MUST be divisible by 3. Each vertex needs exactly 3 coordinates.',
      },
      indices: {
        type: 'array',
        items: { type: 'number' },
        description:
          'Triangle indices as flat array [i1, i2, i3, i4, i5, i6, ...]. MUST be divisible by 3. Each triangle needs exactly 3 vertex indices.',
      },
      normals: {
        type: 'array',
        items: { type: 'number' },
        description:
          'Optional: Vertex normals as flat array [nx1, ny1, nz1, ...]. Must be same length as positions. If omitted, will be computed automatically.',
      },
      uvs: {
        type: 'array',
        items: { type: 'number' },
        description:
          'Optional: Texture coordinates as flat array [u1, v1, u2, v2, ...]. Must have length = (number of vertices * 2).',
      },
      colors: {
        type: 'array',
        items: { type: 'number' },
        description:
          'Optional: Vertex colors as flat array [r1, g1, b1, r2, g2, b2, ...]. Must be same length as positions. RGB values 0-1.',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: Tags for categorization (e.g., ["custom", "building", "prop"])',
      },
      auto_compute_normals: {
        type: 'boolean',
        description: 'Auto-compute normals if not provided (default: true)',
      },
      create_entity: {
        type: 'boolean',
        description: 'Create an entity with this geometry after saving (default: true)',
      },
    },
    required: ['name', 'positions', 'indices'],
  },
};

interface IGeometryCreationParams {
  name: string;
  positions: number[];
  indices: number[];
  normals?: number[];
  uvs?: number[];
  colors?: number[];
  tags?: string[];
  auto_compute_normals?: boolean;
  create_entity?: boolean;
}

/**
 * Execute geometry creation tool
 */
export async function executeGeometryCreation(params: IGeometryCreationParams): Promise<string> {
  logger.info('Creating custom geometry', { name: params.name });

  try {
    // Validate inputs
    const validation = validateGeometryData(params);
    if (!validation.valid) {
      return `Error: ${validation.error}`;
    }

    // Build geometry metadata
    const geometryMeta = buildGeometryMeta(params);

    // Generate filename from name
    const filename = params.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const filepath = `/src/game/geometry/${filename}.shape.json`;

    // Save geometry file (dispatch event to editor)
    const event = new CustomEvent('agent:save-geometry', {
      detail: {
        filepath,
        content: JSON.stringify(geometryMeta, null, 2),
      },
    });
    window.dispatchEvent(event);

    // Optionally create entity with this geometry
    if (params.create_entity !== false) {
      const createEvent = new CustomEvent('agent:create-geometry-entity', {
        detail: {
          path: filepath,
          name: params.name,
        },
      });
      window.dispatchEvent(createEvent);
    }

    const vertexCount = params.positions.length / 3;
    const triangleCount = params.indices.length / 3;

    return `Created geometry "${params.name}" with ${vertexCount} vertices and ${triangleCount} triangles.
File: ${filepath}
${params.create_entity !== false ? `Entity created in scene.` : ''}

To render and verify: yarn render:geometry ${filepath}`;
  } catch (error) {
    logger.error('Failed to create geometry', { error, params });
    return `Failed to create geometry: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

function validateGeometryData(params: IGeometryCreationParams): {
  valid: boolean;
  error?: string;
} {
  // Validate positions
  if (!params.positions || params.positions.length === 0) {
    return { valid: false, error: 'positions array is required and cannot be empty' };
  }
  if (params.positions.length % 3 !== 0) {
    const extra = params.positions.length % 3;
    return {
      valid: false,
      error: `positions must have length divisible by 3 (got ${params.positions.length}, which has ${extra} extra value${extra > 1 ? 's' : ''}). Each vertex needs exactly x, y, z coordinates. You need to add ${3 - extra} more value${3 - extra > 1 ? 's' : ''} or remove ${extra}.`,
    };
  }

  // Validate indices
  if (!params.indices || params.indices.length === 0) {
    return { valid: false, error: 'indices array is required and cannot be empty' };
  }
  if (params.indices.length % 3 !== 0) {
    return {
      valid: false,
      error: `indices must have length divisible by 3 (got ${params.indices.length})`,
    };
  }

  const vertexCount = params.positions.length / 3;
  const maxIndex = Math.max(...params.indices);
  if (maxIndex >= vertexCount) {
    return {
      valid: false,
      error: `Index ${maxIndex} exceeds vertex count ${vertexCount}`,
    };
  }

  // Validate normals if provided
  if (params.normals) {
    if (params.normals.length !== params.positions.length) {
      return {
        valid: false,
        error: `normals length (${params.normals.length}) must match positions length (${params.positions.length})`,
      };
    }
  }

  // Validate UVs if provided
  if (params.uvs) {
    const expectedUVLength = vertexCount * 2;
    if (params.uvs.length !== expectedUVLength) {
      return {
        valid: false,
        error: `uvs length (${params.uvs.length}) must be ${expectedUVLength} (2 per vertex)`,
      };
    }
  }

  // Validate colors if provided
  if (params.colors) {
    const expectedColorLength = vertexCount * 3;
    if (params.colors.length !== expectedColorLength) {
      return {
        valid: false,
        error: `colors length (${params.colors.length}) must be ${expectedColorLength} (3 per vertex for RGB)`,
      };
    }
  }

  return { valid: true };
}

function buildGeometryMeta(params: IGeometryCreationParams): any {
  const meta: any = {
    meta: {
      version: '1.0.0',
      generator: 'vibe-ai-agent',
      name: params.name,
      tags: params.tags || ['custom', 'ai-generated'],
    },
    attributes: {
      position: {
        itemSize: 3,
        normalized: false,
        array: params.positions,
        type: 'float32',
      },
    },
    index: {
      itemSize: 1,
      normalized: false,
      array: params.indices,
      type: 'uint32',
    },
  };

  // Add normals (or mark for auto-computation)
  if (params.normals) {
    meta.attributes.normal = {
      itemSize: 3,
      normalized: false,
      array: params.normals,
      type: 'float32',
    };
  } else if (params.auto_compute_normals !== false) {
    // Add note that normals should be computed
    meta.meta.computeNormals = true;
  }

  // Add UVs if provided
  if (params.uvs) {
    meta.attributes.uv = {
      itemSize: 2,
      normalized: false,
      array: params.uvs,
      type: 'float32',
    };
  }

  // Add colors if provided
  if (params.colors) {
    meta.attributes.color = {
      itemSize: 3,
      normalized: false,
      array: params.colors,
      type: 'float32',
    };
  }

  // Compute bounds
  meta.bounds = computeBounds(params.positions);

  return meta;
}

function computeBounds(positions: number[]): any {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const dx = maxX - centerX;
  const dy = maxY - centerY;
  const dz = maxZ - centerZ;
  const radius = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return {
    aabb: [
      [minX, minY, minZ],
      [maxX, maxY, maxZ],
    ],
    sphere: {
      center: [centerX, centerY, centerZ],
      radius: Number(radius.toFixed(3)),
    },
  };
}
