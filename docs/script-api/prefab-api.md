# Prefab API

The Prefab API provides functionality for managing prefabs - reusable entity templates that can be instantiated at runtime. It's essential for spawning enemies, items, projectiles, and other game objects dynamically.

## Overview

The Prefab API includes:

- Spawning prefab instances
- Managing entity lifecycle
- Entity activation/deactivation
- Prefab overrides and customization

## Core Methods

### `prefab.spawn(prefabId, overrides)`

Spawn a prefab instance.

**Parameters:**

- `prefabId` (string): ID or path of prefab to spawn
- `overrides` (Record<string, unknown>, optional): Property overrides for the spawned entity

**Returns:**

- `number`: Entity ID of the spawned prefab instance

**Example:**

```javascript
function spawnEnemy() {
  const enemyId = prefab.spawn('enemy_basic', {
    position: [10, 0, 5],
    rotation: [0, 180, 0],
    health: 100,
    speed: 3.0,
  });

  console.log('Spawned enemy with ID:', enemyId);
  return enemyId;
}
```

### `prefab.destroy(entityId)`

Destroy an entity.

**Parameters:**

- `entityId` (number, optional): Entity ID to destroy (defaults to current entity if not specified)

**Example:**

```javascript
function destroyEnemy(enemyId) {
  prefab.destroy(enemyId);
  console.log('Destroyed enemy:', enemyId);
}

function destroySelf() {
  prefab.destroy(); // Destroys current entity
}
```

### `prefab.setActive(entityId, active)`

Set entity active state.

**Parameters:**

- `entityId` (number): Target entity ID
- `active` (boolean): Active state to set

**Example:**

```javascript
function hidePickup(pickupId) {
  prefab.setActive(pickupId, false);
  console.log('Hidden pickup:', pickupId);
}

function showPickup(pickupId) {
  prefab.setActive(pickupId, true);
  console.log('Shown pickup:', pickupId);
}
```

## Complete Examples

### Enemy Spawner System

