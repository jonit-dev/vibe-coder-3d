# UI API

The UI API provides powerful tools for creating scripted user interfaces in your game, including HUDs, pause menus, interactive prompts, and world-space UI elements.

## Overview

The UI API allows you to create dynamic UI surfaces that can be:

- **Screen-space** (HUD/overlays) - fixed to screen positions
- **World-space** (3D billboards) - positioned in the game world

## Core Types

### UIWidgetKind

Supported widget types:

- `'text'` - Text labels with configurable font, size, and color
- `'icon'` - Icon/image display
- `'progress'` - Progress bars and health bars
- `'button'` - Interactive buttons
- `'stack'` - Layout containers for other widgets
- `'custom'` - Custom rendering components

### UISurfaceAnchor

Screen anchoring positions:

- `'top-left'` - Upper left corner
- `'top-right'` - Upper right corner
- `'bottom-left'` - Lower left corner
- `'bottom-right'` - Lower right corner
- `'center'` - Center of screen

## API Reference

### `ui.createScreenSurface(def)`

Creates a screen-space UI surface (HUD/overlay).

**Parameters:**

- `def` (UISurfaceDefinition): Surface configuration

**Returns:**

- `UISurfaceHandle`: Handle for managing the surface

**Example:**

```javascript
// Create player HUD
const hud = ui.createScreenSurface({
  id: 'player-hud',
  anchor: 'top-left',
  widgets: [
    {
      id: 'scoreLabel',
      kind: 'text',
      props: {
        text: 'Score: 0',
        fontSize: 20,
        color: '#ffffff',
      },
    },
    {
      id: 'hpBar',
      kind: 'progress',
      props: {
        value: 1,
        maxValue: 100,
        color: '#00ff00',
      },
    },
  ],
});
```

### `ui.createWorldSurface(def)`

Creates a world-space UI surface (3D billboard/panel).

**Parameters:**

- `def` (UISurfaceDefinition): Surface configuration with required `world` property

**Returns:**

- `UISurfaceHandle`: Handle for managing the surface

**Example:**

```javascript
// Create interaction prompt
const prompt = ui.createWorldSurface({
  id: 'interact-prompt',
  world: {
    followEntityId: entity.id,
    offset: [0, 2, 0],
    billboard: true,
  },
  widgets: [
    {
      id: 'message',
      kind: 'text',
      props: {
        text: 'Press E to interact',
        fontSize: 16,
      },
    },
  ],
});
```

### `ui.updateSurface(id, patch)`

Updates surface properties.

**Parameters:**

- `id` (string): Surface ID
- `patch` (Partial<UISurfaceDefinition>): Properties to update

**Example:**

```javascript
ui.updateSurface('player-hud', {
  anchor: 'top-right',
  visible: true,
});
```

### `ui.updateWidget(surfaceId, widgetId, props)`

Updates a specific widget's properties.

**Parameters:**

- `surfaceId` (string): Surface ID
- `widgetId` (string): Widget ID
- `props` (Record<string, unknown>): Widget properties to update

**Example:**

```javascript
// Update score display
ui.updateWidget('player-hud', 'scoreLabel', {
  text: `Score: ${currentScore}`,
});

// Update health bar
ui.updateWidget('player-hud', 'hpBar', {
  value: currentHealth / maxHealth,
});
```

### `ui.bindAction(surfaceId, widgetId, event, handler)`

Binds an event handler to a widget.

**Parameters:**

- `surfaceId` (string): Surface ID
- `widgetId` (string): Widget ID
- `event` ('click' | 'hover' | 'hoverEnd'): Event type
- `handler` (() => void): Event handler function

**Returns:**

- `() => void`: Cleanup function to unbind

**Example:**

```javascript
const cleanup = ui.bindAction('pause-menu', 'resumeBtn', 'click', () => {
  ui.destroySurface('pause-menu');
  ui.captureInput(false);
  // Resume game logic
});

// Later cleanup when menu is destroyed
cleanup();
```

### `ui.setVisible(surfaceId, visible)`

Sets surface visibility.

**Parameters:**

- `surfaceId` (string): Surface ID
- `visible` (boolean): Visibility state

**Example:**

```javascript
ui.setVisible('player-hud', false); // Hide HUD
ui.setVisible('player-hud', true); // Show HUD
```

### `ui.destroySurface(id)`

Destroys a surface and all its widgets.

**Parameters:**

- `id` (string): Surface ID to destroy

**Example:**

```javascript
ui.destroySurface('pause-menu');
```

### `ui.captureInput(claim)`

Controls input focus for UI.

**Parameters:**

- `claim` (boolean): When true, UI intercepts input and pauses gameplay controls

**Example:**

```javascript
// Open pause menu
ui.captureInput(true);

// Close pause menu
ui.captureInput(false);
```

## Complete Examples

### Player HUD System

```javascript
let currentScore = 0;
let currentHealth = 100;

function onStart() {
  // Create persistent HUD
  ui.createScreenSurface({
    id: 'player-hud',
    anchor: 'top-left',
    widgets: [
      {
        id: 'score',
        kind: 'text',
        props: {
          text: 'Score: 0',
          fontSize: 24,
          color: '#ffffff',
          fontWeight: 'bold',
        },
      },
      {
        id: 'health-bg',
        kind: 'progress',
        props: {
          value: 1,
          maxValue: 1,
          color: '#333333',
          width: 200,
          height: 20,
        },
      },
      {
        id: 'health',
        kind: 'progress',
        props: {
          value: 1,
          maxValue: 1,
          color: '#00ff00',
          width: 200,
          height: 20,
        },
      },
    ],
  });
}

function onUpdate() {
  // Update HUD with current values
  ui.updateWidget('player-hud', 'score', {
    text: `Score: ${currentScore}`,
  });

  const healthPercent = currentHealth / 100;
  ui.updateWidget('player-hud', 'health', {
    value: healthPercent,
    color: healthPercent > 0.5 ? '#00ff00' : '#ff0000',
  });
}
```

