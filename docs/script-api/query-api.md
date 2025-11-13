# Query API

The Query API provides tools for finding entities and performing spatial queries in your game. It's essential for implementing features like targeting systems, collision detection, line-of-sight checks, and area-of-effect abilities.

## Overview

The Query API includes:

- Finding entities by tags
- Raycasting for line-of-sight and shooting
- Spatial queries for area detection
- Hit result processing

## Core Methods

### `query.findByTag(tag)`

Find all entities with a specific tag.

**Parameters:**

- `tag` (string): Tag to search for

**Returns:**

- `number[]`: Array of entity IDs

**Example:**

```javascript
function onUpdate() {
  // Find all enemies
  const enemies = query.findByTag('enemy');
  console.log(`Found ${enemies.length} enemies`);

  // Find all powerups
  const powerups = query.findByTag('powerup');
  powerups.forEach((powerupId) => {
    const powerup = entities.get(powerupId);
    if (powerup) {
      console.log('Powerup found:', powerup.name);
    }
  });
}
```

### `query.raycastFirst(origin, dir)`

Perform raycast and get first hit.

**Parameters:**

- `origin` ([number, number, number]): Ray origin position
- `dir` ([number, number, number]): Ray direction (should be normalized)

**Returns:**

- `unknown | null`: First hit result or null if no hit

**Example:**

```javascript
function shoot() {
  const camera = entities.findByTag('MainCamera')[0];
  if (!camera) return;

  const cameraPos = camera.transform.position;
  const forward = camera.transform.forward();

  const hit = query.raycastFirst(cameraPos, forward);

  if (hit) {
    const target = entities.get(hit.entityId);
    console.log('Hit:', target.name);
    applyDamage(hit.entityId, 10);
  } else {
    console.log('No hit');
  }
}
```

### `query.raycastAll(origin, dir)`

Perform raycast and get all hits.

**Parameters:**

- `origin` ([number, number, number]): Ray origin position
- `dir` ([number, number, number]): Ray direction (should be normalized)

**Returns:**

- `unknown[]`: Array of hit results (sorted by distance)

**Example:**

```javascript
function scanEnemies() {
  const myPos = entity.transform.position;
  const forward = entity.transform.forward();

  const hits = query.raycastAll(myPos, forward);

  hits.forEach((hit) => {
    const target = entities.get(hit.entityId);
    if (target && target.hasComponent('Health')) {
      console.log(`Enemy detected at distance: ${hit.distance}`);
      markAsTarget(hit.entityId);
    }
  });
}
```

## Complete Examples

### Targeting System

