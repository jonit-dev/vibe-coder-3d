/**
 * ChatPanel Component
 * Main chat panel with screenshot support
 */

import React from 'react';
import { FiX, FiCamera, FiSquare, FiCpu, FiSend } from 'react-icons/fi';
import { ChatMessageList } from '@editor/chat/components/ChatMessageList';
import { ChatStatusBar } from '@editor/chat/components/ChatStatusBar';
import { useChatAgent } from '@editor/chat/hooks/useChatAgent';
import { useChatMessages } from '@editor/chat/hooks/useChatMessages';
import { useChatInput } from '@editor/chat/hooks/useChatInput';
import { useChatScroll } from '@editor/chat/hooks/useChatScroll';
import { useChatStreaming } from '@editor/chat/hooks/useChatStreaming';
import { useScreenshotEvents } from '@editor/chat/hooks/useScreenshotEvents';
import { useChatError } from '@editor/chat/state/selectors';

export interface IChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPanel: React.FC<IChatPanelProps> = ({ isOpen, onClose }) => {
  // Hook up screenshot events
  useScreenshotEvents();

  const { sendMessage, cancelMessage } = useChatAgent();
  const { displayMessages } = useChatMessages();
  const { initialized, isTyping, currentStream } = useChatStreaming();
  const error = useChatError();

  const { inputValue, setInputValue, handleSend, handleKeyPress } = useChatInput({
    onSend: sendMessage,
    disabled: isTyping || !initialized,
  });

  const { messagesEndRef, inputRef } = useChatScroll({
    messages: displayMessages,
    isOpen,
  });

  const handleScreenshotFeedback = async () => {
    if (isTyping || !initialized) return;

    const feedbackPrompt =
      'Please take a screenshot of the current scene and describe what you see. Are there any issues or improvements you can identify?';

    try {
      await sendMessage(feedbackPrompt);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Error handled by agent service
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-14 bottom-8 w-96 bg-gradient-to-b from-[#0f0f10] to-[#1a1a1e] border-l border-gray-800/50 flex flex-col z-50 shadow-2xl">
      {/* Panel Header */}
      <div className="h-12 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
            <FiCpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-200">AI Assistant</h3>
            <div className="text-xs text-green-400">Online</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
          title="Close Chat"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50">
        <ChatMessageList messages={displayMessages} error={error} size="md" />

        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                  <FiCpu className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-gray-400">
                  AI • {currentStream ? 'responding' : 'thinking'}...
                </span>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 border-2 border-cyan-500/20 mr-8 shadow-lg shadow-cyan-500/10">
                {currentStream ? (
                  <p className="text-sm text-gray-100 whitespace-pre-wrap font-medium">
                    {currentStream}
                  </p>
                ) : (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
        <ChatStatusBar isTyping={isTyping} currentStream={currentStream} />

        <div className="flex items-end space-x-2">
          <button
            onClick={handleScreenshotFeedback}
            disabled={isTyping || !initialized}
            className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center justify-center"
            title="Get AI Feedback on Current Scene"
          >
            <FiCamera className="w-4 h-4" />
          </button>

          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                !initialized
                  ? 'Initializing AI...'
                  : isTyping
                    ? 'AI is working...'
                    : 'Type your message...'
              }
              className="w-full bg-black/30 border border-gray-600/30 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 transition-all duration-200 resize-none"
              disabled={isTyping || !initialized}
            />
          </div>

          {isTyping ? (
            <button
              onClick={cancelMessage}
              className="p-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center"
              title="Stop AI"
            >
              <FiSquare className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || !initialized}
              className="p-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center justify-center"
              title="Send Message (Enter)"
            >
              <FiSend className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send • Shift+Enter for new line</span>
          <span className={initialized ? 'text-green-400' : 'text-yellow-400'}>
            {initialized ? 'AI Ready' : 'Initializing...'}
          </span>
        </div>
      </div>
    </div>
  );
};
