// Light System
// Synchronizes Light components with Three.js lights and processes updates
import { defineQuery } from 'bitecs';

import { componentRegistry } from '../lib/ecs/ComponentRegistry';
import { ECSWorld } from '../lib/ecs/World';
import { LightData } from '../lib/ecs/components/definitions/LightComponent';

// Get world instance
const world = ECSWorld.getInstance().getWorld();

// Lazy-initialize the query to avoid module-load timing issues
let lightQuery: ReturnType<typeof defineQuery> | null = null;

// Initialize the query when needed
function getLightQuery() {
  if (!lightQuery) {
    const lightComponent = componentRegistry.getBitECSComponent('Light');
    if (!lightComponent) {
      console.warn('[lightSystem] Light component not yet registered, skipping update');
      return null;
    }
    lightQuery = defineQuery([lightComponent]);
  }
  return lightQuery;
}

/**
 * Light System - Processes Light component updates
 * This system runs in the EngineLoop and handles the needsUpdate flag
 * Returns the number of lights that were processed
 */
export function lightSystem(_deltaTime: number): number {
  // Get the query (lazy-initialized)
  const query = getLightQuery();
  if (!query) {
    return 0; // Light component not yet registered
  }

  const entities = query(world);
  let updatedCount = 0;

  entities.forEach((eid: number) => {
    // Get the BitECS component to check needsUpdate flag
    const bitECSLight = componentRegistry.getBitECSComponent('Light') as
      | (Record<string, Record<number, number>> & { needsUpdate?: Record<number, number> })
      | undefined;
    if (!bitECSLight?.needsUpdate?.[eid]) {
      return; // Skip entities that don't need updates
    }

    // Get light data using the component registry
    const lightData = componentRegistry.getComponentData<LightData>(eid, 'Light');
    if (!lightData) {
      console.warn(`[lightSystem] No light data found for entity ${eid}`);
      return;
    }

    // Process the light update
    console.log(`[lightSystem] Processing light update for entity ${eid}:`, {
      lightType: lightData.lightType,
      intensity: lightData.intensity,
      enabled: lightData.enabled,
    });

    // The actual Three.js light updates are handled by LightRenderer components
    // This system just processes the ECS side and resets the needsUpdate flag

    // Reset the needsUpdate flag after processing
    if (bitECSLight?.needsUpdate) {
      bitECSLight.needsUpdate[eid] = 0;
    }
    updatedCount++;
  });

  return updatedCount;
}
