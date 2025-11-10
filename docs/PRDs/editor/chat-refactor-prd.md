# Chat Module Refactor PRD\n

## Overview\n

- **Context & Goals**\n
  - Consolidate chat UI and business logic to uphold SRP, DRY, and encapsulation in hooks.\n
  - Standardize a view-model layer between Zustand state and UI to reduce re-renders and duplication.\n
  - Unify left/right sidebar chat UIs and the main `ChatPanel` while preserving existing features (streaming, screenshot analysis, errors).\n
  - Enforce workspace rules: TS path aliases, named exports only, logic in hooks, Zod for runtime validation.\n
    \n
- **Current Pain Points**\n
  - Duplicated UI/logic between `LeftSidebarChat` and `RightSidebarChat` (message list rendering, input handling, typing/stream display).\n
  - `ChatPanel` mixes presentation with event wiring, state mapping, and IO (screenshot events, message conversion, scrolling).\n
  - Message transformation (agent → display) is embedded in components rather than encapsulated.\n
  - Window event listeners live inside a component; no schema validation of event payloads; difficult to test.\n
  - Inconsistent view types (user/ai vs screenshot/analysis) across components; formatting helpers repeated.\n
    \n

## Proposed Solution\n

- **High‑level Summary**\n
  - Introduce a dedicated chat “feature” module with clear layers: hooks (logic), state selectors/view-models, and presentational components.\n
  - Extract all UI-agnostic logic to hooks: message transformation, input handling, scrolling, sidebar expand/focus, screenshot events.\n
  - Create a thin presentational shell for sidebars to remove duplication and allow styling differences via props.\n
  - Define a `display` type model and Zod schemas for event payloads; centralize selectors to avoid unnecessary re-renders.\n
  - Keep named exports only; maintain TS path aliases; follow Tailwind conventions; avoid barrel files.\n
    \n
- **Architecture & Directory Structure**\n
  \n

````text\n
src/\n
└── editor/\n
    ├── chat/\n
    │   ├── components/\n
    │   │   ├── ChatPanel.tsx                         # Presentational + composition only\n
    │   │   ├── SidebarChatShell.tsx                  # Shared left/right shell\n
    │   │   ├── ChatHeader.tsx\n
    │   │   ├── ChatMessageList.tsx\n
    │   │   ├── ChatMessageItem.tsx                   # Renders message variants (user/ai/screenshot/analysis)\n
    │   │   ├── ChatInput.tsx\n
    │   │   ├── ChatStatusBar.tsx\n
    │   │   ├── ScreenshotCard.tsx\n
    │   │   └── AnalysisCard.tsx\n
    │   ├── hooks/\n
    │   │   ├── useChatAgent.ts                       # moved from components/chat/hooks\n
    │   │   ├── useChatMessages.ts                    # map store → display messages (sorted)\n
    │   │   ├── useChatInput.ts                       # input state + send/cancel bindings\n
    │   │   ├── useChatScroll.ts                      # autoscroll + focus management\n
    │   │   ├── useChatSidebar.ts                     # expand/collapse + side-specific behavior\n
    │   │   ├── useScreenshotEvents.ts                # window event wiring + Zod validation\n
    │   │   └── useChatStreaming.ts                   # stream/UI state derivation\n
    │   ├── state/\n
    │   │   ├── selectors.ts                          # memoized selectors to prevent re-renders\n
    │   │   ├── viewModels.ts                         # display view-model builders\n
    │   │   └── schemas.ts                            # Zod schemas for events/payloads\n
    │   ├── types/\n
    │   │   └── display.ts                            # IDisplayChatMessage etc.\n
    │   └── utils/\n
    │       └── formatters.ts                         # formatTime, truncation, etc.\n
    └── store/\n
        └── chatStore.ts                               # Zustand store (unchanged API)\n
