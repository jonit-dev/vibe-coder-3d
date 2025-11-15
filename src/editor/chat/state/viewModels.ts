/**
 * Chat View Models
 * Converts agent messages to display messages for the UI
 */

import type { IAgentMessage } from '@editor/services/agent/types';
import type { IDisplayChatMessage, IScreenshotMessage } from '@editor/chat/types/display';

export function toDisplayMessages(messages: IAgentMessage[]): IDisplayChatMessage[] {
  const converted: IDisplayChatMessage[] = messages.map((msg) => {
    // Screenshot message
    if (msg.metadata?.isScreenshot) {
      const metadata = msg.metadata as {
        imageData?: string;
        thumbnailData?: string;
        sceneInfo?: Record<string, unknown>
      };

      // Validate and transform sceneInfo to match expected interface
      const sceneInfo = metadata.sceneInfo ? {
        entity_count: Number(metadata.sceneInfo.entity_count) || 0,
        camera_position: String(metadata.sceneInfo.camera_position || ''),
        selected_entities: Array.isArray(metadata.sceneInfo.selected_entities)
          ? metadata.sceneInfo.selected_entities.map(Number)
          : [],
        scene_name: metadata.sceneInfo.scene_name ? String(metadata.sceneInfo.scene_name) : null,
      } satisfies IScreenshotMessage['sceneInfo'] : undefined;

      return {
        id: msg.id,
        kind: 'screenshot' as const,
        content: msg.content,
        timestamp: msg.timestamp,
        imageData: metadata.imageData as string,
        thumbnailData: metadata.thumbnailData,
        sceneInfo,
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
