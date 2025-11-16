# Viewport Refresh System

## Overview

This system ensures the viewport/scene refreshes immediately after every agent tool execution to prevent displaying stale state.

## Problem

When the AI agent executes tools (e.g., creating entities, modifying transforms, instantiating prefabs), the changes were made to the underlying data structures but the Three.js viewport wouldn't always update immediately. This created a poor user experience where the user couldn't see the results of tool calls until something else triggered a re-render.

## Solution

### 1. Viewport Invalidate Exporter Component

**File**: `src/editor/components/panels/ViewportPanel/components/ViewportInvalidateExporter.tsx`

This component runs inside the React Three Fiber Canvas and exposes the `invalidate()` function to the global window object. The `invalidate()` function forces React Three Fiber to re-render the scene on the next frame.

```typescript
// Inside the Canvas
<ViewportInvalidateExporter />
```

This makes the invalidate function available as `window.__editorInvalidate()`.

### 2. Viewport Refresh Utility

**File**: `src/editor/services/agent/tools/utils/viewportRefresh.ts`

A utility function that safely calls the global invalidate function:

```typescript
export function refreshViewport(): void {
  if (window.__editorInvalidate) {
    window.__editorInvalidate();
  }
}
```

### 3. Tool Execution Integration

**File**: `src/editor/services/agent/tools/index.ts`

The `executeTool` function now calls `refreshViewport()` after every tool execution:

```typescript
export async function executeTool(toolName: string, params: ToolParameters): Promise<string> {
  let result: string;

  // ... execute the tool ...

  // Force viewport refresh after every tool execution to avoid stale state
  refreshViewport();

  return result;
}
```

## How It Works

1. **Tool Execution**: AI agent calls a tool (e.g., `scene_manipulation`, `entity_edit`)
2. **Data Update**: Tool updates ECS data structures
3. **Viewport Refresh**: `refreshViewport()` is called automatically
4. **Invalidate**: React Three Fiber's `invalidate()` is triggered
5. **Re-render**: Three.js scene re-renders on the next frame
6. **User Sees Changes**: Visual feedback is immediate

## Benefits

- **Immediate Visual Feedback**: Users see changes as soon as tools execute
- **No Stale State**: Prevents confusion from outdated viewport display
- **Automatic**: Works for all tools without individual implementation
- **Safe**: Gracefully handles cases where invalidate isn't available yet
- **Performance**: Only triggers re-renders when needed (after tool calls)

## Testing

To test the viewport refresh system:

1. Open the editor and the AI chat panel
2. Ask the AI to create/modify entities
3. Observe that changes appear immediately in the viewport
4. Check browser console for "Viewport refreshed after tool execution" debug logs

## Related Files

- `src/editor/components/panels/ViewportPanel/ViewportPanel.tsx` - Includes ViewportInvalidateExporter
- `src/editor/services/agent/AgentService.ts` - Calls executeTool during agent operation
- All tool implementation files in `src/editor/services/agent/tools/`