```\n
\n
All modules use named exports, no barrel files. Import via path aliases (e.g., `@editor/chat/hooks/useChatMessages`).\n
\n
## Implementation Plan\n
\n
### Phase 1: Setup (0.5 day)\n
1. Create `src/editor/chat/{components,hooks,state,types,utils}` directories.\n
2. Move `useChatAgent` to `@editor/chat/hooks/useChatAgent` (preserve public API).\n
3. Add `state/schemas.ts` with Zod schemas for screenshot/analysis events.\n
4. Add `types/display.ts` for discriminated unions used by UI.\n
\n
### Phase 2: View-Model & Selectors (0.5 day)\n
1. Implement `state/selectors.ts` for stable, fine-grained Zustand selectors (typing, stream, error, session messages).\n
2. Implement `state/viewModels.ts` to convert `IAgentMessage[]` → `IDisplayChatMessage[]` (sorted, normalized types).\n
\n
### Phase 3: Hooks Extraction (1 day)\n
1. `useChatMessages` to return memoized display messages plus derived counts.\n
2. `useChatInput` to manage local input + `sendMessage`/`cancel` wiring + Enter handling.\n
3. `useChatScroll` to handle autoscroll/focus with refs.\n
4. `useScreenshotEvents` to encapsulate window event wiring + store updates using Zod-validated payloads.\n
5. `useChatStreaming` to expose `isTyping`, `currentStream`, `initialized`, `error` from store/hook.\n
\n
### Phase 4: Componentization (1 day)\n
1. `SidebarChatShell` to unify left/right sidebars (widths, collapsed affordances via props).\n
2. `ChatMessageList` + `ChatMessageItem` to render message variants.\n
3. `ChatInput` to accept handlers/disabled state from `useChatInput`/`useChatStreaming`.\n
4. `ChatHeader` and `ChatStatusBar` to encapsulate header and typing/stream indicators.\n
\n
### Phase 5: Integrations & Migration (0.5 day)\n
1. Refactor `LeftSidebarChat`/`RightSidebarChat` to thin wrappers around `SidebarChatShell` + shared children.\n
2. Refactor `ChatPanel` to use hooks/components; remove inline event wiring and transformation code.\n
\n
### Phase 6: Clean-up & Validation (0.5 day)\n
1. Remove duplicated logic from old components; ensure all imports use aliases; ensure named exports.\n
2. Validate Zod errors display in UI via `useChatError`.\n
\n
### Phase 7: Tests & Docs (0.5 day)\n
1. Add unit tests for hooks and view-models.\n
2. Add integration tests for `ChatPanel` and sidebar wrappers.\n
3. Update docs and in-code JSDoc for new public surfaces.\n
\n
## File and Directory Structures\n
\n
Target structure focusing on chat feature (additional files omitted):\n
\n
```text\n
/src/editor/chat/\n
├── components/\n
├── hooks/\n
├── state/\n
├── types/\n
└── utils/\n
```\n
\n
Migration mapping:\n
- `src/editor/components/chat/ChatPanel.tsx` → `src/editor/chat/components/ChatPanel.tsx` (composition only)\n
- `src/editor/components/chat/LeftSidebarChat.tsx` → thin wrapper over `SidebarChatShell`\n
- `src/editor/components/chat/RightSidebarChat.tsx` → thin wrapper over `SidebarChatShell`\n
- `src/editor/components/chat/hooks/useChatAgent.ts` → `src/editor/chat/hooks/useChatAgent.ts`\n
\n
## Technical Details\n
\n
Minimal type model for display-layer messages:\n
\n
```ts\n
// src/editor/chat/types/display.ts\n
export interface IDisplayBaseMessage {\n
  id: string;\n
  timestamp: Date;\n
}\n
\n
export interface IUserMessage extends IDisplayBaseMessage {\n
  kind: 'user';\n
  content: string;\n
}\n
\n
export interface IAssistantMessage extends IDisplayBaseMessage {\n
  kind: 'ai';\n
  content: string;\n
}\n
\n
export interface IScreenshotMessage extends IDisplayBaseMessage {\n
  kind: 'screenshot';\n
  content: string;           // title/summary\n
  imageData: string;         // base64\n
  sceneInfo?: {\n
    entity_count: number;\n
    camera_position: string;\n
    selected_entities: number[];\n
    scene_name: string | null;\n
  };\n
}\n
\n
export interface IAnalysisMessage extends IDisplayBaseMessage {\n
  kind: 'analysis';\n
  content: string;\n
}\n
\n
export type IDisplayChatMessage =\n
  | IUserMessage\n
  | IAssistantMessage\n
  | IScreenshotMessage\n
  | IAnalysisMessage;\n
