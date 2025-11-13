# Math API

The Math API provides essential mathematical functions and constants commonly needed in game development, including basic operations, game-specific utilities, and conversion functions.

## Overview

The Math API includes:

- Mathematical constants (PI, E)
- Basic math functions (trigonometry, logarithms, etc.)
- Game-specific utilities (lerp, clamp, distance)
- Angle conversion utilities

## Constants

### `math.PI`

**Readonly number**: π (3.14159...)

```javascript
const circumference = 2 * math.PI * radius;
```

### `math.E`

**Readonly number**: Euler's number (2.71828...)

```javascript
const exponentialGrowth = math.pow(math.E, x);
```

## Basic Math Functions

### Absolute Value

```javascript
const positive = math.abs(-5); // 5
const distance = math.abs(player.x - enemy.x);
```

### Trigonometry

```javascript
// Basic trig functions
const angle = math.atan2(dy, dx); // Get angle from delta
const sinValue = math.sin(angle);
const cosValue = math.cos(angle);

// Inverse trig functions
const angleFromSin = math.asin(0.5); // 30 degrees (in radians)
const angleFromCos = math.acos(0.5);
```

### Rounding

```javascript
const rounded = math.round(3.7); // 4
const floored = math.floor(3.7); // 3
const ceiling = math.ceil(3.2); // 4
```

### Exponents and Logarithms

```javascript
// Powers
const squared = math.pow(5, 2); // 25
const cubed = math.pow(3, 3); // 27

// Square root
const root = math.sqrt(16); // 4

// Logarithms
const naturalLog = math.log(10); // ln(10)
```

### Min/Max/Random

```javascript
const highest = math.max(1, 5, 3, 9); // 9
const lowest = math.min(1, 5, 3, 9); // 1

// Random number between 0 and 1
const randomFloat = math.random(); // e.g., 0.742

// Random integer between min and max (inclusive)
const randomInt = math.floor(math.random() * (max - min + 1)) + min;
```

## Game-Specific Utilities

### Linear Interpolation

```javascript
// Smooth movement between two values
const smoothHealth = math.lerp(0, 100, 0.75); // 75

// Animation progress
const animatedPos = math.lerp(startPos, endPos, progress);

// Color interpolation
const lerpedColor = [
  math.lerp(startR, endR, t),
  math.lerp(startG, endG, t),
  math.lerp(startB, endB, t),
];
```

### Clamping

```javascript
// Clamp health between 0 and 100
const validHealth = math.clamp(playerHealth, 0, 100);

// Clamp input values
const normalizedInput = math.clamp(input, -1, 1);

// Color clamping
const safeRed = math.clamp(colorRed, 0, 1);
```

### Distance Calculation

```javascript
// Distance between two 3D points
const dist = math.distance(x1, y1, z1, x2, y2, z2);

// Example: Check if player is close to target
const myPos = entity.transform.position;
const targetPos = target.transform.position;
const distance = math.distance(
  myPos[0],
  myPos[1],
  myPos[2],
  targetPos[0],
  targetPos[1],
  targetPos[2],
);

if (distance < 5) {
  console.log('Target is close!');
}
```

### Angle Conversion

```javascript
// Convert degrees to radians
const radians = math.degToRad(45); // 0.785...

// Convert radians to degrees
const degrees = math.radToDeg(math.PI / 4); // 45

// Common usage with trigonometry
const angleInDegrees = 90;
const angleInRadians = math.degToRad(angleInDegrees);
const sinValue = math.sin(angleInRadians);
```

## Complete Examples

### 3D Movement with Math

