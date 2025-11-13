# Event API

The Event API provides access to a global event bus that allows scripts to communicate with each other through events. It's essential for decoupled systems where different components need to react to game events without direct references to each other.

## Overview

The Event API includes:

- Global event subscription and unsubscription
- Event emission with payload data
- Decoupled communication between scripts
- Type-safe event handling

## Core Methods

### `events.on(type, handler)`

Subscribe to an event type.

**Parameters:**

- `type` (string): Event type identifier
- `handler` (function): Callback function that receives the event payload

**Returns:**

- `() => void`: Cleanup function to unsubscribe from the event

**Example:**

```javascript
function onStart() {
  // Subscribe to player damage event
  const cleanup = events.on('player_damaged', (payload) => {
    console.log('Player took damage:', payload.amount);
    updateHealthBar(payload.currentHealth, payload.maxHealth);
  });

  // Store cleanup function for later use
  this.damageEventCleanup = cleanup;
}

function onDestroy() {
  // Clean up event subscription
  if (this.damageEventCleanup) {
    this.damageEventCleanup();
  }
}
```

### `events.off(type, handler)`

Unsubscribe from an event type.

**Parameters:**

- `type` (string): Event type identifier
- `handler` (function): The exact callback function to remove

**Example:**

```javascript
const healthUpdateHandler = (payload) => {
  console.log('Health updated:', payload);
};

function onStart() {
  events.on('health_updated', healthUpdateHandler);
}

function onDestroy() {
  events.off('health_updated', healthUpdateHandler);
}
```

### `events.emit(type, payload)`

Emit an event to all subscribers.

**Parameters:**

- `type` (string): Event type identifier
- `payload` (unknown): Data to pass to event handlers

**Example:**

```javascript
function takeDamage(amount) {
  currentHealth -= amount;

  // Emit damage event
  events.emit('player_damaged', {
    amount: amount,
    currentHealth: currentHealth,
    maxHealth: maxHealth,
    damageSource: this.name,
  });

  if (currentHealth <= 0) {
    events.emit('player_died', {
      lastDamageSource: this.name,
    });
  }
}
```

## Complete Examples

### Game State Management

```javascript
// GameStateManager script
const gameStates = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
};

let currentState = gameStates.MENU;

function onStart() {
  // Listen for state change requests
  events.on('request_state_change', (payload) => {
    changeState(payload.newState);
  });

  events.on('player_died', () => {
    changeState(gameStates.GAME_OVER);
  });

  events.on('pause_requested', () => {
    if (currentState === gameStates.PLAYING) {
      changeState(gameStates.PAUSED);
    } else if (currentState === gameStates.PAUSED) {
      changeState(gameStates.PLAYING);
    }
  });

  // Emit initial state
  events.emit('state_changed', {
    from: null,
    to: currentState,
  });
}

function changeState(newState) {
  if (currentState === newState) return;

  const oldState = currentState;
  currentState = newState;

  console.log(`State change: ${oldState} -> ${newState}`);

  // Emit state change event
  events.emit('state_changed', {
    from: oldState,
    to: newState,
  });

  // Handle state-specific logic
  switch (currentState) {
    case gameStates.PLAYING:
      events.emit('game_started');
      break;
    case gameStates.PAUSED:
      events.emit('game_paused');
      break;
    case gameStates.GAME_OVER:
      events.emit('game_ended');
      break;
  }
}
```

### Achievement System

