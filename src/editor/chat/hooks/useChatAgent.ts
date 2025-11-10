/**
 * useChatAgent Hook
 * React hook for interacting with the AI agent service
 * Following PRD: docs/PRDs/editor/claude-agent-sdk-integration-prd.md
 */

import { useCallback, useEffect, useRef } from 'react';
import { useChatStore } from '@editor/store/chatStore';
import { AgentService } from '@editor/services/agent/AgentService';
import { CodebaseContextProvider } from '@editor/services/agent/CodebaseContextProvider';
import { Logger } from '@core/lib/logger';
import type { IAgentMessage } from '@editor/services/agent/types';

const logger = Logger.create('useChatAgent');

interface IUseChatAgentReturn {
  sendMessage: (content: string) => Promise<void>;
  cancelMessage: () => void;
  isTyping: boolean;
  error: string | null;
  currentStream: string;
  initialized: boolean;
}

export const useChatAgent = (): IUseChatAgentReturn => {
  // Only subscribe to values we need to render, not actions
  const isAgentTyping = useChatStore((state) => state.isAgentTyping);
  const currentStream = useChatStore((state) => state.currentStream);
  const error = useChatStore((state) => state.error);

  const agentServiceRef = useRef<AgentService | null>(null);
  const contextProviderRef = useRef<CodebaseContextProvider | null>(null);
  const initializedRef = useRef(false);

  // Initialize agent service
  useEffect(() => {
    if (initializedRef.current) return;

    try {
      agentServiceRef.current = AgentService.getInstance();
      contextProviderRef.current = new CodebaseContextProvider();

      // Check if API key is configured
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        const errorMsg =
          'AI Assistant requires OPENROUTER_API_KEY. Please configure in .env file. Get your key at: https://openrouter.ai/keys';
        useChatStore.getState().setError(errorMsg);
        logger.error(errorMsg);
        return;
      }

      agentServiceRef.current.initialize();
      initializedRef.current = true;
      useChatStore.getState().setError(null);

      logger.info('Chat agent initialized');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize AI agent';
      useChatStore.getState().setError(errorMsg);
      logger.error('Failed to initialize agent', { error: err });
    }
  }, []);

  // Ensure there's an active session (only run once on mount)
  useEffect(() => {
    if (!useChatStore.getState().activeSessionId && initializedRef.current) {
      logger.info('Creating initial session');
      // Create session in Zustand store
      useChatStore.getState().createSession();
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!agentServiceRef.current || !initializedRef.current) {
        const errorMsg = 'Agent service not initialized';
        useChatStore.getState().setError(errorMsg);
        logger.error(errorMsg);
        return;
      }

      // Get current state directly to avoid stale closure
      const currentState = useChatStore.getState();
      let sessionId = currentState.activeSessionId;

      if (!sessionId) {
        logger.warn('No active session, creating one');
        // Create session in Zustand store
        sessionId = currentState.createSession();
      }

      if (!sessionId) {
        useChatStore.getState().setError('No active session available');
        return;
      }

      // Add user message to store
      const userMessage: IAgentMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'user',
        content,
        timestamp: new Date(),
      };
      useChatStore.getState().addMessage(sessionId, userMessage);

      // Clear any previous errors and set typing state
      useChatStore.getState().setError(null);
      useChatStore.getState().setAgentTyping(true);
      useChatStore.getState().clearStream();

      try {
        // Get current session state for context and messages
        const session = useChatStore.getState().sessions.get(sessionId);
        if (!session) {
          throw new Error('Session not found in store');
        }

        // Get live context from editor state
        const liveContext = contextProviderRef.current
          ? await contextProviderRef.current.getFullContext()
          : session.context;

        logger.debug('Sending message with live context', {
          currentScene: liveContext.currentScene,
          selectedEntities: liveContext.selectedEntities,
        });

        // Send all messages to AgentService for API call
        await agentServiceRef.current.sendMessage(sessionId, session.messages, liveContext, {
          onStream: (chunk: string) => {
            // Update streaming content using getState to avoid closure
            const currentStream = useChatStore.getState().currentStream;
            useChatStore.getState().updateStream(currentStream + chunk);
          },
          onToolUse: (toolName: string, args: unknown, result?: unknown) => {
            // Surface tool actions as separate messages in the chat history
            const content =
              toolName === 'screenshot_feedback'
                ? '' // screenshot already rendered via dedicated event/card
                : `✓ ${toolName}: ${typeof result === 'string' ? result : JSON.stringify(result)}`;

            if (content) {
              const toolMessage: IAgentMessage = {
                id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'tool',
                content,
                timestamp: new Date(),
                metadata: { args, toolName, result },
              };
              useChatStore.getState().addMessage(sessionId!, toolMessage);
            }
          },
          onComplete: (response: string) => {
            // Add AI response to store
            const aiMessage: IAgentMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'ai',
              content: response,
              timestamp: new Date(),
            };
            useChatStore.getState().addMessage(sessionId, aiMessage);

            useChatStore.getState().clearStream();
            useChatStore.getState().setAgentTyping(false);

            logger.info('Message completed', { responseLength: response.length });
          },
          onError: (err: Error) => {
            useChatStore.getState().setError(err.message);
            useChatStore.getState().setAgentTyping(false);
            useChatStore.getState().clearStream();
            logger.error('Message failed', { error: err });
          },
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
        useChatStore.getState().setError(errorMsg);
        useChatStore.getState().setAgentTyping(false);
        useChatStore.getState().clearStream();
        logger.error('Failed to send message', { error: err });
      }
    },
    [], // Empty deps - we use getState() to avoid stale closures
  );

  const cancelMessage = useCallback(() => {
    if (!agentServiceRef.current) return;

    logger.info('User requested cancellation');
    agentServiceRef.current.cancelCurrentRequest();

    // Reset UI state
    useChatStore.getState().setAgentTyping(false);
    useChatStore.getState().clearStream();
  }, []);

  return {
    sendMessage,
    cancelMessage,
    isTyping: isAgentTyping,
    error,
    currentStream,
    initialized: initializedRef.current,
  };
};
