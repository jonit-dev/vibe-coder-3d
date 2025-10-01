# Game Scripts Directory

This directory contains **auto-generated** game scripts managed by the External Script System.

> ⚠️ **Note**: Scripts here are excluded from TypeScript compilation and may show type errors in your IDE. This is intentional - see "TypeScript & IDE Setup" below.

## Overview

Scripts in this directory are TypeScript files that define entity behaviors. They can be linked to entities via the Script component and are hot-reloaded during development.

## Two Script Systems

### 1. External Scripts (New - Recommended)
External scripts are standalone `.ts` files in this directory that are loaded dynamically via the Script API. They use pattern-based execution and are ideal for rapid prototyping and editor workflows.

**File Naming**: Use kebab-case or dot-notation: `player-controller.ts` or `game.player-controller.ts`

**Example**:
```typescript
function onStart() {
  console.log('Entity started');
  if (three.mesh) {
    three.material.setColor('#00ff00');
  }
}

function onUpdate(deltaTime) {
  entity.transform.rotate(0, deltaTime * 0.5, 0);
}
```

### 2. Registered Scripts (Legacy)
Legacy system using `registerScript` for compile-time registration.

**Example**:
```typescript
import { registerScript } from '@core';

registerScript({
  id: 'game.player-controller',
  onInit: (entityId) => { /* ... */ },
  onUpdate: (entityId, dt) => { /* ... */ },
  onDestroy: (entityId) => { /* ... */ },
});
```

## External Scripts API

### Available APIs

#### Entity API
- `entity.transform.setPosition(x, y, z)` - Set entity position
- `entity.transform.setRotation(x, y, z)` - Set entity rotation (radians)
- `entity.transform.translate(x, y, z)` - Move entity relatively
- `entity.transform.rotate(x, y, z)` - Rotate entity relatively
- `entity.transform.position` - Get position as `[x, y, z]`
- `entity.transform.rotation` - Get rotation as `[x, y, z]`

#### Three.js API
- `three.material.setColor(color)` - Set material color (e.g., `"#ff0000"`)
- `three.mesh` - Access to the Three.js mesh object
- `three.scene` - Access to the Three.js scene

#### Time API
- `time.time` - Current time in seconds
- `time.deltaTime` - Frame time in seconds
- `time.frameCount` - Total frames rendered

#### Console API
- `console.log(message)` - Log messages (visible in console)

### Script API Endpoints

Development endpoints available at `http://localhost:5173/api/script/`:

- `POST /api/script/save` - Save or update a script
- `GET /api/script/load?id=<id>` - Load a script by ID
- `GET /api/script/list` - List all available scripts
- `POST /api/script/rename` - Rename a script
- `POST /api/script/delete` - Delete a script
- `POST /api/script/validate` - Validate script code
- `GET /api/script/diff?id=<id>&hash=<hash>` - Check for changes

## TypeScript & IDE Setup

### Why Type Errors Appear

Scripts in this directory are **excluded from the TypeScript build** (`tsconfig.json` line 30):
```json
"exclude": ["src/game/scripts/*.ts", ...]
```

This is by design because:
1. Scripts are executed at runtime by the `ScriptExecutor`, not compiled
2. Global APIs (`entity`, `three`, etc.) are injected at runtime
3. Similar to Unity's C# scripts - they're not part of the editor codebase

### Type Definitions

The `script-api.d.ts` file provides TypeScript definitions for:
- ✅ Autocomplete in your IDE
- ✅ IntelliSense for API methods
- ✅ Type hints for function parameters

### Suppressing IDE Errors

If your IDE shows errors on `entity`, `three`, etc., you can:
1. **Ignore them** - The scripts work fine at runtime
2. **Add a workspace setting** (VSCode):
   ```json
   {
     "typescript.tsserver.watchOptions": {
       "excludeDirectories": ["src/game/scripts"]
     }
   }
   ```

## Best Practices

1. **Keep scripts small and focused** - Each script should handle one behavior
2. **Use parameters** - Configure behavior via script parameters in the editor
3. **Handle errors gracefully** - Scripts that throw errors will be disabled automatically
4. **Use deltaTime** - Multiply movement/rotation by `deltaTime` for frame-rate independence
5. **Test in Play Mode** - Scripts only execute when play mode is active

## Security

Scripts use a safe pattern-based executor:
- No `eval()` or `Function()` constructor
- Limited to predefined API surface
- Sandboxed execution context
- File size limited to 256KB per script
