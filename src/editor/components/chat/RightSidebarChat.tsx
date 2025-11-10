/**
 * RightSidebarChat Component
 * Thin wrapper around SidebarChatShell for right sidebar
 */

import React from 'react';
import { FiChevronLeft, FiChevronRight, FiMessageSquare } from 'react-icons/fi';
import { SidebarChatShell } from '@editor/chat/components/SidebarChatShell';
import { ChatMessageList } from '@editor/chat/components/ChatMessageList';
import { ChatInput } from '@editor/chat/components/ChatInput';
import { useChatAgent } from '@editor/chat/hooks/useChatAgent';
import { useChatMessages } from '@editor/chat/hooks/useChatMessages';
import { useChatInput } from '@editor/chat/hooks/useChatInput';
import { useChatScroll } from '@editor/chat/hooks/useChatScroll';
import { useChatStreaming } from '@editor/chat/hooks/useChatStreaming';
import { useChatError } from '@editor/chat/state/selectors';

export interface IRightSidebarChatProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const RightSidebarChat: React.FC<IRightSidebarChatProps> = ({ isExpanded, onToggle }) => {
  const { sendMessage } = useChatAgent();
  const { displayMessages } = useChatMessages();
  const { initialized, isTyping } = useChatStreaming();
  const error = useChatError();

  const { inputValue, setInputValue, handleSend, handleKeyPress } = useChatInput({
    onSend: sendMessage,
    disabled: isTyping || !initialized,
  });

  const { messagesEndRef, inputRef } = useChatScroll({
    messages: displayMessages,
    isOpen: isExpanded,
  });

  // Collapsed state
  if (!isExpanded) {
    return (
      <SidebarChatShell
        side="right"
        isExpanded={false}
        onToggle={onToggle}
        header={
          <div
            className="flex-1 flex flex-col items-center justify-start pt-4 space-y-4 cursor-pointer"
            onClick={onToggle}
          >
            <div className="flex flex-col items-center space-y-2">
              <button
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
                title="Expand Chat"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <div className="p-1.5 bg-gray-800/50 rounded text-cyan-400" title="AI Assistant">
                <FiMessageSquare className="w-3 h-3" />
              </div>
            </div>
          </div>
        }
        input={<></>}
      >
        <></>
      </SidebarChatShell>
    );
  }

  // Expanded state header
  const header = (
    <div className="h-12 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-3 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

      <div className="relative z-10 flex items-center space-x-2 flex-1">
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
          title="Collapse Chat"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-gray-200 truncate">AI Assistant</h3>
          <div className="text-[10px] text-green-400">Online</div>
        </div>

        <button
          onClick={onToggle}
          className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center hover:from-cyan-300 hover:to-purple-400 transition-all duration-200"
          title="Collapse Chat"
        >
          <FiMessageSquare className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );

  // Messages
  const messages = (
    <>
      <ChatMessageList messages={displayMessages} error={error} size="sm" />
      <div ref={messagesEndRef} />
    </>
  );

  // Input
  const input = (
    <ChatInput
      value={inputValue}
      onChange={setInputValue}
      onSend={handleSend}
      onKeyPress={handleKeyPress}
      disabled={isTyping || !initialized}
      placeholder={!initialized ? 'Initializing...' : 'Type message...'}
      inputRef={inputRef}
      size="sm"
    />
  );

  return (
    <SidebarChatShell
      side="right"
      isExpanded={isExpanded}
      onToggle={onToggle}
      header={header}
      input={input}
    >
      {messages}
    </SidebarChatShell>
  );
};
