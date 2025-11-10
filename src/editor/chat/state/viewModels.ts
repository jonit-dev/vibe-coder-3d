/**
 * Chat View Models
 * Converts agent messages to display messages for the UI
 */

import type { IAgentMessage } from '@editor/services/agent/types';
import type { IDisplayChatMessage } from '@editor/chat/types/display';

export function toDisplayMessages(messages: IAgentMessage[]): IDisplayChatMessage[] {
  const converted: IDisplayChatMessage[] = messages.map((msg) => {
    // Screenshot message
    if (msg.metadata?.isScreenshot) {
      return {
        id: msg.id,
        kind: 'screenshot' as const,
        content: msg.content,
        timestamp: msg.timestamp,
        imageData: (msg.metadata as any).imageData as string,
        thumbnailData: (msg.metadata as any).thumbnailData as string | undefined,
        sceneInfo: (msg.metadata as any).sceneInfo,
      };
    }

    // Analysis message
    if (msg.metadata?.isAnalysis) {
      return {
        id: msg.id,
        kind: 'analysis',
        content: msg.content,
        timestamp: msg.timestamp,
      } as IDisplayChatMessage;
    }

    // Regular user/ai message
    return {
      id: msg.id,
      kind: msg.type === 'user' ? 'user' : 'ai',
      content: msg.content,
      timestamp: msg.timestamp,
    } as IDisplayChatMessage;
  });

  // Sort by timestamp to ensure chronological order
  return converted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