```javascript
// AchievementSystem script
const achievements = {
  FIRST_KILL: { id: 'first_kill', name: 'First Blood', unlocked: false },
  SPEED_RUNNER: { id: 'speed_runner', name: 'Speed Runner', unlocked: false },
  COLLECTOR: { id: 'collector', name: 'Collector', unlocked: false },
  SURVIVOR: { id: 'survivor', name: 'Survivor', unlocked: false },
};

let enemiesKilled = 0;
let itemsCollected = 0;
let gameStartTime = 0;

function onStart() {
  gameStartTime = time.time;

  // Listen for game events
  events.on('enemy_killed', () => {
    enemiesKilled++;
    checkFirstKill();
  });

  events.on('item_collected', (payload) => {
    itemsCollected++;
    checkCollector();
  });

  events.on('game_ended', () => {
    checkSpeedRunner();
    checkSurvivor();
  });

  events.on('achievement_unlocked', (payload) => {
    console.log('Achievement unlocked:', payload.name);
    ui.createNotification({
      text: `Achievement: ${payload.name}`,
      type: 'achievement',
    });
  });
}

function checkFirstKill() {
  if (enemiesKilled === 1 && !achievements.FIRST_KILL.unlocked) {
    unlockAchievement(achievements.FIRST_KILL);
  }
}

function checkCollector() {
  if (itemsCollected >= 10 && !achievements.COLLECTOR.unlocked) {
    unlockAchievement(achievements.COLLECTOR);
  }
}

function checkSpeedRunner() {
  const gameTime = time.time - gameStartTime;
  if (gameTime < 300 && !achievements.SPEED_RUNNER.unlocked) {
    // Under 5 minutes
    unlockAchievement(achievements.SPEED_RUNNER);
  }
}

function checkSurvivor() {
  if (enemiesKilled >= 50 && !achievements.SURVIVOR.unlocked) {
    unlockAchievement(achievements.SURVIVOR);
  }
}

function unlockAchievement(achievement) {
  achievement.unlocked = true;
  events.emit('achievement_unlocked', {
    id: achievement.id,
    name: achievement.name,
  });
}
```

### Combat Event System

```javascript
// CombatManager script
function onStart() {
  // Listen to various combat events
  events.on('weapon_fired', (payload) => {
    console.log(`${payload.weaponName} fired by ${payload.shooterName}`);
    processWeaponFire(payload);
  });

  events.on('damage_dealt', (payload) => {
    console.log(`${payload.damage} damage dealt to ${payload.targetName}`);
    applyDamage(payload);
  });

  events.on('healing_received', (payload) => {
    console.log(`${payload.targetName} healed for ${payload.amount}`);
    applyHealing(payload);
  });
}

function processWeaponFire(payload) {
  const { shooterId, targetPosition, weaponType, damage } = payload;

  // Create visual effects
  events.emit('weapon_effect', {
    type: weaponType,
    position: targetPosition,
    source: shooterId,
  });

  // Play sound
  events.emit('sound_play', {
    soundName: `${weaponType}_fire`,
    position: payload.shooterPosition,
  });

  // Handle raycast for hits
  const hit = query.raycastFirst(payload.shooterPosition, payload.direction);
  if (hit) {
    events.emit('damage_dealt', {
      targetId: hit.entityId,
      damage: damage,
      damageType: weaponType,
      shooterId: shooterId,
    });
  }
}

function applyDamage(payload) {
  const target = entities.get(payload.targetId);
  if (!target) return;

  // Apply damage through target's health system
  if (target.hasComponent('Health')) {
    const health = target.getComponent('Health');
    const newHealth = Math.max(0, health.current - payload.damage);

    target.setComponent('Health', { current: newHealth });

    // Emit damage event for other systems
    events.emit('entity_damaged', {
      entityId: payload.targetId,
      damage: payload.damage,
      newHealth: newHealth,
      damageType: payload.damageType,
    });

    // Create damage number UI
    events.emit('damage_number', {
      position: target.transform.position,
      amount: payload.damage,
      type: payload.damageType,
    });

    if (newHealth === 0) {
      events.emit('entity_killed', {
        entityId: payload.targetId,
        killerId: payload.shooterId,
      });
    }
  }
}
```

### Audio Event System

