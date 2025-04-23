// Transform System
// Synchronizes Transform components with Three.js objects
import { Quaternion, Vector3 } from 'three';

import { entityToObject, Transform, transformQuery, world } from '@core/lib/ecs';

// Reusable objects to avoid garbage collection
const position = new Vector3();
const quaternion = new Quaternion();
const scale = new Vector3();

/**
 * System that synchronizes ECS Transform data with Three.js objects
 * Returns the number of transformed entities
 */
export function transformSystem(): number {
  // Get all entities with Transform components
  const entities = transformQuery(world);
  let updatedCount = 0;

  // Update Three.js objects from ECS data
  entities.forEach((eid) => {
    // Skip if no corresponding object or doesn't need update
    const object = entityToObject.get(eid);
    if (!object || !Transform.needsUpdate[eid]) return;

    // Get transform data
    position.set(
      Transform.position[eid][0],
      Transform.position[eid][1],
      Transform.position[eid][2],
    );

    quaternion.set(
      Transform.rotation[eid][0],
      Transform.rotation[eid][1],
      Transform.rotation[eid][2],
      Transform.rotation[eid][3],
    );

    scale.set(Transform.scale[eid][0], Transform.scale[eid][1], Transform.scale[eid][2]);

    // Apply to Three.js object
    object.position.copy(position);
    object.quaternion.copy(quaternion);
    object.scale.copy(scale);

    // Reset update flag
    Transform.needsUpdate[eid] = 0;
    updatedCount++;
  });

  return updatedCount;
}

/**
 * Mark all transforms for update
 * Useful after changes like physics simulation
 */
export function markAllTransformsForUpdate(): number {
  const entities = transformQuery(world);

  entities.forEach((eid) => {
    Transform.needsUpdate[eid] = 1;
  });

  return entities.length;
}
