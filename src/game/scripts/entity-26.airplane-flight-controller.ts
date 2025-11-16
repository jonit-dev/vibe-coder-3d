function onStart(): void {
  console.log('Airplane Flight Controller initialized');
  console.log('Controls: W/S - Throttle, A/D - Yaw, Q/E - Roll, R/F - Pitch, Space - Level Flight');
}

function onUpdate(deltaTime: number): void {
  // Get configurable parameters with defaults
  const thrust = (parameters.thrust as number) || 50.0;
  const turnSpeed = (parameters.turnSpeed as number) || 45.0;
  const liftForce = (parameters.liftForce as number) || 15.0;
  const dragCoeff = (parameters.dragCoeff as number) || 0.5;

  // Check if rigidbody component exists
  if (!entity.rigidBody) {
    console.error('Airplane requires RigidBody component for flight physics');
    return;
  }

  const rigidBody = entity.rigidBody;
  const transform = entity.transform;

  // Get current velocity and rotation
  const velocity = rigidBody.getLinearVelocity();
  const rotation = transform.getRotation();

  // Calculate forward direction from rotation
  const forward = {
    x: Math.sin((rotation.y * Math.PI) / 180),
    y: 0,
    z: Math.cos((rotation.y * Math.PI) / 180),
  };

  // Control inputs
  let throttleInput = 0;
  let yawInput = 0;
  let rollInput = 0;
  let pitchInput = 0;

  // Keyboard controls
  if (input.isKeyDown('KeyW')) throttleInput = 1; // Increase throttle
  if (input.isKeyDown('KeyS')) throttleInput = -1; // Decrease throttle
  if (input.isKeyDown('KeyA')) yawInput = -1; // Turn left
  if (input.isKeyDown('KeyD')) yawInput = 1; // Turn right
  if (input.isKeyDown('KeyQ')) rollInput = -1; // Roll left
  if (input.isKeyDown('KeyE')) rollInput = 1; // Roll right
  if (input.isKeyDown('KeyR')) pitchInput = 1; // Pitch up
  if (input.isKeyDown('KeyF')) pitchInput = -1; // Pitch down
  if (input.isKeyDown('Space')) {
    // Auto-level flight
    transform.setRotation({ x: 0, y: rotation.y, z: 0 });
  }

  // Apply thrust (forward force)
  if (throttleInput !== 0) {
    const thrustForce = {
      x: forward.x * thrust * throttleInput,
      y: 0,
      z: forward.z * thrust * throttleInput,
    };
    rigidBody.addForce(thrustForce);
  }

  // Apply turning (yaw rotation)
  if (yawInput !== 0) {
    const newYaw = rotation.y + yawInput * turnSpeed * deltaTime;
    transform.setRotation({ x: rotation.x, y: newYaw, z: rotation.z });
  }

  // Apply roll (banking)
  if (rollInput !== 0) {
    const newRoll = rotation.z + rollInput * turnSpeed * deltaTime;
    transform.setRotation({ x: rotation.x, y: rotation.y, z: newRoll });
  }

  // Apply pitch (nose up/down)
  if (pitchInput !== 0) {
    const newPitch = rotation.x + pitchInput * turnSpeed * 0.5 * deltaTime;
    // Clamp pitch to prevent flipping
    const clampedPitch = Math.max(-45, Math.min(45, newPitch));
    transform.setRotation({ x: clampedPitch, y: rotation.y, z: rotation.z });
  }

  // Calculate speed for lift and drag
  const speed = Math.sqrt(
    velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z,
  );

  // Apply lift (upward force based on forward speed)
  if (speed > 1) {
    const liftMagnitude = liftForce * speed * 0.1;
    rigidBody.addForce({ x: 0, y: liftMagnitude, z: 0 });
  }

  // Apply drag (opposing force)
  if (speed > 0.1) {
    const dragMagnitude = dragCoeff * speed;
    const dragForce = {
      x: -velocity.x * dragMagnitude,
      y: -velocity.y * dragMagnitude,
      z: -velocity.z * dragMagnitude,
    };
    rigidBody.addForce(dragForce);
  }

  // Auto-level when no roll input (stable flight)
  if (rollInput === 0 && Math.abs(rotation.z) > 0.1) {
    const levelingSpeed = deltaTime * 30;
    const newRoll = rotation.z * (1 - levelingSpeed);
    transform.setRotation({ x: rotation.x, y: rotation.y, z: newRoll });
  }

  // Prevent plane from falling too fast (stall recovery)
  if (velocity.y < -20) {
    rigidBody.addForce({ x: 0, y: 30, z: 0 });
  }

  // Debug info (every 60 frames)
  if (time.frameCount % 60 === 0) {
    console.log(
      `Airplane Speed: ${speed.toFixed(1)}, Altitude: ${transform.position.y.toFixed(1)}`,
    );
  }
}
