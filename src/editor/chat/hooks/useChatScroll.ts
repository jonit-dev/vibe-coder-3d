/**
 * useChatScroll Hook
 * Manages autoscroll and focus behavior for chat UI
 */

import { useEffect, useRef } from 'react';

export interface IUseChatScrollOptions {
  messages: unknown[];
  isOpen?: boolean;
}

export const useChatScroll = ({ messages, isOpen = true }: IUseChatScrollOptions) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Autoscroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return {
    messagesEndRef,
    inputRef,
    scrollToBottom,
  };
};
