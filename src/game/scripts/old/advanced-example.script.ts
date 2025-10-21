/**
 * Advanced Script Example
 * Demonstrates all 13 Script APIs
 *
 * Note: Types from script-api.d.ts are automatically available
 */

// Script parameters (configured in editor)
const moveSpeed = (parameters.speed as number) || 5.0;
const targetEntityRef = parameters.target as IEntityRef;
const respawnTime = (parameters.respawnTime as number) || 3000;
const jumpSound = (parameters.jumpSound as string) || '/sounds/jump.wav';

// Local state
let isGrounded = false;
let score = 0;
let jumpCooldown = false;

/**
 * Initialize script on start
 */
function onStart(): void {
  console.log('Advanced script started for entity', entity.id);

  // Set initial appearance
  three.material.setColor('#4a90e2');
  three.material.setMetalness(0.5);
  three.material.setRoughness(0.3);

  // Subscribe to global events
  events.on('game:reset', handleGameReset);
  events.on('enemy:defeated', handleEnemyDefeated);

  // Play intro animation
  playIntroAnimation();

  // Schedule periodic status update
  timer.setInterval(() => {
    console.info('Status:', {
      position: entity.transform.position,
      score: score,
      isGrounded: isGrounded,
    });
  }, 5000);
}

/**
 * Update loop - runs every frame
 */
function onUpdate(deltaTime: number): void {
  // Update scheduler (for timers)
  handleInput(deltaTime);
  checkGround();
  followTarget(deltaTime);
  updateVisuals(deltaTime);
}

/**
 * Handle keyboard/mouse input
 */
function handleInput(deltaTime: number): void {
  const speed = moveSpeed * deltaTime;

  // WASD movement
  if (input.isKeyPressed('w')) {
    entity.transform.translate(0, 0, -speed);
  }
  if (input.isKeyPressed('s')) {
    entity.transform.translate(0, 0, speed);
  }
  if (input.isKeyPressed('a')) {
    entity.transform.translate(-speed, 0, 0);
  }
  if (input.isKeyPressed('d')) {
    entity.transform.translate(speed, 0, 0);
  }

  // Jump with space
  if (input.isKeyDown('space') && isGrounded && !jumpCooldown) {
    jump();
  }

  // Interact with E key
  if (input.isKeyDown('e')) {
    interact();
  }

  // Mouse click to spawn
  if (input.isMouseButtonDown(0)) {
    const mousePos = input.mousePosition();
    console.log('Mouse clicked at:', mousePos);
    spawnAtMouse();
  }
}

/**
 * Check if entity is on the ground using raycasting
 */
function checkGround(): void {
  const pos = entity.transform.position;
  const origin: [number, number, number] = [pos[0], pos[1], pos[2]];
  const direction: [number, number, number] = [0, -1, 0];

  const hit = query.raycastFirst(origin, direction);

  const wasGrounded = isGrounded;
  isGrounded = hit !== null && (hit as any).distance < 1.5;

  // Landed event
  if (isGrounded && !wasGrounded) {
    events.emit('player:landed', { entityId: entity.id });
    console.log('Landed!');
  }
}

/**
 * Follow target entity if configured
 */
function followTarget(deltaTime: number): void {
  if (!targetEntityRef) return;

  const target = entities.fromRef(targetEntityRef);
  if (!target) {
    console.warn('Target entity not found');
    return;
  }

  const myPos = entity.transform.position;
  const targetPos = target.transform.position;

  // Calculate distance
  const distance = math.distance(
    myPos[0],
    myPos[1],
    myPos[2],
    targetPos[0],
    targetPos[1],
    targetPos[2],
  );

  // Only follow if far enough
  if (distance > 3.0) {
    // Look at target
    entity.transform.lookAt(targetPos);

    // Move towards target
    const followSpeed = 2.0 * deltaTime;
    entity.transform.translate(0, 0, -followSpeed);
  }
}

/**
 * Update visual effects based on state
 */
function updateVisuals(deltaTime: number): void {
  // Rotate slowly
  entity.transform.rotate(0, deltaTime * 0.2, 0);

  // Pulse scale when not grounded
  if (!isGrounded) {
    const scale = 1.0 + math.sin(time.time * 5) * 0.1;
    entity.transform.setScale(scale, scale, scale);
  } else {
    entity.transform.setScale(1, 1, 1);
  }

  // Change color based on speed
  const velocity = math.abs(math.sin(time.time));
  const hue = math.clamp(velocity * 360, 0, 360);
  // Color change would go here if we had HSL support
}

