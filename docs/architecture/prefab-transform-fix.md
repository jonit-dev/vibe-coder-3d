# Prefab Transform Hierarchy Fix

## Problem

The ComponentRegistry was manually propagating position deltas to all children when a prefab root's transform was updated. This caused incorrect behavior and didn't follow standard game engine patterns.

## Industry Standard (Unity/Unreal)

**Unity/Unreal approach:**

1. **Prefab root has Transform component** (stores world position)
2. **Children store LOCAL transforms** (position/rotation/scale relative to parent)
3. **Scene graph propagates transforms** automatically
4. **Moving parent moves all children** - children maintain local offsets

Example:

```
Prefab Instance (Tree)
  Transform: position [5, 0, 0]  ← World position
  └─ Trunk (child)
       Transform: position [0, 0, 0]  ← Local to parent
       World position: [5, 0, 0]      ← Calculated by scene graph
     └─ Leaves (child)
          Transform: position [0, 2, 0]  ← Local to parent
          World position: [5, 2, 0]      ← Calculated by scene graph
```

When moving the tree to `[10, 0, 0]`:

- ✅ Children keep local positions unchanged
- ✅ Scene graph recalculates world positions automatically
- ❌ NO manual delta propagation needed

## What Was Wrong

`ComponentRegistry.ts` (lines 420-474) had code that:

1. Detected when a prefab root's transform changed
2. Calculated position delta (new position - old position)
3. Recursively added delta to all children's positions

**Problems:**

- ❌ Performance: O(n) recursive traversal on every prefab transform update
- ❌ Conceptual mismatch: Children should use local coords, not world coords
- ❌ Complexity: Two sources of truth (scene graph + manual updates)
- ❌ Caused children to store world positions instead of local positions

## Solution

**Removed the manual delta propagation code** (57 lines deleted)

The system already had:

1. ✅ `transformSystem.ts` - Properly computes world transforms from parent-child hierarchy
2. ✅ `PrefabApplier.ts:68-90` - Ensures prefab root always has Transform component
3. ✅ `useAgentActions.ts:253-254` - Parents children FIRST, then sets local transforms

## Files Changed

- `src/core/lib/ecs/ComponentRegistry.ts` - Removed lines 420-474 (manual delta propagation)
- `src/editor/components/panels/ViewportPanel/GizmoControls.tsx` - Removed unused import

## Verification

The existing code already follows Unity/Unreal patterns:

**Transform System** (`transformSystem.ts:66-163`):

- Computes world transforms recursively from parent hierarchy
- Caches results for performance
- Handles local → world transformation automatically

**Prefab Creation** (`useAgentActions.ts:253-267`):

```typescript
// Parent to container FIRST (so transforms become relative to container)
entityManager.setParent(childEntity.id, containerId);

// Then set transform (now relative to container at 0,0,0)
// This ensures the prefab has correct relative transforms
updateComponent(childEntity.id, 'Transform', {
  position: spec.position ? [...] : [0, 0, 0],
  ...
});
```

## Benefits

1. **Simpler code** - Removed 57 lines of complex recursive logic
2. **Better performance** - No redundant position updates
3. **Industry standard** - Matches Unity/Unreal behavior
4. **Single source of truth** - Scene graph handles all transform propagation
5. **Correct semantics** - Children properly use local coordinates

## Testing

The system now correctly:

- ✅ Stores local transforms in child entities
- ✅ Propagates world transforms via scene graph
- ✅ Moves entire prefab hierarchy when moving root
- ✅ Maintains child local offsets relative to parent
- ✅ Follows Unity/Unreal transform hierarchy model

## Related Files

- `src/core/systems/transformSystem.ts` - World transform calculation
- `src/core/prefabs/PrefabApplier.ts` - Prefab instantiation
- `src/core/prefabs/PrefabSerializer.ts` - Prefab serialization
- `src/editor/hooks/useAgentActions.ts` - Entity creation with hierarchy