```javascript
const EnemySpawner = {
  spawnPoints: [
    { position: [10, 0, 10], rotation: [0, 180, 0] },
    { position: [-10, 0, 10], rotation: [0, 180, 0] },
    { position: [0, 0, 15], rotation: [0, 180, 0] },
    { position: [10, 0, -10], rotation: [0, 0, 0] },
    { position: [-10, 0, -10], rotation: [0, 0, 0] },
  ],

  enemyTypes: [
    { prefabId: 'enemy_basic', health: 50, speed: 2.0, score: 10 },
    { prefabId: 'enemy_fast', health: 30, speed: 4.0, score: 20 },
    { prefabId: 'enemy_tank', health: 100, speed: 1.0, score: 50 },
  ],

  activeEnemies: new Map(),
  maxEnemies: 15,
  spawnInterval: 2000, // milliseconds
  lastSpawnTime: 0,
  totalSpawned: 0,
  waveNumber: 1,

  startSpawning() {
    console.log('Enemy spawner started');
    this.scheduleNextWave();
  },

  scheduleNextWave() {
    timer.setTimeout(() => {
      this.spawnWave();
    }, this.spawnInterval);
  },

  spawnWave() {
    const waveSize = Math.min(3 + Math.floor(this.waveNumber / 2), 8);
    console.log(`Spawning wave ${this.waveNumber} with ${waveSize} enemies`);

    for (let i = 0; i < waveSize; i++) {
      timer.setTimeout(() => {
        this.spawnRandomEnemy();
      }, i * 500); // Stagger spawns
    }

    this.waveNumber++;
    this.scheduleNextWave();
  },

  spawnRandomEnemy() {
    if (this.activeEnemies.size >= this.maxEnemies) {
      console.log('Max enemies reached, skipping spawn');
      return null;
    }

    // Choose random spawn point
    const spawnPoint = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];

    // Choose enemy type based on wave
    const enemyType = this.chooseEnemyType();

    // Spawn enemy with overrides
    const enemyId = prefab.spawn(enemyType.prefabId, {
      position: spawnPoint.position,
      rotation: spawnPoint.rotation,
      health: enemyType.health,
      speed: enemyType.speed,
      score: enemyType.score,
      waveNumber: this.waveNumber,
    });

    if (enemyId) {
      this.activeEnemies.set(enemyId, {
        type: enemyType,
        spawnTime: time.time,
        spawnPoint: spawnPoint,
      });

      this.totalSpawned++;
      console.log(`Spawned ${enemyType.prefabId} with ID: ${enemyId}`);

      // Set up enemy death tracking
      this.trackEnemy(enemyId);

      // Emit spawn event
      events.emit('enemy_spawned', {
        enemyId: enemyId,
        enemyType: enemyType,
        position: spawnPoint.position,
      });

      return enemyId;
    }

    return null;
  },

  chooseEnemyType() {
    // Weighted selection based on wave number
    const weights = [
      Math.max(10 - this.waveNumber, 3), // Basic enemies become less common
      Math.min(5 + Math.floor(this.waveNumber / 3), 15), // Fast enemies become more common
      Math.max(1, Math.floor(this.waveNumber / 4)), // Tank enemies appear in later waves
    ];

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return this.enemyTypes[i];
      }
    }

    return this.enemyTypes[0]; // Fallback
  },

  trackEnemy(enemyId) {
    // Listen for enemy death
    const cleanup = events.on('enemy_died', (payload) => {
      if (payload.enemyId === enemyId) {
        this.onEnemyDied(enemyId, payload);
        cleanup(); // Remove listener
      }
    });
  },

  onEnemyDied(enemyId, deathData) {
    const enemyInfo = this.activeEnemies.get(enemyId);
    if (enemyInfo) {
      console.log(`Enemy ${enemyId} died. Type: ${enemyInfo.type.prefabId}`);

      // Award score
      events.emit('score_earned', {
        amount: enemyInfo.type.score,
        enemyType: enemyInfo.type.prefabId,
      });

      // Chance to spawn pickup
      if (Math.random() < 0.3) {
        // 30% chance
        this.spawnPickup(deathData.position);
      }

      // Remove from active enemies
      this.activeEnemies.delete(enemyId);

      // Check for wave completion
      if (this.activeEnemies.size === 0) {
        console.log(`Wave ${this.waveNumber - 1} completed!`);
        events.emit('wave_completed', {
          waveNumber: this.waveNumber - 1,
          totalEnemies: this.totalSpawned,
        });
      }
    }
  },

  spawnPickup(position) {
    const pickupTypes = [
      { prefabId: 'health_pickup', chance: 0.5 },
      { prefabId: 'ammo_pickup', chance: 0.3 },
      { prefabId: 'powerup_pickup', chance: 0.2 },
    ];

    const random = Math.random();
    let cumulativeChance = 0;

    for (const pickupType of pickupTypes) {
      cumulativeChance += pickupType.chance;
      if (random <= cumulativeChance) {
        const pickupId = prefab.spawn(pickupType.prefabId, {
          position: [position[0], position[1] + 1, position[2]],
          rotation: [0, Math.random() * 360, 0],
        });

        console.log(`Spawned pickup: ${pickupType.prefabId}`);
        return pickupId;
      }
    }
  },

  getStats() {
    return {
      activeEnemies: this.activeEnemies.size,
      maxEnemies: this.maxEnemies,
      totalSpawned: this.totalSpawned,
      currentWave: this.waveNumber,
    };
  },

  clearAllEnemies() {
    console.log(`Clearing all ${this.activeEnemies.size} enemies`);
    this.activeEnemies.forEach((enemyInfo, enemyId) => {
      prefab.destroy(enemyId);
    });
    this.activeEnemies.clear();
  },
};

function onStart() {
  // Create spawner UI
  ui.createScreenSurface({
    id: 'spawner-info',
    anchor: 'top-right',
    widgets: [
      {
        id: 'enemies-text',
        kind: 'text',
        props: {
          text: 'Enemies: 0',
          fontSize: 18,
          color: '#ffffff',
        },
      },
      {
        id: 'wave-text',
        kind: 'text',
        props: {
          text: 'Wave: 1',
          fontSize: 18,
          color: '#ffffff',
        },
      },
    ],
  });

  // Start spawning after delay
  timer.setTimeout(() => {
    EnemySpawner.startSpawning();
  }, 3000);
}

function onUpdate() {
  // Update UI
  const stats = EnemySpawner.getStats();
  ui.updateWidget('spawner-info', 'enemies-text', {
    text: `Enemies: ${stats.activeEnemies}/${stats.maxEnemies}`,
  });
  ui.updateWidget('spawner-info', 'wave-text', {
    text: `Wave: ${stats.currentWave}`,
  });
}

// Manual spawn trigger
function onDebugCommand(command) {
  if (command === 'spawn_enemy') {
    EnemySpawner.spawnRandomEnemy();
  } else if (command === 'clear_enemies') {
    EnemySpawner.clearAllEnemies();
  } else if (command === 'next_wave') {
    EnemySpawner.scheduleNextWave();
  }
}
```

