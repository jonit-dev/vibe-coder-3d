import { useState } from 'react';

import { dynamicComponentManager } from '@core/lib/dynamic-components';
import { MeshTypeEnum } from '@core/lib/ecs';
import { ecsManager } from '@core/lib/ecs-manager';
import { ArchetypeManager } from '@core/lib/entity-archetypes';

export type ShapeType = 'Cube' | 'Sphere' | 'Plane' | 'Cylinder' | 'Cone' | 'Torus';

export const useEntityCreation = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createEntity = async (type: ShapeType): Promise<{ entityId: number; message: string }> => {
    setIsCreating(true);

    try {
      let meshType: MeshTypeEnum;
      switch (type) {
        case 'Cube':
          meshType = MeshTypeEnum.Cube;
          break;
        case 'Sphere':
          meshType = MeshTypeEnum.Sphere;
          break;
        case 'Cylinder':
          meshType = MeshTypeEnum.Cylinder;
          break;
        case 'Cone':
          meshType = MeshTypeEnum.Cone;
          break;
        case 'Torus':
          meshType = MeshTypeEnum.Torus;
          break;
        case 'Plane':
          meshType = MeshTypeEnum.Plane;
          break;
        default:
          meshType = MeshTypeEnum.Cube;
      }

      console.log(`[EntityCreation] Creating ${type} with multiple fallback strategies...`);

      // Strategy 1: Try archetype-based creation (most feature-rich)
      const archetypeResult = await tryArchetypeCreation(type, meshType);
      if (archetypeResult.success) {
        console.log(`[EntityCreation] ✅ Archetype creation successful for ${type}`);
        return { entityId: archetypeResult.entityId!, message: archetypeResult.message! };
      }

      // Strategy 2: Enhanced legacy creation with component validation
      console.log(`[EntityCreation] Archetype creation failed, trying enhanced legacy creation...`);
      const enhancedResult = await tryEnhancedLegacyCreation(type, meshType);
      if (enhancedResult.success) {
        console.log(`[EntityCreation] ✅ Enhanced legacy creation successful for ${type}`);
        return { entityId: enhancedResult.entityId!, message: enhancedResult.message! };
      }

      // Strategy 3: Basic fallback (guaranteed to work)
      console.log(`[EntityCreation] Enhanced creation failed, using basic fallback...`);
      const entityId = ecsManager.createEntity({
        meshType,
        position: type === 'Plane' ? [0, 0, 0] : [0, 1, 0],
        name: `${type}_${Date.now()}`,
      });

      console.log(`[EntityCreation] ✅ Basic fallback successful for ${type}: ${entityId}`);
      return {
        entityId,
        message: `Added new ${type}: ${entityId} (basic - core components only)`,
      };
    } catch (error) {
      console.error('[EntityCreation] All creation strategies failed:', error);
      throw new Error(
        `Failed to create ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createEntity,
    isCreating,
  };
};

// Strategy 1: Archetype-based creation
async function tryArchetypeCreation(
  type: ShapeType,
  meshType: MeshTypeEnum,
): Promise<{
  success: boolean;
  entityId?: number;
  message?: string;
  error?: string;
}> {
  try {
    const availableArchetypes = ArchetypeManager.listArchetypes();
    console.log(
      `[ArchetypeCreation] Available archetypes: ${availableArchetypes.map((a) => a.id).join(', ')}`,
    );

    if (type === 'Plane') {
      // Try static mesh for planes
      const staticArchetype = ArchetypeManager.getArchetype('static-mesh');
      if (staticArchetype) {
        const entityId = await ArchetypeManager.createEntity('static-mesh', {
          meshType: { type: meshType },
          transform: { position: [0, 0, 0] },
        });
        return {
          success: true,
          entityId,
          message: `Added new static ${type}: ${entityId} (with renderer)`,
        };
      }
    } else {
      // Try physics entity for other objects
      const physicsArchetype = ArchetypeManager.getArchetype('physics-entity');
      if (physicsArchetype) {
        const entityId = await ArchetypeManager.createEntity('physics-entity', {
          meshType: { type: meshType },
          transform: { position: [0, 1, 0] },
        });
        return {
          success: true,
          entityId,
          message: `Added new physics-enabled ${type}: ${entityId} (full features)`,
        };
      }

      // Fallback to basic-entity archetype
      const basicArchetype = ArchetypeManager.getArchetype('basic-entity');
      if (basicArchetype) {
        const entityId = await ArchetypeManager.createEntity('basic-entity', {
          meshType: { type: meshType },
        });
        return {
          success: true,
          entityId,
          message: `Added new ${type}: ${entityId} (basic archetype)`,
        };
      }
    }

    return {
      success: false,
      error: `No suitable archetype found for ${type}`,
    };
  } catch (error) {
    return {
      success: false,
      error: `Archetype creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Strategy 2: Enhanced legacy creation with manual component addition
async function tryEnhancedLegacyCreation(
  type: ShapeType,
  meshType: MeshTypeEnum,
): Promise<{
  success: boolean;
  entityId?: number;
  message?: string;
  error?: string;
}> {
  try {
    // Create basic entity
    const entityId = ecsManager.createEntity({
      meshType,
      position: type === 'Plane' ? [0, 0, 0] : [0, 1, 0],
      name: `${type}_${Date.now()}`,
    });

    console.log(
      `[EnhancedCreation] Created base entity ${entityId}, adding enhanced components...`,
    );

    // Wait for entity to be processed
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Try to add enhanced components manually
    const addedComponents: string[] = [];

    // Add mesh renderer for better visuals
    try {
      const rendererResult = await dynamicComponentManager.addComponent(entityId, 'meshRenderer', {
        enabled: true,
        castShadows: true,
        receiveShadows: true,
      });
      if (rendererResult.valid) {
        addedComponents.push('meshRenderer');
      }
    } catch (error) {
      console.warn(`[EnhancedCreation] Failed to add meshRenderer: ${error}`);
    }

    // For non-plane objects, try to add physics components
    if (type !== 'Plane') {
      try {
        const rigidBodyResult = await dynamicComponentManager.addComponent(entityId, 'rigidBody', {
          enabled: true,
          bodyType: 'dynamic',
          mass: 1,
        });
        if (rigidBodyResult.valid) {
          addedComponents.push('rigidBody');
        }
      } catch (error) {
        console.warn(`[EnhancedCreation] Failed to add rigidBody: ${error}`);
      }

      try {
        const colliderResult = await dynamicComponentManager.addComponent(
          entityId,
          'meshCollider',
          {
            enabled: true,
            colliderType: 'box',
            isTrigger: false,
          },
        );
        if (colliderResult.valid) {
          addedComponents.push('meshCollider');
        }
      } catch (error) {
        console.warn(`[EnhancedCreation] Failed to add meshCollider: ${error}`);
      }
    }

    const message =
      addedComponents.length > 0
        ? `Added new enhanced ${type}: ${entityId} (with ${addedComponents.join(', ')})`
        : `Added new ${type}: ${entityId} (enhanced - core only)`;

    return { success: true, entityId, message };
  } catch (error) {
    return {
      success: false,
      error: `Enhanced legacy creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
