# Entity API

The Entity API provides comprehensive access to entity properties, components, and transformation operations. It's your primary interface for manipulating game objects in scripts.

## Overview

Each script runs in the context of an entity, with full access to:

- Transform operations (position, rotation, scale)
- Component access and manipulation
- Hierarchy management (parent/child relationships)
- Physics and rendering components
- Entity lifecycle management

## Core Properties

### `entity.id`

**Readonly number**: Unique identifier for this entity

```javascript
console.log(`My entity ID is: ${entity.id}`);
```

### `entity.name`

**Readonly string**: Name of the entity

```javascript
console.log(`Entity name: ${entity.name}`);
```

### `entity.transform`

**ITransformAPI**: Access to position, rotation, and scale operations

## Transform API

### Position

```javascript
// Get current position
const pos = entity.transform.position; // [x, y, z]

// Set position
entity.transform.setPosition(0, 5, 0);

// Translate by offset
entity.transform.translate(1, 0, 0);

// Direct property access
entity.transform.position = [10, 20, 30];
```

### Rotation

```javascript
// Get current rotation (euler angles in degrees)
const rot = entity.transform.rotation; // [x, y, z]

// Set rotation
entity.transform.setRotation(0, 90, 0);

// Rotate by delta
entity.transform.rotate(0, 45, 0);
```

### Scale

```javascript
// Get current scale
const scale = entity.transform.scale; // [x, y, z]

// Set uniform scale
entity.transform.setScale(2, 2, 2);

// Set non-uniform scale
entity.transform.scale = [1, 2, 1];
```

### Direction Vectors

```javascript
// Get forward direction
const forward = entity.transform.forward(); // [x, y, z]

// Get right direction
const right = entity.transform.right();

// Get up direction
const up = entity.transform.up();

// Look at target position
entity.transform.lookAt([targetX, targetY, targetZ]);
```

## Component Access

### Generic Component Methods

```javascript
// Check if component exists
if (entity.hasComponent('Light')) {
  console.log('Entity has a Light component');
}

// Get component data
const lightData = entity.getComponent('Light');
if (lightData) {
  console.log('Light color:', lightData.color);
}

// Update component data
entity.setComponent('Light', {
  intensity: 2.0,
  color: [1, 0, 0], // Red light
});
```

### Direct Component Accessors

#### Mesh Renderer

```javascript
if (entity.meshRenderer) {
  // Get mesh renderer data
  const rendererData = entity.meshRenderer.get();

  // Enable/disable renderer
  entity.meshRenderer.enable(false); // Hide mesh
  entity.meshRenderer.enable(true); // Show mesh

  // Material manipulation
  entity.meshRenderer.material.setColor('#ff0000'); // Red color
  entity.meshRenderer.material.setMetalness(0.8);
  entity.meshRenderer.material.setRoughness(0.2);
  entity.meshRenderer.material.setEmissive('#ff00ff', 0.5);

  // Texture manipulation
  entity.meshRenderer.material.setTexture('albedo', '/textures/metal.jpg');
  entity.meshRenderer.material.setTexture('normal', '/textures/metal_normal.jpg');
}
```

#### Camera

```javascript
if (entity.camera) {
  // Set field of view
  entity.camera.setFov(75);

  // Set clipping planes
  entity.camera.setClipping(0.1, 1000);

  // Set projection type
  entity.camera.setProjection('perspective');
  entity.camera.setProjection('orthographic');

  // Set as main camera
  entity.camera.setAsMain(true);
}
```

#### Light

```javascript
if (entity.light) {
  // Set light type
  entity.light.setType('point');
  entity.light.setType('directional');
  entity.light.setType('spot');

  // Set color and intensity
  entity.light.setColor(1, 0.8, 0.6); // RGB 0-1
  entity.light.setIntensity(1.5);

  // Shadow settings
  entity.light.setCastShadow(true);
  entity.light.setShadowMapSize(2048);
  entity.light.setShadowBias(0.001);

  // Point/spot light specific
  entity.light.setRange(10);
  entity.light.setDecay(2);

  // Spot light specific
  entity.light.setDirection(0, -1, 0);
  entity.light.setAngle(45); // degrees
  entity.light.setPenumbra(0.1); // 0-1
}
```

## Physics API

### Rigid Body

```javascript
if (entity.rigidBody) {
  // Set body type
  entity.rigidBody.setBodyType('dynamic');
  entity.rigidBody.setBodyType('kinematic');
  entity.rigidBody.setBodyType('static');

  // Mass and gravity
  entity.rigidBody.setMass(2.5);
  entity.rigidBody.setGravityScale(0.5); // Half gravity
  entity.rigidBody.setGravityScale(0); // No gravity

  // Physics material
  entity.rigidBody.setPhysicsMaterial(0.7, 0.3, 1000); // friction, restitution, density

  // Forces and impulses
  entity.rigidBody.applyForce([0, 10, 0]); // Upward force
  entity.rigidBody.applyImpulse([5, 0, 0]); // Forward impulse

  // Apply at specific point
  entity.rigidBody.applyForce([0, 10, 0], [0, 0, 1]); // Force at top

  // Velocity control
  entity.rigidBody.setLinearVelocity([2, 0, 0]);
  const currentVel = entity.rigidBody.getLinearVelocity();

  entity.rigidBody.setAngularVelocity([0, 1, 0]);
  const currentAngVel = entity.rigidBody.getAngularVelocity();
}
```

