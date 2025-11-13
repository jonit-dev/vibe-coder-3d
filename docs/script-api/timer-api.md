# Timer API

The Timer API provides scheduling and timing functionality for scripts, allowing you to execute code after delays, at intervals, or wait for specific conditions. It's essential for creating timed events, delayed actions, and frame-based operations.

## Overview

The Timer API includes:

- Single-shot timeouts (execute once after delay)
- Repeating intervals (execute continuously at intervals)
- Frame-based waiting utilities
- Promise-based async operations

## Core Methods

### `timer.setTimeout(callback, ms)`

Execute callback after specified delay.

**Parameters:**

- `callback` (() => void): Function to execute
- `ms` (number): Delay in milliseconds

**Returns:**

- `number`: Timer ID for cancellation

**Example:**

```javascript
function onStart() {
  console.log('Starting countdown...');

  // Execute after 3 seconds
  const timerId = timer.setTimeout(() => {
    console.log('3 seconds passed!');
    explodeBomb();
  }, 3000);

  console.log('Timer scheduled with ID:', timerId);
}

function explodeBomb() {
  entity.meshRenderer.material.setColor('#ff0000');
  timer.setTimeout(() => {
    entity.destroy();
  }, 500);
}
```

### `timer.clearTimeout(id)`

Cancel a pending timeout.

**Parameters:**

- `id` (number): Timer ID to cancel

**Example:**

```javascript
let respawnTimer = null;

function onDeath() {
  // Schedule respawn after 5 seconds
  respawnTimer = timer.setTimeout(respawnPlayer, 5000);
  console.log('Respawn scheduled in 5 seconds');
}

function cancelRespawn() {
  if (respawnTimer) {
    timer.clearTimeout(respawnTimer);
    respawnTimer = null;
    console.log('Respawn cancelled');
  }
}
```

### `timer.setInterval(callback, ms)`

Execute callback repeatedly at specified interval.

**Parameters:**

- `callback` (() => void): Function to execute
- `ms` (number): Interval in milliseconds

**Returns:**

- `number`: Timer ID for cancellation

**Example:**

```javascript
let healthRegenTimer = null;

function onStart() {
  // Regenerate health every second
  healthRegenTimer = timer.setInterval(() => {
    if (currentHealth < maxHealth) {
      currentHealth = Math.min(currentHealth + 1, maxHealth);
      updateHealthBar();
      console.log('Health regenerated:', currentHealth);
    }
  }, 1000);
}

function onDestroy() {
  if (healthRegenTimer) {
    timer.clearInterval(healthRegenTimer);
  }
}
```

### `timer.clearInterval(id)`

Cancel a repeating interval.

**Parameters:**

- `id` (number): Timer ID to cancel

**Example:**

```javascript
let damageTimer = null;

function startPoisonDamage() {
  if (damageTimer) return; // Already active

  damageTimer = timer.setInterval(() => {
    takeDamage(1);
    console.log('Poison damage tick');

    // Stop after 10 seconds
    timer.setTimeout(() => {
      stopPoisonDamage();
    }, 10000);
  }, 500); // Every 0.5 seconds
}

function stopPoisonDamage() {
  if (damageTimer) {
    timer.clearInterval(damageTimer);
    damageTimer = null;
    console.log('Poison damage stopped');
  }
}
```

### `timer.nextTick()`

Wait for next frame (Promise-based).

**Returns:**

- `Promise<void>`: Promise that resolves on next frame

**Example:**

```javascript
async function performAnimation() {
  console.log('Animation start');

  for (let i = 0; i < 10; i++) {
    entity.transform.setScale(1 + i * 0.1);
    await timer.nextTick();
  }

  console.log('Animation complete');
}

function onStart() {
  performAnimation();
}
```

### `timer.waitFrames(count)`

Wait for specified number of frames.

**Parameters:**

- `count` (number): Number of frames to wait

**Returns:**

- `Promise<void>`: Promise that resolves after specified frames

**Example:**

```javascript
async function delayedExplosion() {
  console.log('Charge starting...');

  // Flash effect
  for (let i = 0; i < 30; i++) {
    const visible = i % 2 === 0;
    entity.setActive(visible);
    await timer.waitFrames(1);
  }

  console.log('Explosion!');
  explode();
}
```

## Complete Examples

### Countdown Timer System

