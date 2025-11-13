# Console API

The Console API provides sandboxed logging functionality for script debugging and information output. It allows scripts to log messages that appear in the game's debug console without accessing the browser's console directly.

## Overview

The Console API includes:

- Standard logging methods (log, info, warn, error)
- Sandbox security (no access to browser console)
- Structured message formatting
- Debug information output

## Methods

### `console.log(...args)`

Outputs general information messages to the debug console.

**Parameters:**

- `...args` (unknown[]): Any number of arguments to log

**Example:**

```javascript
function onStart() {
  console.log('Script started successfully!');
  console.log('Entity ID:', entity.id, 'Entity Name:', entity.name);
  console.log('Initial position:', entity.transform.position);
}

function onUpdate() {
  if (input.isKeyPressed('space')) {
    console.log('Jump action triggered at time:', time.time);
  }
}
```

### `console.info(...args)`

Outputs informational messages to the debug console.

**Parameters:**

- `...args` (unknown[]): Any number of arguments to log

**Example:**

```javascript
function onCollisionEnter(otherEntityId) {
  const other = entities.get(otherEntityId);
  console.info('Collision detected with:', other.name);
}

function collectItem(itemType) {
  info('Item collected:', itemType, 'at time:', time.time);
}
```

### `console.warn(...args)`

Outputs warning messages to the debug console.

**Parameters:**

- `...args` (unknown[]): Any number of arguments to log

**Example:**

```javascript
function tryUseAbility(abilityName) {
  if (!abilities[abilityName]) {
    console.warn('Unknown ability requested:', abilityName);
    return false;
  }

  if (onCooldown(abilityName)) {
    console.warn('Ability on cooldown:', abilityName);
    return false;
  }

  return true;
}

function updateHealth(health) {
  if (health < 0) {
    console.warn('Health went negative:', health, '- clamping to 0');
    health = 0;
  }
}
```

### `console.error(...args)`

Outputs error messages to the debug console.

**Parameters:**

- `...args` (unknown[]): Any number of arguments to log

**Example:**

```javascript
function loadPlayerData() {
  try {
    const data = playerDataLoader.load();
    if (!data) {
      console.error('Failed to load player data - data is null');
      return;
    }

    // Process data...
  } catch (error) {
    console.error('Error loading player data:', error);
  }
}

function validateRequirements(requirements) {
  if (!Array.isArray(requirements)) {
    console.error('Requirements must be an array, got:', typeof requirements);
    return false;
  }
  return true;
}
```

## Complete Examples

### Debugging Movement Script

```javascript
const speed = 5.0;
let lastPosition = null;

function onStart() {
  console.log('Movement script initialized');
  console.log('Initial settings - Speed:', speed);
  lastPosition = [...entity.transform.position];
}

function onUpdate() {
  const currentPos = entity.transform.position;
  let moved = false;

  // Movement with debug output
  if (input.isKeyDown('w')) {
    entity.transform.translate(0, 0, -speed * time.deltaTime);
    moved = true;
    console.log('Moving forward - delta:', -speed * time.deltaTime);
  }

  if (input.isKeyDown('s')) {
    entity.transform.translate(0, 0, speed * time.deltaTime);
    moved = true;
    console.log('Moving backward - delta:', speed * time.deltaTime);
  }

  if (moved) {
    const distance = math.distance(
      lastPosition[0],
      lastPosition[1],
      lastPosition[2],
      currentPos[0],
      currentPos[1],
      currentPos[2],
    );
    console.info('Movement distance this frame:', distance);
    lastPosition = [...currentPos];
  }
}

function onCollisionEnter(otherEntityId) {
  const other = entities.get(otherEntityId);
  console.warn('Movement blocked by:', other.name);
}
```

### State Machine Debugging

