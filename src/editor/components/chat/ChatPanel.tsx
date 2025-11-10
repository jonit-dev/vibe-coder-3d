import React, { useEffect, useRef, useState } from 'react';
import {
  FiCpu,
  FiSend,
  FiUser,
  FiX,
  FiAlertCircle,
  FiCamera,
  FiImage,
  FiSquare,
} from 'react-icons/fi';
import { useChatAgent } from './hooks/useChatAgent';
import { useActiveSession, useChatError, useChatStore } from '@editor/store/chatStore';

export interface IChatMessage {
  id: string;
  type: 'user' | 'ai' | 'screenshot' | 'analysis';
  content: string;
  timestamp: Date;
  imageData?: string;
  sceneInfo?: {
    entity_count: number;
    camera_position: string;
    selected_entities: number[];
    scene_name: string | null;
  };
}

export interface IChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPanel: React.FC<IChatPanelProps> = ({ isOpen, onClose }) => {
  const activeSession = useActiveSession();
  const chatError = useChatError();
  const { sendMessage, cancelMessage, isTyping, currentStream, initialized } = useChatAgent();

  const [inputValue, setInputValue] = useState('');
  const [displayMessages, setDisplayMessages] = useState<IChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get messages from active session
  const messages = activeSession?.messages || [];