/**
 * Jump action
 */
function jump(): void {
  console.log('Jump!');

  // Play sound
  audio.play(jumpSound, { volume: 0.7 });

  // Emit event
  events.emit('player:jumped', {
    entityId: entity.id,
    position: entity.transform.position,
  });

  // Jump animation (move up)
  const currentPos = entity.transform.position;
  three.animate.position([currentPos[0], currentPos[1] + 3, currentPos[2]], 300);

  // Set cooldown
  jumpCooldown = true;
  timer.setTimeout(() => {
    jumpCooldown = false;
  }, 500);

  // Update score
  score += 10;
}

/**
 * Interact with nearby objects
 */
function interact(): void {
  console.log('Interact!');

  // Find nearby enemies
  const enemies = query.findByTag('enemy');

  if (enemies.length > 0) {
    console.log('Found enemies:', enemies);

    // Emit interaction event
    events.emit('player:interacted', {
      entityId: entity.id,
      targets: enemies,
    });

    // Increase score
    score += 50;
  } else {
    console.log('No enemies nearby');
  }
}

/**
 * Spawn entity at mouse position
 */
function spawnAtMouse(): void {
  // In a real implementation, convert mouse coords to world position
  const mousePos = input.mousePosition();
  console.log('Spawning at mouse:', mousePos);

  // Spawn using prefab (stub)
  const newEntityId = prefab.spawn('projectile', {
    position: entity.transform.position,
  });

  console.log('Spawned entity:', newEntityId);

  // Emit spawn event
  events.emit('entity:spawned', {
    entityId: newEntityId,
    spawnedBy: entity.id,
  });
}

/**
 * Play intro animation sequence
 */
async function playIntroAnimation(): Promise<void> {
  // Wait a moment
  await timer.waitFrames(10);

  // Pulse scale
  await three.animate.scale([1.5, 1.5, 1.5], 300);
  await three.animate.scale([1, 1, 1], 300);

  // Spin
  const currentRot = entity.transform.rotation;
  await three.animate.rotation([currentRot[0], currentRot[1] + math.PI * 2, currentRot[2]], 1000);

  console.log('Intro animation complete!');
}

/**
 * Handle game reset event
 */
function handleGameReset(data: unknown): void {
  console.log('Game reset received:', data);

  // Reset state
  score = 0;
  isGrounded = false;
  jumpCooldown = false;

  // Reset position
  entity.transform.setPosition(0, 1, 0);
  entity.transform.setRotation(0, 0, 0);

  // Reset visual
  three.material.setColor('#4a90e2');

  // Play reset sound
  audio.play('/sounds/reset.wav');
}

/**
 * Handle enemy defeated event
 */
function handleEnemyDefeated(data: any): void {
  console.log('Enemy defeated:', data);

  // Increase score
  score += 100;

  // Visual feedback
  three.material.setColor('#00ff00');

  // Reset color after delay
  timer.setTimeout(() => {
    three.material.setColor('#4a90e2');
  }, 500);

  // Play victory sound
  audio.play('/sounds/victory.wav', { volume: 0.8 });
}

/**
 * Respawn entity after delay
 */
function scheduleRespawn(): void {
  timer.setTimeout(() => {
    // Reset to spawn point
    entity.transform.setPosition(0, 5, 0);
    three.setVisible(true);

    // Play respawn effect
    playIntroAnimation();
  }, respawnTime);
}

/**
 * Cleanup when entity is destroyed
 */
function onDestroy(): void {
  console.log('Advanced script destroyed for entity', entity.id);

  // Emit destruction event
  events.emit('entity:destroyed', {
    entityId: entity.id,
    finalScore: score,
  });

  // Note: Event listeners and timers are automatically cleaned up
}

/**
 * Called when component is enabled
 */
function onEnable(): void {
  console.log('Script enabled');
  three.setVisible(true);
}

/**
 * Called when component is disabled
 */
function onDisable(): void {
  console.log('Script disabled');
  three.setVisible(false);
}
