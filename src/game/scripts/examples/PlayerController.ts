/**
 * Example: Player Controller Script
 * Demonstrates how to use keyboard and mouse input in scripts
 */

// Movement speed
const moveSpeed = 5.0;
const rotationSpeed = 0.002;

/**
 * Called once when the script starts
 */
function onStart() {
  console.log('Player Controller started');
  console.log('Controls:');
  console.log('- WASD: Move');
  console.log('- Mouse: Look around');
  console.log('- Space: Jump');
  console.log('- Shift: Sprint');
}

/**
 * Called every frame while playing
 */
function onUpdate(deltaTime: number) {
  // Get current position
  const [x, y, z] = entity.transform.position;

  // Movement using WASD keys
  let speed = moveSpeed * deltaTime;

  // Sprint when holding Shift
  if (input.isKeyDown('shift')) {
    speed *= 2; // Double speed when sprinting
  }

  // Forward/Backward (W/S)
  if (input.isKeyDown('w')) {
    entity.transform.translate(0, 0, -speed);
  }
  if (input.isKeyDown('s')) {
    entity.transform.translate(0, 0, speed);
  }

  // Strafe Left/Right (A/D)
  if (input.isKeyDown('a')) {
    entity.transform.translate(-speed, 0, 0);
  }
  if (input.isKeyDown('d')) {
    entity.transform.translate(speed, 0, 0);
  }

  // Jump on Space press (single trigger per press)
  if (input.isKeyPressed('space')) {
    entity.transform.translate(0, 2, 0);
    console.log('Jump!');
  }

  // Mouse look (camera rotation)
  const [dx, dy] = input.mouseDelta();

  if (input.isMouseButtonDown(0)) {
    // Right mouse button held - rotate camera
    const [rx, ry, rz] = entity.transform.rotation;
    entity.transform.setRotation(rx - dy * rotationSpeed, ry - dx * rotationSpeed, rz);
  }

  // Mouse wheel zoom
  const wheel = input.mouseWheel();
  if (wheel !== 0) {
    const zoomAmount = wheel * 0.1;
    entity.transform.translate(0, 0, zoomAmount);
  }

  // Example: Detect mouse button clicks
  if (input.isMouseButtonPressed(1)) {
    console.log('Middle mouse button clicked!');
  }

  // Example: Key release detection
  if (input.isKeyReleased('w')) {
    console.log('Stopped moving forward');
  }
}

/**
 * Called when the script is destroyed
 */
function onDestroy() {
  console.log('Player Controller destroyed');
}
