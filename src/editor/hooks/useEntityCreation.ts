import { useState } from 'react';

import { componentManager } from '@/core/dynamic-components/init';
import { MeshTypeEnum } from '@/core/lib/ecs';

// Shape types that can be created in the editor
export type ShapeType = 'Cube' | 'Sphere' | 'Cylinder' | 'Cone' | 'Torus' | 'Plane';

// Map shape names to MeshType enum values
const SHAPE_TO_MESH_TYPE: Record<ShapeType, MeshTypeEnum> = {
  Cube: MeshTypeEnum.Cube,
  Sphere: MeshTypeEnum.Sphere,
  Cylinder: MeshTypeEnum.Cylinder,
  Cone: MeshTypeEnum.Cone,
  Torus: MeshTypeEnum.Torus,
  Plane: MeshTypeEnum.Plane,
};

// Default colors for different shapes
const SHAPE_COLORS: Record<ShapeType, [number, number, number]> = {
  Cube: [0.8, 0.8, 0.8], // Light gray
  Sphere: [0.2, 0.6, 1.0], // Blue
  Cylinder: [0.2, 0.8, 0.2], // Green
  Cone: [1.0, 0.5, 0.2], // Orange
  Torus: [0.8, 0.2, 0.8], // Purple
  Plane: [0.8, 0.8, 0.6], // Beige
};

export interface IEntityCreationResult {
  entityId: number;
  message: string;
}

export function useEntityCreation() {
  const [isCreating, setIsCreating] = useState(false);

  const createEntityWithShape = async (shapeType: ShapeType): Promise<IEntityCreationResult> => {
    setIsCreating(true);

    try {
      console.log(`[EntityCreation] Creating ${shapeType} using centralized ComponentManager...`);

      // Get the mesh type for this shape
      const meshType = SHAPE_TO_MESH_TYPE[shapeType];
      if (meshType === undefined) {
        throw new Error(`Unknown shape type: ${shapeType}`);
      }

      // Create entity with components through centralized ComponentManager
      const entityId = componentManager.createEntity({
        name: `${shapeType} ${Date.now()}`,
        components: [
          {
            id: 'transform',
            data: {
              position: [0, 0, 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
              needsUpdate: 1,
            },
          },
          {
            id: 'meshType',
            data: {
              type: meshType,
            },
          },
          {
            id: 'material',
            data: {
              color: SHAPE_COLORS[shapeType],
              needsUpdate: 1,
            },
          },
        ],
      });

      console.log(
        `[EntityCreation] ✅ Successfully created ${shapeType} entity ${entityId} using centralized system`,
      );

      return {
        entityId,
        message: `Created ${shapeType} (Entity ${entityId})`,
      };
    } catch (error) {
      console.error(`[EntityCreation] ❌ Failed to create ${shapeType}:`, error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createEntity: createEntityWithShape,
    isCreating,
  };
}
