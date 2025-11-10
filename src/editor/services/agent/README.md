# AI Agent Service - Enhanced Workflow

## Overview

The AI Agent Service provides an intelligent assistant for scene creation and manipulation in Vibe Coder 3D. This document describes the enhanced workflow with dynamic shape discovery and flexible scene creation tools.

## Key Features

### 1. Direct Prefab Creation from Primitives (NEW)

**Problem Solved:** Previously, creating a forest required adding 20+ individual trees to the scene first, causing visual clutter and performance overhead before prefabs could be organized.

**Solution:** The `create_from_primitives` action allows the AI to create prefabs directly from primitive specifications without polluting the scene.

```typescript
// AI can now do this in ONE call:
prefab_management({
  action: 'create_from_primitives',
  name: 'Pine Tree',
  primitives: [
    {
      type: 'Cylinder',
      position: { x: 0, y: 0, z: 0 },
      scale: { x: 0.2, y: 1, z: 0.2 },
      name: 'trunk',
    },
    {
      type: 'Cone',
      position: { x: 0, y: 1.5, z: 0 },
      scale: { x: 0.8, y: 1.5, z: 0.8 },
      name: 'foliage',
    },
  ],
});
// Then instantiate 20 times → Clean hierarchy with 1 prefab + 20 instances
```

### 2. Dynamic Shape Discovery

- **Automatic detection** of all available shapes in the codebase
- **Primitive shapes**: Cube, Sphere, Cylinder, **Cone**, Plane, Light (built-in)
- **Custom geometry**: Dynamically scanned from `src/game/geometry/*.shape.json`
- **System prompt integration**: AI knows what shapes exist without hardcoding

### 3. Tool Hierarchy & Workflow

**Tier 1: Single Primitives**

- Use `scene_manipulation` for individual primitives
- Example: "add a cube at (5, 0, 0)"

**Tier 2: Compositions**

- Use `prefab_management.create_from_primitives` for objects made of 2+ primitives
- Creates reusable templates **without scene clutter**

**Tier 3: Multiple Instances**

- Use `prefab_management.instantiate` to place prefab instances
- Each instance references the same prefab template

#### Core Tools

1. **scene_manipulation** - Add/modify primitive shapes
2. **prefab_management** - Create and manage reusable entity templates (ENHANCED)
3. **entity_edit** - Modify existing entities
4. **screenshot_feedback** - Visual verification workflow (includes image in AI conversation)

#### Discovery Tools

5. **get_available_shapes** - Query available shapes dynamically
6. **get_shape_schema** - Inspect geometry file structure
7. **get_scene_info** - Get detailed scene context

## Available Tools

### prefab_management (ENHANCED)

#### create_from_primitives (NEW)

```typescript
{
  action: 'create_from_primitives',
  name: 'Pine Tree',
  primitives: [
    {
      type: 'Cylinder',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.2, y: 1, z: 0.2 },
      name: 'trunk',
      material: {
        color: '#8B4513'  // Brown trunk
      }
    },
    {
      type: 'Cone',
      position: { x: 0, y: 1.5, z: 0 },
      scale: { x: 0.8, y: 1.5, z: 0.8 },
      name: 'foliage',
      material: {
        color: '#228B22'  // Forest green foliage
      }
    }
  ]
}
```

**Returns:** `Created prefab "Pine Tree" (id: "pine-tree") from 2 primitives. You can now instantiate it multiple times using the instantiate action with prefab_id="pine-tree".`

**Use case:** Create reusable prefabs from primitive compositions without cluttering the scene

---

#### instantiate

```typescript
{
  action: 'instantiate',
  prefab_id: 'pine-tree',
  position: { x: 5, y: 0, z: 3 }
}
```

**Returns:** Instance entity ID

**Use case:** Place prefab instances at different positions

---

#### Other actions

- `create_from_selection` - Create prefab from currently selected entities
- `list_prefabs` - Get all available prefabs
- `create_variant` - Create a variant of an existing prefab
- `unpack_instance` - Convert prefab instance to regular entities

---

### get_available_materials (NEW)

```typescript
{
  include_properties: false; // Set to true for full material details
}
```

**Returns:** List of available materials with IDs, names, shader types, and optionally full properties (color, metalness, roughness, etc.)

