# Time API

The Time API provides access to time-related information including elapsed time, delta time between frames, and frame counting. It's essential for creating frame-rate independent animations and time-based game logic.

## Overview

The Time API includes:

- Total elapsed time since game start
- Delta time between frames for smooth animations
- Frame count for timing and debugging
- Time-based calculations and scheduling

## Core Properties

### `time.time`

**Readonly number**: Total time elapsed since the game started (in seconds).

**Usage:**

- Animations that should progress over time
- Cooldowns and time-based effects
- Synchronized actions across entities

**Example:**

```javascript
function onUpdate() {
  // Create a pulsing effect
  const pulseSpeed = 2.0; // pulses per second
  const pulse = math.sin(time.time * pulseSpeed * 2 * math.PI) * 0.5 + 0.5;

  // Apply to scale
  entity.transform.setScale(1 + pulse * 0.2);
}

// Cooldown example
let lastShotTime = 0;
const fireRate = 0.1; // seconds between shots

function tryShoot() {
  if (time.time - lastShotTime >= fireRate) {
    shoot();
    lastShotTime = time.time;
  }
}
```

### `time.deltaTime`

**Readonly number**: Time elapsed since the last frame (in seconds).

**Usage:**

- Frame-rate independent movement
- Smooth animations
- Physics calculations

**Example:**

```javascript
const speed = 5.0; // units per second

function onUpdate() {
  // Frame-rate independent movement
  const moveDistance = speed * time.deltaTime;

  if (input.isKeyDown('w')) {
    entity.transform.translate(0, 0, -moveDistance);
  }

  if (input.isKeyDown('s')) {
    entity.transform.translate(0, 0, moveDistance);
  }
}

// Smooth rotation
const rotationSpeed = 90.0; // degrees per second

function onUpdate() {
  if (input.isKeyDown('a')) {
    entity.transform.rotate(0, -rotationSpeed * time.deltaTime, 0);
  }

  if (input.isKeyDown('d')) {
    entity.transform.rotate(0, rotationSpeed * time.deltaTime, 0);
  }
}
```

### `time.frameCount`

**Readonly number**: Total number of frames rendered since the game started.

**Usage:**

- Debugging and performance monitoring
- Frame-based timing (use carefully)
- Staggered updates across multiple entities

**Example:**

```javascript
function onUpdate() {
  // Log every 60 frames (approximately every second at 60 FPS)
  if (time.frameCount % 60 === 0) {
    console.log(`FPS Check: Frame ${time.frameCount}, Time: ${time.time.toFixed(2)}s`);
  }
}

// Stagger enemy updates to distribute processing
function onUpdate() {
  // Only update every 3rd frame
  if (time.frameCount % 3 === 0) {
    updateAI();
  }
}
```

## Complete Examples

### Smooth Movement System

```javascript
const moveSpeed = 8.0;
const jumpForce = 10.0;

function onUpdate() {
  // Frame-rate independent movement
  const moveX = input.isKeyDown('d') - input.isKeyDown('a');
  const moveZ = input.isKeyDown('w') - input.isKeyDown('s');

  // Normalize diagonal movement
  if (moveX !== 0 || moveZ !== 0) {
    const length = math.sqrt(moveX * moveX + moveZ * moveZ);
    moveX /= length;
    moveZ /= length;
  }

  // Apply movement
  const currentPos = entity.transform.position;
  const deltaX = moveX * moveSpeed * time.deltaTime;
  const deltaZ = moveZ * moveSpeed * time.deltaTime;

  entity.transform.setPosition(currentPos[0] + deltaX, currentPos[1], currentPos[2] + deltaZ);
}
```

### Time-Based Animations

```javascript
let animationStartTime = 0;
const animationDuration = 2.0; // seconds

function onStart() {
  animationStartTime = time.time;
}

function onUpdate() {
  const elapsed = time.time - animationStartTime;
  const progress = math.clamp(elapsed / animationDuration, 0, 1);

  // Smooth interpolation
  const easeProgress = progress * progress * (3 - 2 * progress); // Smoothstep

  // Animate scale from 0.5 to 2.0
  const scale = math.lerp(0.5, 2.0, easeProgress);
  entity.transform.setScale(scale);

  // Animate rotation
  entity.transform.rotate(0, 360 * time.deltaTime, 0);

  // Restart animation
  if (progress >= 1.0) {
    animationStartTime = time.time;
  }
}
```

### Cooldown System

