/**
 * useChatInput Hook
 * Manages chat input state and message sending
 */

import { useState, useCallback } from 'react';

export interface IUseChatInputOptions {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export const useChatInput = ({ onSend, disabled = false }: IUseChatInputOptions) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || disabled) return;

    const content = inputValue.trim();
    setInputValue('');

    await onSend(content);
  }, [inputValue, disabled, onSend]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return {
    inputValue,
    setInputValue,
    handleSend,
    handleKeyPress,
    canSend: !!inputValue.trim() && !disabled,
  };
};
