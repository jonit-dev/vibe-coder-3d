/**
 * Pulsing Scale Script
 *
 * Makes an entity pulse by changing its scale smoothly.
 */

let elapsedTime = 0;

export function onStart(): void {
  console.log('[Pulsing Scale] Started');
}

export function onUpdate(deltaTime: number): void {
  const speed = (parameters.speed as number) || 2.0;
  const minScale = (parameters.minScale as number) || 0.5;
  const maxScale = (parameters.maxScale as number) || 1.5;

  elapsedTime += deltaTime * speed;

  // Pulse using sine wave (0.5 to 1.5 range by default)
  const pulse = minScale + (maxScale - minScale) * (Math.sin(elapsedTime) * 0.5 + 0.5);
  entity.transform.setScale(pulse, pulse, pulse);
}

export function onDestroy(): void {
  console.log('[Pulsing Scale] Destroyed');
}