```javascript
const abilities = {
  dash: { cooldown: 3.0, lastUsed: 0 },
  heal: { cooldown: 10.0, lastUsed: 0 },
  special: { cooldown: 30.0, lastUsed: 0 },
};

function tryUseAbility(abilityName) {
  const ability = abilities[abilityName];
  if (!ability) return false;

  const currentTime = time.time;
  if (currentTime - ability.lastUsed >= ability.cooldown) {
    // Use ability
    useAbility(abilityName);
    ability.lastUsed = currentTime;
    return true;
  } else {
    // Calculate remaining cooldown
    const remaining = ability.cooldown - (currentTime - ability.lastUsed);
    console.log(`${abilityName} on cooldown: ${remaining.toFixed(1)}s remaining`);
    return false;
  }
}

function onUpdate() {
  // Check ability inputs
  if (input.isKeyPressed('shift')) {
    tryUseAbility('dash');
  }

  if (input.isKeyPressed('h')) {
    tryUseAbility('heal');
  }

  if (input.isKeyPressed('q')) {
    tryUseAbility('special');
  }
}
```

### Particle System Timer

```javascript
const particleCount = 100;
let particles = [];
let lastEmissionTime = 0;
const emissionRate = 0.05; // seconds between particle spawns

function onStart() {
  // Initialize particle system
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      active: false,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
      lifeTime: 0,
      maxLifeTime: 0,
    });
  }
}

function onUpdate() {
  // Emit new particles
  if (time.time - lastEmissionTime >= emissionRate) {
    emitParticle();
    lastEmissionTime = time.time;
  }

  // Update existing particles
  particles.forEach((particle, index) => {
    if (particle.active) {
      // Update position
      particle.position[0] += particle.velocity[0] * time.deltaTime;
      particle.position[1] += particle.velocity[1] * time.deltaTime;
      particle.position[2] += particle.velocity[2] * time.deltaTime;

      // Update lifetime
      particle.lifeTime += time.deltaTime;

      // Deactivate if lifetime exceeded
      if (particle.lifeTime >= particle.maxLifeTime) {
        particle.active = false;
      }

      // Update visual representation
      updateParticleVisual(index);
    }
  });
}

function emitParticle() {
  const particle = particles.find((p) => !p.active);
  if (!particle) return;

  particle.active = true;
  particle.position = [...entity.transform.position];
  particle.velocity = [(math.random() - 0.5) * 4, math.random() * 3 + 2, (math.random() - 0.5) * 4];
  particle.lifeTime = 0;
  particle.maxLifeTime = 2.0; // 2 seconds
}
```

### Day/Night Cycle

```javascript
const dayDuration = 300.0; // 5 minutes per day
const nightColor = [0.1, 0.1, 0.3];
const dayColor = [0.8, 0.9, 1.0];

function onUpdate() {
  // Calculate time of day (0-1)
  const dayProgress = (time.time % dayDuration) / dayDuration;

  // Calculate sun angle
  const sunAngle = dayProgress * 360 - 90; // Start at horizon
  const sunRadians = math.degToRad(sunAngle);

  // Sun position
  const sunHeight = math.sin(sunRadians);
  const sunDistance = 50;

  const sunX = math.cos(sunRadians) * sunDistance;
  const sunY = math.max(sunHeight * sunDistance, -10);
  const sunZ = 0;

  // Update sun light
  const sunEntity = entities.findByTag('Sun')[0];
  if (sunEntity && sunEntity.light) {
    sunEntity.transform.setPosition(sunX, sunY, sunZ);
    sunEntity.light.setIntensity(math.max(sunHeight, 0.1));

    // Sun color changes with height
    const sunIntensity = math.clamp(sunHeight, 0, 1);
    const sunColor = [
      math.lerp(nightColor[0], dayColor[0], sunIntensity),
      math.lerp(nightColor[1], dayColor[1], sunIntensity),
      math.lerp(nightColor[2], dayColor[2], sunIntensity),
    ];

    sunEntity.light.setColor(sunColor[0], sunColor[1], sunColor[2]);
  }

  // Time display
  const hours = math.floor(dayProgress * 24);
  const minutes = math.floor((dayProgress * 24 - hours) * 60);
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  ui.updateWidget('hud', 'time-display', {
    text: timeString,
  });
}
```

### Performance Monitor

```javascript
let fps = 0;
let frameTime = 0;
let fpsUpdateTime = 0;
let frameCount = 0;

function onUpdate() {
  // Calculate frame time
  frameCount++;

  // Update FPS every second
  if (time.time - fpsUpdateTime >= 1.0) {
    fps = frameCount;
    frameTime = (1.0 / fps) * 1000; // Convert to milliseconds
    frameCount = 0;
    fpsUpdateTime = time.time;

    // Update debug UI
    ui.updateWidget('debug', 'fps-display', {
      text: `FPS: ${fps} (${frameTime.toFixed(2)}ms)`,
    });
  }

  // Warn about performance issues
  if (frameTime > 16.67) {
    // More than 60 FPS frame time
    console.warn(`Frame time high: ${frameTime.toFixed(2)}ms`);
  }
}
```

