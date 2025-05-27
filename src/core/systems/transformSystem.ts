// Transform System
// Synchronizes Transform components with Three.js objects
import { defineQuery } from 'bitecs';
import { Euler, Quaternion, Vector3 } from 'three';

import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { ECSWorld } from '@core/lib/ecs/World';
import { ITransformData } from '@core/lib/ecs/components/TransformComponent';

// Get world instance
const world = ECSWorld.getInstance().getWorld();

// Lazy-initialize the query to avoid module-load timing issues
let transformQuery: ReturnType<typeof defineQuery> | null = null;

// Initialize the query when needed
function getTransformQuery() {
  if (!transformQuery) {
    const transformComponent = componentRegistry.getBitECSComponent('Transform');
    if (!transformComponent) {
      console.warn('[transformSystem] Transform component not yet registered, skipping update');
      return null;
    }
    transformQuery = defineQuery([transformComponent]);
  }
  return transformQuery;
}

// Entity to Three.js object mapping (simplified for now)
const entityToObject = new Map<number, any>();

// Reusable objects to avoid garbage collection
const position = new Vector3();
const euler = new Euler();
const quaternion = new Quaternion();
const scale = new Vector3();

// Conversion constants
const DEG_TO_RAD = Math.PI / 180;

/**
 * System that synchronizes ECS Transform data with Three.js objects
 * Returns the number of transformed entities
 */
export function transformSystem(): number {
  // Get the query (lazy-initialized)
  const query = getTransformQuery();
  if (!query) {
    return 0; // Transform component not yet registered
  }

  // Get all entities with Transform components
  const entities = query(world);
  let updatedCount = 0;

  // Update Three.js objects from ECS data
  entities.forEach((eid: number) => {
    // Skip if no corresponding object
    const object = entityToObject.get(eid);
    if (!object) return;

    // Get transform data using the new component registry
    const transformData = componentRegistry.getComponentData<ITransformData>(eid, 'Transform');
    if (!transformData) return;

    // For now, we'll always update since we don't have needsUpdate in the new system yet
    // TODO: Add needsUpdate flag to the new Transform component definition

    // Get transform data
    position.set(transformData.position[0], transformData.position[1], transformData.position[2]);

    // Convert rotation from degrees to radians
    const rotDeg = transformData.rotation;
    const rotRad = [rotDeg[0] * DEG_TO_RAD, rotDeg[1] * DEG_TO_RAD, rotDeg[2] * DEG_TO_RAD];
    euler.set(rotRad[0], rotRad[1], rotRad[2]);
    quaternion.setFromEuler(euler);

    scale.set(transformData.scale[0], transformData.scale[1], transformData.scale[2]);

    // Debug logs (commented out for performance)
    // console.log('[transformSystem] eid:', eid);
    // console.log('  position:', position.toArray());
    // console.log('  rotation (deg):', rotDeg);
    // console.log('  rotation (rad):', rotRad);
    // console.log('  quaternion:', quaternion.toArray());
    // console.log('  scale:', scale.toArray());

    // Apply to Three.js object
    object.position.copy(position);
    object.quaternion.copy(quaternion);
    object.scale.copy(scale);

    updatedCount++;
  });

  return updatedCount;
}
