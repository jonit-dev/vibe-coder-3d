# Testing Material Support in Agent

## What Was Fixed

1. **Prefab positioning** - Primitives now use correct relative transforms
2. **Material support** - Primitives can have colors and material IDs
3. **Material discovery** - AI can query available materials

## How to Test

### 1. Start the Dev Server

```bash
yarn dev
```

### 2. Open Browser Console

Press F12 to see logs from the agent service.

### 3. Test Material Discovery

Ask the AI in chat:

```
What materials are available?
```

**Expected AI behavior:**

- Uses `get_available_materials` tool
- Returns list with "Default Material" (id: "default")
- Shows usage example

**Check logs for:**

```
[GetAvailableMaterialsTool] Getting available materials
[GetAvailableMaterialsTool] Retrieved materials { count: 1 }
```

### 4. Test Colored Prefab Creation

Ask the AI:

```
Create a tree prefab with a brown trunk and green foliage
```

**Expected AI behavior:**

1. Uses `prefab_management` with `create_from_primitives`
2. Specifies cylinder for trunk with `material: { color: '#8B4513' }`
3. Specifies cone/sphere for foliage with `material: { color: '#228B22' }`
4. Creates prefab without adding entities to scene first

**Check logs for:**

```
[useAgentActions] Agent requested prefab creation from primitives
[useAgentActions] Applied material to primitive { entityId: X, material: { color: '#8B4513' } }
[useAgentActions] Applied material to primitive { entityId: Y, material: { color: '#228B22' } }
[useAgentActions] Prefab created from primitives
```

### 5. Test Prefab Instantiation

Ask the AI:

```
Add 5 trees at different positions
```

**Expected AI behavior:**

1. Uses `prefab_management` with `instantiate` action
2. Instantiates the tree prefab 5 times at different positions
3. Each instance should have correctly colored parts

**Check logs for:**

```
[useAgentActions] Agent requested prefab instantiation
[PrefabManager] Instantiated prefab "tree" at (x, y, z)
```

## Debugging

### If materials aren't showing colors:

1. **Check if material update is happening:**

   ```javascript
   // In browser console
   Logger.setLevel('debug');
   ```

2. **Inspect the entity in the hierarchy:**

   - Select the primitive in the hierarchy
   - Check Inspector panel → MeshRenderer component
   - Should see `material.color` property with the hex value

3. **Check prefab serialization:**
   - After creating prefab, check if it saved with material data
   - Look in browser console for prefab JSON structure

### If tool isn't being called:

1. **Check tool is registered:**

   ```bash
   grep "get_available_materials" src/editor/services/agent/tools/index.ts
   ```

   Should appear in AVAILABLE_TOOLS and executeTool switch

2. **Check AI is receiving tool:**
   - AI should see tool in AVAILABLE_TOOLS list
   - Check AgentService system prompt includes material tool

## Expected File Structure

```
src/editor/
├── hooks/
│   └── useAgentActions.ts         # Material application logic (line 181-205)
├── services/agent/
    ├── AgentService.ts             # Includes all tools
    └── tools/
        ├── GetAvailableMaterialsTool.ts  # NEW: Material discovery
        ├── PrefabManagementTool.ts       # UPDATED: Material schema
        └── index.ts                       # Registers material tool
```

## What Should Work Now

✅ AI can discover available materials
✅ AI can apply hex colors to primitives in prefabs
✅ AI can reference material IDs from registry
✅ Prefabs save with material data
✅ Prefab instances inherit correct colors
✅ Transform order is fixed (correct relative positioning)

## Common Issues

### Issue: Colors not appearing

**Cause:** Material update structure incorrect
**Solution:** Material color must be in nested object: `{ material: { color: '#xxx' } }`

### Issue: Tool not found

**Cause:** Tool not registered in index.ts
**Solution:** Check AVAILABLE_TOOLS array and executeTool switch

### Issue: Prefab parts positioned wrong

**Cause:** Transform set before parenting
**Solution:** Fixed - now parents first, then sets transform

## Manual Verification

1. Create a prefab with colored parts
2. Open browser DevTools
3. Run:

```javascript
// Get entity manager
const em = window.__ENTITY_MANAGER__;

// Find prefab instance
const entities = em.getAllEntities();
const tree = entities.find((e) => e.name.includes('tree'));

// Check MeshRenderer component
const comp = componentRegistry.getComponent(tree.id, 'MeshRenderer');
console.log('Material:', comp.material);
```

Should show `{ color: '#8B4513' }` or similar.
