/**
 * useChatStreaming Hook
 * Provides streaming state derived from store
 */

import { useIsTyping, useCurrentStream, useChatError } from '@editor/chat/state/selectors';
import { useChatAgent } from '@editor/chat/hooks/useChatAgent';

export const useChatStreaming = () => {
  const { initialized } = useChatAgent();
  const isTyping = useIsTyping();
  const currentStream = useCurrentStream();
  const error = useChatError();

  return {
    initialized,
    isTyping,
    currentStream,
    error,
    isReady: initialized && !error,
  };
};