```javascript
// AudioManager script
const audioContext = {
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  currentBGM: null,
  soundEffects: new Map(),
};

function onStart() {
  // Listen for audio events
  events.on('sound_play', (payload) => {
    playSoundEffect(payload.soundName, payload);
  });

  events.on('bgm_play', (payload) => {
    playBackgroundMusic(payload.musicName, payload);
  });

  events.on('bgm_stop', () => {
    stopBackgroundMusic();
  });

  events.on('audio_volume_changed', (payload) => {
    updateVolume(payload.type, payload.volume);
  });

  // Game state audio management
  events.on('state_changed', (payload) => {
    handleGameStateMusic(payload.to);
  });

  events.on('player_died', () => {
    playSoundEffect('player_death');
    stopBackgroundMusic();
    timer.setTimeout(() => {
      playBackgroundMusic('game_over_music');
    }, 1000);
  });
}

function playSoundEffect(soundName, options = {}) {
  const soundId = audio.play(soundName, {
    volume: audioContext.sfxVolume * (options.volume || 1),
    pitch: options.pitch || 1,
    loop: options.loop || false,
  });

  if (options.position) {
    // Positional audio
    audio.attachToEntity(soundId, true);
  }

  console.log(`Playing sound effect: ${soundName}`);
  return soundId;
}

function playBackgroundMusic(musicName, options = {}) {
  if (audioContext.currentBGM) {
    audio.stop(audioContext.currentBGM);
  }

  audioContext.currentBGM = audio.play(musicName, {
    volume: audioContext.bgmVolume * (options.volume || 1),
    loop: true,
  });

  console.log(`Playing background music: ${musicName}`);
}

function handleGameStateMusic(gameState) {
  switch (gameState) {
    case 'menu':
      playBackgroundMusic('menu_music');
      break;
    case 'playing':
      playBackgroundMusic('gameplay_music');
      break;
    case 'paused':
      if (audioContext.currentBGM) {
        // Lower volume during pause
        updateVolume('bgm', audioContext.bgmVolume * 0.5);
      }
      break;
    default:
      stopBackgroundMusic();
  }
}
```

### UI Event System

```javascript
// UIManager script
let activeMenus = [];
let notifications = [];

function onStart() {
  // Listen for UI events
  events.on('show_menu', (payload) => {
    showMenu(payload.menuType, payload.options);
  });

  events.on('hide_menu', (payload) => {
    hideMenu(payload.menuType);
  });

  events.on('show_notification', (payload) => {
    showNotification(payload);
  });

  events.on('update_hud', (payload) => {
    updateHUD(payload);
  });

  events.on('state_changed', (payload) => {
    handleGameStateUI(payload.to);
  });

  // Input events for UI
  events.on('ui_navigation', (payload) => {
    handleUINavigation(payload.direction);
  });

  events.on('ui_select', () => {
    handleUISelect();
  });
}

function showMenu(menuType, options = {}) {
  if (activeMenus.includes(menuType)) return;

  activeMenus.push(menuType);

  const menuSurface = ui.createScreenSurface({
    id: `menu_${menuType}`,
    anchor: 'center',
    widgets: createMenuWidgets(menuType, options),
  });

  // Capture input for menu
  ui.captureInput(true);

  events.emit('menu_shown', { menuType, surfaceId: menuSurface.id });
  console.log(`Menu shown: ${menuType}`);
}

function hideMenu(menuType) {
  const index = activeMenus.indexOf(menuType);
  if (index > -1) {
    activeMenus.splice(index, 1);
    ui.destroySurface(`menu_${menuType}`);

    // Release input if no menus are active
    if (activeMenus.length === 0) {
      ui.captureInput(false);
    }

    events.emit('menu_hidden', { menuType });
    console.log(`Menu hidden: ${menuType}`);
  }
}

function showNotification(payload) {
  const notificationId = `notification_${Date.now()}`;

  const notification = {
    id: notificationId,
    text: payload.text,
    type: payload.type || 'info',
    duration: payload.duration || 3000,
    createdAt: time.time,
  };

  notifications.push(notification);

  const surface = ui.createScreenSurface({
    id: notificationId,
    anchor: 'top-center',
    widgets: [
      {
        id: 'text',
        kind: 'text',
        props: {
          text: notification.text,
          fontSize: 18,
          color: getNotificationColor(notification.type),
        },
      },
    ],
  });

  // Auto-hide notification
  timer.setTimeout(() => {
    hideNotification(notificationId);
  }, notification.duration);
}

function updateHUD(payload) {
  // Update various HUD elements based on payload
  if (payload.health !== undefined) {
    ui.updateWidget('main_hud', 'health_bar', {
      value: payload.health / payload.maxHealth,
    });
  }

  if (payload.score !== undefined) {
    ui.updateWidget('main_hud', 'score_text', {
      text: `Score: ${payload.score}`,
    });
  }

  if (payload.ammo !== undefined) {
    ui.updateWidget('main_hud', 'ammo_text', {
      text: `${payload.current}/${payload.max}`,
    });
  }
}
```

