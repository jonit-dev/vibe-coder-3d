/**
 * Physics Demo Script
 * Demonstrates the Script API physics features including:
 * - RigidBody force/impulse/velocity control
 * - Collision and trigger events
 * - Character controller for movement and jumping
 */

// State variables
const speed = 6;
const jumpStrength = 6.5;
let hasJumped = false;

function onStart() {
  console.log('Physics Demo started!');

  // Configure physics material
  entity.rigidBody?.setPhysicsMaterial(0.5, 0.3, 1.0);

  // Subscribe to collision events
  entity.physicsEvents?.onCollisionEnter((otherEntityId) => {
    console.log('Collided with entity:', otherEntityId);

    // Flash color on collision
    entity.meshRenderer?.material.setColor('#ff0000');
    timer.setTimeout(() => {
      entity.meshRenderer?.material.setColor('#ffffff');
    }, 200);
  });

  // Subscribe to trigger events
  entity.physicsEvents?.onTriggerEnter((otherEntityId) => {
    console.log('Entered trigger:', otherEntityId);
  });
}

function onUpdate(deltaTime: number) {
  // Example 1: Direct velocity control
  // Uncomment to use direct velocity instead of character controller
  /*
  const [mx, my] = input.getActionValue('Gameplay', 'Move') as [number, number];
  entity.rigidBody?.setLinearVelocity([mx * speed, 0, my * speed]);
  */

  // Example 2: Character controller (recommended for characters)
  if (entity.controller) {
    // Get movement input
    const moveInput = input.getActionValue('Gameplay', 'Move') as [number, number];

    // Move character
    entity.controller.move(moveInput, speed, deltaTime);

    // Jump when space is pressed and character is grounded
    if (input.isActionActive('Gameplay', 'Jump') && entity.controller.isGrounded()) {
      entity.controller.jump(jumpStrength);
      console.log('Jump!');
    }

    // Check grounded state
    if (entity.controller.isGrounded() && hasJumped) {
      console.log('Landed!');
      hasJumped = false;
    } else if (!entity.controller.isGrounded()) {
      hasJumped = true;
    }
  }

  // Example 3: Apply impulse on key press
  if (input.isKeyPressed('f')) {
    entity.rigidBody?.applyImpulse([0, 5, 0]);
    console.log('Applied upward impulse!');
  }

  // Example 4: Apply continuous force
  if (input.isKeyDown('g')) {
    entity.rigidBody?.applyForce([0, 10, 0]);
  }

  // Example 5: Read velocity
  if (input.isKeyPressed('v')) {
    const velocity = entity.rigidBody?.getLinearVelocity();
    console.log('Current velocity:', velocity);
  }

  // Example 6: Toggle gravity
  if (input.isKeyPressed('0')) {
    // Toggle between normal gravity and no gravity
    const currentGravity = entity.rigidBody?.get()?.gravityScale ?? 1;
    const newGravity = currentGravity === 0 ? 1 : 0;
    entity.rigidBody?.setGravityScale(newGravity);
    console.log('Gravity scale:', newGravity);
  }

  // Example 7: Change body type
  if (input.isKeyPressed('1')) {
    entity.rigidBody?.setBodyType('dynamic');
    console.log('Body type: dynamic');
  }
  if (input.isKeyPressed('2')) {
    entity.rigidBody?.setBodyType('kinematic');
    console.log('Body type: kinematic');
  }
  if (input.isKeyPressed('3')) {
    entity.rigidBody?.setBodyType('static');
    console.log('Body type: static');
  }
}

function onDestroy() {
  console.log('Physics Demo destroyed');
}
