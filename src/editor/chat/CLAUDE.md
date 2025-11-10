# Chat Module Guidelines

**Purpose**: AI-powered chat system with screenshot analysis and Claude Agent SDK integration.

**Architecture**: Clean separation of concerns following SRP, DRY, and hook-based logic patterns.

## Directory Structure

```
chat/
├── components/       # Presentational UI components
├── hooks/           # Business logic and state management hooks
├── state/           # Selectors, view models, and Zod schemas
├── types/           # Display-layer type definitions
└── utils/           # Formatting and helper utilities
```

## Key Principles

- **Hook-Driven Logic**: All business logic lives in custom hooks, components are purely presentational
- **View-Model Layer**: Agent messages are transformed to display messages via `toDisplayMessages()`
- **Fine-Grained Selectors**: Zustand selectors prevent unnecessary re-renders
- **Zod Validation**: Runtime validation for window events (screenshot, analysis)
- **Named Exports Only**: No barrel files, explicit imports via TS path aliases

## Hooks

### Core Hooks

- **`useChatAgent`** (`@editor/chat/hooks/useChatAgent`)
  - Manages AgentService initialization and message sending
  - Handles streaming, tool use, errors
  - Returns: `sendMessage`, `cancelMessage`, `isTyping`, `error`, `currentStream`, `initialized`

- **`useChatMessages`** (`@editor/chat/hooks/useChatMessages`)
  - Provides memoized display messages from active session
  - Transforms agent messages via `toDisplayMessages()` view model
  - Returns: `displayMessages`, `total`

- **`useChatInput`** (`@editor/chat/hooks/useChatInput`)
  - Manages input state and send/cancel handlers
  - Handles Enter key for send, Shift+Enter for newline
  - Returns: `inputValue`, `setInputValue`, `handleSend`, `handleKeyPress`, `canSend`

- **`useChatScroll`** (`@editor/chat/hooks/useChatScroll`)
  - Autoscroll to bottom on new messages
  - Focus input when chat opens/expands
  - Returns: `messagesEndRef`, `inputRef`, `scrollToBottom`

- **`useScreenshotEvents`** (`@editor/chat/hooks/useScreenshotEvents`)
  - Window event listeners for `agent:screenshot-captured` and `agent:screenshot-analysis`
  - Zod-validates payloads before adding to store
  - No return value (side-effect only)

- **`useChatStreaming`** (`@editor/chat/hooks/useChatStreaming`)
  - Aggregates streaming state from multiple sources
  - Returns: `initialized`, `isTyping`, `currentStream`, `error`, `isReady`

## State Management

### Selectors (`@editor/chat/state/selectors`)

Fine-grained Zustand selectors to minimize re-renders:

- `useActiveSession()` - Current session object
- `useIsTyping()` - Agent typing state
- `useCurrentStream()` - Streaming content
- `useChatError()` - Error state
- `useActiveSessionId()` - Active session ID

### View Models (`@editor/chat/state/viewModels`)

**`toDisplayMessages(messages: IAgentMessage[]): IDisplayChatMessage[]`**

Converts agent messages to discriminated union of display messages:
- User messages → `{ kind: 'user', content, timestamp }`
- AI messages → `{ kind: 'ai', content, timestamp }`
- Screenshot messages → `{ kind: 'screenshot', content, imageData, sceneInfo, timestamp }`
- Analysis messages → `{ kind: 'analysis', content, timestamp }`

Sorted chronologically by timestamp.

### Schemas (`@editor/chat/state/schemas`)

Zod schemas for runtime validation:

- **`ScreenshotEventSchema`** - Validates `agent:screenshot-captured` events
- **`AnalysisEventSchema`** - Validates `agent:screenshot-analysis` events

## Components

### Presentational Components

- **`SidebarChatShell`** - Shared shell for left/right sidebars (widths, borders, layout)
- **`ChatMessageList`** - Renders message array with error display
- **`ChatMessageItem`** - Renders individual message variants (user/ai/screenshot/analysis)
- **`ChatInput`** - Input field with send button (supports sm/md sizes)
- **`ChatHeader`** - Header with title, icon, online status, actions
- **`ChatStatusBar`** - Typing/streaming indicator

### Container Components

