/**
 * ChatStatusBar Component
 * Shows typing indicator and streaming status
 */

import React from 'react';

export interface IChatStatusBarProps {
  isTyping: boolean;
  currentStream?: string;
}

export const ChatStatusBar: React.FC<IChatStatusBarProps> = ({ isTyping, currentStream }) => {
  if (!isTyping) return null;

  return (
    <div className="mb-3 flex items-center space-x-2 text-cyan-400 text-xs">
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
      <span className="animate-pulse">
        {currentStream ? 'AI is responding...' : 'AI is thinking...'}
      </span>
    </div>
  );
};
