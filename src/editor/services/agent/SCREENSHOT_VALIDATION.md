# Screenshot Validation System

This document explains how the AI agent captures, analyzes, and displays screenshots for visual validation.

## Overview

The screenshot validation system allows the AI agent to:

1. Capture screenshots of the 3D scene
2. Send the image to the AI for visual analysis
3. Display both the screenshot and analysis in the chat UI
4. Validate that scene changes match expectations

## Architecture

### Components

1. **ScreenshotFeedbackTool** (`tools/ScreenshotFeedbackTool.ts`)

   - Captures canvas screenshot as base64 PNG
   - Collects scene metadata (entity count, selected entities, etc.)
   - Dispatches `agent:screenshot-captured` event

2. **AgentService** (`AgentService.ts`)

   - Listens for screenshot events
   - Includes image in tool result sent to AI
   - Captures AI's analysis response
   - Dispatches `agent:screenshot-analysis` event

3. **ChatPanel** (`components/chat/ChatPanel.tsx`)
   - Listens for both screenshot and analysis events
   - Displays screenshot thumbnails in chat
   - Shows AI's visual analysis separately
   - Stores screenshots in chat history

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. AI calls screenshot_feedback tool                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ScreenshotFeedbackTool                                        │
│    - Captures canvas as base64                                   │
│    - Gets scene info (entity count, selected, etc.)             │
│    - Dispatches: agent:screenshot-captured                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ├──────────────────────────────┐
                          ▼                              ▼
┌─────────────────────────────────────┐  ┌─────────────────────────┐
│ 3a. ChatPanel                       │  │ 3b. AgentService        │
│     - Adds screenshot message       │  │     - Stores pending    │
│     - Displays thumbnail            │  │       screenshot        │
│     - Shows scene metadata          │  │                         │
└─────────────────────────────────────┘  └────────┬────────────────┘
                                                   │
                          ┌────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. AgentService sends tool result to AI                         │
│    - Includes image as base64 in result                         │
│    - Prompts AI to analyze the screenshot                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. AI responds with visual analysis                             │
│    - Describes what it sees                                      │
│    - Verifies expected changes                                   │
│    - Identifies issues                                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. AgentService captures analysis text                          │
│    - Detects it's a post-screenshot response                    │
│    - Dispatches: agent:screenshot-analysis                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. ChatPanel displays analysis                                   │
│    - Shows as distinct "Visual Analysis" message                │
│    - Green highlight to differentiate from regular messages     │
└─────────────────────────────────────────────────────────────────┘
```

## Message Types in Chat

### Screenshot Message

- **Type**: `screenshot`
- **Styling**: Purple gradient border
- **Content**:
  - Screenshot thumbnail (clickable for full size)
  - Capture reason
  - Scene metadata (entity count, selected entities)
  - Timestamp

### Analysis Message

- **Type**: `analysis`
- **Styling**: Green gradient border
- **Content**:
  - AI's visual analysis text
  - Timestamp
  - "Visual Analysis" header

## Usage Example

```typescript
// AI agent calls the tool
await executeTool('screenshot_feedback', {
  reason: 'Verify 10 trees were added to scene',
  wait_ms: 500,
});

// Screenshot is captured and displayed in chat
// Image is sent to AI in tool result
// AI responds with analysis:
// "I can see 10 trees positioned throughout the scene at varying positions..."
```

## Validation Points

The system validates:

1. **Screenshot Capture**: Confirms canvas capture succeeded
2. **Image Transmission**: Logs image size being sent to AI
3. **AI Receipt**: AI must analyze the image (prompted explicitly)
4. **Analysis Capture**: Logs analysis text length and preview
5. **UI Display**: Both screenshot and analysis appear in chat

## Debugging

### Check Screenshot Capture

Look for log: `Screenshot captured, will include in next tool result`

### Check Image Transmission

Look for log: `Including screenshot in tool result` with image size

### Check AI Analysis

Look for log: `Screenshot tool detected, will capture next text as analysis`

### Check Analysis Capture

Look for log: `Screenshot analysis captured` with preview text

### Check UI Display

Both messages should appear in ChatPanel with distinct styling

## Configuration

**Wait Time**: Default 500ms before capture (configurable via `wait_ms` parameter)
**Image Format**: PNG, base64 encoded
**Max Analysis Length**: Captures until double newline or 500 characters

## Technical Details

### Event Names

- `agent:screenshot-captured` - Fired when screenshot is taken
- `agent:screenshot-analysis` - Fired when AI provides analysis

### Metadata Structure

```typescript
interface IScreenshotMetadata {
  imageData: string; // base64 PNG
  sceneInfo: {
    entity_count: number;
    camera_position: string;
    selected_entities: number[];
    scene_name: string | null;
  };
  reason: string; // Why screenshot was taken
}
```

### Chat Message Structure

```typescript
interface IChatMessage {
  id: string;
  type: 'screenshot' | 'analysis' | 'user' | 'ai';
  content: string;
  timestamp: Date;
  imageData?: string; // Only for screenshot type
  sceneInfo?: {
    // Only for screenshot type
    entity_count: number;
    camera_position: string;
    selected_entities: number[];
    scene_name: string | null;
  };
}
```

## Future Improvements

- [ ] Screenshot comparison (before/after)
- [ ] Annotation overlay on screenshots
- [ ] Multiple screenshot history
- [ ] Export screenshot validation reports
- [ ] Automated visual regression testing