```javascript
const speed = 5.0;

function onUpdate() {
  // Get input
  let moveX = 0;
  let moveZ = 0;

  if (input.isKeyDown('w')) moveZ = -1;
  if (input.isKeyDown('s')) moveZ = 1;
  if (input.isKeyDown('a')) moveX = -1;
  if (input.isKeyDown('d')) moveX = 1;

  // Normalize for consistent diagonal speed
  if (moveX !== 0 || moveZ !== 0) {
    const length = math.sqrt(moveX * moveX + moveZ * moveZ);
    moveX /= length;
    moveZ /= length;
  }

  // Apply movement
  const currentPos = entity.transform.position;
  const newPos = [
    currentPos[0] + moveX * speed * time.deltaTime,
    currentPos[1],
    currentPos[2] + moveZ * speed * time.deltaTime,
  ];
  entity.transform.setPosition(newPos[0], newPos[1], newPos[2]);
}
```

### Circular Motion

```javascript
const radius = 3.0;
const angularSpeed = 1.0; // radians per second

function onUpdate() {
  const angle = time.time * angularSpeed;

  // Calculate position on circle
  const x = math.cos(angle) * radius;
  const z = math.sin(angle) * radius;

  entity.transform.setPosition(x, 0, z);
}
```

### Wave Motion

```javascript
const amplitude = 2.0;
const frequency = 0.5; // waves per second

function onUpdate() {
  const y = math.sin(time.time * frequency * 2 * math.PI) * amplitude;

  const currentPos = entity.transform.position;
  entity.transform.setPosition(currentPos[0], y, currentPos[2]);
}
```

### Projectile Trajectory

```javascript
function launchProjectile(speed, angleDegrees) {
  const angle = math.degToRad(angleDegrees);
  const velocityX = speed * math.cos(angle);
  const velocityY = speed * math.sin(angle);

  const projectileId = gameObject.createPrimitive('sphere', {
    transform: { position: entity.transform.position },
    physics: { body: 'dynamic', collider: 'sphere' },
  });

  const projectile = entities.get(projectileId);
  if (projectile.rigidBody) {
    projectile.rigidBody.setLinearVelocity([velocityX, velocityY, 0]);
  }
}
```

### Smooth Camera Follow

```javascript
const followSpeed = 5.0;
const distance = 10.0;
const height = 5.0;

function onUpdate() {
  const player = entities.findByTag('Player')[0];
  if (!player) return;

  const playerPos = player.transform.position;

  // Calculate ideal camera position
  const idealPos = [playerPos[0], playerPos[1] + height, playerPos[2] - distance];

  // Smoothly move camera to ideal position
  const currentPos = entity.transform.position;
  const newPos = [
    math.lerp(currentPos[0], idealPos[0], followSpeed * time.deltaTime),
    math.lerp(currentPos[1], idealPos[1], followSpeed * time.deltaTime),
    math.lerp(currentPos[2], idealPos[2], followSpeed * time.deltaTime),
  ];

  entity.transform.setPosition(newPos[0], newPos[1], newPos[2]);

  // Look at player
  entity.transform.lookAt(playerPos);
}
```

### Health Bar Animation

```javascript
const currentHealth = 75;
const maxHealth = 100;
const targetHealthPercent = currentHealth / maxHealth;

// Smooth health bar transition
let currentDisplayHealth = 1.0; // Start at full

function onUpdate() {
  // Smoothly transition health display
  currentDisplayHealth = math.lerp(currentDisplayHealth, targetHealthPercent, 0.1);

  // Update UI
  ui.updateWidget('health-bar', 'health', {
    value: currentDisplayHealth,
  });

  // Change color based on health
  let color;
  if (currentDisplayHealth > 0.6) {
    color = '#00ff00'; // Green
  } else if (currentDisplayHealth > 0.3) {
    color = '#ffff00'; // Yellow
  } else {
    color = '#ff0000'; // Red
  }

  ui.updateWidget('health-bar', 'health', { color });
}
```

### Proximity-Based Effects