```javascript
const TargetingSystem = {
  maxTargetRange: 50,
  currentTarget: null,
  enemiesInSight: [],

  updateTargeting() {
    this.enemiesInSight = this.findVisibleEnemies();

    if (this.currentTarget) {
      // Check if current target is still valid
      if (!this.isValidTarget(this.currentTarget)) {
        this.currentTarget = null;
      }
    }

    // Auto-target closest enemy if no current target
    if (!this.currentTarget && this.enemiesInSight.length > 0) {
      this.currentTarget = this.getClosestEnemy();
    }

    this.updateTargetUI();
  },

  findVisibleEnemies() {
    const allEnemies = query.findByTag('enemy');
    const visibleEnemies = [];
    const myPos = entity.transform.position;

    allEnemies.forEach((enemyId) => {
      const enemy = entities.get(enemyId);
      if (!enemy || !enemy.isActive()) return;

      const enemyPos = enemy.transform.position;
      const distance = math.distance(
        myPos[0],
        myPos[1],
        myPos[2],
        enemyPos[0],
        enemyPos[1],
        enemyPos[2],
      );

      if (distance <= this.maxTargetRange) {
        // Check line of sight
        if (this.hasLineOfSight(myPos, enemyPos)) {
          visibleEnemies.push({
            id: enemyId,
            entity: enemy,
            distance: distance,
          });
        }
      }
    });

    // Sort by distance
    visibleEnemies.sort((a, b) => a.distance - b.distance);
    return visibleEnemies;
  },

  hasLineOfSight(from, to) {
    const direction = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];

    // Normalize direction
    const length = math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
    direction[0] /= length;
    direction[1] /= length;
    direction[2] /= length;

    const hit = query.raycastFirst(from, direction);

    if (!hit) return true;

    // Check if hit is our target
    const targetDistance = math.distance(from[0], from[1], from[2], to[0], to[1], to[2]);
    return hit.distance >= targetDistance - 0.1; // Small tolerance
  },

  isValidTarget(targetId) {
    const target = entities.get(targetId);
    if (!target || !target.isActive()) return false;

    // Check if still an enemy (might have changed teams)
    if (!target.hasComponent('EnemyTag')) return false;

    // Check range
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

    return distance <= this.maxTargetRange;
  },

  getClosestEnemy() {
    if (this.enemiesInSight.length === 0) return null;
    return this.enemiesInSight[0].id;
  },

  switchTarget(direction = 1) {
    if (this.enemiesInSight.length <= 1) return;

    let currentIndex = -1;
    if (this.currentTarget) {
      currentIndex = this.enemiesInSight.findIndex((enemy) => enemy.id === this.currentTarget);
    }

    const newIndex =
      (currentIndex + direction + this.enemiesInSight.length) % this.enemiesInSight.length;
    this.currentTarget = this.enemiesInSight[newIndex].id;
    console.log('Switched to target:', entities.get(this.currentTarget).name);
  },

  updateTargetUI() {
    // Update target reticle
    if (this.currentTarget) {
      const target = entities.get(this.currentTarget);
      const targetPos = target.transform.position;

      ui.createWorldSurface({
        id: 'target-reticle',
        world: {
          followEntityId: this.currentTarget,
          offset: [0, 1, 0],
          billboard: true,
        },
        widgets: [
          {
            id: 'reticle',
            kind: 'text',
            props: {
              text: '⭕',
              fontSize: 24,
              color: '#ff0000',
            },
          },
        ],
      });
    } else {
      ui.destroySurface('target-reticle');
    }

    // Update enemy count
    ui.updateWidget('hud', 'enemy-count', {
      text: `Enemies: ${this.enemiesInSight.length}`,
    });
  },
};

function onUpdate() {
  TargetingSystem.updateTargeting();

  // Target switching controls
  if (input.isKeyPressed('tab')) {
    TargetingSystem.switchTarget(1);
  }

  if (input.isKeyPressed('shift') + input.isKeyPressed('tab')) {
    TargetingSystem.switchTarget(-1);
  }

  // Fire at current target
  if (input.isMouseButtonPressed(0) && TargetingSystem.currentTarget) {
    fireAtTarget(TargetingSystem.currentTarget);
  }
}

function fireAtTarget(targetId) {
  const target = entities.get(targetId);
  const myPos = entity.transform.position;
  const targetPos = target.transform.position;

  // Calculate direction to target
  const direction = [targetPos[0] - myPos[0], targetPos[1] - myPos[1], targetPos[2] - myPos[2]];

  // Normalize
  const length = math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
  direction[0] /= length;
  direction[1] /= length;
  direction[2] /= length;

  // Create projectile
  const projectileId = gameObject.createPrimitive('sphere', {
    transform: {
      position: myPos,
      scale: 0.2,
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
      direction[0] * 30,
      direction[1] * 30,
      direction[2] * 30,
    ]);

    // Store target info for hit detection
    projectile.setComponent('Projectile', {
      targetId: targetId,
      damage: 25,
    });
  }

  console.log('Fired at target:', target.name);
}
```

### Area of Effect System

