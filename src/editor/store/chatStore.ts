/**
 * Chat Store - Zustand store for AI agent chat state
 * Manages sessions, messages, and streaming state
 * Following PRD: docs/PRDs/editor/claude-agent-sdk-integration-prd.md
 */

import { create } from 'zustand';
import type { IAgentSession, IAgentMessage } from '@editor/services/agent/types';

interface IChatStore {
  // Session management
  sessions: Map<string, IAgentSession>;
  activeSessionId: string | null;

  // UI state
  isAgentTyping: boolean;
  currentStream: string;
  error: string | null;

  // Actions
  createSession: () => string;
  deleteSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: IAgentMessage) => void;
  updateStream: (content: string) => void;
  clearStream: () => void;
  setAgentTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;
  getActiveSession: () => IAgentSession | null;
}

export const useChatStore = create<IChatStore>((set, get) => ({
  // Initial state
  sessions: new Map(),
  activeSessionId: null,
  isAgentTyping: false,
  currentStream: '',
  error: null,

  // Create a new session
  createSession: () => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: IAgentSession = {
      id: sessionId,
      messages: [],
      context: {
        projectRoot: '/home/joao/projects/vibe-coder-3d',
        currentScene: null,
        selectedEntities: [],
        recentFiles: [],
        claudeMemory: [],
      },
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.set(sessionId, newSession);
      return {
        sessions: newSessions,
        activeSessionId: sessionId,
      };
    });

    return sessionId;
  },

  // Delete a session
  deleteSession: (sessionId: string) => {
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.delete(sessionId);
      return {
        sessions: newSessions,
        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
      };
    });
  },

  // Set active session
  setActiveSession: (sessionId: string) => {
    set({ activeSessionId: sessionId });
  },

  // Add message to a session
  addMessage: (sessionId: string, message: IAgentMessage) => {
    set((state) => {
      const session = state.sessions.get(sessionId);
      if (!session) return state;

      const updatedSession: IAgentSession = {
        ...session,
        messages: [...session.messages, message],
        lastActivity: new Date(),
      };

      const newSessions = new Map(state.sessions);
      newSessions.set(sessionId, updatedSession);

      return { sessions: newSessions };
    });
  },

  // Update streaming content
  updateStream: (content: string) => {
    set({ currentStream: content });
  },

  // Clear streaming content
  clearStream: () => {
    set({ currentStream: '' });
  },

  // Set agent typing state
  setAgentTyping: (typing: boolean) => {
    set({ isAgentTyping: typing });
  },

  // Set error state
  setError: (error: string | null) => {
    set({ error });
  },

  // Get active session
  getActiveSession: () => {
    const { sessions, activeSessionId } = get();
    if (!activeSessionId) return null;
    return sessions.get(activeSessionId) || null;
  },
}));

// Individual selectors to prevent unnecessary re-renders
export const useActiveSessionId = () => useChatStore((state) => state.activeSessionId);
export const useIsAgentTyping = () => useChatStore((state) => state.isAgentTyping);
export const useCurrentStream = () => useChatStore((state) => state.currentStream);
export const useChatError = () => useChatStore((state) => state.error);
export const useActiveSession = () => useChatStore((state) => state.getActiveSession());
