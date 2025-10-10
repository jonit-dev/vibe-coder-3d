/**
 * GameObject CRUD Demo Script
 * Demonstrates creating, modifying, and destroying entities at runtime
 *
 * Usage:
 * 1. Attach this script to any entity
 * 2. Enter play mode
 * 3. Entities will be created and animated
 * 4. Press 'X' to destroy spawned entities
 * 5. Press 'C' to clone entities
 * 6. Press 'P' to spawn primitives in a grid
 */

// Track spawned entities for cleanup
let spawnedEntities: number[] = [];
let clonedEntities: number[] = [];

function onStart() {
  console.log('=== GameObject CRUD Demo Started ===');

  // Example 1: Create a simple cube with physics
  const cubeId = gameObject.createPrimitive('cube', {
    name: 'DynamicCube',
    transform: { position: [0, 5, 0], scale: 1.2 },
    material: { color: '#44ccff', roughness: 0.6 },
    physics: { body: 'dynamic', collider: 'box', mass: 1 },
  });
  spawnedEntities.push(cubeId);
  console.log('Created dynamic cube:', cubeId);

  // Example 2: Create a sphere as a child of current entity
  const sphereId = gameObject.createPrimitive('sphere', {
    name: 'ChildSphere',
    parent: entity.id,
    transform: { position: [3, 2, 0], scale: 0.8 },
    material: { color: '#ff6644', metalness: 0.8, roughness: 0.2 },
    physics: { body: 'dynamic', collider: 'sphere', mass: 0.5 },
  });
  spawnedEntities.push(sphereId);
  console.log('Created child sphere:', sphereId);

  // Example 3: Create a static plane as a platform
  const planeId = gameObject.createPrimitive('plane', {
    name: 'Platform',
    transform: { position: [0, -2, 0], scale: [5, 1, 5] },
    material: { color: '#88cc44', roughness: 0.9 },
    physics: { body: 'static', collider: 'box' },
  });
  spawnedEntities.push(planeId);
  console.log('Created platform:', planeId);

  // Example 4: Create an empty entity and attach components
  const lightEntity = gameObject.createEntity('DynamicLight', entity.id);
  gameObject.attachComponents(lightEntity, [
    {
      type: 'Light',
      data: {
        lightType: 'point',
        color: '#ffffff',
        intensity: 1.5,
        castShadows: true,
      },
    },
    {
      type: 'Transform',
      data: {
        position: [0, 3, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    },
  ]);
  spawnedEntities.push(lightEntity);
  console.log('Created light entity:', lightEntity);

  console.log(`Total spawned entities: ${spawnedEntities.length}`);
}

function onUpdate(deltaTime: number) {
  // Animate the light entity in a circle
  if (spawnedEntities.length >= 4) {
    const lightId = spawnedEntities[3];
    const lightEntity = entities.get(lightId);

    if (lightEntity) {
      const t = time.time;
      const radius = 4;
      const x = math.cos(t) * radius;
      const z = math.sin(t) * radius;
      lightEntity.transform.setPosition(x, 3, z);
    }
  }

  // Press X to destroy all spawned entities
  if (input.isKeyPressed('x')) {
    console.log('Destroying spawned entities...');
    spawnedEntities.forEach((id) => {
      if (entities.exists(id)) {
        gameObject.destroy(id);
        console.log('Destroyed entity:', id);
      }
    });
    spawnedEntities = [];
    clonedEntities = [];
    console.log('All spawned entities destroyed');
  }

  // Press C to clone the first cube
  if (input.isKeyPressed('c') && spawnedEntities.length > 0) {
    const originalId = spawnedEntities[0];
    if (entities.exists(originalId)) {
      const cloneId = gameObject.clone(originalId, {
        name: 'CubeClone',
        transform: {
          position: [math.random() * 4 - 2, 5, math.random() * 4 - 2],
        },
      });
      clonedEntities.push(cloneId);
      console.log('Cloned cube:', cloneId);
    }
  }

  // Press P to spawn a grid of primitives
  if (input.isKeyPressed('p')) {
    console.log('Spawning primitive grid...');
    const primitives: ('cube' | 'sphere' | 'cylinder')[] = ['cube', 'sphere', 'cylinder'];
    const colors = ['#ff4444', '#44ff44', '#4444ff'];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const kind = primitives[(i + j) % 3];
        const color = colors[(i + j) % 3];

        const id = gameObject.createPrimitive(kind, {
          name: `Grid_${kind}_${i}_${j}`,
          transform: {
            position: [i * 2 - 2, 3, j * 2 - 2],
            scale: 0.6,
          },
          material: { color, roughness: 0.5 },
          physics: { body: 'dynamic', collider: kind === 'sphere' ? 'sphere' : 'box', mass: 0.5 },
        });

        spawnedEntities.push(id);
      }
    }
    console.log(`Spawned ${3 * 3} primitives in grid`);
  }
}

function onDestroy() {
  console.log('=== GameObject CRUD Demo Stopped ===');
  console.log(`Cleaning up ${spawnedEntities.length} entities...`);

  // Clean up all spawned entities
  spawnedEntities.forEach((id) => {
    if (entities.exists(id)) {
      gameObject.destroy(id);
    }
  });

  console.log('Demo cleanup complete');
}
