/**
 * ChatMessageList Component
 * Renders a list of chat messages with error display
 */

import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { ChatMessageItem } from '@editor/chat/components/ChatMessageItem';
import type { IDisplayChatMessage } from '@editor/chat/types/display';

export interface IChatMessageListProps {
  messages: IDisplayChatMessage[];
  error?: string | null;
  size?: 'sm' | 'md';
}

export const ChatMessageList: React.FC<IChatMessageListProps> = ({
  messages,
  error,
  size = 'md',
}) => {
  return (
    <>
      {error && (
        <div className="flex items-start space-x-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
          <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300 font-medium">Configuration Error</p>
            <p className="text-xs text-red-200 mt-1">{error}</p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} size={size} />
      ))}
    </>
  );
};