### Projectile System

```javascript
const ProjectileSystem = {
  activeProjectiles: new Map(),
  projectileTypes: {
    bullet: {
      prefabId: 'projectile_bullet',
      speed: 30,
      damage: 10,
      lifetime: 3.0,
      size: 0.2,
    },
    rocket: {
      prefabId: 'projectile_rocket',
      speed: 15,
      damage: 50,
      lifetime: 5.0,
      size: 0.5,
      explosionRadius: 3,
    },
    laser: {
      prefabId: 'projectile_laser',
      speed: 100,
      damage: 25,
      lifetime: 1.0,
      size: 0.1,
    },
  },

  fireProjectile(type, origin, direction, owner) {
    const projectileType = this.projectileTypes[type];
    if (!projectileType) {
      console.error(`Unknown projectile type: ${type}`);
      return null;
    }

    // Normalize direction
    const length = math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
    const normalizedDir = [direction[0] / length, direction[1] / length, direction[2] / length];

    // Calculate initial rotation to face direction
    const yaw = Math.atan2(normalizedDir[0], normalizedDir[2]) * (180 / Math.PI);
    const pitch = Math.asin(-normalizedDir[1]) * (180 / Math.PI);

    // Spawn projectile
    const projectileId = prefab.spawn(projectileType.prefabId, {
      position: origin,
      rotation: [pitch, yaw, 0],
      scale: projectileType.size,
      damage: projectileType.damage,
      speed: projectileType.speed,
      lifetime: projectileType.lifetime,
      owner: owner,
      direction: normalizedDir,
      type: type,
    });

    if (projectileId) {
      // Track projectile
      this.activeProjectiles.set(projectileId, {
        type: type,
        owner: owner,
        spawnTime: time.time,
        lastPosition: origin,
        distanceTraveled: 0,
      });

      // Set up physics
      this.setupProjectilePhysics(projectileId, normalizedDir, projectileType);

      // Set up collision detection
      this.setupProjectileCollision(projectileId);

      // Set lifetime cleanup
      timer.setTimeout(() => {
        this.destroyProjectile(projectileId);
      }, projectileType.lifetime * 1000);

      console.log(`Fired ${type} projectile with ID: ${projectileId}`);
      events.emit('projectile_fired', {
        projectileId: projectileId,
        type: type,
        owner: owner,
        origin: origin,
      });

      return projectileId;
    }

    return null;
  },

  setupProjectilePhysics(projectileId, direction, projectileType) {
    const projectile = entities.get(projectileId);
    if (!projectile || !projectile.rigidBody) return;

    // Set initial velocity
    projectile.rigidBody.setLinearVelocity([
      direction[0] * projectileType.speed,
      direction[1] * projectileType.speed,
      direction[2] * projectileType.speed,
    ]);

    // Set physics properties
    projectile.rigidBody.setBodyType('kinematic'); // Projectiles shouldn't be affected by gravity
    projectile.rigidBody.setGravityScale(0);
  },

  setupProjectileCollision(projectileId) {
    const projectile = entities.get(projectileId);
    if (!projectile || !projectile.physicsEvents) return;

    projectile.physicsEvents.onCollisionEnter((otherEntityId) => {
      this.onProjectileHit(projectileId, otherEntityId);
    });

    projectile.physicsEvents.onTriggerEnter((otherEntityId) => {
      this.onProjectileHit(projectileId, otherEntityId);
    });
  },

  onProjectileHit(projectileId, targetId) {
    const projectile = entities.get(projectileId);
    if (!projectile) return;

    const projectileData = projectile.getComponent('ProjectileData');
    if (!projectileData) return;

    // Don't hit owner
    if (projectileData.owner === targetId) return;

    const target = entities.get(targetId);
    if (!target) return;

    // Apply damage to target
    if (target.hasComponent('Health')) {
      const health = target.getComponent('Health');
      const newHealth = Math.max(0, health.current - projectileData.damage);
      target.setComponent('Health', { current: newHealth });

      console.log(`Projectile hit ${target.name} for ${projectileData.damage} damage`);

      // Visual and audio feedback
      this.showHitEffect(target, projectileData.damage);
      audio.play('/sounds/hit.wav', { volume: 0.6 });

      // Emit hit event
      events.emit('projectile_hit', {
        projectileId: projectileId,
        targetId: targetId,
        damage: projectileData.damage,
        owner: projectileData.owner,
      });
    }

    // Special effects for different projectile types
    if (projectileData.type === 'rocket') {
      this.createExplosion(projectile.transform.position, projectileData.explosionRadius || 3);
    }

    // Destroy projectile on hit
    this.destroyProjectile(projectileId);
  },

  createExplosion(position, radius) {
    console.log(`Creating explosion at [${position.join(', ')}] with radius ${radius}`);

    // Visual effect
    for (let i = 0; i < 8; i++) {
      const particleId = prefab.spawn('explosion_particle', {
        position: position,
        scale: math.random() * 2 + 1,
      });

      const particle = entities.get(particleId);
      if (particle && particle.rigidBody) {
        // Random explosion direction
        const direction = [(math.random() - 0.5) * 2, math.random() * 2, (math.random() - 0.5) * 2];

        const speed = math.random() * 10 + 5;
        particle.rigidBody.setLinearVelocity([
          direction[0] * speed,
          direction[1] * speed,
          direction[2] * speed,
        ]);

        // Auto-destroy particle
        timer.setTimeout(() => {
          prefab.destroy(particleId);
        }, 2000);
      }
    }

    // Area damage
    this.applyAreaDamage(position, radius, 30);

    // Sound
    audio.play('/sounds/explosion.wav', { volume: 0.8 });
  },

  applyAreaDamage(origin, radius, damage) {
    const allEntities = query.findByTag('enemy');
    allEntities.push(...query.findByTag('player'));

    allEntities.forEach((entityId) => {
      const target = entities.get(entityId);
      if (!target || !target.isActive()) return;

      const targetPos = target.transform.position;
      const distance = math.distance(
        origin[0],
        origin[1],
        origin[2],
        targetPos[0],
        targetPos[1],
        targetPos[2],
      );

      if (distance <= radius) {
        // Damage falls off with distance
        const damageAmount = damage * (1 - distance / radius);

        if (target.hasComponent('Health')) {
          const health = target.getComponent('Health');
          const newHealth = Math.max(0, health.current - damageAmount);
          target.setComponent('Health', { current: newHealth });

          this.showHitEffect(target, damageAmount);
        }
      }
    });
  },

  showHitEffect(target, damage) {
    if (target.meshRenderer) {
      target.meshRenderer.material.setEmissive('#ff0000', 0.5);
      timer.setTimeout(() => {
        if (target && target.meshRenderer) {
          target.meshRenderer.material.setEmissive('#ffffff', 0);
        }
      }, 100);
    }

    // Damage number
    events.emit('damage_number', {
      position: target.transform.position,
      amount: Math.round(damage),
      color: '#ff0000',
    });
  },

  destroyProjectile(projectileId) {
    const projectile = this.activeProjectiles.get(projectileId);
    if (projectile) {
      console.log(`Destroying projectile ${projectileId}`);
      this.activeProjectiles.delete(projectileId);
    }

    prefab.destroy(projectileId);
  },

  clearAllProjectiles() {
    console.log(`Clearing all ${this.activeProjectiles.size} projectiles`);
    this.activeProjectiles.forEach((projectileInfo, projectileId) => {
      prefab.destroy(projectileId);
    });
    this.activeProjectiles.clear();
  },
};

// Example weapon system using projectile system
function fireWeapon() {
  const myPos = entity.transform.position;
  const forward = entity.transform.forward();

  // Fire from slightly in front of entity
  const fireOrigin = [
    myPos[0] + forward[0] * 0.5,
    myPos[1] + forward[1] * 0.5,
    myPos[2] + forward[2] * 0.5,
  ];

  // Choose projectile type based on weapon
  let projectileType = 'bullet';
  if (input.isKeyDown('shift')) {
    projectileType = 'rocket';
  }

  ProjectileSystem.fireProjectile(projectileType, fireOrigin, forward, entity.id);
}

function onUpdate() {
  if (input.isMouseButtonPressed(0)) {
    fireWeapon();
  }

  // Debug command to clear projectiles
  if (input.isKeyPressed('x')) {
    ProjectileSystem.clearAllProjectiles();
  }
}
```

