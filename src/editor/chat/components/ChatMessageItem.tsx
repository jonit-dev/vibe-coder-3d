/**
 * ChatMessageItem Component
 * Renders individual chat messages (user/ai/screenshot/analysis)
 */

import React, { useState } from 'react';
import { FiCpu, FiUser, FiImage } from 'react-icons/fi';
import type { IDisplayChatMessage } from '@editor/chat/types/display';
import { formatTime } from '@editor/chat/utils/formatters';
import { Modal } from '@editor/components/shared/Modal';

export interface IChatMessageItemProps {
  message: IDisplayChatMessage;
  size?: 'sm' | 'md';
}

export const ChatMessageItem: React.FC<IChatMessageItemProps> = ({ message, size = 'md' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Size-based styling
  const avatarSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const timeSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const contentSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const paddingSize = size === 'sm' ? 'p-2.5' : 'p-3';
  const marginSize = size === 'sm' ? 'ml-6 mr-6' : 'ml-8 mr-8';

  // Screenshot message
  if (message.kind === 'screenshot') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%]">
          <div className="flex items-center space-x-1.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <FiImage className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-gray-300 font-medium">
              Screenshot • {formatTime(message.timestamp)}
            </span>
          </div>
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 border border-cyan-500/20 rounded-lg p-3 space-y-2 mr-8">
            <div className="text-xs text-gray-300 font-medium">{message.content}</div>
            <div className="relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
              <img
                src={
                  message.thumbnailData
                    ? `data:image/jpeg;base64,${message.thumbnailData}`
                    : `data:image/png;base64,${message.imageData}`
                }
                alt="Scene screenshot"
                className="w-full rounded border border-cyan-500/20 transition-all duration-200 group-hover:border-cyan-400/50"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                  Click to view full size
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

          {/* Full-size screenshot modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Screenshot"
            size="full"
            backdropOpacity="bg-black/80"
            scrollBody={true}
          >
            <div className="p-4 flex items-center justify-center">
              <img
                src={`data:image/png;base64,${message.imageData}`}
                alt="Scene screenshot - full size"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          </Modal>
        </div>
      </div>
    );
  }

  // Analysis message
  if (message.kind === 'analysis') {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-full">
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
        </div>
      </div>
    );
  }

  // Regular user/AI messages
  const isUser = message.kind === 'user';
  const Icon = isUser ? FiUser : FiCpu;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`flex items-center space-x-1.5 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`${avatarSize} rounded-full flex items-center justify-center ${
              isUser
                ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                : 'bg-gradient-to-br from-cyan-400 to-purple-500'
            }`}
          >
            <Icon className={`${iconSize} text-white`} />
          </div>
          <span className={`${timeSize} text-gray-300 font-medium`}>
            {isUser ? 'You' : 'AI'} • {formatTime(message.timestamp)}
          </span>
        </div>

        <div
          className={`${paddingSize} rounded-lg ${contentSize} ${
            isUser
              ? `bg-gradient-to-r from-cyan-500 to-blue-600 text-white ${marginSize.split(' ')[0]}`
              : `bg-gradient-to-r from-gray-700 to-gray-800 text-gray-100 border border-cyan-500/20 ${marginSize.split(' ')[1]}`
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
};
