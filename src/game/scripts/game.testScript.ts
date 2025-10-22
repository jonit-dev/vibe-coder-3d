/**
 * Test Script for Scene Deserializer Tests
 *
 * Simple test script that logs "hello" for testing purposes.
 */

// Lifecycle: Called once when script is loaded
export function onStart(): void {
  console.log('hello');
}

// Lifecycle: Called every frame
export function onUpdate(deltaTime: number): void {
  // Simple rotation for testing
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}

// Lifecycle: Called when script is unloaded
export function onDestroy(): void {
  console.log('Test script destroyed');
}
