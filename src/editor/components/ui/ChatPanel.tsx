import React, { useEffect, useRef, useState } from 'react';
import { FiCpu, FiSend, FiUser, FiX } from 'react-icons/fi';

export interface IChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface IChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPanel: React.FC<IChatPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<IChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content:
        "Hello! I'm your AI assistant. I can help you with scene editing, object manipulation, and answer questions about the editor. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: IChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Mock AI response after a delay
    setTimeout(() => {
      const aiMessage: IChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you want to: "${userMessage.content}". This is a mock response. In the future, I'll provide actual assistance with scene editing, object manipulation, and other editor features.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
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

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-14 bottom-8 w-96 bg-gradient-to-b from-[#0f0f10] to-[#1a1a1e] border-l border-gray-800/50 flex flex-col z-50 shadow-2xl">
      {/* Panel Header */}
      <div className="h-12 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-4 relative overflow-hidden">
        {/* Animated background */}
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              <div
                className={`flex items-center space-x-2 mb-1 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300/50 shadow-cyan-500/30'
                      : 'bg-gradient-to-br from-cyan-400 to-purple-500 border-purple-300/50 shadow-purple-500/30'
                  }`}
                >
                  {message.type === 'user' ? (
                    <FiUser className="w-3 h-3 text-white" />
                  ) : (
                    <FiCpu className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-xs text-gray-300 font-medium">
                  {message.type === 'user' ? 'You' : 'AI'} • {formatTime(message.timestamp)}
                </span>
              </div>

              <div
                className={`p-3 rounded-lg shadow-lg ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white ml-8 border border-cyan-400/30'
                    : 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-100 border-2 border-cyan-500/20 mr-8 shadow-cyan-500/10'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap font-medium">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                  <FiCpu className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-gray-400">AI • typing...</span>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 border-2 border-cyan-500/20 mr-8 shadow-lg shadow-cyan-500/10">
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
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full bg-black/30 border border-gray-600/30 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 transition-all duration-200 resize-none"
              disabled={isTyping}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="p-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center justify-center"
            title="Send Message (Enter)"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send • Shift+Enter for new line</span>
          <span className="text-cyan-400">AI Assistant v1.0</span>
        </div>
      </div>
    </div>
  );
};
