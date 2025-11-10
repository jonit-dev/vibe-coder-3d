/**
 * ChatInput Component
 * Input field for sending chat messages
 */

import React from 'react';
import { FiSend } from 'react-icons/fi';

export interface IChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  size?: 'sm' | 'md';
}

export const ChatInput: React.FC<IChatInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled = false,
  placeholder = 'Type message...',
  inputRef,
  size = 'sm',
}) => {
  const inputClasses =
    size === 'sm'
      ? 'px-2.5 py-1.5 text-xs'
      : 'px-3 py-2 text-sm';

  const buttonClasses = size === 'sm' ? 'p-1.5' : 'p-2';
  const iconClasses = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="flex items-end space-x-2">
      <div className="flex-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          className={`w-full bg-black/30 border border-gray-600/30 rounded-md ${inputClasses} text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 transition-all duration-200`}
          disabled={disabled}
        />
      </div>
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className={`${buttonClasses} bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-md transition-all duration-200 flex items-center justify-center`}
        title="Send Message"
      >
        <FiSend className={iconClasses} />
      </button>
    </div>
  );
};
