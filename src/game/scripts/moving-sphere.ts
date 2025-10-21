/**
 * Moving Sphere Script
 *
 * Moves an entity back and forth using sine wave motion.
 */

let startPosition: [number, number, number];
let elapsedTime = 0;

export function onStart(): void {
  const pos = entity.transform.position();
  startPosition = [pos[0], pos[1], pos[2]];
  console.log(`[Moving Sphere] Started at position ${startPosition}`);
}

export function onUpdate(deltaTime: number): void {
  const speed = (parameters.speed as number) || 1.0;
  const distance = (parameters.distance as number) || 3.0;

  elapsedTime += deltaTime * speed;

  // Oscillate along X axis using sine wave
  const offset = Math.sin(elapsedTime) * distance;
  entity.transform.setPosition(
    startPosition[0] + offset,
    startPosition[1],
    startPosition[2]
  );
}

export function onDestroy(): void {
  console.log('[Moving Sphere] Destroyed');
}