```javascript
const effectRange = 5.0;
const maxEffectStrength = 1.0;

function onUpdate() {
  const myPos = entity.transform.position;
  const player = entities.findByTag('Player')[0];

  if (!player) return;

  const playerPos = player.transform.position;
  const distance = math.distance(
    myPos[0],
    myPos[1],
    myPos[2],
    playerPos[0],
    playerPos[1],
    playerPos[2],
  );

  // Calculate effect strength based on distance
  const effectStrength = math.max(0, 1 - distance / effectRange);

  // Apply effect (e.g., glow intensity)
  if (entity.meshRenderer) {
    const glowIntensity = effectStrength * maxEffectStrength;
    entity.meshRenderer.material.setEmissive('#ffff00', glowIntensity);
  }
}
```

### Random Spawn Points

```javascript
const spawnRadius = 20.0;

function spawnEnemy() {
  // Random angle
  const angle = math.random() * 2 * math.PI;

  // Random distance within radius
  const distance = math.random() * spawnRadius;

  // Calculate spawn position
  const spawnX = math.cos(angle) * distance;
  const spawnZ = math.sin(angle) * distance;

  const enemyId = gameObject.createPrimitive('cube', {
    transform: {
      position: [spawnX, 0, spawnZ],
    },
  });

  console.log(`Spawned enemy at (${spawnX.toFixed(2)}, 0, ${spawnZ.toFixed(2)})`);
}
```

### Orbital Motion

```javascript
const orbitRadius = 8.0;
const orbitSpeed = 0.5; // rotations per second
const orbitCenter = [0, 0, 0];

function onUpdate() {
  const angle = time.time * orbitSpeed * 2 * math.PI;

  // Calculate orbital position
  const x = orbitCenter[0] + math.cos(angle) * orbitRadius;
  const z = orbitCenter[2] + math.sin(angle) * orbitRadius;

  entity.transform.setPosition(x, orbitCenter[1], z);

  // Look at center
  entity.transform.lookAt(orbitCenter);
}
```

### Bouncing Ball Physics

```javascript
let velocity = 0;
const gravity = -9.8;
const bounceHeight = 5.0;
const bounceDamping = 0.8;

function onUpdate() {
  const currentY = entity.transform.position[1];

  // Apply gravity
  velocity += gravity * time.deltaTime;

  // Update position
  const newY = currentY + velocity * time.deltaTime;
  entity.transform.setPosition(0, newY, 0);

  // Bounce when hitting ground
  if (newY <= 0) {
    entity.transform.setPosition(0, 0, 0);
    velocity = math.abs(velocity) * bounceDamping;

    // Add some randomness to bounce
    velocity += math.random() * 0.5 - 0.25;
  }
}
```

## Performance Tips

1. **Cache Calculations**: Store frequently used calculations in variables
2. **Avoid Square Roots**: Use squared distances for comparisons when possible
3. **Use Approximations**: For visual effects, consider using simpler approximations
4. **Precompute Values**: Calculate constants once, not every frame

## Common Patterns

### Distance Without Square Root

```javascript
// For distance comparisons, avoid the expensive sqrt
function isWithinRange(pos1, pos2, rangeSquared) {
  const dx = pos2[0] - pos1[0];
  const dy = pos2[1] - pos1[1];
  const dz = pos2[2] - pos1[2];

  const distanceSquared = dx * dx + dy * dy + dz * dz;
  return distanceSquared <= rangeSquared;
}

// Usage
const range = 5.0;
const rangeSquared = range * range;

if (isWithinRange(myPos, targetPos, rangeSquared)) {
  console.log('Target is in range!');
}
```

### Smooth Value Changes

```javascript
let currentValue = 0;
let targetValue = 1;

function onUpdate() {
  // Smooth step function for more natural transitions
  const t = math.clamp(time.deltaTime * 2, 0, 1);
  currentValue = math.lerp(currentValue, targetValue, t);
}
```

### Random Range Function

```javascript
function randomRange(min, max) {
  return min + math.random() * (max - min);
}

function randomIntRange(min, max) {
  return math.floor(randomRange(min, max + 1));
}
```

## Error Handling

- All math functions return `number` or `number[]`
- Invalid inputs (like `sqrt(-1)`) return `NaN`
- Division by zero returns `Infinity`
- Always validate results if the input might be invalid