### Interactive Pause Menu

```javascript
let isPaused = false;

function onStart() {
  // Bind pause key
  input.onAction('Gameplay', 'Pause', (phase) => {
    if (phase === 'started') {
      togglePause();
    }
  });
}

function togglePause() {
  isPaused = !isPaused;

  if (isPaused) {
    openPauseMenu();
  } else {
    closePauseMenu();
  }
}

function openPauseMenu() {
  ui.captureInput(true); // Take input focus

  ui.createScreenSurface({
    id: 'pause-menu',
    anchor: 'center',
    widgets: [
      {
        id: 'title',
        kind: 'text',
        props: {
          text: 'PAUSED',
          fontSize: 48,
          color: '#ffffff',
        },
      },
      {
        id: 'resume',
        kind: 'button',
        props: {
          text: 'Resume',
          fontSize: 24,
          color: '#00ff00',
        },
      },
      {
        id: 'quit',
        kind: 'button',
        props: {
          text: 'Quit',
          fontSize: 24,
          color: '#ff0000',
        },
      },
    ],
  });

  // Bind button actions
  ui.bindAction('pause-menu', 'resume', 'click', () => {
    togglePause();
  });

  ui.bindAction('pause-menu', 'quit', 'click', () => {
    // Handle quit logic
    console.log('Quit game');
  });
}

function closePauseMenu() {
  ui.captureInput(false);
  ui.destroySurface('pause-menu');
}
```

### World-Space Interaction Prompts

```javascript
let nearbyNPC = null;

function onUpdate() {
  // Check for nearby interactable entities
  const nearby = query.findByTag('interactable');

  if (nearby.length > 0 && !nearbyNPC) {
    // Show prompt for first interactable
    nearbyNPC = nearby[0];
    showInteractionPrompt(nearbyNPC);
  } else if (nearby.length === 0 && nearbyNPC) {
    // Hide prompt when no interactables nearby
    hideInteractionPrompt();
    nearbyNPC = null;
  }
}

function showInteractionPrompt(entityId) {
  ui.createWorldSurface({
    id: 'interact-prompt',
    world: {
      followEntityId: entityId,
      offset: [0, 2, 0],
      billboard: true,
    },
    widgets: [
      {
        id: 'prompt',
        kind: 'text',
        props: {
          text: 'Press E',
          fontSize: 18,
          color: '#ffff00',
          backgroundColor: '#000000',
          padding: 8,
        },
      },
    ],
  });
}

function hideInteractionPrompt() {
  ui.destroySurface('interact-prompt');
}

function onStart() {
  input.onAction('Gameplay', 'Interact', (phase) => {
    if (phase === 'started' && nearbyNPC) {
      handleInteraction(nearbyNPC);
    }
  });
}

function handleInteraction(entityId) {
  const targetEntity = entities.get(entityId);
  console.log('Interacting with:', targetEntity.name);
  // Handle interaction logic
}
```

### Dynamic Health Bars for Enemies

```javascript
const enemyHealthBars = new Map();

function onEnable() {
  // Find all enemy entities
  const enemies = entities.findByTag('enemy');

  enemies.forEach((enemy) => {
    createHealthBarForEnemy(enemy.id);
  });
}

function createHealthBarForEnemy(enemyId) {
  const barId = `health-bar-${enemyId}`;

  ui.createWorldSurface({
    id: barId,
    world: {
      followEntityId: enemyId,
      offset: [0, 2.5, 0],
      billboard: true,
    },
    widgets: [
      {
        id: 'bg',
        kind: 'progress',
        props: {
          value: 1,
          maxValue: 1,
          color: '#333333',
          width: 60,
          height: 6,
        },
      },
      {
        id: 'health',
        kind: 'progress',
        props: {
          value: 1,
          maxValue: 1,
          color: '#ff0000',
          width: 60,
          height: 6,
        },
      },
    ],
  });

  enemyHealthBars.set(enemyId, barId);
}

function updateEnemyHealth(enemyId, currentHealth, maxHealth) {
  const barId = enemyHealthBars.get(enemyId);
  if (barId) {
    const healthPercent = currentHealth / maxHealth;
    ui.updateWidget(barId, 'health', { value: healthPercent });

    // Change color based on health level
    let color = '#ff0000'; // Red
    if (healthPercent > 0.5)
      color = '#00ff00'; // Green
    else if (healthPercent > 0.25) color = '#ffff00'; // Yellow

    ui.updateWidget(barId, 'health', { color });
  }
}

function onDisable() {
  // Clean up all health bars
  enemyHealthBars.forEach((barId) => {
    ui.destroySurface(barId);
  });
  enemyHealthBars.clear();
}
```

## Best Practices

1. **Resource Management**: Always destroy UI surfaces when no longer needed to prevent memory leaks
2. **Input Focus**: Use `ui.captureInput()` properly to manage input conflicts
3. **Performance**: Minimize frequent UI updates by batching changes when possible
4. **World Space**: Use billboard mode for world-space UI that should always face the camera
5. **Event Cleanup**: Store cleanup functions from `bindAction()` and call them when destroying surfaces

## Error Handling

- Surface IDs must be unique within a scene
- Widget IDs must be unique within their surface
- Invalid surface/widget IDs will be logged but won't crash scripts
- Always check if entities exist before creating world-space UI that follows them