Located in `src/editor/components/chat/` (thin wrappers):

- **`LeftSidebarChat`** - Uses `SidebarChatShell` with left-specific layout
- **`RightSidebarChat`** - Uses `SidebarChatShell` with right-specific layout
- **`ChatPanel`** - Main floating chat panel with screenshot support

All containers compose hooks + presentational components with no inline logic.

## Display Types

Discriminated union for type-safe message rendering:

```ts
type IDisplayChatMessage =
  | IUserMessage
  | IAssistantMessage
  | IScreenshotMessage
  | IAnalysisMessage
```

Each variant has `kind` discriminator, `id`, `timestamp`, and variant-specific fields.

## Event System

**Screenshot Capture Flow**:

1. User triggers screenshot via tool or button
2. Screenshot service emits `agent:screenshot-captured` event
3. `useScreenshotEvents` validates payload with Zod
4. Message added to Zustand store with `metadata.isScreenshot = true`
5. `toDisplayMessages()` converts to `IScreenshotMessage`
6. `ChatMessageItem` renders with image preview and scene info

**Analysis Flow**:

1. AI processes screenshot and emits `agent:screenshot-analysis` event
2. `useScreenshotEvents` validates payload with Zod
3. Message added to store with `metadata.isAnalysis = true`
4. `toDisplayMessages()` converts to `IAnalysisMessage`
5. `ChatMessageItem` renders with green analysis card styling

## Usage Patterns

### Creating a New Chat UI

```tsx
import { useChatAgent } from '@editor/chat/hooks/useChatAgent';
import { useChatMessages } from '@editor/chat/hooks/useChatMessages';
import { useChatInput } from '@editor/chat/hooks/useChatInput';
import { useChatScroll } from '@editor/chat/hooks/useChatScroll';
import { ChatMessageList } from '@editor/chat/components/ChatMessageList';
import { ChatInput } from '@editor/chat/components/ChatInput';

export const MyChat: React.FC = () => {
  const { sendMessage } = useChatAgent();
  const { displayMessages } = useChatMessages();
  const { inputValue, setInputValue, handleSend, handleKeyPress } = useChatInput({
    onSend: sendMessage,
    disabled: false,
  });
  const { messagesEndRef, inputRef } = useChatScroll({
    messages: displayMessages,
    isOpen: true,
  });

  return (
    <div>
      <ChatMessageList messages={displayMessages} />
      <div ref={messagesEndRef} />
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onKeyPress={handleKeyPress}
        inputRef={inputRef}
      />
    </div>
  );
};
```

### Adding Screenshot Support

Just call the hook at the top level of your component:

```tsx
import { useScreenshotEvents } from '@editor/chat/hooks/useScreenshotEvents';

export const ChatPanel: React.FC = () => {
  useScreenshotEvents(); // Sets up event listeners
  // ... rest of component
};
```

## Performance

- **Memoization**: `useChatMessages` memoizes display message transformation
- **Selective Subscriptions**: Fine-grained selectors prevent full store re-renders
- **Empty Deps**: Event listeners persist for component lifetime (no teardown/re-setup)
- **Component Splitting**: Small, focused components reduce render scope

## Error Handling

- **Initialization Errors**: API key missing → show banner, block input
- **Send Errors**: Display in `ChatMessageList` error prop
- **Event Validation**: Zod failures logged, no store update
- **Streaming Errors**: Clear stream, show error, allow retry

## Testing Strategy

- **Unit Tests**: View models, formatters, Zod schemas
- **Hook Tests**: Input handling, scroll behavior, event wiring
- **Integration Tests**: Full message flow (send → stream → complete)
- **Visual Tests**: Screenshot rendering, analysis cards, error states

## Migration Notes

This refactor consolidated:
- Duplicated sidebar logic → `SidebarChatShell` + thin wrappers
- Inline message transformation → `toDisplayMessages()` view model
- Component-level event listeners → `useScreenshotEvents()` hook
- Scattered formatting → centralized `formatters.ts`
- Mixed concerns in `ChatPanel` → composition of hooks + presentational components

Old `src/editor/components/chat/hooks/useChatAgent.ts` → `src/editor/chat/hooks/useChatAgent.ts` (API unchanged).