**Use case:** Discover what materials exist before creating entities with custom materials

**Example response:**

```
Available Materials (1):

- **Default Material** (id: "default")
  - Shader: standard
  - Type: solid

Usage Example:
{
  type: "Cube",
  material: {
    materialId: "default",  // Use existing material ID
    color: "#ff0000"        // OR override with custom color
  }
}
```

---

### get_available_shapes

```typescript
// Get all shapes
{
  filter: 'all';
}

// Get only primitives
{
  filter: 'primitive';
}

// Get only custom geometry
{
  filter: 'geometry';
}
```

**Returns:** List of shapes with name, type, and source

**Use case:** AI discovers what shapes exist before creating entities

---

### get_shape_schema

```typescript
{
  shape_name: 'tree_oak';
}
```

**Returns:**

- Vertex count
- Triangle count
- Attributes (normals, UVs, colors)
- Metadata (ID, name, category, tags)

**Use case:** AI inspects existing geometry to understand structure before creating similar shapes

---

### get_scene_info

```typescript
{
  include_entities: true; // Optional, default false
}
```

**Returns:**

- Scene name
- Total entity count
- Entity types breakdown
- Scene bounds
- Entity details (if requested)

**Use case:** AI understands scene complexity before making changes

---

### screenshot_feedback

```typescript
{
  reason: "Verify cube position after moving to x:5",
  wait_ms: 500  // Optional, default 500ms
}
```

**Returns:**

- Screenshot image (automatically included in AI conversation)
- Scene state (entity count, selected entities, scene name)
- Timestamp

**How it works:**

1. Tool captures canvas screenshot
2. Fires `agent:screenshot-captured` event with base64 image data
3. AgentService intercepts event and stores screenshot
4. When tool result is sent back to AI, image is included in the message
5. AI can visually analyze the screenshot and iterate on changes

**Use case:** AI takes screenshots after making changes to verify visually that everything looks correct, enabling self-correction workflow

---

## Dynamic Shape Discovery Implementation

### Shape Discovery Utility

Location: `src/editor/services/agent/utils/shapeDiscovery.ts`

```typescript
import { getAllShapes, formatShapesForPrompt } from './utils/shapeDiscovery';

// Get all shapes
const shapes = getAllShapes();
// Returns: [{ name: 'Cube', type: 'primitive', source: 'built-in' }, ...]

// Format for system prompt
const promptText = formatShapesForPrompt();
// Includes: primitives, custom geometry, and usage instructions
```

### System Prompt Integration

The system prompt now includes:

- All available primitive shapes (cube, sphere, etc.)
- All custom geometry shapes (tree_oak, battleship, etc.)
- Clear guidance on when to use each tool

Example output:

```
**Available Primitive Shapes (use scene_manipulation):**
Cube, Sphere, Cylinder, Plane, Light

**Available Custom Geometry (reference in prompts):**
tree_oak, tree_pine, battleship, example_box

Note: Custom geometry shapes can be referenced when creating new geometry.
Users can say "add a tree like tree_oak" and you can use that as inspiration.
```

## Workflow Examples

### Example 1: Discovering Available Shapes

```
User: "What shapes can I add?"
AI: Uses get_available_shapes tool with filter: "all"
Response: Lists all primitives and custom geometry
```

### Example 2: Inspecting Existing Geometry

```
User: "I want a tree similar to tree_oak"
AI:
  1. Uses get_shape_schema with shape_name: "tree_oak"
  2. Reviews structure (vertices: 245, triangles: 156, etc.)
  3. Uses geometry_creation to make a similar tree
```

### Example 3: Scene Analysis Before Changes

```
User: "Add 100 cubes randomly"
AI:
  1. Uses get_scene_info to check current entity count
  2. If scene is already complex, suggests optimization
  3. Proceeds with scene_manipulation to add cubes
```

## Architecture

```
AgentService.ts
├── buildSystemPrompt()          # Injects dynamic shape list
│   └── formatShapesForPrompt()  # From shapeDiscovery.ts
│
├── AVAILABLE_TOOLS[]
│   ├── scene_manipulation       # Primitives only
│   ├── geometry_creation        # Custom shapes
│   ├── get_available_shapes     # Discovery tool
│   ├── get_shape_schema         # Schema inspector
│   └── get_scene_info           # Scene context
│
└── executeTool()                # Routes to tool executors
```

