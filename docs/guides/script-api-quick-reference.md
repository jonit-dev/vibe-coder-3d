# Script API Quick Reference

**Quick reference for the most commonly used Script API features.**

## Template

```typescript
/// <reference path="./script-api.d.ts" />

function onStart(): void {
  // Initialize
}

function onUpdate(deltaTime: number): void {
  // Run every frame
}

function onDestroy(): void {
  // Cleanup
}
```

## Entity & Transform

```typescript
// Position
entity.transform.position; // Get [x, y, z]
entity.transform.setPosition(x, y, z); // Set position
entity.transform.translate(dx, dy, dz); // Add to position

// Rotation (euler angles in radians)
entity.transform.rotation; // Get [x, y, z]
entity.transform.setRotation(x, y, z); // Set rotation
entity.transform.rotate(dx, dy, dz); // Add to rotation

// Scale
entity.transform.scale; // Get [x, y, z]
entity.transform.setScale(x, y, z); // Set scale

// Helpers
entity.transform.lookAt([x, y, z]); // Look at position
entity.transform.forward(); // Get forward vector
entity.transform.right(); // Get right vector
entity.transform.up(); // Get up vector
```

## Three.js & Materials

```typescript
// Material
three.material.setColor('#ff0000'); // Set color
three.material.setOpacity(0.5); // Set transparency
three.material.setMetalness(0.8); // Set metalness
three.material.setRoughness(0.2); // Set roughness

// Animation (returns Promise)
await three.animate.position([x, y, z], 1000); // 1 second
await three.animate.rotation([x, y, z], 500); // 0.5 seconds
await three.animate.scale([x, y, z], 300); // 0.3 seconds

// Visibility
three.setVisible(true);
three.isVisible();

// Raycasting
const hits = three.raycast([x, y, z], [dx, dy, dz]);
```

## Input

```typescript
// Input Actions System - Polling
const moveValue = input.getActionValue('Gameplay', 'Move'); // Returns number, [x,y], or [x,y,z]
const isJumping = input.isActionActive('Gameplay', 'Jump'); // Returns boolean

// Input Actions System - Event-driven
input.onAction('Gameplay', 'Fire', (phase, value) => {
  if (phase === 'started') console.log('Fire button pressed!');
  if (phase === 'performed') console.log('Fire button held!');
  if (phase === 'canceled') console.log('Fire button released!');
});

// Action Map Management
input.enableActionMap('UI'); // Enable UI controls
input.disableActionMap('Gameplay'); // Disable gameplay controls
```

## Events

```typescript
// Subscribe
const off = events.on('game:start', (payload) => {
  console.log('Event!', payload);
});

// Emit
events.emit('player:scored', { points: 100 });

// Unsubscribe
off();
// or
events.off('game:start', handler);
```

## Timers

```typescript
// Timeout (once)
const id = timer.setTimeout(() => {
  console.log('Delayed!');
}, 1000);

timer.clearTimeout(id);

// Interval (repeating)
const id = timer.setInterval(() => {
  console.log('Repeating!');
}, 500);

timer.clearInterval(id);

// Wait for frames
await timer.nextTick(); // Wait 1 frame
await timer.waitFrames(60); // Wait 60 frames
```

## Audio

```typescript
// Play sound (2D)
const id = audio.play('/sounds/jump.wav', {
  volume: 0.8,
  loop: false,
  rate: 1.0,
});

// Play 3D spatial audio
const id3D = audio.play('/sounds/engine.wav', {
  volume: 1.0,
  loop: true,
  is3D: true, // Enable 3D positioning
});

// Stop sound
audio.stop(id); // By ID
audio.stop('/sounds/jump.wav'); // By URL (stops all sounds with this URL)

// Attach all active sounds to entity for 3D positioning
audio.attachToEntity(true); // true = follow entity movement

// Fire-and-forget sound effect (no need to store ID)
audio.play('/sounds/coin.wav');
```

## Queries

```typescript
// Raycast
const hit = query.raycastFirst([x, y, z], [dx, dy, dz]);
const hits = query.raycastAll([x, y, z], [dx, dy, dz]);

// Tags (stub - not fully implemented)
const entityIds = query.findByTag('enemy');
```

## Entities