```javascript
const AOESystem = {
  effects: new Map(),

  createAOE(origin, radius, damage, effectType = 'explosion') {
    const aoeId = `aoe_${Date.now()}_${Math.random()}`;

    const aoe = {
      id: aoeId,
      origin: origin,
      radius: radius,
      damage: damage,
      effectType: effectType,
      startTime: time.time,
      duration: effectType === 'explosion' ? 0.5 : 3.0,
      affectedTargets: new Set(),
    };

    this.effects.set(aoeId, aoe);

    // Create visual effect
    this.createAOEVisual(aoe);

    // Apply immediate damage for explosions
    if (effectType === 'explosion') {
      this.applyAOEDamage(aoe);
    } else {
      // Set up continuous damage for persistent effects
      aoe.damageInterval = timer.setInterval(() => {
        this.applyAOEDamage(aoe);
      }, 1000);
    }

    // Clean up after duration
    timer.setTimeout(() => {
      this.destroyAOE(aoeId);
    }, aoe.duration * 1000);

    console.log(`Created ${effectType} AOE at ${origin}, radius: ${radius}`);
    return aoeId;
  },

  applyAOEDamage(aoe) {
    const allTargets = this.findTargetsInRadius(aoe.origin, aoe.radius);

    allTargets.forEach((targetId) => {
      if (aoe.affectedTargets.has(targetId)) return; // Already affected

      const target = entities.get(targetId);
      if (!target || !target.isActive()) return;

      // Apply damage based on effect type
      let damageAmount = aoe.damage;

      if (aoe.effectType === 'poison_cloud') {
        damageAmount = 5; // Lower but continuous damage
      } else if (aoe.effectType === 'heal_aura') {
        damageAmount = -10; // Negative damage = healing
      }

      if (target.hasComponent('Health')) {
        const health = target.getComponent('Health');
        const newHealth = Math.max(0, Math.min(health.max, health.current - damageAmount));

        target.setComponent('Health', { current: newHealth });

        // Visual feedback
        this.showHitEffect(target, damageAmount);

        // Mark as affected
        aoe.affectedTargets.add(targetId);

        events.emit('aoe_damage', {
          aoeId: aoe.id,
          targetId: targetId,
          damage: damageAmount,
        });
      }
    });
  },

  findTargetsInRadius(origin, radius) {
    // Get all potential targets (enemies and player for different effects)
    const enemies = query.findByTag('enemy');
    const players = query.findByTag('player');
    const allTargets = [...enemies, ...players];

    const targetsInRadius = [];

    allTargets.forEach((targetId) => {
      const target = entities.get(targetId);
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
        targetsInRadius.push(targetId);
      }
    });

    return targetsInRadius;
  },

  createAOEVisual(aoe) {
    if (aoe.effectType === 'explosion') {
      // Create explosion effect
      this.createExplosionVisual(aoe);
    } else {
      // Create persistent area visual
      const visualId = gameObject.createPrimitive('cylinder', {
        transform: {
          position: [aoe.origin[0], aoe.origin[1] + 0.01, aoe.origin[2]],
          scale: [aoe.radius * 2, 0.02, aoe.radius * 2],
        },
      });

      const visual = entities.get(visualId);
      if (visual && visual.meshRenderer) {
        switch (aoe.effectType) {
          case 'poison_cloud':
            visual.meshRenderer.material.setColor('#00ff00');
            visual.meshRenderer.material.setEmissive('#00ff00', 0.3);
            break;
          case 'heal_aura':
            visual.meshRenderer.material.setColor('#ffff00');
            visual.meshRenderer.material.setEmissive('#ffff00', 0.3);
            break;
          case 'fire_field':
            visual.meshRenderer.material.setColor('#ff6600');
            visual.meshRenderer.material.setEmissive('#ff6600', 0.5);
            break;
        }
      }

      aoe.visualId = visualId;
    }
  },

  createExplosionVisual(aoe) {
    // Create multiple spheres for explosion effect
    for (let i = 0; i < 5; i++) {
      const offset = [(math.random() - 0.5) * 2, math.random() * 2, (math.random() - 0.5) * 2];

      const particleId = gameObject.createPrimitive('sphere', {
        transform: {
          position: [
            aoe.origin[0] + offset[0],
            aoe.origin[1] + offset[1],
            aoe.origin[2] + offset[2],
          ],
          scale: math.random() * 2 + 1,
        },
      });

      const particle = entities.get(particleId);
      if (particle && particle.meshRenderer) {
        particle.meshRenderer.material.setColor('#ff6600');
        particle.meshRenderer.material.setEmissive('#ff6600', 1.0);
      }

      // Animate and destroy particle
      timer.setTimeout(() => {
        if (particle) {
          particle.setActive(false);
          gameObject.destroy(particleId);
        }
      }, 500);
    }

    // Play explosion sound
    audio.play('/sounds/explosion.wav', {
      volume: 0.8,
    });
  },

  showHitEffect(target, damage) {
    const isHealing = damage < 0;
    const color = isHealing ? '#00ff00' : '#ff0000';

    // Flash effect
    if (target.meshRenderer) {
      target.meshRenderer.material.setEmissive(color, 0.5);
      timer.setTimeout(() => {
        if (target && target.meshRenderer) {
          target.meshRenderer.material.setEmissive('#ffffff', 0);
        }
      }, 200);
    }

    // Damage number
    events.emit('damage_number', {
      position: target.transform.position,
      amount: Math.abs(damage),
      color: color,
    });
  },

  destroyAOE(aoeId) {
    const aoe = this.effects.get(aoeId);
    if (!aoe) return;

    // Clean up interval
    if (aoe.damageInterval) {
      timer.clearInterval(aoe.damageInterval);
    }

    // Clean up visual
    if (aoe.visualId) {
      gameObject.destroy(aoe.visualId);
    }

    this.effects.delete(aoeId);
    console.log(`Destroyed AOE: ${aoeId}`);
  },
};

// Example usage in weapon script
function launchGrenade() {
  const myPos = entity.transform.position;
  const forward = entity.transform.forward();

  // Create grenade projectile
  const grenadeId = gameObject.createPrimitive('sphere', {
    transform: {
      position: myPos,
      scale: 0.3,
    },
    physics: {
      body: 'dynamic',
      collider: 'sphere',
      mass: 1.0,
    },
  });

  const grenade = entities.get(grenadeId);
  if (grenade && grenade.rigidBody) {
    grenade.rigidBody.setLinearVelocity([
      forward[0] * 20,
      forward[1] * 20 + 5, // Arc trajectory
      forward[2] * 20,
    ]);

    // Store explosion data
    grenade.setComponent('Grenade', {
      damage: 50,
      radius: 5,
      fuseTime: 2.0,
    });

    // Set up collision detection for grenade
    if (grenade.physicsEvents) {
      grenade.physicsEvents.onCollisionEnter(() => {
        explodeGrenade(grenadeId);
      });
    }

    // Explode after fuse time
    timer.setTimeout(() => {
      explodeGrenade(grenadeId);
    }, 2000);
  }
}

function explodeGrenade(grenadeId) {
  const grenade = entities.get(grenadeId);
  if (!grenade) return;

  const grenadeData = grenade.getComponent('Grenade');
  if (!grenadeData) return;

  const position = grenade.transform.position;

  // Create explosion AOE
  AOESystem.createAOE(position, grenadeData.radius, grenadeData.damage, 'explosion');

  // Remove grenade
  gameObject.destroy(grenadeId);
}
```

