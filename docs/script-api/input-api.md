# Input API

The Input API provides comprehensive access to keyboard, mouse, and gamepad input through both direct polling and event-driven action systems. It supports simple key checks, complex input mappings, and pointer lock for FPS-style controls.

## Overview

The Input API includes:

- Direct keyboard and mouse input polling
- Input action system for customizable controls
- Mouse pointer management
- Input map enable/disable functionality

## Keyboard Input

### Key States

#### `input.isKeyDown(key)`

Check if a key is currently held down (continuous trigger).

**Parameters:**

- `key` (string): Key name (e.g., "w", "space", "shift", "up")

**Returns:**

- `boolean`: true if key is held down

**Example:**

```javascript
function onUpdate() {
  if (input.isKeyDown('w')) {
    entity.transform.translate(0, 0, -0.1);
  }

  if (input.isKeyDown('shift')) {
    // Running state
    speed = runSpeed;
  } else {
    speed = walkSpeed;
  }
}
```

#### `input.isKeyPressed(key)`

Check if a key was just pressed this frame (single trigger).

**Parameters:**

- `key` (string): Key name

**Returns:**

- `boolean`: true if key was pressed this frame

**Example:**

```javascript
function onUpdate() {
  if (input.isKeyPressed('space')) {
    console.log('Jump!'); // Only fires once per press
    performJump();
  }

  if (input.isKeyPressed('r')) {
    reloadWeapon();
  }
}
```

#### `input.isKeyReleased(key)`

Check if a key was just released this frame.

**Parameters:**

- `key` (string): Key name

**Returns:**

- `boolean`: true if key was released this frame

**Example:**

```javascript
function onUpdate() {
  if (input.isKeyReleased('space')) {
    console.log('Jump released!');
    // Stop jump animation
  }
}
```

### Common Key Names

- **Letters**: "a", "b", "c", ... "z"
- **Numbers**: "0", "1", "2", ... "9"
- **Special keys**: "space", "enter", "escape", "tab", "backspace"
- **Modifiers**: "shift", "ctrl", "alt", "meta" (cmd/windows)
- **Arrow keys**: "up", "down", "left", "right"
- **Function keys**: "f1", "f2", ... "f12"

## Mouse Input

### Button States

#### `input.isMouseButtonDown(button)`

Check if a mouse button is currently held down.

**Parameters:**

- `button` (number): Mouse button (0=left, 1=middle, 2=right)

**Returns:**

- `boolean`: true if button is held down

**Example:**

```javascript
function onUpdate() {
  if (input.isMouseButtonDown(0)) {
    console.log('Left mouse button held');
    // Continuous firing
    fireWeapon();
  }
}
```

#### `input.isMouseButtonPressed(button)`

Check if a mouse button was just pressed this frame.

**Example:**

```javascript
function onUpdate() {
  if (input.isMouseButtonPressed(0)) {
    console.log('Left click - start firing');
    startFiring();
  }

  if (input.isMouseButtonPressed(1)) {
    console.log('Middle click - zoom');
    toggleZoom();
  }

  if (input.isMouseButtonPressed(2)) {
    console.log('Right click - context menu');
    showContextMenu();
  }
}
```

### Mouse Position and Movement

#### `input.mousePosition()`

Get current mouse position relative to canvas.

**Returns:**

- `[number, number]`: [x, y] position in pixels

**Example:**

```javascript
function onUpdate() {
  const [mouseX, mouseY] = input.mousePosition();

  // Update cursor position indicator
  ui.updateWidget('cursor', 'position', {
    x: mouseX,
    y: mouseY,
  });
}
```

#### `input.mouseDelta()`

Get mouse movement delta since last frame.

**Returns:**

- `[number, number]`: [dx, dy] movement in pixels

**Example:**

```javascript
function onUpdate() {
  const [dx, dy] = input.mouseDelta();

  // FPS camera controls
  entity.transform.rotate(-dy * 0.002, -dx * 0.002, 0);
}
```

#### `input.mouseWheel()`

Get mouse wheel delta.

**Returns:**

- `number`: Wheel movement (positive=up, negative=down)

**Example:**

```javascript
function onUpdate() {
  const wheelDelta = input.mouseWheel();

  if (wheelDelta !== 0) {
    zoomLevel += wheelDelta * 0.1;
    zoomLevel = math.clamp(zoomLevel, 0.1, 10.0);
  }
}
```

### Pointer Lock

#### `input.lockPointer()`

