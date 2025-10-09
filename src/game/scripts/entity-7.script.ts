/// <reference path="./script-api.d.ts" />

// Sanity check script - Testing component accessors
function onStart(): void {
  console.log('=== Script Starting ===');

  // Debug: Check what's available
  console.log('Entity ID:', entity.id);
  console.log('Entity name:', entity.name);
  console.log('Has Transform?', entity.hasComponent('Transform'));
  console.log('Has MeshRenderer?', entity.hasComponent('MeshRenderer'));

  // Test reading transform
  const currentPos = entity.transform.position;
  const currentRot = entity.transform.rotation;
  console.log('Current position:', currentPos);
  console.log('Current rotation:', currentRot);

  // Test MeshRenderer accessor (replaces direct three usage)
  if (entity.meshRenderer) {
    console.log('Setting color via entity.meshRenderer.material.setColor()');
    entity.meshRenderer.material.setColor('#00ff00'); // Green
  } else {
    console.log('Warning: No MeshRenderer component!');
  }
}

function onUpdate(deltaTime: number): void {
  // Test rotation via transform accessor
  // This queues a mutation that gets flushed by ComponentWriteSystem after all scripts execute
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}