### Detection and Awareness System

```javascript
const AwarenessSystem = {
  detectionRadius: 15,
  alertRadius: 8,
  alertDecayTime: 5.0,
  alertLevel: 0,

  knownThreats: new Map(),
  lastSeenPositions: new Map(),

  update() {
    this.detectThreats();
    this.updateAlertLevel();
    this.reactToThreats();
  },

  detectThreats() {
    const myPos = entity.transform.position;
    const threats = query.findByTag('player');

    threats.forEach((threatId) => {
      const threat = entities.get(threatId);
      if (!threat || !threat.isActive()) return;

      const threatPos = threat.transform.position;
      const distance = math.distance(
        myPos[0],
        myPos[1],
        myPos[2],
        threatPos[0],
        threatPos[1],
        threatPos[2],
      );

      if (distance <= this.detectionRadius) {
        if (this.hasLineOfSight(myPos, threatPos)) {
          this.registerThreat(threatId, threatPos, distance);
        }
      }
    });
  },

  registerThreat(threatId, position, distance) {
    const threat = {
      id: threatId,
      lastSeen: time.time,
      lastPosition: position,
      lastDistance: distance,
      detectionCount: (this.knownThreats.get(threatId)?.detectionCount || 0) + 1,
    };

    this.knownThreats.set(threatId, threat);
    this.lastSeenPositions.set(threatId, position);

    // Increase alert level
    this.alertLevel = Math.min(1.0, this.alertLevel + 0.2);

    console.log(`Threat detected: ${threatId} at distance ${distance.toFixed(1)}`);
    events.emit('threat_detected', { threatId, position, distance });
  },

  hasLineOfSight(from, to) {
    const direction = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];

    // Normalize direction
    const length = math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
    direction[0] /= length;
    direction[1] /= length;
    direction[2] /= length;

    const hit = query.raycastFirst(from, direction);

    if (!hit) return true;

    const targetDistance = math.distance(from[0], from[1], from[2], to[0], to[1], to[2]);
    return hit.distance >= targetDistance - 0.1;
  },

  updateAlertLevel() {
    // Decay alert level over time
    if (this.alertLevel > 0) {
      this.alertLevel = Math.max(0, this.alertLevel - time.deltaTime / this.alertDecayTime);
    }

    // Remove old threats
    const currentTime = time.time;
    this.knownThreats.forEach((threat, threatId) => {
      if (currentTime - threat.lastSeen > this.alertDecayTime) {
        this.knownThreats.delete(threatId);
        this.lastSeenPositions.delete(threatId);
        console.log(`Threat lost: ${threatId}`);
      }
    });
  },

  reactToThreats() {
    if (this.knownThreats.size === 0) {
      // No threats - patrol behavior
      this.patrol();
      return;
    }

    // Find closest threat
    let closestThreat = null;
    let closestDistance = Infinity;

    this.knownThreats.forEach((threat) => {
      if (threat.lastDistance < closestDistance) {
        closestDistance = threat.lastDistance;
        closestThreat = threat;
      }
    });

    if (closestThreat) {
      this.engageThreat(closestThreat);
    }
  },

  engageThreat(threat) {
    const threatEntity = entities.get(threat.id);
    if (!threatEntity) return;

    const myPos = entity.transform.position;
    const threatPos = threatEntity.transform.position;

    // Look at threat
    entity.transform.lookAt(threatPos);

    // Move towards threat if far away
    if (threat.lastDistance > this.alertRadius) {
      const direction = [
        threatPos[0] - myPos[0],
        0, // Keep on same Y level
        threatPos[2] - myPos[2],
      ];

      // Normalize and move
      const length = math.sqrt(direction[0] ** 2 + direction[2] ** 2);
      direction[0] /= length;
      direction[2] /= length;

      const moveSpeed = 3.0 * this.alertLevel; // Move faster when more alert
      entity.transform.translate(
        direction[0] * moveSpeed * time.deltaTime,
        0,
        direction[2] * moveSpeed * time.deltaTime,
      );
    }

    // Attack if in range
    if (threat.lastDistance <= this.alertRadius) {
      this.attack(threat.id);
    }

    // Update alert visuals
    this.updateAlertVisuals();
  },

  patrol() {
    // Simple patrol behavior when no threats
    entity.transform.rotate(0, 30 * time.deltaTime, 0);
    entity.transform.translate(0, 0, -1.5 * time.deltaTime);
  },

  attack(threatId) {
    // Attack cooldown
    if (this.lastAttackTime && time.time - this.lastAttackTime < 1.0) return;

    this.lastAttackTime = time.time;

    // Perform attack
    console.log(`Attacking threat ${threatId}`);
    events.emit('enemy_attack', { attackerId: entity.id, targetId: threatId });

    // Visual effect
    if (entity.meshRenderer) {
      entity.meshRenderer.material.setEmissive('#ff0000', 0.8);
      timer.setTimeout(() => {
        if (entity && entity.meshRenderer) {
          entity.meshRenderer.material.setEmissive('#ffffff', 0);
        }
      }, 200);
    }
  },

  updateAlertVisuals() {
    if (entity.meshRenderer) {
      const alertColor = [
        1.0,
        1.0 - this.alertLevel * 0.5, // Red increases with alert
        1.0 - this.alertLevel * 0.5, // Blue decreases with alert
      ];

      entity.meshRenderer.material.setColor(alertColor[0], alertColor[1], alertColor[2]);
      entity.meshRenderer.material.setEmissive('#ff0000', this.alertLevel * 0.3);
    }
  },
};

function onUpdate() {
  AwarenessSystem.update();
}
```

## Best Practices

1. **Performance**: Limit raycast frequency in update loops
2. **Normalization**: Always normalize direction vectors for raycasts
3. **Hit Validation**: Verify hit results before using them
4. **Caching**: Cache query results when used multiple times per frame
5. **Distance Checks**: Use simple distance checks before expensive raycasts

## Query Optimization

### Spatial Partitioning

```javascript
// Instead of checking all entities, divide space into regions
function findNearbyEntities(position, radius) {
  const region = getRegion(position);
  return region.entities.filter((entity) => {
    const distance = math.distance(/* ... */);
    return distance <= radius;
  });
}
```

### Distance-based Filtering

```javascript
// Filter by distance before raycasting
function getVisibleTargets(origin, maxRange) {
  const allTargets = query.findByTag('enemy');
  return allTargets.filter((targetId) => {
    const target = entities.get(targetId);
    const distance = math.distance(/* ... */);
    return distance <= maxRange;
  });
}
```

## Error Handling

- Raycast directions should be normalized to prevent unexpected behavior
- Entity IDs from queries may become invalid - always verify existence
- Hit result structure may vary by implementation
- Consider null/undefined returns when no hits occur
