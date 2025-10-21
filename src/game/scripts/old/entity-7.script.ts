/// <reference path="./script-api.d.ts" />

// Transform API Test Script - Comprehensive testing of all transform methods
let elapsedTime = 0;
let testPhase = 0;

function onStart(): void {
  console.log('=== Transform API Test Script Starting ===');
  console.log('Entity ID:', entity.id);
  console.log('Entity name:', entity.name);

  // Initial transform state
  console.log('Initial position:', entity.transform.position);
  console.log('Initial rotation:', entity.transform.rotation);
  console.log('Initial scale:', entity.transform.scale);

  // Test MeshRenderer color
  if (entity.meshRenderer) {
    entity.meshRenderer.material.setColor('#00ff00'); // Green
    console.log('Set color to green');
  }

  // Get direction vectors
  console.log('Forward vector:', entity.transform.forward());
  console.log('Right vector:', entity.transform.right());
  console.log('Up vector:', entity.transform.up());
}

function onUpdate(deltaTime: number): void {
  elapsedTime += deltaTime;

  // Test different transform operations in phases (each phase lasts 3 seconds)
  const phaseDuration = 3;
  const currentPhase = Math.floor(elapsedTime / phaseDuration);

  // Only log on phase change
  if (currentPhase !== testPhase) {
    testPhase = currentPhase;

    const phaseNames = [
      'Phase 0: Rotate around Y axis',
      'Phase 1: Translate up/down (oscillate)',
      'Phase 2: Scale pulsing',
      'Phase 3: Rotate around X axis',
      'Phase 4: Circular motion (setPosition)',
      'Phase 5: Look at origin while orbiting',
      'Phase 6: Complex rotation (all axes)',
      'Phase 7: Spiral upward',
    ];

    console.log(`=== ${phaseNames[testPhase] || 'Unknown phase'} ===`);
  }

  switch (testPhase) {
    case 0: {
      // Phase 0: Rotate around Y axis
      entity.transform.rotate(0, deltaTime * 0.5, 0);
      break;
    }

    case 1: {
      // Phase 1: Translate up and down (oscillate)
      const moveY = Math.sin(elapsedTime * 2) * deltaTime;
      entity.transform.translate(0, moveY, 0);
      break;
    }

    case 2: {
      // Phase 2: Scale pulsing
      const scaleFactor = 1 + Math.sin(elapsedTime * 3) * 0.3;
      entity.transform.setScale(scaleFactor, scaleFactor, scaleFactor);
      break;
    }

    case 3: {
      // Phase 3: Rotate around X axis
      entity.transform.rotate(deltaTime * 1.0, 0, 0);
      break;
    }

    case 4: {
      // Phase 4: Circular motion
      const radius = 2;
      const x = Math.cos(elapsedTime) * radius;
      const z = Math.sin(elapsedTime) * radius;
      entity.transform.setPosition(x, 0, z);
      break;
    }

    case 5: {
      // Phase 5: Look at origin
      entity.transform.lookAt([0, 0, 0]);
      // Move in a circle while looking at center
      const circleX = Math.cos(elapsedTime * 0.5) * 3;
      const circleZ = Math.sin(elapsedTime * 0.5) * 3;
      entity.transform.setPosition(circleX, 1, circleZ);
      break;
    }

    case 6: {
      // Phase 6: Complex rotation (all axes)
      entity.transform.rotate(deltaTime * 0.3, deltaTime * 0.5, deltaTime * 0.2);
      break;
    }

    case 7: {
      // Phase 7: Reset and spiral up
      const spiralRadius = 2;
      const spiralX = Math.cos(elapsedTime * 2) * spiralRadius;
      const spiralZ = Math.sin(elapsedTime * 2) * spiralRadius;
      const spiralY = (elapsedTime - testPhase * phaseDuration) * 0.5;
      entity.transform.setPosition(spiralX, spiralY, spiralZ);
      break;
    }

    default: {
      // Reset to initial state and loop
      if (testPhase > 7) {
        console.log('=== Resetting test cycle ===');
        entity.transform.setPosition(0, 0, 0);
        entity.transform.setRotation(0, 0, 0);
        entity.transform.setScale(1, 1, 1);
        elapsedTime = 0;
        testPhase = 0;
      }
      break;
    }
  }
}