  // Convert agent messages to display messages and sort by timestamp
  useEffect(() => {
    console.log('[ChatPanel] SCREENSHOT STEP 10: Converting messages', {
      totalMessages: messages.length,
      messageIds: messages.map((m) => m.id),
      messagesWithMetadata: messages.filter((m) => m.metadata).length,
      screenshotMessages: messages.filter((m) => m.metadata?.isScreenshot).length,
    });

    const converted: IChatMessage[] = messages.map((msg) => {
      // Check if this is a screenshot message
      if (msg.metadata?.isScreenshot) {
        const imageData = msg.metadata.imageData as string | undefined;
        console.log('[ChatPanel] SCREENSHOT STEP 11: Converting screenshot message', {
          id: msg.id,
          hasImageData: !!imageData,
          imageDataLength: imageData?.length,
          hasSceneInfo: !!msg.metadata.sceneInfo,
        });
        return {
          id: msg.id,
          type: 'screenshot' as const,
          content: msg.content,
          timestamp: msg.timestamp,
          imageData: msg.metadata.imageData as string,
          sceneInfo: msg.metadata.sceneInfo as IChatMessage['sceneInfo'],
        };
      }

      // Check if this is an analysis message
      if (msg.metadata?.isAnalysis) {
        console.log('[ChatPanel] Converting analysis message to display', { id: msg.id });
        return {
          id: msg.id,
          type: 'analysis' as const,
          content: msg.content,
          timestamp: msg.timestamp,
        };
      }

      // Regular user/ai message
      return {
        id: msg.id,
        type: msg.type === 'user' ? ('user' as const) : ('ai' as const),
        content: msg.content,
        timestamp: msg.timestamp,
      };
    });

    // Sort messages by timestamp to ensure correct chronological order
    const sortedMessages = converted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    console.log('[ChatPanel] SCREENSHOT STEP 12: Display messages set', {
      total: sortedMessages.length,
      screenshots: sortedMessages.filter((m) => m.type === 'screenshot').length,
      analyses: sortedMessages.filter((m) => m.type === 'analysis').length,
      displayScreenshots: sortedMessages
        .filter((m) => m.type === 'screenshot')
        .map((m) => ({ id: m.id, hasImageData: !!m.imageData })),
    });

    setDisplayMessages(sortedMessages);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Listen for screenshot capture events
  // NOTE: Empty deps array - listeners should persist for entire component lifecycle
  useEffect(() => {
    console.log('[ChatPanel] SCREENSHOT STEP 4: Event listener registered (MOUNT)');

    const handleScreenshotCaptured = (event: Event) => {
      console.log('[ChatPanel] SCREENSHOT STEP 5: Event received in ChatPanel', {
        eventType: event.type,
      });

      const customEvent = event as CustomEvent;
      const { imageData, sceneInfo, reason } = customEvent.detail;

      console.log('[ChatPanel] SCREENSHOT STEP 6: Event detail extracted', {
        hasImageData: !!imageData,
        imageDataLength: imageData?.length,
        hasSceneInfo: !!sceneInfo,
        entityCount: sceneInfo?.entity_count,
        reason,
      });

      // Get active session from store at event time (not from closure)
      const currentSession = useChatStore.getState().getActiveSession();

      if (!currentSession) {
        console.error('[ChatPanel] SCREENSHOT STEP 7: NO ACTIVE SESSION - STOPPING');
        return;
      }

      console.log('[ChatPanel] SCREENSHOT STEP 8: Adding to session store', {
        sessionId: currentSession.id,
      });

      // Add to session store - will be displayed via conversion effect
      const messageId = `screenshot-${Date.now()}`;
      useChatStore.getState().addMessage(currentSession.id, {
        id: messageId,
        type: 'tool',
        content: `📸 Screenshot captured: ${reason}`,
        timestamp: new Date(),
        metadata: { imageData, sceneInfo, reason, isScreenshot: true },
      });

      console.log('[ChatPanel] SCREENSHOT STEP 9: Message added to store', {
        messageId,
      });
    };

    const handleScreenshotAnalysis = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { analysis } = customEvent.detail;

      // Get active session from store at event time (not from closure)
      const currentSession = useChatStore.getState().getActiveSession();

      if (!currentSession) {
        console.warn('[ChatPanel] Analysis received but no active session');
        return;
      }

      console.log('[ChatPanel] Analysis received, adding to chat', {
        analysisLength: analysis?.length,
        preview: analysis?.substring(0, 100),
      });

      // Add to session store - will be displayed via conversion effect
      useChatStore.getState().addMessage(currentSession.id, {
        id: `analysis-${Date.now()}`,
        type: 'ai',
        content: `🔍 Visual Analysis:\n\n${analysis}`,
        timestamp: new Date(),
        metadata: { isAnalysis: true },
      });
    };

    window.addEventListener('agent:screenshot-captured', handleScreenshotCaptured);
    window.addEventListener('agent:screenshot-analysis', handleScreenshotAnalysis);

    return () => {
      window.removeEventListener('agent:screenshot-captured', handleScreenshotCaptured);
      window.removeEventListener('agent:screenshot-analysis', handleScreenshotAnalysis);
    };
  }, []); // Empty deps - listeners persist for component lifetime

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

  const handleScreenshotFeedback = async () => {
    if (isTyping || !initialized) return;

    const feedbackPrompt =
      'Please take a screenshot of the current scene and describe what you see. Are there any issues or improvements you can identify?';
    setInputValue('');

    try {
      await sendMessage(feedbackPrompt);
    } catch (error) {
      console.error('Failed to send screenshot feedback request:', error);
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
        {/* Error Message */}
        {chatError && (
          <div className="flex items-start space-x-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-300 font-medium">Configuration Error</p>
              <p className="text-xs text-red-200 mt-1">{chatError}</p>
            </div>
          </div>
        )}

        {displayMessages.map((message) => {
          if (message.type === 'screenshot') {
            console.log('[ChatPanel] SCREENSHOT STEP 13: Rendering screenshot message', {
              id: message.id,
              hasImageData: !!message.imageData,
              imageDataLength: message.imageData?.length,
            });
          }
          return (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user'
                  ? 'justify-end'
                  : message.type === 'screenshot' || message.type === 'analysis'
                    ? 'justify-center'
                    : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] ${
                  message.type === 'user'
                    ? 'order-2'
                    : message.type === 'screenshot' || message.type === 'analysis'
                      ? 'w-full max-w-full'
                      : 'order-1'
                }`}
              >
                {/* Screenshot Message */}
                {message.type === 'screenshot' && message.imageData && (
                  <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center space-x-2 text-purple-300">
                      <FiImage className="w-4 h-4" />
                      <span className="text-xs font-medium">{message.content}</span>
                      <span className="text-xs text-gray-400">
                        • {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="relative group">
                      <img
                        src={`data:image/png;base64,${message.imageData}`}
                        alt="Scene screenshot"
                        className="w-full rounded border border-purple-500/30 cursor-pointer transition-all duration-200 hover:border-purple-400/60"
                        onClick={() => {
                          // Open full size in new window
                          const win = window.open();
                          if (win) {
                            win.document.write(
                              `<img src="data:image/png;base64,${message.imageData}" style="max-width:100%;height:auto;"/>`,
                            );
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                          Click to enlarge
                        </span>
                      </div>
                    </div>
                    {message.sceneInfo && (
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Scene: {message.sceneInfo.scene_name || 'unnamed'}</div>
                        <div>Entities: {message.sceneInfo.entity_count}</div>
                        {message.sceneInfo.selected_entities.length > 0 && (
                          <div>Selected: {message.sceneInfo.selected_entities.join(', ')}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis Message */}
                {message.type === 'analysis' && (
                  <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <FiCpu className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-green-300 font-medium">
                        AI Visual Analysis • {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                      {message.content.replace('🔍 Visual Analysis:\n\n', '')}
                    </p>
                  </div>
                )}

                {/* Regular user/AI messages */}
                {(message.type === 'user' || message.type === 'ai') && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          );
        })}

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
        {/* Loading indicator when AI is working */}
        {isTyping && (
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
        )}

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
          {/* Show stop button when AI is working, send button otherwise */}
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
              onClick={handleSendMessage}
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