### Animation State Machine

```javascript
const states = {
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'run',
  JUMP: 'jump',
};

let currentState = states.IDLE;
let stateStartTime = 0;
const stateDurations = {
  idle: Infinity,
  walk: 0.5,
  run: 0.5,
  jump: 1.0,
};

function onUpdate() {
  const stateElapsed = time.time - stateStartTime;

  // Check for state transitions
  switch (currentState) {
    case states.IDLE:
      if (input.isKeyDown('shift') && (input.isKeyDown('w') || input.isKeyDown('s'))) {
        changeState(states.RUN);
      } else if (input.isKeyDown('w') || input.isKeyDown('s')) {
        changeState(states.WALK);
      }
      break;

    case states.WALK:
      if (!input.isKeyDown('w') && !input.isKeyDown('s')) {
        changeState(states.IDLE);
      } else if (input.isKeyDown('shift')) {
        changeState(states.RUN);
      }
      break;

    case states.RUN:
      if (!input.isKeyDown('w') && !input.isKeyDown('s')) {
        changeState(states.IDLE);
      } else if (!input.isKeyDown('shift')) {
        changeState(states.WALK);
      }
      break;

    case states.JUMP:
      if (stateElapsed >= stateDurations.jump && entity.controller.isGrounded()) {
        changeState(states.IDLE);
      }
      break;
  }

  // Execute state behavior
  executeState(stateElapsed);
}

function changeState(newState) {
  console.log(`State change: ${currentState} -> ${newState}`);
  currentState = newState;
  stateStartTime = time.time;
}

function executeState(stateElapsed) {
  switch (currentState) {
    case states.WALK:
      animateWalk(stateElapsed);
      break;
    case states.RUN:
      animateRun(stateElapsed);
      break;
    case states.JUMP:
      animateJump(stateElapsed);
      break;
  }
}

function animateWalk(elapsed) {
  // Walking animation loop
  const walkCycle = elapsed * 2; // 2 cycles per second
  const bounce = math.abs(math.sin(walkCycle)) * 0.1;
  entity.transform.setPosition(
    entity.transform.position[0],
    entity.transform.position[1] + bounce,
    entity.transform.position[2],
  );
}
```

### Weapon Firing with Rapid Fire

```javascript
const fireRate = 10.0; // rounds per second
const burstLength = 3; // rounds per burst
const burstCooldown = 0.5; // seconds between bursts

let lastFireTime = 0;
let currentBurstCount = 0;
let lastBurstTime = 0;

function onUpdate() {
  if (input.isMouseButtonDown(0)) {
    tryFire();
  } else {
    // Reset burst when button is released
    currentBurstCount = 0;
  }
}

function tryFire() {
  const currentTime = time.time;
  const fireInterval = 1.0 / fireRate;

  // Check if we need to start a new burst
  if (currentBurstCount >= burstLength) {
    if (currentTime - lastBurstTime >= burstCooldown) {
      currentBurstCount = 0;
    } else {
      return; // Still in burst cooldown
    }
  }

  // Check fire rate
  if (currentTime - lastFireTime >= fireInterval) {
    fire();
    lastFireTime = currentTime;
    currentBurstCount++;

    if (currentBurstCount === 1) {
      lastBurstTime = currentTime;
    }
  }
}

function fire() {
  console.log(`Firing shot ${currentBurstCount} of burst`);
  // Create projectile or raycast
}
```

## Best Practices

1. **Always Use Delta Time**: Multiply any continuous movement or changes by `time.deltaTime` for frame-rate independence
2. **Prefer Time Over Frame Count**: Use `time.time` for scheduling and cooldowns instead of `time.frameCount`
3. **Cache Time Values**: For performance-critical code, cache `time.deltaTime` and `time.time` at the start of your update
4. **Handle Time Jumps**: Be aware that `time.time` can jump (especially in debug modes)
5. **Precision**: Use appropriate precision - `time.deltaTime` is small, `time.time` grows continuously

## Common Patterns

### Frame-Rate Independent Lerp

```javascript
function smoothLerp(current, target, speed) {
  const t = 1 - math.exp(-speed * time.deltaTime);
  return math.lerp(current, target, t);
}
```

### Precise Timing

```javascript
function scheduleCallback(callback, delay) {
  const targetTime = time.time + delay;

  function check() {
    if (time.time >= targetTime) {
      callback();
    } else {
      // Check again next frame
    }
  }

  return check;
}
```

## Error Handling

- `time.deltaTime` should always be positive and reasonable (typically 0.001-0.1 seconds)
- `time.time` continuously increases and may become very large over long play sessions
- `time.frameCount` increments every frame and can become very large
- Use math.clamp() to prevent issues with extreme values when needed