Lock the mouse pointer for FPS-style controls.

**Example:**

```javascript
function onStart() {
  input.lockPointer(); // Enables pointer lock for FPS controls
}

function onEnable() {
  input.lockPointer(); // Re-lock when re-enabled
}
```

#### `input.unlockPointer()`

Unlock the mouse pointer.

**Example:**

```javascript
function onDisable() {
  input.unlockPointer(); // Release pointer when disabled
}

function showPauseMenu() {
  input.unlockPointer(); // Show cursor for menu navigation
}
```

#### `input.isPointerLocked()`

Check if pointer is currently locked.

**Returns:**

- `boolean`: true if pointer is locked

**Example:**

```javascript
function togglePointerLock() {
  if (input.isPointerLocked()) {
    input.unlockPointer();
  } else {
    input.lockPointer();
  }
}
```

## Input Actions System

The input actions system provides a flexible way to handle input through named actions and action maps, making it easy to support keyboard, gamepad, and custom control schemes.

### Action Polling

#### `input.getActionValue(actionMapName, actionName)`

Get current value of an input action.

**Parameters:**

- `actionMapName` (string): Name of the action map (e.g., "Gameplay", "UI")
- `actionName` (string): Name of the action (e.g., "Move", "Jump")

**Returns:**

- `number | [number, number] | [number, number, number]`: Action value based on action type

**Example:**

```javascript
function onUpdate() {
  // 2D movement action (vector)
  const moveInput = input.getActionValue('Gameplay', 'Move');
  if (Array.isArray(moveInput)) {
    const [x, y] = moveInput;
    entity.transform.translate(x * speed * time.deltaTime, 0, y * speed * time.deltaTime);
  }

  // Look action (2D vector for mouse look)
  const lookInput = input.getActionValue('Gameplay', 'Look');
  if (Array.isArray(lookInput)) {
    const [dx, dy] = lookInput;
    entity.transform.rotate(-dy * 0.002, dx * 0.002, 0);
  }

  // Jump action (button)
  const jumpInput = input.getActionValue('Gameplay', 'Jump');
  if (jumpInput > 0.5 && entity.controller.isGrounded()) {
    entity.controller.jump(8.0);
  }
}
```

#### `input.isActionActive(actionMapName, actionName)`

Check if an input action is currently active.

**Parameters:**

- `actionMapName` (string): Name of the action map
- `actionName` (string): Name of the action

**Returns:**

- `boolean`: true if action is active (value > threshold)

**Example:**

```javascript
function onUpdate() {
  if (input.isActionActive('Gameplay', 'Sprint')) {
    currentSpeed = runSpeed;
  } else {
    currentSpeed = walkSpeed;
  }

  if (input.isActionActive('Gameplay', 'Fire')) {
    fireWeapon();
  }

  if (input.isActionActive('Gameplay', 'Aim')) {
    zoomIn();
  }
}
```

### Action Events

#### `input.onAction(actionMapName, actionName, callback)`

Subscribe to input action events (event-driven).

**Parameters:**

- `actionMapName` (string): Name of the action map
- `actionName` (string): Name of the action
- `callback` (function): Function called when action state changes

**Callback signature:**

```javascript
(phase, value) => {
  // phase: 'started' | 'performed' | 'canceled'
  // value: number | [number, number] | [number, number, number]
};
```

**Example:**

```javascript
function onStart() {
  // Jump event
  input.onAction('Gameplay', 'Jump', (phase, value) => {
    if (phase === 'started' && entity.controller.isGrounded()) {
      entity.controller.jump(8.0);
      console.log('Jump started');
    }
  });

  // Fire event
  input.onAction('Gameplay', 'Fire', (phase, value) => {
    if (phase === 'started') {
      startFiring();
      console.log('Fire button pressed');
    } else if (phase === 'canceled') {
      stopFiring();
      console.log('Fire button released');
    }
  });

  // Reload event
  input.onAction('Gameplay', 'Reload', (phase, value) => {
    if (phase === 'started') {
      reloadWeapon();
    }
  });
}
```

#### `input.offAction(actionMapName, actionName, callback)`

Unsubscribe from input action events.

**Example:**

```javascript
function onDestroy() {
  // Clean up action listeners
  input.offAction('Gameplay', 'Jump', jumpHandler);
  input.offAction('Gameplay', 'Fire', fireHandler);
}
```

### Action Map Management

#### `input.enableActionMap(mapName)`

Enable an action map.

**Example:**

