// Test Player Controller Script
// Note: This file uses global script APIs (entity, three, etc.)
// which are injected at runtime by the script executor
// TypeScript errors are expected and can be ignored

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

function onStart() {
  console.log('Player controller started');
  if (three.mesh) {
    three.material.setColor('#00ff00');
  }
}

function onUpdate(deltaTime: number) {
  // Rotate the entity
  entity.transform.rotate(0, deltaTime * 0.5, 0);

  // Move forward slightly
  entity.transform.translate(0, 0, deltaTime * 0.1);
}

function onDestroy() {
  console.log('Player controller destroyed');
}