```javascript
const CountdownTimer = {
  active: false,
  duration: 0,
  timeRemaining: 0,
  updateInterval: null,
  startTime: 0,

  start(seconds) {
    if (this.active) {
      this.stop();
    }

    this.duration = seconds;
    this.timeRemaining = seconds;
    this.active = true;
    this.startTime = time.time;

    console.log(`Countdown started: ${seconds} seconds`);

    // Update display every 100ms
    this.updateInterval = timer.setInterval(() => {
      this.update();
    }, 100);

    // Final timeout
    timer.setTimeout(() => {
      this.complete();
    }, seconds * 1000);
  },

  update() {
    if (!this.active) return;

    this.timeRemaining = this.duration - (time.time - this.startTime);

    // Update UI
    ui.updateWidget('countdown', 'timer', {
      text: `Time: ${Math.ceil(this.timeRemaining)}`,
    });

    // Warning effects
    if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
      const pulse = Math.sin(this.timeRemaining * 10) * 0.5 + 0.5;
      ui.updateWidget('countdown', 'timer', {
        color: `rgb(255, ${255 * pulse}, 0)`,
      });
    }

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
    }
  },

  complete() {
    console.log('Countdown completed!');
    this.active = false;

    if (this.updateInterval) {
      timer.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    ui.updateWidget('countdown', 'timer', {
      text: "TIME'S UP!",
      color: '#ff0000',
    });

    events.emit('countdown_completed');
  },

  stop() {
    if (!this.active) return;

    this.active = false;

    if (this.updateInterval) {
      timer.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('Countdown stopped');
    ui.destroySurface('countdown');
  },
};

function onStart() {
  // Create countdown UI
  ui.createScreenSurface({
    id: 'countdown',
    anchor: 'top-center',
    widgets: [
      {
        id: 'timer',
        kind: 'text',
        props: {
          text: 'Time: 0',
          fontSize: 32,
          color: '#ffffff',
        },
      },
    ],
  });

  // Start countdown
  CountdownTimer.start(30);
}
```

### Attack Cooldown System

```javascript
const AttackSystem = {
  attacks: {
    basic: { cooldown: 0.5, lastUsed: 0, damage: 10 },
    heavy: { cooldown: 2.0, lastUsed: 0, damage: 25 },
    special: { cooldown: 10.0, lastUsed: 0, damage: 50 },
  },

  canAttack(attackType) {
    const attack = this.attacks[attackType];
    if (!attack) return false;

    const timeSinceLastUse = time.time - attack.lastUsed;
    return timeSinceLastUse >= attack.cooldown;
  },

  getCooldownRemaining(attackType) {
    const attack = this.attacks[attackType];
    if (!attack) return 0;

    const timeSinceLastUse = time.time - attack.lastUsed;
    return Math.max(0, attack.cooldown - timeSinceLastUse);
  },

  performAttack(attackType) {
    const attack = this.attacks[attackType];
    if (!attack) return false;

    if (!this.canAttack(attackType)) {
      console.log(
        `${attackType} attack on cooldown for ${this.getCooldownRemaining(attackType).toFixed(1)}s`,
      );
      return false;
    }

    // Execute attack
    attack.lastUsed = time.time;
    console.log(`${attackType} attack! Damage: ${attack.damage}`);

    // Visual and audio feedback
    this.showAttackEffect(attackType);
    this.playAttackSound(attackType);

    // Deal damage to nearby enemies
    this.dealDamageInArea(attack.damage);

    return true;
  },

  showAttackEffect(attackType) {
    let effectDuration = 0.3;

    switch (attackType) {
      case 'basic':
        entity.meshRenderer.material.setEmissive('#ffffff', 0.5);
        break;
      case 'heavy':
        entity.meshRenderer.material.setEmissive('#ff0000', 0.8);
        effectDuration = 0.5;
        break;
      case 'special':
        entity.meshRenderer.material.setEmissive('#00ff00', 1.0);
        effectDuration = 1.0;
        break;
    }

    // Remove effect after duration
    timer.setTimeout(() => {
      entity.meshRenderer.material.setEmissive('#ffffff', 0);
    }, effectDuration * 1000);
  },

  playAttackSound(attackType) {
    const sounds = {
      basic: '/sounds/attacks/basic.wav',
      heavy: '/sounds/attacks/heavy.wav',
      special: '/sounds/attacks/special.wav',
    };

    audio.play(sounds[attackType], {
      volume: 0.7,
    });
  },

  dealDamageInArea(damage) {
    // Implementation for area damage
    events.emit('damage_area', {
      origin: entity.transform.position,
      radius: 5,
      damage: damage,
    });
  },
};

function onUpdate() {
  if (input.isMouseButtonPressed(0)) {
    if (input.isKeyDown('shift')) {
      AttackSystem.performAttack('heavy');
    } else {
      AttackSystem.performAttack('basic');
    }
  }

  if (input.isKeyPressed('q')) {
    AttackSystem.performAttack('special');
  }

  // Update UI with cooldowns
  updateCooldownUI();
}

function updateCooldownUI() {
  Object.entries(AttackSystem.attacks).forEach(([attackType, attack]) => {
    const remaining = AttackSystem.getCooldownRemaining(attackType);
    const cooldownPercent = remaining / attack.cooldown;

    ui.updateWidget('combat_ui', `${attackType}_cooldown`, {
      value: 1 - cooldownPercent,
      visible: remaining > 0,
    });
  });
}
```

