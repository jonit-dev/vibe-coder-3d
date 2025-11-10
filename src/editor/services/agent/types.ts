/**
 * Type definitions for Claude Agent SDK integration
 * Following PRD: docs/PRDs/editor/claude-agent-sdk-integration-prd.md
 */

export interface IAgentMessage {
  id: string;
  type: 'user' | 'ai' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: IToolCall[];
  metadata?: Record<string, unknown>;
}

export interface IAgentSession {
  id: string;
  messages: IAgentMessage[];
  context: ICodebaseContext;
  createdAt: Date;
  lastActivity: Date;
}

export interface ICodebaseContext {
  projectRoot: string;
  currentScene: string | null;
  selectedEntities: number[];
  recentFiles: string[];
  claudeMemory: string[];
}

export interface IToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface IAgentConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

export interface IOpenRouterConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface IMessageOptions {
  temperature?: number;
  maxTokens?: number;
  tools?: unknown[];
  stream?: boolean;
  system?: string;
}

export interface ITool {
  name: string;
  description: string;
  parameters: unknown; // Zod schema
  execute: (args: unknown) => Promise<unknown>;
  permissions?: string[];
}
