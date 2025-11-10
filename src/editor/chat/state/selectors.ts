/**
 * Chat State Selectors
 * Fine-grained Zustand selectors to prevent unnecessary re-renders
 */

import { useChatStore } from '@editor/store/chatStore';

export const useActiveSession = () => useChatStore((state) => state.getActiveSession());
export const useIsTyping = () => useChatStore((state) => state.isAgentTyping);
export const useCurrentStream = () => useChatStore((state) => state.currentStream);
export const useChatError = () => useChatStore((state) => state.error);
export const useActiveSessionId = () => useChatStore((state) => state.activeSessionId);