### Status Effect System

```javascript
const StatusEffectSystem = {
  effects: new Map(),
  updateInterval: null,

  applyEffect(entityId, effectType, duration) {
    const effectId = `${entityId}_${effectType}`;

    // Remove existing effect of same type
    this.removeEffect(entityId, effectType);

    const effect = {
      id: effectId,
      entityId: entityId,
      type: effectType,
      startTime: time.time,
      duration: duration,
      updateInterval: null,
    };

    this.effects.set(effectId, effect);

    // Apply initial effect
    this.applyEffectLogic(effect);

    // Set up update interval
    effect.updateInterval = timer.setInterval(() => {
      this.updateEffect(effect);
    }, 500);

    // Set expiration timer
    timer.setTimeout(() => {
      this.removeEffect(entityId, effectType);
    }, duration * 1000);

    console.log(`Applied ${effectType} to entity ${entityId} for ${duration}s`);
    events.emit('status_effect_applied', {
      entityId: entityId,
      effectType: effectType,
      duration: duration,
    });
  },

  removeEffect(entityId, effectType) {
    const effectId = `${entityId}_${effectType}`;
    const effect = this.effects.get(effectId);

    if (effect) {
      if (effect.updateInterval) {
        timer.clearInterval(effect.updateInterval);
      }

      this.effects.delete(effectId);
      this.removeEffectLogic(effect);

      console.log(`Removed ${effectType} from entity ${entityId}`);
      events.emit('status_effect_removed', {
        entityId: entityId,
        effectType: effectType,
      });
    }
  },

  updateEffect(effect) {
    const elapsed = time.time - effect.startTime;
    const remaining = effect.duration - elapsed;

    if (remaining <= 0) {
      this.removeEffect(effect.entityId, effect.type);
      return;
    }

    // Update effect visuals
    this.updateEffectVisuals(effect);
  },

  applyEffectLogic(effect) {
    const target = entities.get(effect.entityId);
    if (!target) return;

    switch (effect.type) {
      case 'poison':
        // Poison deals damage every second
        effect.damageInterval = timer.setInterval(() => {
          if (target.hasComponent('Health')) {
            const health = target.getComponent('Health');
            const newHealth = Math.max(0, health.current - 1);
            target.setComponent('Health', { current: newHealth });
            this.showDamageNumber(target, 1, '#00ff00');
          }
        }, 1000);
        break;

      case 'speed':
        // Speed boost
        if (target.rigidBody) {
          target.rigidBody.setGravityScale(0.5); // Lower gravity for higher jumps
        }
        if (target.meshRenderer) {
          target.meshRenderer.material.setColor('#00ffff');
        }
        break;

      case 'slow':
        // Slow effect
        if (target.rigidBody) {
          effect.originalGravity = target.getComponent('RigidBody').gravityScale || 1;
          target.rigidBody.setGravityScale(2.0); // Higher gravity for slower movement
        }
        if (target.meshRenderer) {
          target.meshRenderer.material.setColor('#0000ff');
        }
        break;

      case 'invincible':
        // Invincibility
        if (target.meshRenderer) {
          // Golden glow for invincibility
          target.meshRenderer.material.setEmissive('#ffff00', 0.8);
        }
        break;
    }
  },

  removeEffectLogic(effect) {
    const target = entities.get(effect.entityId);
    if (!target) return;

    switch (effect.type) {
      case 'poison':
        if (effect.damageInterval) {
          timer.clearInterval(effect.damageInterval);
        }
        break;

      case 'speed':
      case 'slow':
        if (target.rigidBody) {
          target.rigidBody.setGravityScale(1.0); // Reset gravity
        }
        if (target.meshRenderer) {
          target.meshRenderer.material.setColor('#ffffff'); // Reset color
        }
        break;

      case 'invincible':
        if (target.meshRenderer) {
          target.meshRenderer.material.setEmissive('#ffffff', 0); // Remove glow
        }
        break;
    }
  },

  updateEffectVisuals(effect) {
    const target = entities.get(effect.entityId);
    if (!target || !target.meshRenderer) return;

    const elapsed = time.time - effect.startTime;
    const remaining = effect.duration - elapsed;
    const fadePercent = remaining / effect.duration;

    switch (effect.type) {
      case 'poison':
        // Pulsing green effect
        const pulse = Math.sin(elapsed * 10) * 0.5 + 0.5;
        target.meshRenderer.material.setEmissive('#00ff00', pulse * fadePercent);
        break;

      case 'speed':
        // Cyan fade
        target.meshRenderer.material.setColor(`rgb(0, ${255 * fadePercent}, ${255 * fadePercent})`);
        break;

      case 'slow':
        // Blue fade
        target.meshRenderer.material.setColor(`rgb(0, 0, ${255 * fadePercent})`);
        break;

      case 'invincible':
        // Golden fade
        target.meshRenderer.material.setEmissive('#ffff00', 0.8 * fadePercent);
        break;
    }
  },

  showDamageNumber(target, amount, color) {
    events.emit('damage_number', {
      position: target.transform.position,
      amount: amount,
      color: color,
    });
  },
};

function onStart() {
  // Listen for effect requests
  events.on('apply_status_effect', (payload) => {
    StatusEffectSystem.applyEffect(payload.entityId, payload.effectType, payload.duration);
  });

  events.on('remove_status_effect', (payload) => {
    StatusEffectSystem.removeEffect(payload.entityId, payload.effectType);
  });
}

// Example usage
function onCollisionEnter(otherEntityId) {
  // Apply poison on collision with poison trap
  if (entity.hasComponent('PoisonTrap')) {
    StatusEffectSystem.applyEffect(otherEntityId, 'poison', 5.0);
  }

  // Apply speed boost on collision with powerup
  if (entity.hasComponent('SpeedPowerup')) {
    StatusEffectSystem.applyEffect(otherEntityId, 'speed', 10.0);
  }
}
```

