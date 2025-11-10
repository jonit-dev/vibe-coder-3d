/**
 * Chat Formatting Utilities
 * Centralized formatting functions for chat UI
 */

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