```typescript
// Get entity by ID
const other = entities.get(entityId);
if (other) {
  other.transform.setPosition(0, 5, 0);
}

// From reference
const target = entities.fromRef(parameters.target as IEntityRef);

// Check existence
if (entities.exists(entityId)) {
  // Entity is valid
}
```

## Prefabs

```typescript
// Spawn entity
const id = prefab.spawn('enemy-1', {
  position: [x, y, z],
});

// Destroy entity
prefab.destroy(id); // Specific entity
prefab.destroy(); // Current entity

// Toggle active
prefab.setActive(id, false); // Disable
prefab.setActive(id, true); // Enable
```

## Math

```typescript
math.PI; // 3.14159...
math.E; // 2.71828...

math.sin(x), math.cos(x), math.tan(x);
math.floor(x), math.ceil(x), math.round(x);
math.abs(x), math.sqrt(x);
math.min(...values), math.max(...values);

math.lerp(a, b, t); // Linear interpolation
math.clamp(value, min, max); // Clamp value
math.distance(x1, y1, z1, x2, y2, z2); // 3D distance
math.degToRad(degrees); // Convert to radians
math.radToDeg(radians); // Convert to degrees
```

## Time

```typescript
time.time; // Total time (seconds)
time.deltaTime; // Frame time (seconds)
time.frameCount; // Frame number
```

## Parameters

```typescript
// Read parameters set in editor
const speed = (parameters.speed as number) || 5.0;
const color = (parameters.color as string) || '#ff0000';
const target = parameters.targetEntity as IEntityRef;
```

## Common Patterns

### Simple Rotation

```typescript
function onUpdate(dt: number): void {
  entity.transform.rotate(0, dt, 0);
}
```

### WASD Movement

```typescript
function onUpdate(dt: number): void {
  const speed = 5 * dt;
  if (input.isKeyPressed('w')) entity.transform.translate(0, 0, -speed);
  if (input.isKeyPressed('s')) entity.transform.translate(0, 0, speed);
  if (input.isKeyPressed('a')) entity.transform.translate(-speed, 0, 0);
  if (input.isKeyPressed('d')) entity.transform.translate(speed, 0, 0);
}
```

### Pulse Animation

```typescript
async function onStart(): void {
  while (true) {
    await three.animate.scale([1.2, 1.2, 1.2], 500);
    await three.animate.scale([1, 1, 1], 500);
  }
}
```

### Follow Target

```typescript
const targetRef = parameters.target as IEntityRef;

function onUpdate(dt: number): void {
  const target = entities.fromRef(targetRef);
  if (!target) return;

  const targetPos = target.transform.position;
  entity.transform.lookAt(targetPos);
  entity.transform.translate(0, 0, -dt * 3);
}
```

### Ground Detection

```typescript
function onUpdate(dt: number): void {
  const pos = entity.transform.position;
  const hit = query.raycastFirst(pos, [0, -1, 0]);

  if (hit && (hit as any).distance < 1.0) {
    console.log('On ground');
  }
}
```

### Delayed Color Change

```typescript
function onStart(): void {
  timer.setTimeout(() => {
    three.material.setColor('#00ff00');
  }, 2000);
}
```

### Event Communication

```typescript
// Emitter
function onUpdate(dt: number): void {
  if (input.isKeyDown('space')) {
    events.emit('player:jumped', { height: 5 });
  }
}

// Listener
function onStart(): void {
  events.on('player:jumped', (data: any) => {
    console.log('Jump height:', data.height);
    audio.play('/sounds/jump.wav');
  });
}
```

## Tips

- Always check if entities/objects exist before using them
- Use `await` with animation promises for sequential animations
- Clean up timers and event listeners in `onDestroy()` (automatic cleanup provided)
- Use `deltaTime` in `onUpdate()` for frame-rate independent movement
- Keep scripts lightweight - avoid heavy computations in `onUpdate()`
- Use parameters for configurable values instead of hardcoding
- Include `/// <reference path="./script-api.d.ts" />` for type hints

## See Also

- [Full Script System Documentation](../architecture/2-13-script-system.md)
- [Type Definitions](../../src/game/scripts/script-api.d.ts)
- [Example Scripts](../../src/game/scripts/)