```javascript
function showPauseMenu() {
  input.enableActionMap('UI'); // Enable UI controls
  input.disableActionMap('Gameplay'); // Disable gameplay controls
}

function hidePauseMenu() {
  input.enableActionMap('Gameplay'); // Enable gameplay controls
  input.disableActionMap('UI'); // Disable UI controls
}
```

#### `input.disableActionMap(mapName)`

Disable an action map.

**Example:**

```javascript
function onDeath() {
  input.disableActionMap('Gameplay'); // Disable all gameplay input
  input.enableActionMap('Respawn'); // Enable respawn input only
}
```

## Complete Examples

### First-Person Controller

```javascript
const mouseSensitivity = 0.002;
const moveSpeed = 5.0;
const jumpForce = 8.0;

function onStart() {
  input.lockPointer();

  // Setup action listeners
  input.onAction('Gameplay', 'Jump', (phase) => {
    if (phase === 'started' && entity.controller.isGrounded()) {
      entity.controller.jump(jumpForce);
    }
  });
}

function onUpdate() {
  // Mouse look
  const [dx, dy] = input.mouseDelta();
  entity.transform.rotate(-dy * mouseSensitivity, dx * mouseSensitivity, 0);

  // Movement
  const moveInput = input.getActionValue('Gameplay', 'Move');
  if (Array.isArray(moveInput)) {
    const [x, y] = moveInput;
    entity.controller.move([x, y], moveSpeed, time.deltaTime);
  }

  // Sprint
  if (input.isActionActive('Gameplay', 'Sprint')) {
    currentSpeed = moveSpeed * 2;
  }
}

function onDestroy() {
  input.unlockPointer();
}
```

### Third-Person Controller

```javascript
const moveSpeed = 5.0;
const rotationSpeed = 180.0;
let isAiming = false;

function onUpdate() {
  // Movement
  let moveX = 0;
  let moveZ = 0;

  if (input.isKeyDown('w')) moveZ = -1;
  if (input.isKeyDown('s')) moveZ = 1;
  if (input.isKeyDown('a')) moveX = -1;
  if (input.isKeyDown('d')) moveX = 1;

  // Normalize movement
  if (moveX !== 0 || moveZ !== 0) {
    const length = math.sqrt(moveX * moveX + moveZ * moveZ);
    moveX /= length;
    moveZ /= length;
  }

  // Apply movement relative to camera
  const currentRot = entity.transform.rotation[1];
  const radians = math.degToRad(currentRot);
  const cosAngle = math.cos(radians);
  const sinAngle = math.sin(radians);

  const worldMoveX = moveX * cosAngle - moveZ * sinAngle;
  const worldMoveZ = moveX * sinAngle + moveZ * cosAngle;

  entity.transform.translate(
    worldMoveX * moveSpeed * time.deltaTime,
    0,
    worldMoveZ * moveSpeed * time.deltaTime,
  );

  // Rotation
  if (input.isKeyDown('q')) {
    entity.transform.rotate(0, -rotationSpeed * time.deltaTime, 0);
  }
  if (input.isKeyDown('e')) {
    entity.transform.rotate(0, rotationSpeed * time.deltaTime, 0);
  }

  // Jump
  if (input.isKeyPressed('space') && entity.controller.isGrounded()) {
    entity.controller.jump(8.0);
  }
}
```

### RTS Camera Controls

```javascript
const cameraSpeed = 10.0;
const edgePanMargin = 50;
const minZoom = 5.0;
const maxZoom = 50.0;

function onUpdate() {
  // Keyboard movement
  let moveX = 0;
  let moveZ = 0;

  if (input.isKeyDown('w') || input.isKeyDown('up')) moveZ = -1;
  if (input.isKeyDown('s') || input.isKeyDown('down')) moveZ = 1;
  if (input.isKeyDown('a') || input.isKeyDown('left')) moveX = -1;
  if (input.isKeyDown('d') || input.isKeyDown('right')) moveX = 1;

  // Edge of screen panning
  const [mouseX, mouseY] = input.mousePosition();
  const [screenWidth, screenHeight] = [window.innerWidth, window.innerHeight];

  if (mouseX < edgePanMargin) moveX = -1;
  if (mouseX > screenWidth - edgePanMargin) moveX = 1;
  if (mouseY < edgePanMargin) moveZ = -1;
  if (mouseY > screenHeight - edgePanMargin) moveZ = 1;

  // Apply movement
  if (moveX !== 0 || moveZ !== 0) {
    const currentPos = entity.transform.position;
    const normalizedSpeed = cameraSpeed * time.deltaTime;

    entity.transform.setPosition(
      currentPos[0] + moveX * normalizedSpeed,
      currentPos[1],
      currentPos[2] + moveZ * normalizedSpeed,
    );
  }

  // Zoom with mouse wheel
  const wheelDelta = input.mouseWheel();
  if (wheelDelta !== 0) {
    const currentPos = entity.transform.position;
    const newHeight = math.clamp(currentPos[1] + wheelDelta * 2, minZoom, maxZoom);
    entity.transform.setPosition(currentPos[0], newHeight, currentPos[2]);
  }
}
```