```\n
\n
Selectors and view-models:\n
\n
```ts\n
// src/editor/chat/state/selectors.ts\n
import { useChatStore } from '@editor/store/chatStore';\n
\n
export const useActiveSession = () => useChatStore((s) => s.getActiveSession());\n
export const useIsTyping = () => useChatStore((s) => s.isAgentTyping);\n
export const useCurrentStream = () => useChatStore((s) => s.currentStream);\n
export const useChatError = () => useChatStore((s) => s.error);\n
```\n
\n
```ts\n
// src/editor/chat/state/viewModels.ts\n
import type { IAgentMessage } from '@editor/services/agent/types';\n
import type { IDisplayChatMessage } from '@editor/chat/types/display';\n
\n
export function toDisplayMessages(messages: IAgentMessage[]): IDisplayChatMessage[] {\n
  const converted: IDisplayChatMessage[] = messages.map((msg) => {\n
    if (msg.metadata?.isScreenshot) {\n
      return {\n
        id: msg.id,\n
        kind: 'screenshot',\n
        content: msg.content,\n
        timestamp: msg.timestamp,\n
        imageData: (msg.metadata as any).imageData as string,\n
        sceneInfo: (msg.metadata as any).sceneInfo as IScreenshotMessage['sceneInfo'],\n
      } as IDisplayChatMessage;\n
    }\n
    if (msg.metadata?.isAnalysis) {\n
      return { id: msg.id, kind: 'analysis', content: msg.content, timestamp: msg.timestamp };\n
    }\n
    return {\n
      id: msg.id,\n
      kind: msg.type === 'user' ? 'user' : 'ai',\n
      content: msg.content,\n
      timestamp: msg.timestamp,\n
    } as IDisplayChatMessage;\n
  });\n
\n
  return converted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());\n
}\n
```\n
\n
Hooks:\n
\n
```ts\n
// src/editor/chat/hooks/useChatMessages.ts\n
import { useMemo } from 'react';\n
import { useActiveSession } from '@editor/chat/state/selectors';\n
import { toDisplayMessages } from '@editor/chat/state/viewModels';\n
\n
export const useChatMessages = () => {\n
  const session = useActiveSession();\n
  const displayMessages = useMemo(() => toDisplayMessages(session?.messages ?? []), [session]);\n
  return { displayMessages, total: displayMessages.length };\n
};\n
```\n
\n
```ts\n
// src/editor/chat/hooks/useScreenshotEvents.ts\n
import { useEffect } from 'react';\n
import { z } from 'zod';\n
import { useChatStore } from '@editor/store/chatStore';\n
\n
const ScreenshotEventSchema = z.object({\n
  imageData: z.string(),\n
  sceneInfo: z.object({\n
    entity_count: z.number(),\n
    camera_position: z.string(),\n
    selected_entities: z.array(z.number()),\n
    scene_name: z.string().nullable(),\n
  }),\n
  reason: z.string(),\n
});\n
\n
export const useScreenshotEvents = () => {\n
  useEffect(() => {\n
    const onCaptured = (event: Event) => {\n
      const parsed = ScreenshotEventSchema.safeParse((event as CustomEvent).detail);\n
      if (!parsed.success) return;\n
      const { imageData, sceneInfo, reason } = parsed.data;\n
      const session = useChatStore.getState().getActiveSession();\n
      if (!session) return;\n
      useChatStore.getState().addMessage(session.id, {\n
        id: `screenshot-${Date.now()}`,\n
        type: 'tool',\n
        content: `📸 Screenshot captured: ${reason}`,\n
        timestamp: new Date(),\n
        metadata: { imageData, sceneInfo, reason, isScreenshot: true },\n
      });\n
    };\n
\n
    const onAnalysis = (event: Event) => {\n
      const detail = (event as CustomEvent).detail as { analysis?: string };\n
      const session = useChatStore.getState().getActiveSession();\n
      if (!session || !detail?.analysis) return;\n
      useChatStore.getState().addMessage(session.id, {\n
        id: `analysis-${Date.now()}`,\n
        type: 'ai',\n
        content: `🔍 Visual Analysis:\\n\\n${detail.analysis}`,\n
        timestamp: new Date(),\n
        metadata: { isAnalysis: true },\n
      });\n
    };\n
\n
    window.addEventListener('agent:screenshot-captured', onCaptured);\n
    window.addEventListener('agent:screenshot-analysis', onAnalysis);\n
    return () => {\n
      window.removeEventListener('agent:screenshot-captured', onCaptured);\n
      window.removeEventListener('agent:screenshot-analysis', onAnalysis);\n
    };\n
  }, []);\n
};\n
```\n
\n
Presentational shell and components:\n
\n
```tsx\n
// src/editor/chat/components/SidebarChatShell.tsx\n
import React from 'react';\n
\n
export interface ISidebarChatShellProps {\n
  side: 'left' | 'right';\n
  isExpanded: boolean;\n
  onToggle: () => void;\n
  header: React.ReactNode;\n
  children: React.ReactNode; // message list\n
  input: React.ReactNode;    // input area\n
}\n
\n
export const SidebarChatShell: React.FC<ISidebarChatShellProps> = ({ side, isExpanded, onToggle, header, children, input }) => {\n
  const base = side === 'left' ? 'border-r' : 'border-l';\n
  const width = side === 'left' ? (isExpanded ? 'w-80' : 'w-12') : (isExpanded ? 'w-80' : 'w-16');\n
  return (\n
    <div className={`${width} bg-gradient-to-b from-[#0f0f10] to-[#1a1a1e] ${base} border-gray-800/50 flex-shrink-0 flex flex-col h-full relative transition-all duration-300 z-50`}>\n
      {header}\n
      {isExpanded && <div className=\"flex-1 overflow-y-auto p-3 space-y-3\">{children}</div>}\n
      {isExpanded && <div className=\"p-3 border-t border-gray-700/50\">{input}</div>}\n
    </div>\n
  );\n
};\n
```\n
\n
Utilities:\n
\n
```ts\n
// src/editor/chat/utils/formatters.ts\n
export const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });\n
```\n
\n
## Usage Examples\n
\n
1) Left sidebar wrapper using the shell:\n
\n
```tsx\n
// src/editor/components/chat/LeftSidebarChat.tsx (after refactor)\n
import React from 'react';\n
import { SidebarChatShell } from '@editor/chat/components/SidebarChatShell';\n
import { useChatMessages } from '@editor/chat/hooks/useChatMessages';\n
import { useChatAgent } from '@editor/chat/hooks/useChatAgent';\n
\n
export const LeftSidebarChat: React.FC<{ isExpanded: boolean; onToggle: () => void }> = ({ isExpanded, onToggle }) => {\n
  const { displayMessages } = useChatMessages();\n
  const { sendMessage, isTyping, currentStream, initialized } = useChatAgent();\n
  // header, message list, and input composed here (omitted for brevity)\n
  return <SidebarChatShell side=\"left\" isExpanded={isExpanded} onToggle={onToggle} header={/* ... */}>\n
    {/* messages */}\n
    {/* input */}\n
  </SidebarChatShell>;\n
};\n
```\n
\n
2) `ChatPanel` composition with hooks:\n
\n
```tsx\n
// src/editor/chat/components/ChatPanel.tsx (after refactor)\n
import React from 'react';\n
import { useChatMessages } from '@editor/chat/hooks/useChatMessages';\n
import { useScreenshotEvents } from '@editor/chat/hooks/useScreenshotEvents';\n
import { useChatAgent } from '@editor/chat/hooks/useChatAgent';\n
\n
export const ChatPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {\n
  useScreenshotEvents();\n
  const { displayMessages } = useChatMessages();\n
  const { sendMessage, cancelMessage, isTyping, currentStream, initialized } = useChatAgent();\n
  if (!isOpen) return null;\n
  return (\n
    <div>{/* header, message list, input, status bar */}</div>\n
  );\n
};\n
```\n
\n
3) Selectors-only consumption to minimize re-renders:\n
\n
```ts\n
import { useIsTyping, useCurrentStream } from '@editor/chat/state/selectors';\n
const isTyping = useIsTyping();\n
const currentStream = useCurrentStream();\n
```\n
\n
## Testing Strategy\n
- **Unit Tests**\n
  - `toDisplayMessages` conversions for: user/ai, screenshot, analysis; correct sorting; metadata fallbacks.\n
  - `useScreenshotEvents` payload validation (Zod success/failure) and store updates.\n
  - `useChatInput` Enter handling, disabled states with `isTyping`/`initialized`.\n
  - `useChatScroll` autoscroll behavior and focus on open/toggle.\n
  - Selectors stability: ensure memoization reduces re-renders.\n
\n
- **Integration Tests**\n
  - `ChatPanel` end-to-end: send → stream → complete; error display; screenshot analysis renders.\n
  - Left/Right sidebars share `SidebarChatShell` without logic duplication; toggling and focus.\n
  - Tool events roundtrip: window event → store → view-model → UI.\n
\n
## Edge Cases\n
\n
| Edge Case | Remediation |\n
| --- | --- |\n
| No active session on mount | Hook creates session via store; UI stays responsive. |\n
| Missing `VITE_OPENROUTER_API_KEY` | Show `useChatError` banner; block input; link to setup. |\n
| Streaming cancelled mid-response | Clear stream/state, maintain previous messages, show neutral status. |\n
| Screenshot event missing fields | Zod rejects; no store update; optional toast/log. |\n
| Extremely long messages | Truncate in list preview; expand on click. |\n
| Rapid toggling of sidebar | Debounce focus; guard scroll effects. |\n
| Re-render storms | Use selectors + memoized view-models; split components. |\n
| Timezone/locale formatting | Centralize in `formatters.ts`. |\n
| Tool result errors | Surface as tool message with error styling (non-blocking). |\n
| Multiple screenshot events queued | Process in order; each yields its own message; no merging. |\n
\n
## Sequence Diagram\n
\n
```mermaid\n
sequenceDiagram\n
  actor U as User\n
  participant CP as ChatPanel (UI)\n
  participant HM as useChatMessages\n
  participant HA as useChatAgent\n
  participant ST as Zustand Store\n
  participant AS as AgentService\n
