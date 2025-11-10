/**
 * useChatMessages Hook
 * Provides memoized display messages from the active session
 */

import { useMemo } from 'react';
import { useActiveSession } from '@editor/chat/state/selectors';
import { toDisplayMessages } from '@editor/chat/state/viewModels';

export const useChatMessages = () => {
  const session = useActiveSession();
  const displayMessages = useMemo(
    () => toDisplayMessages(session?.messages ?? []),
    [session?.messages]
  );

  return {
    displayMessages,
    total: displayMessages.length,
  };
};