### UI Navigation

```javascript
let selectedButtonIndex = 0;
const buttons = ['resume', 'settings', 'quit'];

function onStart() {
  input.enableActionMap('UI');
  input.disableActionMap('Gameplay');

  input.onAction('UI', 'Navigate', (phase, value) => {
    if (phase === 'started') {
      if (Array.isArray(value)) {
        const [x, y] = value;

        if (y < -0.5) {
          navigateUp();
        } else if (y > 0.5) {
          navigateDown();
        }
      }
    }
  });

  input.onAction('UI', 'Select', (phase) => {
    if (phase === 'started') {
      activateCurrentButton();
    }
  });

  input.onAction('UI', 'Back', (phase) => {
    if (phase === 'started') {
      closeMenu();
    }
  });
}

function navigateUp() {
  selectedButtonIndex = (selectedButtonIndex - 1 + buttons.length) % buttons.length;
  updateButtonHighlight();
}

function navigateDown() {
  selectedButtonIndex = (selectedButtonIndex + 1) % buttons.length;
  updateButtonHighlight();
}

function updateButtonHighlight() {
  buttons.forEach((buttonId, index) => {
    ui.updateWidget('pause-menu', buttonId, {
      color: index === selectedButtonIndex ? '#ffff00' : '#ffffff',
    });
  });
}

function activateCurrentButton() {
  const currentButton = buttons[selectedButtonIndex];
  console.log(`Activated: ${currentButton}`);

  switch (currentButton) {
    case 'resume':
      closeMenu();
      break;
    case 'settings':
      openSettings();
      break;
    case 'quit':
      quitGame();
      break;
  }
}
```

### Vehicle Controls

```javascript
const maxSpeed = 20.0;
const acceleration = 10.0;
const turnSpeed = 60.0;
let currentSpeed = 0;

function onUpdate() {
  // Acceleration/braking
  if (input.isKeyDown('w')) {
    currentSpeed = math.min(currentSpeed + acceleration * time.deltaTime, maxSpeed);
  } else if (input.isKeyDown('s')) {
    currentSpeed = math.max(currentSpeed - acceleration * time.deltaTime, -maxSpeed * 0.5);
  } else {
    // Friction
    currentSpeed *= 0.95;
  }

  // Steering
  let turnInput = 0;
  if (input.isKeyDown('a')) turnInput = -1;
  if (input.isKeyDown('d')) turnInput = 1;

  // Apply turn (more effective at higher speeds)
  const turnAmount = turnInput * turnSpeed * (currentSpeed / maxSpeed) * time.deltaTime;
  entity.transform.rotate(0, turnAmount, 0);

  // Apply forward movement
  const forward = entity.transform.forward();
  entity.transform.translate(
    forward[0] * currentSpeed * time.deltaTime,
    0,
    forward[2] * currentSpeed * time.deltaTime,
  );

  // Handbrake
  if (input.isKeyDown('space')) {
    currentSpeed *= 0.9;
  }
}
```

## Best Practices

1. **Use Action System**: Prefer input actions over direct key checks for better control mapping support
2. **Delta Time**: Always multiply input-based movement by `time.deltaTime` for frame-rate independence
3. **Pointer Management**: Remember to lock/unlock pointer appropriately
4. **Action Maps**: Use action maps to organize different input contexts (Gameplay, UI, Menu, etc.)
5. **Event Cleanup**: Remove action event listeners in `onDestroy()` to prevent memory leaks
6. **Normalization**: Normalize diagonal movement to maintain consistent speed

## Error Handling

- Invalid key names will return `false` for all key checks
- Mouse position is relative to the canvas, not screen coordinates
- Action values depend on the input system configuration
- Ensure action maps exist before enabling/disabling them
- Pointer lock requires user interaction and only works in certain contexts
