/**
 * Display Types for Chat UI
 * Type models for the view layer of the chat system
 */

export interface IDisplayBaseMessage {
  id: string;
  timestamp: Date;
}

export interface IUserMessage extends IDisplayBaseMessage {
  kind: 'user';
  content: string;
}

export interface IAssistantMessage extends IDisplayBaseMessage {
  kind: 'ai';
  content: string;
}

export interface IScreenshotMessage extends IDisplayBaseMessage {
  kind: 'screenshot';
  content: string;
  imageData: string;
  sceneInfo?: {
    entity_count: number;
    camera_position: string;
    selected_entities: number[];
    scene_name: string | null;
  };
}

export interface IAnalysisMessage extends IDisplayBaseMessage {
  kind: 'analysis';
  content: string;
}

export type IDisplayChatMessage =
  | IUserMessage
  | IAssistantMessage
  | IScreenshotMessage
  | IAnalysisMessage;
