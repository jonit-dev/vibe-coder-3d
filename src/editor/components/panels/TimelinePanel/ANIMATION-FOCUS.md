# Animation Focus Mode

## Overview

When the Animation Timeline panel opens, the editor automatically enters "animation focus mode" to help users concentrate on the entity being animated. This mode provides:

1. **Camera Auto-Framing**: Automatically frames the camera on the focused entity
2. **Scene Fade**: Dims non-focused entities to reduce visual clutter

## Architecture

Following Single Responsibility Principle (SRP), the feature is split into focused, reusable hooks and components:

### Hooks (src/editor/components/panels/TimelinePanel/hooks/)

#### `useAnimationFocus.ts`

- **Responsibility**: Manages focus mode state
- **Returns**: `{ focusedEntityId, isFocusMode }`
- **Logic**: Focus is active when timeline is open AND has an active entity

#### `useCameraFocus.ts`

- **Responsibility**: Auto-frames camera on focused entity
- **Dependencies**: Uses `window.__frameEntity` function
- **Timing**: Small 100ms delay for smooth transition

#### `useSceneFade.ts`

- **Responsibility**: Fades out non-focused entities
- **Features**:
  - Stores original material opacity values
  - Applies configurable fade opacity (default: 0.2)
  - Skips gizmos, helpers, and grid
  - Restores materials on cleanup
- **Performance**: Direct Three.js material manipulation (no React re-renders)

### Components (src/editor/components/panels/TimelinePanel/components/)

#### `AnimationFocusEffect.tsx`

- **Responsibility**: Orchestrates all focus effects
- **Renders**: Inside Three.js Canvas
- **Reads**: Timeline store state directly (no prop drilling)
- **Integrates**: Scene fade hook

## State Management

### Timeline Store Enhancement

Added `isOpen: boolean` to `useTimelineStore`:

- Tracks whether timeline panel is open
- Updated from TimelinePanel props
- Read by AnimationFocusEffect to determine focus mode

### Migration from Local State

Before:

```tsx
// AnimationSection.tsx
const [timelineOpen, setTimelineOpen] = useState(false);
```

After:

```tsx
// AnimationSection.tsx
const { setIsOpen, isOpen: timelineOpen } = useTimelineStore();
```

## Integration Points

### TimelinePanel

```tsx
// src/editor/components/panels/TimelinePanel/TimelinePanel.tsx
const { focusedEntityId, isFocusMode } = useAnimationFocus(isOpen);
useCameraFocus({ focusedEntityId, isFocusMode });
```

### ViewportPanel

```tsx
// src/editor/components/panels/ViewportPanel/ViewportPanel.tsx
const isTimelineOpen = useTimelineStore((state) => state.isOpen);

// Inside Canvas
<AnimationFocusEffect isTimelineOpen={isTimelineOpen} />;
```

## Usage Flow

1. User opens timeline panel by clicking "Edit Timeline" in Animation Inspector
2. `AnimationSection` calls `setIsOpen(true)` and `setActiveEntity(entityId, clip)`
3. `TimelinePanel` hooks trigger:
   - `useAnimationFocus` → returns `isFocusMode: true`
   - `useCameraFocus` → frames camera on entity after 100ms
4. `AnimationFocusEffect` (in ViewportPanel Canvas):
   - `useSceneFade` → fades non-focused entities to 0.2 opacity
5. User closes timeline panel → everything restores to normal

## Performance Considerations

- **No React re-renders**: Scene fade uses direct Three.js manipulation
- **Original values stored**: Material opacity restored on cleanup (no permanent changes)
- **Minimal overhead**: Effects only active when timeline is open
- **Selective fade**: Skips editor UI elements (gizmos, helpers, grid)

## Customization

### Fade Opacity

```tsx
<AnimationFocusEffect isTimelineOpen={isTimelineOpen} fadeOpacity={0.3} />
```

### Disable Auto-Focus

```tsx
useCameraFocus({ focusedEntityId, isFocusMode, enabled: false });
```

## Future Enhancements

Potential improvements:

- Fade animation duration control
- Focus mode toggle button in timeline toolbar
- Focus multiple entities for multi-track animations

## Testing

Manual testing checklist:

- [ ] Open timeline → camera frames entity
- [ ] Open timeline → other entities fade out
- [ ] Close timeline → all effects restore
- [ ] Multiple entities → correct entity focused
- [ ] No entity selected → no effects applied
- [ ] Gizmos/grid → not faded

## Files Modified

- `src/editor/store/timelineStore.ts` - Added `isOpen` state
- `src/editor/components/panels/InspectorPanel/Animation/AnimationSection.tsx` - Use store instead of local state
- `src/editor/components/panels/TimelinePanel/TimelinePanel.tsx` - Added focus hooks
- `src/editor/components/panels/ViewportPanel/ViewportPanel.tsx` - Added AnimationFocusEffect

## Files Created

- `src/editor/components/panels/TimelinePanel/hooks/useAnimationFocus.ts`
- `src/editor/components/panels/TimelinePanel/hooks/useCameraFocus.ts`
- `src/editor/components/panels/TimelinePanel/hooks/useSceneFade.ts`
- `src/editor/components/panels/TimelinePanel/components/AnimationFocusEffect.tsx`