### Weather System Events

```javascript
// WeatherSystem script
const weatherTypes = {
  CLEAR: 'clear',
  RAIN: 'rain',
  STORM: 'storm',
  SNOW: 'snow',
  FOG: 'fog',
};

let currentWeather = weatherTypes.CLEAR;
let weatherIntensity = 0;
let nextWeatherChange = 0;

function onStart() {
  // Listen for weather events
  events.on('weather_change_requested', (payload) => {
    setWeather(payload.weatherType, payload.intensity);
  });

  events.on('state_changed', (payload) => {
    if (payload.to === 'playing') {
      startWeatherCycle();
    }
  });

  // Game events that affect weather
  events.on('player_died', () => {
    // Dramatic weather change on death
    setWeather(weatherTypes.STORM, 0.8);
  });
}

function onUpdate() {
  // Update weather effects
  if (time.time >= nextWeatherChange) {
    cycleWeather();
  }

  // Apply weather effects
  applyWeatherEffects();
}

function setWeather(weatherType, intensity = 0.5) {
  const oldWeather = currentWeather;
  currentWeather = weatherType;
  weatherIntensity = intensity;

  console.log(`Weather changed: ${oldWeather} -> ${weatherType} (intensity: ${intensity})`);

  // Emit weather change event
  events.emit('weather_changed', {
    from: oldWeather,
    to: weatherType,
    intensity: intensity,
  });

  // Update audio
  updateWeatherAudio();

  // Update lighting
  updateWeatherLighting();
}

function applyWeatherEffects() {
  switch (currentWeather) {
    case weatherTypes.RAIN:
      applyRainEffects();
      break;
    case weatherTypes.STORM:
      applyStormEffects();
      break;
    case weatherTypes.SNOW:
      applySnowEffects();
      break;
    case weatherTypes.FOG:
      applyFogEffects();
      break;
  }
}

function applyStormEffects() {
  // Lightning
  if (math.random() < 0.01 * weatherIntensity) {
    events.emit('lightning_strike');

    // Play thunder sound with delay
    const delay = math.random() * 2000 + 500;
    timer.setTimeout(() => {
      events.emit('sound_play', { soundName: 'thunder' });
    }, delay);
  }

  // Wind effects
  events.emit('wind_gust', {
    strength: weatherIntensity * (math.random() * 0.5 + 0.5),
    direction: math.random() * 360,
  });

  // Screen shake
  events.emit('camera_shake', {
    intensity: weatherIntensity * 0.1,
    duration: 0.5,
  });
}
```

## Best Practices

1. **Event Naming**: Use clear, consistent event names with underscores (e.g., `player_damaged`, `item_collected`)
2. **Payload Structure**: Include relevant data in event payloads for complete context
3. **Cleanup**: Always remove event listeners in `onDestroy()` to prevent memory leaks
4. **Type Safety**: Use consistent payload structures for event types
5. **Avoid Circular Events**: Be careful not to create event loops where events trigger each other indefinitely
6. **Performance**: Avoid emitting events in performance-critical loops unless necessary

## Common Event Patterns

### Request/Response Pattern

```javascript
// Request
events.emit('player_stats_requested', { playerId: entity.id });

// Response
events.on('player_stats_requested', (payload) => {
  const player = entities.get(payload.playerId);
  events.emit('player_stats_response', {
    playerId: payload.playerId,
    stats: player.getComponent('Stats'),
  });
});
```

### State Changes

```javascript
// Before change
events.emit('before_state_change', { from: oldState, to: newState });

// Apply change
currentState = newState;

// After change
events.emit('after_state_change', { from: oldState, to: newState });
```

## Error Handling

- Event handlers should be wrapped in try-catch blocks to prevent crashes
- Invalid payloads are passed through but may cause errors in handlers
- Missing event types are ignored (no error thrown)
- Circular event dependencies can cause stack overflow
