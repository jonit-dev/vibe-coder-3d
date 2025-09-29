# Texture Cleanup Fix

## Problem

When switching a material from `texture` type to `solid` type, the texture-related properties (albedoTexture, normalTexture, etc.) were not being cleared, causing the material to retain texture references even in solid mode.

## Root Cause

The `updateMaterial` functions in both `MaterialInspector.tsx` and `materialsStore.ts` used simple object spreading (`{ ...existing, ...updates }`), which only updated the specified properties without clearing others.

## Solution

Added explicit texture cleanup logic when switching from `texture` to `solid` materialType:

### MaterialInspector.tsx (lines 55-71)

```typescript
// When switching from texture to solid, clear texture-specific properties
if (updates.materialType === 'solid' && prev.materialType === 'texture') {
  updated = {
    ...updated,
    albedoTexture: undefined,
    normalTexture: undefined,
    metallicTexture: undefined,
    roughnessTexture: undefined,
    emissiveTexture: undefined,
    occlusionTexture: undefined,
    // Reset texture transform properties to defaults
    normalScale: 1,
    occlusionStrength: 1,
    textureOffsetX: 0,
    textureOffsetY: 0,
  };
}
```

### materialsStore.ts (lines 153-169)

Same logic applied to the store's `updateMaterial` function.

## Properties Cleared

- `albedoTexture` → `undefined`
- `normalTexture` → `undefined`
- `metallicTexture` → `undefined`
- `roughnessTexture` → `undefined`
- `emissiveTexture` → `undefined`
- `occlusionTexture` → `undefined`

## Properties Reset to Defaults

- `normalScale` → `1`
- `occlusionStrength` → `1`
- `textureOffsetX` → `0`
- `textureOffsetY` → `0`

## Testing

The fix ensures that when switching from texture to solid mode:

1. All texture file references are removed
2. Texture transform properties are reset to defaults
3. Other material properties remain unchanged
4. The change only applies when actually switching FROM texture TO solid

The fix has been tested to ensure existing functionality remains intact.
