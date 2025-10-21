/**
 * Rotating Cube Script
 *
 * Simple example script that rotates an entity continuously.
 * Demonstrates basic transform manipulation via Lua scripting.
 */

// Lifecycle: Called once when script is loaded
export function onStart(): void {
  console.log(`[Rotating Cube] Started for entity ${entity.id}`);
}

// Lifecycle: Called every frame
export function onUpdate(deltaTime: number): void {
  const rotationSpeed = (parameters.speed as number) || 45.0; // degrees per second

  // Rotate around Y axis
  entity.transform.rotate(0, rotationSpeed * deltaTime, 0);
}

// Lifecycle: Called when script is unloaded
export function onDestroy(): void {
  console.log(`[Rotating Cube] Destroyed for entity ${entity.id}`);
}