### Mesh Collider

```javascript
if (entity.meshCollider) {
  // Set collider type
  entity.meshCollider.setType('box');
  entity.meshCollider.setType('sphere');
  entity.meshCollider.setType('capsule');
  entity.meshCollider.setType('convex');
  entity.meshCollider.setType('mesh');

  // Enable/disable
  entity.meshCollider.enable(true);
  entity.meshCollider.setTrigger(false); // Solid collider
  entity.meshCollider.setTrigger(true); // Trigger only

  // Box collider
  entity.meshCollider.setBoxSize(2, 3, 1);

  // Sphere collider
  entity.meshCollider.setSphereRadius(1.5);

  // Capsule collider
  entity.meshCollider.setCapsuleSize(0.5, 2);

  // Center offset
  entity.meshCollider.setCenter(0, 1, 0);
}
```

### Physics Events

```javascript
if (entity.physicsEvents) {
  // Collision events
  const cleanupCollision = entity.physicsEvents.onCollisionEnter((otherEntityId) => {
    const other = entities.get(otherEntityId);
    console.log(`Collision with ${other.name}`);
  });

  const cleanupExit = entity.physicsEvents.onCollisionExit((otherEntityId) => {
    console.log(`Collision ended with entity ${otherEntityId}`);
  });

  // Trigger events
  const cleanupTrigger = entity.physicsEvents.onTriggerEnter((otherEntityId) => {
    const other = entities.get(otherEntityId);
    console.log(`Trigger entered by ${other.name}`);
  });

  const cleanupTriggerExit = entity.physicsEvents.onTriggerExit((otherEntityId) => {
    console.log(`Trigger exited by entity ${otherEntityId}`);
  });

  // Cleanup when script is destroyed
  // cleanupCollision();
  // cleanupExit();
  // cleanupTrigger();
  // cleanupTriggerExit();
}
```

### Character Controller

```javascript
if (entity.controller) {
  // Check if grounded
  if (entity.controller.isGrounded()) {
    console.log('Character is on the ground');
  }

  // Character movement
  const moveInput = [inputX, inputZ]; // [-1,1] range
  const speed = 5.0;
  entity.controller.move(moveInput, speed, time.deltaTime);

  // Jumping
  if (entity.controller.isGrounded() && input.isKeyPressed('space')) {
    entity.controller.jump(8.0); // Jump strength
  }

  // Configure controller
  entity.controller.setSlopeLimit(45); // Max slope angle in degrees
  entity.controller.setStepOffset(0.4); // Max step height
}
```

## Hierarchy Management

### Parent/Child Relationships

```javascript
// Get parent entity
const parent = entity.getParent();
if (parent) {
  console.log(`Parent is: ${parent.name}`);
}

// Get all children
const children = entity.getChildren();
children.forEach((child) => {
  console.log(`Child: ${child.name}`);
});

// Find child by name
const weapon = entity.findChild('Weapon');
if (weapon) {
  console.log('Found weapon child entity');
}
```

## Entity Lifecycle

### Active State

```javascript
// Check if entity is active
if (entity.isActive()) {
  console.log('Entity is active and visible');
}

// Set active state
entity.setActive(false); // Deactivate (hide)
entity.setActive(true); // Activate (show)
```

### Destruction

```javascript
// Destroy this entity
entity.destroy();

// Note: After calling destroy(), the entity is no longer valid
// and further API calls will have no effect
```

## Complete Examples

### Player Movement Controller

```javascript
const speed = 5.0;
const jumpForce = 8.0;
const mouseSensitivity = 0.002;

function onStart() {
  input.lockPointer(); // FPS controls
}

function onUpdate() {
  if (!entity.rigidBody || !entity.controller) return;

  // Mouse look
  const [dx, dy] = input.mouseDelta();
  entity.transform.rotate(-dy * mouseSensitivity, dx * mouseSensitivity, 0);

  // Movement input
  let moveX = 0;
  let moveZ = 0;

  if (input.isKeyDown('w')) moveZ = -1;
  if (input.isKeyDown('s')) moveZ = 1;
  if (input.isKeyDown('a')) moveX = -1;
  if (input.isKeyDown('d')) moveX = 1;

  // Normalize diagonal movement
  if (moveX !== 0 || moveZ !== 0) {
    const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
    moveX /= length;
    moveZ /= length;
  }

  // Apply movement
  entity.controller.move([moveX, moveZ], speed, time.deltaTime);

  // Jumping
  if (entity.controller.isGrounded() && input.isKeyPressed('space')) {
    entity.controller.jump(jumpForce);
  }
}

function onDestroy() {
  input.unlockPointer();
}
```

### Door Mechanism