### Item Pickup System

```javascript
const ItemSystem = {
  itemTypes: {
    health_small: {
      prefabId: 'health_small',
      effect: 'heal',
      value: 25,
      respawnTime: 10,
      rarity: 'common',
    },
    health_large: {
      prefabId: 'health_large',
      effect: 'heal',
      value: 50,
      respawnTime: 15,
      rarity: 'uncommon',
    },
    ammo_pistol: {
      prefabId: 'ammo_pistol',
      effect: 'ammo',
      value: 12,
      respawnTime: 8,
      rarity: 'common',
    },
    ammo_shotgun: {
      prefabId: 'ammo_shotgun',
      effect: 'ammo',
      value: 8,
      respawnTime: 12,
      rarity: 'uncommon',
    },
    powerup_speed: {
      prefabId: 'powerup_speed',
      effect: 'speed',
      value: 2.0,
      respawnTime: 30,
      rarity: 'rare',
      duration: 10,
    },
    powerup_damage: {
      prefabId: 'powerup_damage',
      effect: 'damage',
      value: 2.0,
      respawnTime: 30,
      rarity: 'rare',
      duration: 15,
    },
  },

  spawnPoints: [
    { position: [5, 0, 0], type: 'health_small' },
    { position: [-5, 0, 0], type: 'ammo_pistol' },
    { position: [0, 0, 5], type: 'health_large' },
    { position: [0, 0, -5], type: 'ammo_shotgun' },
    { position: [10, 0, 10], type: 'powerup_speed' },
    { position: [-10, 0, -10], type: 'powerup_damage' },
  ],

  spawnedItems: new Map(),

  initializeSpawnPoints() {
    this.spawnPoints.forEach((spawnPoint, index) => {
      this.spawnItemAtPoint(spawnPoint, index);
    });
  },

  spawnItemAtPoint(spawnPoint, pointIndex) {
    const itemType = this.itemTypes[spawnPoint.type];
    if (!itemType) return;

    const itemId = prefab.spawn(itemType.prefabId, {
      position: spawnPoint.position,
      rotation: [0, Math.random() * 360, 0],
      itemType: spawnPoint.type,
      value: itemType.value,
      respawnTime: itemType.respawnTime,
      pointIndex: pointIndex,
    });

    if (itemId) {
      this.spawnedItems.set(itemId, {
        type: spawnPoint.type,
        pointIndex: pointIndex,
        spawnTime: time.time,
        collected: false,
      });

      // Setup pickup detection
      this.setupPickupDetection(itemId);

      console.log(`Spawned ${spawnPoint.type} at point ${pointIndex}`);
      return itemId;
    }

    return null;
  },

  setupPickupDetection(itemId) {
    const item = entities.get(itemId);
    if (!item || !item.physicsEvents) return;

    item.physicsEvents.onTriggerEnter((otherEntityId) => {
      this.onPickupCollected(itemId, otherEntityId);
    });
  },

  onPickupCollected(itemId, collectorId) {
    const itemInfo = this.spawnedItems.get(itemId);
    if (!itemInfo || itemInfo.collected) return;

    const collector = entities.get(collectorId);
    if (!collector || !collector.hasComponent('PlayerTag')) return; // Only players can collect

    const itemType = this.itemTypes[itemInfo.type];
    if (!itemType) return;

    console.log(`Item ${itemInfo.type} collected by player ${collectorId}`);

    // Apply item effect
    this.applyItemEffect(collector, itemType);

    // Visual and audio feedback
    this.showPickupEffect(itemId, itemType);
    audio.play('/sounds/pickup.wav', { volume: 0.6 });

    // Mark as collected and hide
    itemInfo.collected = true;
    itemInfo.collectedBy = collectorId;
    itemInfo.collectTime = time.time;
    prefab.setActive(itemId, false);

    // Emit pickup event
    events.emit('item_collected', {
      itemId: itemId,
      itemType: itemInfo.type,
      collectorId: collectorId,
      value: itemType.value,
    });

    // Schedule respawn
    this.scheduleRespawn(itemId, itemType.respawnTime);
  },

  applyItemEffect(collector, itemType) {
    switch (itemType.effect) {
      case 'heal':
        this.applyHeal(collector, itemType.value);
        break;
      case 'ammo':
        this.applyAmmo(collector, itemType.value);
        break;
      case 'speed':
        this.applyPowerup(collector, 'speed', itemType.value, itemType.duration);
        break;
      case 'damage':
        this.applyPowerup(collector, 'damage', itemType.value, itemType.duration);
        break;
    }
  },

  applyHeal(player, amount) {
    if (player.hasComponent('Health')) {
      const health = player.getComponent('Health');
      const newHealth = Math.min(health.max, health.current + amount);
      player.setComponent('Health', { current: newHealth });

      console.log(`Player healed for ${amount} HP`);
      events.emit('player_healed', { amount: amount, newHealth: newHealth });

      // Visual effect
      this.showHealthEffect(player, amount);
    }
  },

  applyAmmo(player, amount) {
    // This would interface with the player's weapon system
    console.log(`Player gained ${amount} ammo`);
    events.emit('ammo_collected', { amount: amount });

    // Visual effect
    this.showAmmoEffect(player, amount);
  },

  applyPowerup(player, powerupType, value, duration) {
    console.log(`Player gained ${powerupType} powerup: ${value}x for ${duration}s`);

    // Store powerup on player
    const existingPowerups = player.getComponent('Powerups') || {};
    existingPowerups[powerupType] = {
      value: value,
      endTime: time.time + duration,
    };
    player.setComponent('Powerups', existingPowerups);

    // Apply immediate effect
    switch (powerupType) {
      case 'speed':
        if (player.rigidBody) {
          player.rigidBody.setGravityScale(0.5); // Example speed effect
        }
        if (player.meshRenderer) {
          player.meshRenderer.material.setColor('#00ffff');
        }
        break;
      case 'damage':
        // Would interface with weapon system
        if (player.meshRenderer) {
          player.meshRenderer.material.setColor('#ff0000');
        }
        break;
    }

    // Schedule powerup removal
    timer.setTimeout(() => {
      this.removePowerup(player, powerupType);
    }, duration * 1000);

    // Visual effect
    this.showPowerupEffect(player, powerupType);
    events.emit('powerup_collected', {
      powerupType: powerupType,
      value: value,
      duration: duration,
    });
  },

  removePowerup(player, powerupType) {
    console.log(`Player ${powerupType} powerup expired`);

    const powerups = player.getComponent('Powerups') || {};
    delete powerups[powerupType];
    player.setComponent('Powerups', powerups);

    // Remove visual effects
    switch (powerupType) {
      case 'speed':
        if (player.rigidBody) {
          player.rigidBody.setGravityScale(1.0);
        }
        break;
      case 'damage':
        // Would reset damage multiplier
        break;
    }

    if (player.meshRenderer) {
      player.meshRenderer.material.setColor('#ffffff');
    }

    events.emit('powerup_expired', { powerupType: powerupType });
  },

  showPickupEffect(itemId, itemType) {
    const item = entities.get(itemId);
    if (!item) return;

    // Create collection particles
    for (let i = 0; i < 10; i++) {
      const particleId = prefab.spawn('pickup_particle', {
        position: item.transform.position,
        scale: 0.1,
      });

      const particle = entities.get(particleId);
      if (particle && particle.rigidBody) {
        // Random particle movement
        particle.rigidBody.setLinearVelocity([
          (math.random() - 0.5) * 5,
          math.random() * 3,
          (math.random() - 0.5) * 5,
        ]);

        // Auto-destroy
        timer.setTimeout(() => {
          prefab.destroy(particleId);
        }, 1000);
      }
    }
  },

  showHealthEffect(player, amount) {
    // Green glow for healing
    if (player.meshRenderer) {
      player.meshRenderer.material.setEmissive('#00ff00', 0.5);
      timer.setTimeout(() => {
        if (player && player.meshRenderer) {
          player.meshRenderer.material.setEmissive('#ffffff', 0);
        }
      }, 500);
    }

    // Floating text
    events.emit('damage_number', {
      position: player.transform.position,
      amount: `+${amount}`,
      color: '#00ff00',
    });
  },

  showAmmoEffect(player, amount) {
    // Blue glow for ammo
    if (player.meshRenderer) {
      player.meshRenderer.material.setEmissive('#0088ff', 0.5);
      timer.setTimeout(() => {
        if (player && player.meshRenderer) {
          player.meshRenderer.material.setEmissive('#ffffff', 0);
        }
      }, 500);
    }
  },

  showPowerupEffect(player, powerupType) {
    const colors = {
      speed: '#00ffff',
      damage: '#ff00ff',
    };

    if (player.meshRenderer && colors[powerupType]) {
      player.meshRenderer.material.setEmissive(colors[powerupType], 0.8);
      timer.setTimeout(() => {
        if (player && player.meshRenderer) {
          player.meshRenderer.material.setEmissive(colors[powerupType], 0.3);
        }
      }, 1000);
    }
  },

  scheduleRespawn(itemId, respawnTime) {
    timer.setTimeout(() => {
      this.respawnItem(itemId);
    }, respawnTime * 1000);
  },

  respawnItem(itemId) {
    const itemInfo = this.spawnedItems.get(itemId);
    if (!itemInfo) return;

    const spawnPoint = this.spawnPoints[itemInfo.pointIndex];
    if (!spawnPoint) return;

    // Respawn at original location
    prefab.setActive(itemId, true);
    const item = entities.get(itemId);
    if (item) {
      item.transform.setPosition(...spawnPoint.position);
      item.transform.setRotation(0, Math.random() * 360, 0);
    }

    // Reset item info
    itemInfo.collected = false;
    itemInfo.collectedBy = null;
    itemInfo.spawnTime = time.time;

    console.log(`Respawned ${spawnPoint.type} at point ${itemInfo.pointIndex}`);
    events.emit('item_respawned', {
      itemId: itemId,
      itemType: spawnPoint.type,
      pointIndex: itemInfo.pointIndex,
    });
  },

  getStats() {
    const stats = {
      totalItems: this.spawnedItems.size,
      collectedItems: 0,
      availableItems: 0,
    };

    this.spawnedItems.forEach((itemInfo) => {
      if (itemInfo.collected) {
        stats.collectedItems++;
      } else {
        stats.availableItems++;
      }
    });

    return stats;
  },
};

function onStart() {
  // Initialize all spawn points
  timer.setTimeout(() => {
    ItemSystem.initializeSpawnPoints();
  }, 1000);

  // Create UI for item status
  ui.createScreenSurface({
    id: 'item-status',
    anchor: 'bottom-left',
    widgets: [
      {
        id: 'item-text',
        kind: 'text',
        props: {
          text: 'Items: 0/0',
          fontSize: 16,
          color: '#ffffff',
        },
      },
    ],
  });
}

function onUpdate() {
  // Update UI
  const stats = ItemSystem.getStats();
  ui.updateWidget('item-status', 'item-text', {
    text: `Items: ${stats.availableItems}/${stats.totalItems}`,
  });
}
```

## Best Practices

1. **Memory Management**: Always clean up prefabs when no longer needed
2. **Performance**: Limit the number of active prefabs at once
3. **Tracking**: Keep track of spawned entities for later management
4. **Validation**: Verify prefab IDs exist before spawning
5. **Pooling**: Consider object pooling for frequently spawned/destroyed items

## Prefab Naming Conventions

- Use descriptive names: `enemy_basic`, `weapon_pistol`, `health_small`
- Group related prefabs with prefixes: `projectile_`, `pickup_`, `effect_`
- Include size or strength indicators: `small`, `large`, `light`, `heavy`

## Error Handling

- Invalid prefab IDs will return null
- Missing overrides will use default values
- Entity destruction is safe even if entity doesn't exist
- Always verify spawned entity existence before use