```javascript
const states = { IDLE: 'idle', WALKING: 'walking', RUNNING: 'running' };
let currentState = states.IDLE;
let stateHistory = [];

function changeState(newState) {
  console.info('State transition:', currentState, '->', newState);

  stateHistory.push({
    from: currentState,
    to: newState,
    time: time.time,
  });

  // Keep only last 10 state changes
  if (stateHistory.length > 10) {
    stateHistory.shift();
  }

  currentState = newState;

  // Validate state
  if (!Object.values(states).includes(newState)) {
    console.error('Invalid state attempted:', newState);
    currentState = states.IDLE;
  }
}

function onUpdate() {
  const previouState = currentState;

  // State logic
  if (input.isKeyDown('w')) {
    if (input.isKeyDown('shift')) {
      changeState(states.RUNNING);
    } else {
      changeState(states.WALKING);
    }
  } else {
    changeState(states.IDLE);
  }

  // Log state changes
  if (previouState !== currentState) {
    console.log('Current state:', currentState, 'at frame:', time.frameCount);
  }

  // Periodic state info
  if (time.frameCount % 300 === 0) {
    // Every 5 seconds at 60 FPS
    console.info('State check - Current:', currentState, 'History:', stateHistory);
  }
}
```

### Inventory System Debugging

```javascript
const inventory = {
  items: [],
  maxSize: 20,
  add(item) {
    if (this.items.length >= this.maxSize) {
      console.warn('Inventory full - cannot add:', item.name);
      return false;
    }

    if (!item.id || !item.name) {
      console.error('Invalid item format:', item);
      return false;
    }

    this.items.push(item);
    console.log('Item added to inventory:', item.name, '(Slot:', this.items.length - 1, ')');
    console.info('Inventory size:', this.items.length, '/', this.maxSize);
    return true;
  },

  remove(itemId) {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) {
      console.warn('Item not found in inventory:', itemId);
      return null;
    }

    const removedItem = this.items.splice(index, 1)[0];
    console.log('Item removed from inventory:', removedItem.name);
    console.info('Remaining items:', this.items.length);
    return removedItem;
  },

  debug() {
    console.log('=== INVENTORY DEBUG ===');
    console.log('Size:', this.items.length, '/', this.maxSize);
    console.log('Items:');
    this.items.forEach((item, index) => {
      console.log(`  [${index}]:`, item.name, '(ID:', item.id, ')');
    });
    console.log('===================');
  },
};

function onStart() {
  console.log('Initializing inventory system');
  inventory.debug();
}

// Test the inventory system
function testInventory() {
  console.log('Testing inventory system...');

  // Add valid items
  const item1 = { id: 'sword_001', name: 'Iron Sword' };
  const item2 = { id: 'potion_001', name: 'Health Potion' };

  inventory.add(item1);
  inventory.add(item2);

  // Test invalid item
  inventory.add({ name: 'Invalid Item' }); // Missing ID
  inventory.add('not an object'); // Wrong type

  // Test removal
  inventory.remove('sword_001');
  inventory.remove('nonexistent_item');

  inventory.debug();
}
```

### Performance Profiler

```javascript
const profiler = {
  samples: {},
  sampleCount: {},
  startProfile(name) {
    this.samples[name] = time.time;
  },

  endProfile(name) {
    if (this.samples[name] === undefined) {
      console.warn('Profile ended without start:', name);
      return;
    }

    const duration = time.time - this.samples[name];
    delete this.samples[name];

    if (!this.sampleCount[name]) {
      this.sampleCount[name] = { count: 0, totalTime: 0, min: Infinity, max: 0 };
    }

    const stats = this.sampleCount[name];
    stats.count++;
    stats.totalTime += duration;
    stats.min = Math.min(stats.min, duration);
    stats.max = Math.max(stats.max, duration);

    if (duration > 0.001) {
      // Log samples over 1ms
      console.warn(`Profile ${name}:`, (duration * 1000).toFixed(2), 'ms');
    }
  },

  report() {
    console.log('=== PERFORMANCE REPORT ===');
    Object.entries(this.sampleCount).forEach(([name, stats]) => {
      const avg = stats.totalTime / stats.count;
      console.log(`${name}:`);
      console.log(`  Count: ${stats.count}`);
      console.log(`  Average: ${(avg * 1000).toFixed(3)}ms`);
      console.log(`  Min: ${(stats.min * 1000).toFixed(3)}ms`);
      console.log(`  Max: ${(stats.max * 1000).toFixed(3)}ms`);
      console.log(`  Total: ${(stats.totalTime * 1000).toFixed(1)}ms`);
    });
    console.log('=========================');
  },
};

function onUpdate() {
  profiler.startProfile('update_logic');

  // Game logic here
  updateAI();
  updatePhysics();
  updateAnimation();

  profiler.endProfile('update_logic');

  // Report every 5 seconds
  if (time.frameCount % 300 === 0) {
    profiler.report();
  }
}

function updateAI() {
  profiler.startProfile('ai_update');
  // AI logic...
  profiler.endProfile('ai_update');
}

function updatePhysics() {
  profiler.startProfile('physics_update');
  // Physics logic...
  profiler.endProfile('physics_update');
}
```