### Cinematic Sequence System

```javascript
const CinematicSystem = {
  isPlaying: false,
  currentSequence: null,

  async playSequence(sequenceName) {
    if (this.isPlaying) {
      console.warn('Cinematic already playing');
      return;
    }

    this.isPlaying = true;
    this.currentSequence = sequenceName;

    console.log(`Starting cinematic: ${sequenceName}`);

    // Disable player input
    events.emit('cinematic_started');
    ui.captureInput(false);

    try {
      await this.executeSequence(sequenceName);
    } catch (error) {
      console.error('Cinematic error:', error);
    } finally {
      this.isPlaying = false;
      this.currentSequence = null;

      // Re-enable player input
      events.emit('cinematic_ended');
      ui.captureInput(true);

      console.log(`Cinematic ended: ${sequenceName}`);
    }
  },

  async executeSequence(sequenceName) {
    switch (sequenceName) {
      case 'intro':
        await this.introSequence();
        break;
      case 'boss_intro':
        await this.bossIntroSequence();
        break;
      case 'victory':
        await this.victorySequence();
        break;
      default:
        console.error(`Unknown cinematic: ${sequenceName}`);
    }
  },

  async introSequence() {
    // Fade in
    ui.createScreenSurface({
      id: 'fade',
      anchor: 'center',
      widgets: [
        {
          id: 'overlay',
          kind: 'text',
          props: {
            text: 'Chapter 1: The Beginning',
            fontSize: 48,
            color: '#ffffff',
          },
        },
      ],
    });

    await this.wait(2);

    // Fade out text
    ui.destroySurface('fade');
    await this.wait(1);

    // Pan camera to starting position
    const camera = entities.findByTag('MainCamera')[0];
    if (camera) {
      const startPos = camera.transform.position;
      const endPos = [startPos[0], startPos[1] + 10, startPos[2] - 20];

      await this.animateCameraMove(camera, startPos, endPos, 3);
    }

    await this.wait(2);
  },

  async bossIntroSequence() {
    const boss = entities.findByTag('Boss')[0];
    const player = entities.findByTag('Player')[0];

    if (boss) {
      // Focus on boss
      const camera = entities.findByTag('MainCamera')[0];
      if (camera) {
        await this.animateCameraLookAt(camera, boss.transform.position, 2);
      }

      // Boss roar
      boss.meshRenderer.material.setEmissive('#ff0000', 1.0);
      audio.play('/sounds/boss/roar.wav', { volume: 1.0 });

      await this.wait(3);

      boss.meshRenderer.material.setEmissive('#ffffff', 0);

      // Return to player
      if (camera && player) {
        await this.animateCameraLookAt(camera, player.transform.position, 1);
      }
    }

    await this.wait(1);
  },

  async victorySequence() {
    // Show victory text
    ui.createScreenSurface({
      id: 'victory',
      anchor: 'center',
      widgets: [
        {
          id: 'text',
          kind: 'text',
          props: {
            text: 'VICTORY!',
            fontSize: 64,
            color: '#ffff00',
          },
        },
      ],
    });

    audio.play('/music/victory_fanfare.mp3', { volume: 0.8 });

    await this.wait(3);

    // Slow motion celebration
    time.timeScale = 0.3;

    const player = entities.findByTag('Player')[0];
    if (player) {
      // Victory pose animation
      for (let i = 0; i < 10; i++) {
        player.transform.rotate(0, 36, 0); // Full rotation over 10 frames
        await this.waitFrames(1);
      }
    }

    time.timeScale = 1.0;
    await this.wait(2);
  },

  async wait(seconds) {
    return new Promise((resolve) => {
      timer.setTimeout(resolve, seconds * 1000);
    });
  },

  async waitFrames(frames) {
    return timer.waitFrames(frames);
  },

  async animateCameraMove(camera, from, to, duration) {
    const steps = 60;
    const stepDelay = (duration / steps) * 1000;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const eased = this.easeInOutCubic(t);

      const position = [
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased,
        from[2] + (to[2] - from[2]) * eased,
      ];

      camera.transform.setPosition(position[0], position[1], position[2]);
      await this.wait(stepDelay);
    }
  },

  async animateCameraLookAt(camera, target, duration) {
    const steps = 30;
    const stepDelay = (duration / steps) * 1000;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const eased = this.easeInOutCubic(t);

      // Calculate intermediate look-at positions
      const currentPos = camera.transform.position;
      const targetPos = [
        currentPos[0] + (target[0] - currentPos[0]) * eased,
        currentPos[1] + (target[1] - currentPos[1]) * eased,
        currentPos[2] + (target[2] - currentPos[2]) * eased,
      ];

      camera.transform.lookAt(targetPos);
      await this.wait(stepDelay);
    }
  },

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },
};

function onStart() {
  // Listen for cinematic triggers
  events.on('play_cinematic', (payload) => {
    CinematicSystem.playSequence(payload.sequenceName);
  });

  // Auto-play intro
  if (entity.hasComponent('IntroTrigger')) {
    timer.setTimeout(() => {
      CinematicSystem.playSequence('intro');
    }, 1000);
  }
}
```

## Best Practices

1. **Cleanup**: Always clear timers when they're no longer needed to prevent memory leaks
2. **Performance**: Be careful with rapid intervals - consider using frame-based waiting for very frequent updates
3. **Error Handling**: Wrap timer callbacks in try-catch blocks to prevent crashes
4. **State Management**: Store timer IDs for later cancellation
5. **Async/Await**: Use Promise-based methods for cleaner asynchronous code

## Common Patterns

### Debouncing

```javascript
let debounceTimer = null;

function handleInput() {
  if (debounceTimer) {
    timer.clearTimeout(debounceTimer);
  }

  debounceTimer = timer.setTimeout(() => {
    processInput();
  }, 100);
}
```

### Frame-Rate Independent Timing

```javascript
async function smoothAnimation(duration) {
  const startTime = time.time;
  const endTime = startTime + duration;

  while (time.time < endTime) {
    const progress = (time.time - startTime) / duration;
    updateAnimation(progress);
    await timer.nextTick();
  }
}
```

## Error Handling

- Timer callbacks execute in the global context - be careful with `this`
- Invalid timer IDs are ignored when clearing
- Very short intervals (< 16ms) may not execute as expected due to frame rate
- Timer precision may vary across platforms
