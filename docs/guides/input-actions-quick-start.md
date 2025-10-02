# Input Actions - Quick Start Guide

This guide will help you get started with the Unity-like Input Actions system in Vibe Coder 3D.

## Opening the Input Settings

1. Click **Settings** in the menu bar
2. Select **Input** from the dropdown
3. The Input Settings modal will open with a 3-column layout

## Understanding the Layout

```
┌─────────────────────────────────────────────────────────┐
│ Settings → Input                                        │
├────────────────┬─────────────┬──────────────────────────┤
│ Action Maps    │ Actions     │ Properties               │
├────────────────┼─────────────┼──────────────────────────┤
│ ▼ Gameplay     │ ▶ Move      │ Action: Move             │
│   • Move       │ ▶ Jump      │ Type: Pass Through       │
│   • Jump       │ ▶ Fire      │ Control: Vector2         │
│   • Fire       │ ▶ Look      │                          │
│   • Look       │             │ Bindings:                │
│ ▼ UI           │             │ • 2D Vector Composite    │
│   • Navigate   │             │   - Up: W                │
│   • Submit     │             │   - Down: S              │
│   • Cancel     │             │   - Left: A              │
│                │             │   - Right: D             │
└────────────────┴─────────────┴──────────────────────────┘
```

## Using Input in Scripts

### Method 1: Polling (Recommended for Movement)

Use `getActionValue()` in your `onUpdate()` method:

```typescript
// Script attached to a player entity
onUpdate(deltaTime) {
  // Get movement input as [x, y] vector
  const moveInput = input.getActionValue("Gameplay", "Move");

  if (Array.isArray(moveInput)) {
    const [x, y] = moveInput;
    const speed = 5;

    // Apply movement
    const currentPos = entity.position;
    entity.position = [
      currentPos[0] + x * speed * deltaTime,
      currentPos[1],
      currentPos[2] + y * speed * deltaTime
    ];
  }
}
```

### Method 2: Events (Recommended for Buttons)

Use `onAction()` for discrete button presses:

```typescript
onStart() {
  // Subscribe to jump action
  input.onAction("Gameplay", "Jump", (phase, value) => {
    if (phase === "started") {
      // Jump was just pressed
      console.log("Jump started!");
      this.jump();
    }
  });

  // Subscribe to fire action
  input.onAction("Gameplay", "Fire", (phase, value) => {
    if (phase === "started") {
      console.log("Fire!");
      this.shoot();
    } else if (phase === "canceled") {
      console.log("Fire released");
    }
  });
}

// Helper methods
jump() {
  const rb = entity.getComponent("RigidBody");
  if (rb) {
    rb.velocity = [rb.velocity[0], 10, rb.velocity[2]];
  }
}

shoot() {
  // Shooting logic here
}
```

### Method 3: Boolean Check

Use `isActionActive()` for simple active/inactive checks:

```typescript
onUpdate(deltaTime) {
  // Check if jump is currently pressed
  if (input.isActionActive("Gameplay", "Jump")) {
    console.log("Jump button is held down");
  }

  // Check if fire is active
  if (input.isActionActive("Gameplay", "Fire")) {
    console.log("Fire button is pressed");
  }
}
```

## Action Phases Explained

When you subscribe to actions with `onAction()`, you get three phases:

1. **started** - Action just became active (button pressed, threshold exceeded)
2. **performed** - Action is still active on subsequent frames
3. **canceled** - Action just became inactive (button released)

```typescript
input.onAction('Gameplay', 'Fire', (phase, value) => {
  switch (phase) {
    case 'started':
      console.log('Fire button pressed!');
      break;
    case 'performed':
      console.log('Fire button still held');
      break;
    case 'canceled':
      console.log('Fire button released');
      break;
  }
});
```

## Common Patterns

### Player Movement (WASD)

```typescript
onUpdate(deltaTime) {
  const move = input.getActionValue("Gameplay", "Move");

  if (Array.isArray(move)) {
    const [x, y] = move;
    const speed = parameters.speed || 5;

    const pos = entity.position;
    entity.position = [
      pos[0] + x * speed * deltaTime,
      pos[1],
      pos[2] + y * speed * deltaTime
    ];
  }
}
```

### Camera Look (Mouse Delta)

```typescript
let rotationX = 0;
let rotationY = 0;

onUpdate(deltaTime) {
  const look = input.getActionValue("Gameplay", "Look");

  if (Array.isArray(look)) {
    const [deltaX, deltaY] = look;
    const sensitivity = 0.002;

    rotationY += deltaX * sensitivity;
    rotationX -= deltaY * sensitivity;

    // Clamp vertical rotation
    rotationX = math.clamp(rotationX, -Math.PI / 2, Math.PI / 2);

    entity.rotation = [rotationX, rotationY, 0];
  }
}
```

### Jump on Button Press

```typescript
onStart() {
  input.onAction("Gameplay", "Jump", (phase) => {
    if (phase === "started" && this.isGrounded()) {
      const rb = entity.getComponent("RigidBody");
      if (rb) {
        rb.velocity = [rb.velocity[0], 10, rb.velocity[2]];
      }
    }
  });
}

isGrounded() {
  // Simple ground check
  return entity.position[1] <= 0.5;
}
```

### Enable/Disable Action Maps

Switch between different control schemes (e.g., gameplay vs UI):

```typescript
onStart() {
  // Disable UI controls during gameplay
  input.disableActionMap("UI");
  input.enableActionMap("Gameplay");
}

openMenu() {
  // Switch to UI controls when menu opens
  input.disableActionMap("Gameplay");
  input.enableActionMap("UI");
}
```

## Default Action Maps

### Gameplay Actions

| Action | Type    | Bindings         |
| ------ | ------- | ---------------- |
| Move   | Vector2 | WASD, Arrow Keys |
| Jump   | Button  | Space            |
| Fire   | Button  | Mouse Left, F    |
| Look   | Vector2 | Mouse Delta      |

### UI Actions

| Action   | Type    | Bindings     |
| -------- | ------- | ------------ |
| Navigate | Vector2 | Arrow Keys   |
| Submit   | Button  | Enter, Space |
| Cancel   | Button  | Escape       |

## Best Practices

1. **Use polling for continuous input** (movement, look)
2. **Use events for discrete actions** (jump, fire, interact)
3. **Always unsubscribe in onDestroy** to prevent memory leaks
4. **Check if value is array** before destructuring Vector2/Vector3
5. **Use meaningful action names** that describe intent, not input
6. **Group related actions** in the same action map

## Troubleshooting

### Action not responding

1. Check if the action map is enabled
2. Verify the action name matches exactly (case-sensitive)
3. Ensure the action exists in the Input Settings modal

### Movement feels wrong

- Check if you're multiplying by `deltaTime`
- Verify the speed parameter is reasonable (3-10 is typical)
- Diagonal movement should be automatically normalized

### Callbacks firing multiple times

- Make sure you're not subscribing in `onUpdate()`
- Subscribe once in `onStart()` instead
- Unsubscribe in `onDestroy()` to prevent duplicates

## Next Steps

- Explore the Input Settings modal to see all available actions
- Create custom action maps for your game's specific needs
- Add new actions and bindings to suit your gameplay
- Refer to the full [Input System Documentation](../architecture/2-11-input-system.md)