### Network Communication Debugging

```javascript
const networkDebugger = {
  messagesSent: 0,
  messagesReceived: 0,
  errors: 0,

  logSend(messageType, data) {
    this.messagesSent++;
    console.log(`[OUT] ${messageType}:`, data);
    console.info('Messages sent so far:', this.messagesSent);
  },

  logReceive(messageType, data) {
    this.messagesReceived++;
    console.log(`[IN] ${messageType}:`, data);
    console.info('Messages received so far:', this.messagesReceived);
  },

  logError(error, context) {
    this.errors++;
    console.error(`[ERROR] ${context}:`, error);
    console.warn('Total errors:', this.errors);
  },

  getStats() {
    return {
      sent: this.messagesSent,
      received: this.messagesReceived,
      errors: this.errors,
    };
  },

  report() {
    const stats = this.getStats();
    console.log('=== NETWORK STATS ===');
    console.log('Messages sent:', stats.sent);
    console.log('Messages received:', stats.received);
    console.log('Errors:', stats.errors);
    console.log('===================');
  },
};

function sendPlayerPosition() {
  try {
    const position = entity.transform.position;
    networkDebugger.logSend('PLAYER_POSITION', position);
    // Actually send to network...
  } catch (error) {
    networkDebugger.logError(error, 'sending player position');
  }
}

function onNetworkMessage(messageType, data) {
  try {
    networkDebugger.logReceive(messageType, data);
    // Process message...
  } catch (error) {
    networkDebugger.logError(error, `processing ${messageType}`);
  }
}
```

### Debug Commands

```javascript
const debugCommands = {
  help() {
    console.log('Available debug commands:');
    console.log('  help() - Show this help');
    console.log('  stats() - Show entity statistics');
    console.log('  pos() - Show current position');
    console.log('  components() - List components');
    console.log('  setpos(x, y, z) - Set position');
    console.log('  reset() - Reset entity to origin');
  },

  stats() {
    console.log('=== ENTITY STATS ===');
    console.log('ID:', entity.id);
    console.log('Name:', entity.name);
    console.log('Active:', entity.isActive());
    console.log('Position:', entity.transform.position);
    console.log('Rotation:', entity.transform.rotation);
    console.log('Scale:', entity.transform.scale);
    console.log('===================');
  },

  pos() {
    console.log('Current position:', entity.transform.position);
  },

  components() {
    console.log('=== COMPONENTS ===');
    if (entity.meshRenderer) console.log('✓ MeshRenderer');
    if (entity.rigidBody) console.log('✓ RigidBody');
    if (entity.camera) console.log('✓ Camera');
    if (entity.light) console.log('✓ Light');
    if (entity.meshCollider) console.log('✓ MeshCollider');
    console.log('==================');
  },

  setpos(x, y, z) {
    entity.transform.setPosition(x, y, z);
    console.log('Position set to:', [x, y, z]);
  },

  reset() {
    entity.transform.setPosition(0, 0, 0);
    entity.transform.setRotation(0, 0, 0);
    entity.transform.setScale(1, 1, 1);
    console.log('Entity reset to origin');
  },
};

function onStart() {
  console.log('Debug commands available. Type debugCommands.help() for help');
}
```

## Best Practices

1. **Use Appropriate Log Levels**: Use `log` for general info, `warn` for potential issues, `error` for actual problems
2. **Include Context**: Always include relevant information like entity IDs, positions, or timestamps
3. **Structure Output**: Use clear, consistent formatting for better readability
4. **Performance**: Avoid logging in performance-critical code (use conditionals)
5. **Cleanup**: Remove or disable debug logging in production code

## Production Considerations

- Consider adding a debug mode flag to conditionally disable console output
- Use structured logging for better filtering and analysis
- Be mindful of log spam in loops or frequent update calls
- Console output may not be available in all deployment environments

## Error Handling

- Console methods are safe and won't throw exceptions
- Invalid arguments are converted to strings automatically
- Multiple arguments are separated by spaces in the output
- Circular object references are handled gracefully
