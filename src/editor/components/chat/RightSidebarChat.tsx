import React, { useEffect, useRef, useState } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiMessageSquare,
  FiSend,
  FiUser,
  FiAlertCircle,
} from 'react-icons/fi';
import { useChatAgent } from './hooks/useChatAgent';
import { useActiveSession, useChatError } from '@editor/store/chatStore';

export interface IChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface IRightSidebarChatProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const RightSidebarChat: React.FC<IRightSidebarChatProps> = ({ isExpanded, onToggle }) => {
  const activeSession = useActiveSession();
  const chatError = useChatError();
  const { sendMessage, isTyping, currentStream, initialized } = useChatAgent();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = activeSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping || !initialized) return;

    const content = inputValue.trim();
    setInputValue('');

    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`${
        isExpanded ? 'w-80' : 'w-16'
      } bg-gradient-to-b from-[#0f0f10] to-[#1a1a1e] border-l border-gray-800/50 flex-shrink-0 flex flex-col h-full relative transition-all duration-300 z-50`}
    >
      {/* Collapsed state */}
      {!isExpanded && (
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

            {/* AI Assistant icon indicator when collapsed */}
            <div className="p-1.5 bg-gray-800/50 rounded text-cyan-400" title="AI Assistant">
              <FiMessageSquare className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}

      {/* Expanded state header */}
      {isExpanded && (
        <div className="h-12 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-3 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

          <div className="relative z-10 flex items-center space-x-2 flex-1">
            {/* Collapse caret */}
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

            {/* Main chat icon */}
            <button
              onClick={onToggle}
              className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center hover:from-cyan-300 hover:to-purple-400 transition-all duration-200"
              title="Collapse Chat"
            >
              <FiMessageSquare className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Area - only shown when expanded */}
      {isExpanded && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50">
            {chatError && (
              <div className="flex items-start space-x-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                <FiAlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-200">{chatError}</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`flex items-center space-x-1.5 mb-1 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                          : 'bg-gradient-to-br from-cyan-400 to-purple-500'
                      }`}
                    >
                      {message.type === 'user' ? (
                        <FiUser className="w-2.5 h-2.5 text-white" />
                      ) : (
                        <FiCpu className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-300 font-medium">
                      {message.type === 'user' ? 'You' : 'AI'} • {formatTime(message.timestamp)}
                    </span>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg text-xs ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white ml-6'
                        : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-100 border border-cyan-500/20 mr-6'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                      <FiCpu className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[10px] text-gray-400">
                      AI • {currentStream ? 'responding' : 'thinking'}...
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 border border-cyan-500/20 mr-6">
                    {currentStream ? (
                      <p className="text-xs text-gray-100 whitespace-pre-wrap">{currentStream}</p>
                    ) : (
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
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
          <div className="p-3 border-t border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={!initialized ? 'Initializing...' : 'Type message...'}
                  className="w-full bg-black/30 border border-gray-600/30 rounded-md px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 transition-all duration-200"
                  disabled={isTyping || !initialized}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping || !initialized}
                className="p-1.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-md transition-all duration-200 flex items-center justify-center"
                title="Send Message"
              >
                <FiSend className="w-3 h-3" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
