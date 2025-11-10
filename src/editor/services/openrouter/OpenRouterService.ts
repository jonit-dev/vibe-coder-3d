/**
 * OpenRouter Service
 * Provides integration with OpenRouter API for vision-enabled models
 * Used for analyzing screenshots with custom AI models
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('OpenRouterService');

export interface IOpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content:
    | string
    | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export interface IOpenRouterRequest {
  model: string;
  messages: IOpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  reasoning?: {
    effort?: 'low' | 'medium' | 'high';
  };
}

export interface IOpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface IScreenshotAnalysisRequest {
  imageData: string; // base64 encoded PNG
  prompt: string;
  systemPrompt?: string;
  thinkingEffort?: 'low' | 'medium' | 'high'; // Enable thinking/reasoning mode
}

export class OpenRouterService {
  private static instance: OpenRouterService;
  private apiKey: string = '';
  private baseURL: string = 'https://openrouter.ai/api/v1';
  private model: string = '';
  private initialized = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService();
    }
    return OpenRouterService.instance;
  }

  initialize(): void {
    if (this.initialized) {
      logger.warn('OpenRouterService already initialized');
      return;
    }

    this.apiKey = import.meta.env.VITE_OPENROUTER_VISION_API_KEY || '';
    this.model = import.meta.env.VITE_OPENROUTER_VISION_MODEL || 'anthropic/claude-3.5-sonnet';

    if (!this.apiKey) {
      logger.error('VITE_OPENROUTER_VISION_API_KEY not found in environment');
      throw new Error('VITE_OPENROUTER_VISION_API_KEY is required for OpenRouter integration');
    }

    this.initialized = true;
    logger.info('OpenRouterService initialized', {
      model: this.model,
      baseURL: this.baseURL,
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Analyze a screenshot using OpenRouter's vision-enabled models
   * @param request Screenshot and analysis parameters
   * @returns AI analysis response
   */
  async analyzeScreenshot(request: IScreenshotAnalysisRequest): Promise<string> {
    if (!this.initialized) {
      throw new Error('OpenRouterService not initialized. Call initialize() first.');
    }

    logger.info('Analyzing screenshot with OpenRouter', {
      model: this.model,
      promptLength: request.prompt.length,
      imageDataLength: request.imageData.length,
    });

    try {
      const messages: IOpenRouterMessage[] = [];

      // Add system prompt if provided
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      // Add user message with image
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: request.prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${request.imageData}`,
            },
          },
        ],
      });

      const requestBody: IOpenRouterRequest = {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      };

      // Add thinking/reasoning budget if specified
      if (request.thinkingEffort) {
        requestBody.reasoning = {
          effort: request.thinkingEffort,
        };
        logger.info('Enabling thinking mode', { effort: request.thinkingEffort });
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Vibe Coder 3D',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OpenRouter API request failed', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data: IOpenRouterResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      const analysisText = data.choices[0].message.content;

      logger.info('Screenshot analysis complete', {
        responseLength: analysisText.length,
        tokensUsed: data.usage?.total_tokens || 0,
        model: data.model,
      });

      return analysisText;
    } catch (error) {
      logger.error('Failed to analyze screenshot', { error });
      throw error;
    }
  }

  /**
   * Send a generic message to OpenRouter (without images)
   * @param messages Conversation messages
   * @param options Request options
   * @returns AI response
   */
  async sendMessage(
    messages: IOpenRouterMessage[],
    options?: { temperature?: number; max_tokens?: number },
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('OpenRouterService not initialized. Call initialize() first.');
    }

    logger.info('Sending message to OpenRouter', {
      model: this.model,
      messageCount: messages.length,
    });

    try {
      const requestBody: IOpenRouterRequest = {
        model: this.model,
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 1000,
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Vibe Coder 3D',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OpenRouter API request failed', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data: IOpenRouterResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      logger.error('Failed to send message', { error });
      throw error;
    }
  }

  /**
   * Test the OpenRouter connection
   * @returns True if connection successful
   */
  async testConnection(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      logger.info('Testing OpenRouter connection');

      const response = await this.sendMessage(
        [
          {
            role: 'user',
            content: 'Hello, respond with just "OK" if you can read this.',
          },
        ],
        { max_tokens: 10 },
      );

      const success = response.toLowerCase().includes('ok');
      logger.info('Connection test result', { success, response });

      return success;
    } catch (error) {
      logger.error('Connection test failed', { error });
      return false;
    }
  }

  /**
   * Get the currently configured model
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Update the model to use
   * @param model Model identifier (e.g., 'anthropic/claude-3.5-sonnet')
   */
  setModel(model: string): void {
    logger.info('Updating OpenRouter model', { from: this.model, to: model });
    this.model = model;
  }

  cleanup(): void {
    this.initialized = false;
    this.apiKey = '';
    logger.info('OpenRouterService cleaned up');
  }
}
