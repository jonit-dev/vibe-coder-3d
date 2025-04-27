import { MeshType, MeshTypeEnum } from '@/core/lib/ecs';

/**
 * Determines the mesh type of an entity based on which mesh component it has
 */
export function getEntityMeshType(entityId: number): string {
  // Check if the entity exists and has a mesh component
  if (!MeshType.type[entityId]) {
    return 'unknown';
  }

  // Return the mesh type based on the enum value
  switch (MeshType.type[entityId]) {
    case MeshTypeEnum.Cube:
      return 'Cube';
    case MeshTypeEnum.Sphere:
      return 'Sphere';
    default:
      return 'unknown';
  }
}