```javascript
const openAngle = 90;
const closeAngle = 0;
const openSpeed = 60; // degrees per second
let isOpen = false;
let targetAngle = closeAngle;

function onStart() {
  // Setup collision events
  if (entity.physicsEvents) {
    entity.physicsEvents.onTriggerEnter((otherEntityId) => {
      const other = entities.get(otherEntityId);
      if (other && other.name === 'Player') {
        toggleDoor();
      }
    });
  }
}

function toggleDoor() {
  isOpen = !isOpen;
  targetAngle = isOpen ? openAngle : closeAngle;
}

function onUpdate() {
  // Smooth door rotation
  const currentRotation = entity.transform.rotation[1]; // Y rotation
  const angleDiff = targetAngle - currentRotation;

  if (Math.abs(angleDiff) > 0.1) {
    const rotationStep = Math.sign(angleDiff) * openSpeed * time.deltaTime;
    const newRotation = currentRotation + rotationStep;

    // Clamp to target angle
    const clampedRotation = isOpen
      ? Math.min(newRotation, openAngle)
      : Math.max(newRotation, closeAngle);

    entity.transform.setRotation(0, clampedRotation, 0);
  }
}
```

### Collectible Item

```javascript
const rotationSpeed = 90; // degrees per second
const floatAmplitude = 0.2;
const floatSpeed = 2;
let startY = 0;

function onStart() {
  startY = entity.transform.position[1];

  if (entity.physicsEvents) {
    entity.physicsEvents.onTriggerEnter((otherEntityId) => {
      const other = entities.get(otherEntityId);
      if (other && other.hasComponent('PlayerTag')) {
        collect(other);
      }
    });
  }
}

function collect(playerEntity) {
  // Award points or power-up
  events.emit('item_collected', { itemId: entity.id, playerId: playerEntity.id });

  // Play collection effect
  if (entity.meshRenderer) {
    entity.meshRenderer.material.setEmissive('#ffff00', 1.0);
  }

  // Destroy after delay for effect
  timer.setTimeout(() => {
    entity.destroy();
  }, 200);
}

function onUpdate() {
  // Rotate the item
  entity.transform.rotate(0, rotationSpeed * time.deltaTime, 0);

  // Float up and down
  const floatY = startY + Math.sin(time.time * floatSpeed) * floatAmplitude;
  const currentPos = entity.transform.position;
  entity.transform.setPosition(currentPos[0], floatY, currentPos[2]);
}
```

### Turret Enemy

```javascript
const rotationSpeed = 90; // degrees per second
const fireRate = 0.5; // seconds between shots
const detectionRange = 15;
let lastFireTime = 0;
let target = null;

function onUpdate() {
  // Find player
  const players = entities.findByTag('Player');
  const player = players.length > 0 ? players[0] : null;

  if (!player) return;

  // Calculate distance to player
  const myPos = entity.transform.position;
  const playerPos = player.transform.position;
  const distance = math.distance(
    myPos[0],
    myPos[1],
    myPos[2],
    playerPos[0],
    playerPos[1],
    playerPos[2],
  );

  // Check if in range
  if (distance <= detectionRange) {
    target = player;

    // Aim at player
    entity.transform.lookAt(playerPos);

    // Fire if ready
    if (time.time - lastFireTime >= fireRate) {
      fire(playerPos);
      lastFireTime = time.time;
    }
  } else {
    target = null;
  }
}

function fire(targetPos) {
  // Calculate direction to target
  const myPos = entity.transform.position;
  const direction = [targetPos[0] - myPos[0], targetPos[1] - myPos[1], targetPos[2] - myPos[2]];

  // Normalize direction
  const length = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
  direction[0] /= length;
  direction[1] /= length;
  direction[2] /= length;

  // Create projectile
  const projectileId = gameObject.createPrimitive('sphere', {
    transform: {
      position: myPos,
      scale: 0.3,
    },
    physics: {
      body: 'dynamic',
      collider: 'sphere',
      mass: 0.1,
    },
  });

  const projectile = entities.get(projectileId);
  if (projectile && projectile.rigidBody) {
    projectile.rigidBody.setLinearVelocity([
      direction[0] * 20,
      direction[1] * 20,
      direction[2] * 20,
    ]);

    // Color projectile
    if (projectile.meshRenderer) {
      projectile.meshRenderer.material.setColor('#ff0000');
    }

    // Destroy after 3 seconds
    timer.setTimeout(() => {
      gameObject.destroy(projectileId);
    }, 3000);
  }
}
```

## Best Practices

1. **Component Checks**: Always check if components exist before accessing them
2. **Transform Operations**: Use `setPosition/setRotation/setScale` for absolute changes, `translate/rotate` for relative changes
3. **Physics**: Use character controller for player movement, rigid bodies for objects
4. **Performance**: Cache component references if used frequently
5. **Cleanup**: Clean up event listeners in `onDestroy()` to prevent memory leaks
6. **Hierarchy**: Be careful with parent/child relationships when destroying entities

## Error Handling

- Component accessors will be `undefined` if the component doesn't exist
- Always check for `null` returns from `getComponent()`
- Invalid entity operations will be logged but won't crash scripts
- Entity becomes invalid after `destroy()` - avoid further API calls
