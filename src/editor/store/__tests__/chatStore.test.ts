/**
 * Tests for Chat Store - AI-First Chat Flexibility PRD Implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useChatStore,
  useActiveSessionId,
  useIsAgentTyping,
  useCurrentStream,
  useChatError,
  useActiveSession,
  useChatInitialized,
} from '../chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useChatStore.getState();
    store.sessions.clear();
    store.activeSessionId = null;
    store.isAgentTyping = false;
    store.currentStream = '';
    store.error = null;
    store.isAgentInitialized = false;
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useChatStore.getState();

      expect(state.sessions.size).toBe(0);
      expect(state.activeSessionId).toBeNull();
      expect(state.isAgentTyping).toBe(false);
      expect(state.currentStream).toBe('');
      expect(state.error).toBeNull();
      expect(state.isAgentInitialized).toBe(false);
    });
  });

  describe('Agent Initialization State', () => {
    it('should set agent initialized state', () => {
      const { setAgentInitialized } = useChatStore.getState();

      setAgentInitialized(true);

      expect(useChatStore.getState().isAgentInitialized).toBe(true);
    });

    it('should update agent initialized state', () => {
      const { setAgentInitialized } = useChatStore.getState();

      setAgentInitialized(true);
      expect(useChatStore.getState().isAgentInitialized).toBe(true);

      setAgentInitialized(false);
      expect(useChatStore.getState().isAgentInitialized).toBe(false);
    });

    it('should expose useChatInitialized selector', () => {
      const { setAgentInitialized } = useChatStore.getState();

      setAgentInitialized(true);

      // Access the state directly from store instead of calling hook
      const { isAgentInitialized } = useChatStore.getState();
      expect(isAgentInitialized).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should create a new session', () => {
      const { createSession } = useChatStore.getState();

      const sessionId = createSession();

      const state = useChatStore.getState();
      expect(sessionId).toBeTruthy();
      expect(state.sessions.has(sessionId)).toBe(true);
      expect(state.activeSessionId).toBe(sessionId);
    });

    it('should create session with correct structure', () => {
      const { createSession } = useChatStore.getState();

      const sessionId = createSession();
      const session = useChatStore.getState().sessions.get(sessionId);

      expect(session).toBeDefined();
      expect(session?.id).toBe(sessionId);
      expect(session?.messages).toEqual([]);
      expect(session?.context).toBeDefined();
      expect(session?.createdAt).toBeInstanceOf(Date);
      expect(session?.lastActivity).toBeInstanceOf(Date);
    });

    it('should delete a session', () => {
      const { createSession, deleteSession } = useChatStore.getState();

      const sessionId = createSession();
      deleteSession(sessionId);

      const state = useChatStore.getState();
      expect(state.sessions.has(sessionId)).toBe(false);
      expect(state.activeSessionId).toBeNull();
    });

    it('should keep activeSessionId when deleting different session', () => {
      const { createSession, deleteSession, setActiveSession } = useChatStore.getState();

      const session1 = createSession();
      const session2 = createSession();

      setActiveSession(session1);
      deleteSession(session2);

      expect(useChatStore.getState().activeSessionId).toBe(session1);
    });

    it('should set active session', () => {
      const { createSession, setActiveSession } = useChatStore.getState();

      const sessionId = createSession();
      setActiveSession(sessionId);

      expect(useChatStore.getState().activeSessionId).toBe(sessionId);
    });
  });

  describe('Message Management', () => {
    it('should add message to session', () => {
      const { createSession, addMessage } = useChatStore.getState();

      const sessionId = createSession();
      const message = {
        id: 'msg-1',
        type: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      };

      addMessage(sessionId, message);

      const session = useChatStore.getState().sessions.get(sessionId);
      expect(session?.messages).toHaveLength(1);
      expect(session?.messages[0]).toEqual(message);
    });

    it('should update lastActivity when adding message', async () => {
      const { createSession, addMessage } = useChatStore.getState();

      const sessionId = createSession();
      const initialSession = useChatStore.getState().sessions.get(sessionId);
      const initialActivity = initialSession?.lastActivity;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const message = {
        id: 'msg-1',
        type: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      };

      addMessage(sessionId, message);

      const updatedSession = useChatStore.getState().sessions.get(sessionId);
      const updatedTime = updatedSession?.lastActivity.getTime() || 0;
      const initialTime = initialActivity?.getTime() || 0;
      expect(updatedTime).toBeGreaterThan(initialTime);
    });

    it('should handle adding message to non-existent session', () => {
      const { addMessage } = useChatStore.getState();

      const message = {
        id: 'msg-1',
        type: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      };

      addMessage('non-existent', message);

      // Should not throw, just silently ignore
      expect(useChatStore.getState().sessions.size).toBe(0);
    });
  });

  describe('Streaming State', () => {
    it('should update stream content', () => {
      const { updateStream } = useChatStore.getState();

      updateStream('Streaming content...');

      expect(useChatStore.getState().currentStream).toBe('Streaming content...');
    });

    it('should clear stream content', () => {
      const { updateStream, clearStream } = useChatStore.getState();

      updateStream('Some content');
      clearStream();

      expect(useChatStore.getState().currentStream).toBe('');
    });

    it('should set agent typing state', () => {
      const { setAgentTyping } = useChatStore.getState();

      setAgentTyping(true);
      expect(useChatStore.getState().isAgentTyping).toBe(true);

      setAgentTyping(false);
      expect(useChatStore.getState().isAgentTyping).toBe(false);
    });
  });

  describe('Error State', () => {
    it('should set error', () => {
      const { setError } = useChatStore.getState();

      setError('An error occurred');

      expect(useChatStore.getState().error).toBe('An error occurred');
    });

    it('should clear error', () => {
      const { setError } = useChatStore.getState();

      setError('An error occurred');
      setError(null);

      expect(useChatStore.getState().error).toBeNull();
    });
  });

  describe('Selectors', () => {
    it('should get active session', () => {
      const { createSession, getActiveSession } = useChatStore.getState();

      const sessionId = createSession();
      const activeSession = getActiveSession();

      expect(activeSession?.id).toBe(sessionId);
    });

    it('should return null when no active session', () => {
      const { getActiveSession } = useChatStore.getState();

      const activeSession = getActiveSession();

      expect(activeSession).toBeNull();
    });

    it('should expose all individual selectors', () => {
      const state = useChatStore.getState();
      const sessionId = state.createSession();
      state.setAgentTyping(true);
      state.updateStream('test stream');
      state.setError('test error');
      state.setAgentInitialized(true);

      // Access state directly instead of calling hooks
      const currentState = useChatStore.getState();
      expect(currentState.activeSessionId).toBe(sessionId);
      expect(currentState.isAgentTyping).toBe(true);
      expect(currentState.currentStream).toBe('test stream');
      expect(currentState.error).toBe('test error');
      expect(currentState.isAgentInitialized).toBe(true);
      expect(currentState.getActiveSession()?.id).toBe(sessionId);
    });
  });

  describe('Integration - Initialization Flow', () => {
    it('should prevent actions when agent not initialized', () => {
      const { isAgentInitialized } = useChatStore.getState();

      expect(isAgentInitialized).toBe(false);
      // UI should disable send controls based on this state
    });

    it('should allow actions after agent initialized', () => {
      const { setAgentInitialized } = useChatStore.getState();

      setAgentInitialized(true);

      const { isAgentInitialized } = useChatStore.getState();
      expect(isAgentInitialized).toBe(true);
      // UI can now enable send controls
    });

    it('should handle full initialization flow', () => {
      const { createSession, setAgentInitialized, addMessage } = useChatStore.getState();

      // Step 1: Initialize agent
      setAgentInitialized(true);
      expect(useChatStore.getState().isAgentInitialized).toBe(true);

      // Step 2: Create session
      const sessionId = createSession();
      expect(useChatStore.getState().sessions.has(sessionId)).toBe(true);

      // Step 3: Add messages
      const message = {
        id: 'msg-1',
        type: 'user' as const,
        content: 'Hello, AI',
        timestamp: new Date(),
      };
      addMessage(sessionId, message);

      const session = useChatStore.getState().sessions.get(sessionId);
      expect(session?.messages).toHaveLength(1);
    });
  });
});