\n
  U->>CP: Type + Send\n
  CP->>HA: sendMessage(content)\n
  HA->>ST: add user message + set typing + clear stream\n
  HA->>AS: sendMessage(session, messages, context)\n
  AS-->>HA: onStream(chunk)\n
  HA->>ST: updateStream()\n
  CP->>HM: select + map messages → display\n
  HM-->>CP: displayMessages\n
  AS-->>HA: onToolUse(tool,args,result)\n
  HA->>ST: add tool message (if applicable)\n
  AS-->>HA: onComplete(response)\n
  HA->>ST: add ai message + clear stream + set typing=false\n
  CP->>HM: refresh displayMessages\n
  Note over CP: UI re-renders via fine-grained selectors\n
\n
  Note over CP,ST: Screenshot events\n
  CP->>CP: useScreenshotEvents (listeners)\n
  CP-->>ST: add screenshot/analysis messages\n
```\n
\n
## Risks & Mitigations\n
\n
| Risk | Mitigation |\n
| --- | --- |\n
| Behavior regression during migration | Incremental PRs by phase; snapshot tests; visual QA. |\n
| Over-refactoring increases complexity | Keep components thin; logic only in hooks; adhere to SRP. |\n
| Re-render issues due to selector misuse | Centralize selectors; verify with React Profiler. |\n
| Event payload drift | Zod schemas in one place; type/tests enforce structure. |\n
| Developer confusion during transition | Migration map + docs; maintain public APIs in moved hooks. |\n
\n
## Timeline\n
- Phase 1: 0.5 day\n
- Phase 2: 0.5 day\n
- Phase 3: 1.0 day\n
- Phase 4: 1.0 day\n
- Phase 5: 0.5 day\n
- Phase 6: 0.5 day\n
- Phase 7: 0.5 day\n
\n
**Total: ~4.5 days**\n
\n
## Acceptance Criteria\n
- `LeftSidebarChat` and `RightSidebarChat` share a single shell component with no duplicated logic.\n
- `ChatPanel` contains composition only; no window event listeners or message transformation in the component body.\n
- Message mapping and sorting live in `useChatMessages`/`viewModels`; UI consumes `IDisplayChatMessage` only.\n
- Screenshot/analysis payloads validated with Zod in `useScreenshotEvents`.\n
- All chat imports use TS path aliases and named exports; no barrel files.\n
- Hooks drive all behavioral logic (input, scroll, streaming); components are presentational.\n
- Error/typing/stream states derive from selectors with minimal re-renders (verified with React Profiler).\n
- Unit and integration tests pass covering conversions, events, streaming, and basic flows.\n
\n
## Conclusion\n
This refactor establishes a clean feature boundary for chat, removes duplication, and enforces hook-driven logic with a stable view-model layer. It improves readability, testability, and performance while preserving current behavior and UI.\n
\n
## Assumptions & Dependencies\n
- Build tooling: Vite + Yarn; styling via Tailwind.\n
- State: Zustand store at `@editor/store/chatStore` remains the single source of truth.\n
- Services: `AgentService` streaming contract unchanged.\n
- TS path aliases already configured; continue using `@editor/*` and `@core/*`.\n
- Use Zod for runtime validation; no new external state or UI libraries introduced.\n
\n

````