## Benefits

### 1. No Hardcoding

- Adding a new `.shape.json` file automatically makes it available to the AI
- No code changes needed to expand shape library
- System prompt stays up-to-date

### 2. Intelligent Scene Creation

- AI knows exactly what shapes exist
- Can reference existing shapes when creating new ones
- Understands scene context before modifications

### 3. Better User Experience

- AI can suggest available shapes
- More accurate responses about capabilities
- Fewer errors from requesting non-existent shapes

### 4. Flexible Workflow

- Tools build on each other (discovery → inspection → creation)
- AI can gather context before making changes
- Visual feedback loop with screenshot_feedback

## File Structure

```
src/editor/services/agent/
├── AgentService.ts                       # Main service
├── utils/
│   └── shapeDiscovery.ts                 # Shape discovery utility
├── tools/
│   ├── index.ts                          # Tool registry
│   ├── SceneManipulationTool.ts          # Primitive shapes (dynamic)
│   ├── GeometryCreationTool.ts           # Custom geometry
│   ├── GetAvailableShapesTool.ts         # NEW: Discovery
│   ├── GetShapeSchemaTool.ts             # NEW: Inspector
│   └── GetSceneInfoTool.ts               # NEW: Context
└── README.md                             # This file
```

## Implementation Details

### Prefab Creation from Primitives - Transform Order

**Critical:** When creating prefabs from primitives, the order of operations matters:

```typescript
// ✅ CORRECT ORDER:
1. Create primitive entity (default transform at 0,0,0)
2. Parent to container (transform becomes relative to container)
3. Set desired transform (relative position within prefab)
4. Create prefab from container (captures relative transforms)

// ❌ WRONG ORDER (old implementation):
1. Create primitive entity
2. Set absolute transform
3. Parent to container (transform was already set - becomes wrong relative)
4. Create prefab from container (captures incorrect transforms)
```

**Why this matters:**

- Primitives are positioned **relative to the prefab's root**
- If trunk is at y:0 and foliage at y:1.5, the foliage should be 1.5 units above trunk
- When prefab is instantiated, all children maintain correct relative positions

### Event Handler Flow

```typescript
handleCreatePrefabFromPrimitives():
  1. Create container entity (at 0,0,0)
  2. For each primitive spec:
     a. Create primitive entity
     b. Parent to container (NOW transforms are relative)
     c. Apply spec transform (position, rotation, scale)
  3. Create prefab from container (serializes with correct relative transforms)
  4. Cleanup: unparent children, delete container
  5. Prefab ready for instantiation
```

## Adding New Shapes

To add a new shape to the system:

1. **Create geometry file**: `src/game/geometry/my_shape.shape.json`
2. **Done!** - The shape is automatically:
   - Discovered by `shapeDiscovery.ts`
   - Added to system prompt
   - Available via `get_available_shapes` tool
   - Inspectable via `get_shape_schema` tool

No code changes required!

## Future Enhancements

- [ ] Batch shape operations (add multiple shapes at once)
- [ ] Shape variants and LOD levels
- [ ] Material presets library
- [ ] Scene templates and presets
- [ ] Undo/redo for agent actions
- [ ] Real-time preview during creation
- [ ] Physics simulation preview
- [ ] Performance profiling tool

## Testing

To test the enhanced workflow:

1. Start dev server: `yarn dev`
2. Open chat panel (Ctrl+/)
3. Try these commands:
   - "What shapes are available?"
   - "Show me the schema for tree_oak"
   - "What's in the current scene?"
   - "Add a red cube at (5, 0, 0)"

## Debugging

Enable detailed logging:

```typescript
import { Logger } from '@core/lib/logger';

// In browser console:
Logger.setLevel('debug');
```

View agent logs:

- `AgentService` - Main service operations
- `ShapeDiscovery` - Shape scanning results
- `[ToolName]Tool` - Individual tool execution

## Contributing

When adding new tools:

1. Create tool file in `tools/` directory
2. Define tool schema with proper types
3. Implement executor function
4. Add to `tools/index.ts`:
   - Import tool and executor
   - Add to `AVAILABLE_TOOLS` array
   - Add case to `executeTool()` switch
5. Update this README

## License

Part of Vibe Coder 3D - See project LICENSE
