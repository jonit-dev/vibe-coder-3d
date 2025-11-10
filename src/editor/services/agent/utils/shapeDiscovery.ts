/**
 * Shape Discovery Utility
 * Discovers available shapes from geometry files and shape registry
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('ShapeDiscovery');

export interface IDiscoveredShape {
  name: string;
  type: 'primitive' | 'custom' | 'geometry';
  source: string;
}

/**
 * Get all available primitive shapes
 */
export function getPrimitiveShapes(): IDiscoveredShape[] {
  return [
    { name: 'Cube', type: 'primitive', source: 'built-in' },
    { name: 'Sphere', type: 'primitive', source: 'built-in' },
    { name: 'Cylinder', type: 'primitive', source: 'built-in' },
    { name: 'Cone', type: 'primitive', source: 'built-in' },
    { name: 'Plane', type: 'primitive', source: 'built-in' },
    { name: 'Light', type: 'primitive', source: 'built-in' },
  ];
}

/**
 * Get all available custom geometry shapes from the geometry folder
 * Uses Vite's import.meta.glob to scan for .shape.json files
 */
export function getCustomGeometryShapes(): IDiscoveredShape[] {
  try {
    // Scan for all .shape.json files in the game/geometry directory
    const geometryFiles = import.meta.glob('/src/game/geometry/*.shape.json', {
      eager: true,
    });

    const shapes: IDiscoveredShape[] = [];

    for (const path of Object.keys(geometryFiles)) {
      // Extract shape name from filename (e.g., "tree_oak.shape.json" -> "tree_oak")
      const filename = path.split('/').pop();
      if (!filename) continue;

      const shapeName = filename.replace('.shape.json', '');

      shapes.push({
        name: shapeName,
        type: 'geometry',
        source: path,
      });
    }

    logger.debug('Discovered custom geometry shapes', {
      count: shapes.length,
      shapes: shapes.map((s) => s.name),
    });

    return shapes;
  } catch (error) {
    logger.error('Failed to discover custom geometry shapes', { error });
    return [];
  }
}

/**
 * Get all available shapes (primitives + custom geometry)
 */
export function getAllShapes(): IDiscoveredShape[] {
  const primitives = getPrimitiveShapes();
  const customGeometry = getCustomGeometryShapes();

  return [...primitives, ...customGeometry];
}

/**
 * Format shapes for display in the system prompt
 */
export function formatShapesForPrompt(): string {
  const primitives = getPrimitiveShapes();
  const customGeometry = getCustomGeometryShapes();

  const primitiveList = primitives.map((s) => s.name).join(', ');
  const customList =
    customGeometry.length > 0 ? customGeometry.map((s) => s.name).join(', ') : 'None available';

  return `
**Available Primitive Shapes (use scene_manipulation):**
${primitiveList}

**Available Custom Geometry (reference in prompts, created via geometry_creation):**
${customList}

Note: Custom geometry shapes can be referenced when creating new geometry or scenes.
Users can say "add a tree like tree_oak" and you can use that as inspiration for geometry_creation.
`;
}

/**
 * Get shape names only (for tool schema enums)
 */
export function getShapeNames(type?: 'primitive' | 'custom' | 'geometry'): string[] {
  const allShapes = getAllShapes();

  if (type) {
    return allShapes.filter((s) => s.type === type).map((s) => s.name);
  }

  return allShapes.map((s) => s.name);
}
