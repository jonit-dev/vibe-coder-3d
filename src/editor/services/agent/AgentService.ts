/**
 * Agent Service - Using Anthropic SDK
 * Manages AI agent with proper tool calling support
 */

import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '@core/lib/logger';
import { AVAILABLE_TOOLS, executeTool } from './tools';
import type { IAgentMessage, ICodebaseContext } from './types';
import { formatShapesForPrompt } from './utils/shapeDiscovery';
import { buildSystemPrompt, buildScreenshotAnalysisInstructions } from './prompts';

const logger = Logger.create('AgentService');

interface ISendMessageOptions {
  onStream?: (chunk: string) => void;
  onComplete?: (response: string) => void;
  onToolUse?: (tool: string, args: unknown, result?: unknown) => void;
  onError?: (error: Error) => void;
}

interface IScreenshotData {
  imageData: string;
  sceneInfo: {
    entity_count: number;
    camera_position: string;
    selected_entities: number[];
    scene_name: string | null;
  };
  reason: string;
}

export class AgentService {
  private static instance: AgentService;
  private client!: Anthropic;
  private initialized = false;
  private pendingScreenshot: IScreenshotData | null = null;
  private currentAbortController: AbortController | null = null;

  private constructor() {
    // Private constructor for singleton

    // Listen for screenshot events
    window.addEventListener('agent:screenshot-captured', ((event: CustomEvent) => {
      this.pendingScreenshot = event.detail;
      logger.info('SCREENSHOT STEP 3 (AgentService): Received screenshot event', {
        reason: event.detail.reason,
        imageDataLength: event.detail.imageData?.length,
        entityCount: event.detail.sceneInfo?.entity_count,
      });
    }) as EventListener);
  }

  static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  initialize(): void {
    if (this.initialized) {
      logger.warn('AgentService already initialized');
      return;
    }

    const apiKey = import.meta.env.VITE_CLAUDE_CODE_SDK_API_KEY;
    const configuredBaseURL = import.meta.env.VITE_CLAUDE_CODE_SDK_BASE_URL;

    if (!apiKey) {
      throw new Error('VITE_CLAUDE_CODE_SDK_API_KEY is required');
    }

    if (!configuredBaseURL) {
      throw new Error('VITE_CLAUDE_CODE_SDK_BASE_URL is required');
    }

    // Use Vite plugin API proxy to avoid CORS
    const proxyEndpoint = '/api/ai';

    // Create custom fetch that routes through our Vite plugin
    const customFetch: typeof fetch = (input, init) => {
      const url =
        typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
      // Replace the absolute API URL with our plugin endpoint
      const proxiedUrl = url.replace(configuredBaseURL, proxyEndpoint);

      return fetch(proxiedUrl, init);
    };

    this.client = new Anthropic({
      apiKey,
      baseURL: configuredBaseURL, // SDK needs valid URL format
      dangerouslyAllowBrowser: true,
      fetch: customFetch, // Route through our Vite plugin
    });

    this.initialized = true;
    logger.info('AgentService initialized with Anthropic SDK (using Vite proxy)', {
      baseURL: configuredBaseURL,
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  cancelCurrentRequest(): void {
    if (this.currentAbortController) {
      logger.info('Cancelling current AI request');
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  async sendMessage(
    sessionId: string,
    messages: IAgentMessage[],
    context: ICodebaseContext,
    options?: ISendMessageOptions,
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('AgentService not initialized');
    }

    logger.info('Sending message', { sessionId, messageCount: messages.length });

    // Create new abort controller for this request
    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    try {
      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(context);

      // Convert messages to Anthropic format
      const anthropicMessages = messages.map((msg) => ({
        role: msg.type === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      }));

      // Get model and settings
      const model = import.meta.env.VITE_CLAUDE_CODE_SDK_MODEL || 'glm-4.6';
      const maxTokens = parseInt(import.meta.env.VITE_AGENT_MAX_CONTEXT_TOKENS || '4096', 10);

      let fullResponse = '';
      let continueWithTools = true;
      const conversationMessages: Anthropic.MessageParam[] = [...anthropicMessages];
      let isFirstTextAfterScreenshot = false;
      let screenshotAnalysis = '';
      let lastAssistantText = '';

      // Multi-turn conversation loop for tool use
      while (continueWithTools) {
        const toolUses = new Map<number, { id: string; name: string; input: string }>();
        const contentBlocks: Anthropic.ContentBlock[] = [];
        let currentTextBlock = '';

        // Check if aborted before making request
        if (signal.aborted) {
          throw new Error('Request cancelled');
        }

        // Stream the response
        const stream = await this.client.messages.create({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: conversationMessages,
          tools: AVAILABLE_TOOLS,
          stream: true,
        });

        for await (const event of stream) {
          // Check if cancelled during streaming
          if (signal.aborted) {
            throw new Error('Request cancelled');
          }

          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              const text = event.delta.text;
              currentTextBlock += text;
              fullResponse += text;
              options?.onStream?.(text);

              // Capture text after screenshot for analysis validation
              if (isFirstTextAfterScreenshot) {
                screenshotAnalysis += text;
                // Stop capturing after we get the first text block (the analysis)
                if (text.includes('\n\n') || currentTextBlock.length > 500) {
                  isFirstTextAfterScreenshot = false;
                }
              }
            } else if (event.delta.type === 'input_json_delta') {
              // Accumulate tool input JSON
              const blockIndex = event.index;
              const existing = toolUses.get(blockIndex);
              if (existing) {
                existing.input += event.delta.partial_json;
              }
            }
          } else if (event.type === 'content_block_start') {
            if (event.content_block.type === 'tool_use') {
              // Save any text block before tool
              if (currentTextBlock) {
                contentBlocks.push({
                  type: 'text',
                  text: currentTextBlock,
                } as Anthropic.ContentBlock);
                currentTextBlock = '';
              }
              // Start accumulating tool input
              toolUses.set(event.index, {
                id: event.content_block.id,
                name: event.content_block.name,
                input: '',
              });
              logger.info('Tool use started', {
                toolName: event.content_block.name,
                index: event.index,
              });
            }
          } else if (event.type === 'content_block_stop') {
            // Save text block if any
            if (currentTextBlock) {
              contentBlocks.push({
                type: 'text',
                text: currentTextBlock,
              } as Anthropic.ContentBlock);
              currentTextBlock = '';
            }
          }
        }

        // Save final text block
        if (currentTextBlock) {
          contentBlocks.push({ type: 'text', text: currentTextBlock } as Anthropic.ContentBlock);
        }

        // If tools were used, execute them and continue conversation
        if (toolUses.size > 0) {
          // Capture this turn's assistant text only (exclude tool results)
          const thisTurnAssistantText = contentBlocks
            .filter((b) => b.type === 'text')
            .map((b) => (b as Anthropic.TextBlock).text)
            .join('');
          lastAssistantText = thisTurnAssistantText;

          // Add assistant's message with tool uses
          const assistantToolBlocks: Anthropic.ToolUseBlock[] = [];
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const [, toolUse] of toolUses.entries()) {
            try {
              // Log raw input for debugging
              logger.debug('Parsing tool input', {
                tool: toolUse.name,
                rawInput: toolUse.input.substring(0, 200),
              });

              // Parse and validate JSON
              let params;
              try {
                params = JSON.parse(toolUse.input);
              } catch (parseError) {
                const errorMsg =
                  parseError instanceof Error ? parseError.message : 'Invalid JSON';
                logger.error('Model generated invalid JSON for tool call', {
                  tool: toolUse.name,
                  parseError: errorMsg,
                  rawInput: toolUse.input,
                  hint: 'This is a model generation error - the AI generated malformed JSON',
                });
                throw new Error(
                  `Invalid JSON in tool parameters: ${errorMsg}. Raw input: ${toolUse.input}`,
                );
              }

              logger.info('Executing tool', { tool: toolUse.name, params });

              const result = await executeTool(toolUse.name, params);
              logger.info('Tool executed', { tool: toolUse.name, result });
              options?.onToolUse?.(toolUse.name, params, result);

              // Add tool use to assistant message
              assistantToolBlocks.push({
                type: 'tool_use',
                id: toolUse.id,
                name: toolUse.name,
                input: params,
              });

              // Create tool result content - may include screenshot image
              let toolResultContent:
                | string
                | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam>;

              // If this was a screenshot tool, include the image
              if (toolUse.name === 'screenshot_feedback' && this.pendingScreenshot) {
                const analysisInstructions = buildScreenshotAnalysisInstructions(result, {
                  entityCount: this.pendingScreenshot.sceneInfo.entity_count,
                });

                toolResultContent = [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: 'image/png',
                      data: this.pendingScreenshot.imageData,
                    },
                  },
                  {
                    type: 'text',
                    text: analysisInstructions,
                  },
                ];

                logger.info('Including screenshot in tool result', {
                  reason: this.pendingScreenshot.reason,
                  imageSize: this.pendingScreenshot.imageData.length,
                });

                // Clear pending screenshot after use
                this.pendingScreenshot = null;
              } else {
                toolResultContent = result;
              }

              // Create tool result for next turn
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: toolResultContent,
              });

              // Intentionally do not stream tool result text into the main response.
              // Tool activity will be surfaced via onToolUse and dedicated UI.
            } catch (error) {
              const isJsonError = error instanceof Error && error.message.includes('Invalid JSON');
              const errorType = isJsonError ? 'JSON Parse Error' : 'Tool Execution Error';

              logger.error('Tool execution failed', {
                tool: toolUse.name,
                errorType,
                error,
                rawInput: toolUse.input.substring(0, 500),
              });

              // Try to parse input or use raw string
              let inputForMessage;
              try {
                inputForMessage = JSON.parse(toolUse.input);
              } catch {
                // If parsing fails, create a minimal valid object with error details
                inputForMessage = {
                  _error: 'Invalid JSON input',
                  _rawInput: toolUse.input.substring(0, 100),
                };
              }

              assistantToolBlocks.push({
                type: 'tool_use',
                id: toolUse.id,
                name: toolUse.name,
                input: inputForMessage,
              });

              const errorMsg = error instanceof Error ? error.message : 'Tool execution failed';
              const userFriendlyError = isJsonError
                ? `${errorMsg}\n\nYou generated malformed JSON. Please ensure all property names are properly quoted and the JSON is valid. Example: {"query_type": "list_entities", "filter": {"nameContains": "pawn"}}`
                : `${errorMsg}. Please check your input format and try again.`;

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: userFriendlyError,
                is_error: true,
              });

              const errorMessage = `\n\n✗ ${toolUse.name} [${errorType}]: ${errorMsg}`;
              fullResponse += errorMessage;
              options?.onStream?.(errorMessage);
            }
          }

          // Add assistant message with tool uses
          conversationMessages.push({
            role: 'assistant',
            content: [
              ...contentBlocks,
              ...assistantToolBlocks,
            ] as Anthropic.MessageParam['content'],
          });

          // Add user message with tool results
          conversationMessages.push({
            role: 'user',
            content: toolResults as Anthropic.MessageParam['content'],
          });

          // Check if we just sent a screenshot - next response will be the analysis
          const hadScreenshot =
            toolUses.size > 0 &&
            Array.from(toolUses.values()).some((t) => t.name === 'screenshot_feedback');
          if (hadScreenshot) {
            logger.info('Screenshot tool detected, will capture next text as analysis');
            isFirstTextAfterScreenshot = true;
            screenshotAnalysis = '';
          }

          // Continue the conversation to get AI's response to tool results
          continue;
        } else {
          // No more tools, conversation complete
          continueWithTools = false;

          // Capture final turn text (the actual assistant reply to user)
          const finalAssistantText = contentBlocks
            .filter((b) => b.type === 'text')
            .map((b) => (b as Anthropic.TextBlock).text)
            .join('');
          if (finalAssistantText.trim()) {
            lastAssistantText = finalAssistantText;
          }

          // If we captured screenshot analysis, sanitize and dispatch it for validation
          if (screenshotAnalysis.trim()) {
            const sanitizedAnalysis = this.sanitizeScreenshotAnalysis(screenshotAnalysis.trim());
            window.dispatchEvent(
              new CustomEvent('agent:screenshot-analysis', {
                detail: {
                  analysis: sanitizedAnalysis,
                  timestamp: new Date().toISOString(),
                },
              }),
            );
            logger.info('Screenshot analysis captured', {
              analysisLength: sanitizedAnalysis.length,
              preview: sanitizedAnalysis.substring(0, 200),
            });
          }
        }
      }

      const responseToUser = (lastAssistantText || fullResponse).trim();
      options?.onComplete?.(responseToUser);
      logger.info('Message completed', { responseLength: fullResponse.length });
    } catch (error) {
      // Check if error is from cancellation
      if (error instanceof Error && error.message === 'Request cancelled') {
        logger.info('Request was cancelled by user');
        options?.onError?.(new Error('Request cancelled'));
      } else {
        logger.error('Failed to send message', { error });
        const err = error instanceof Error ? error : new Error('Unknown error');
        options?.onError?.(err);
      }
      throw error;
    } finally {
      // Clean up abort controller
      this.currentAbortController = null;
    }
  }

  private buildSystemPrompt(context: ICodebaseContext): string {
    const shapesInfo = formatShapesForPrompt();

    return buildSystemPrompt({
      projectRoot: context.projectRoot,
      currentScene: context.currentScene,
      selectedEntities: context.selectedEntities,
      shapesInfo,
    });
  }

  /**
   * Old implementation kept for reference during migration
   * @deprecated Use buildSystemPrompt instead
   */
  // @ts-ignore - Deprecated method kept for reference
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private buildSystemPromptOld(context: ICodebaseContext): string {
    const shapesInfo = formatShapesForPrompt();

    return `You are an AI assistant for Vibe Coder 3D, an AI-first game engine built with React Three Fiber and Rust.

You can help with:
- Adding, modifying, and querying 3D entities in the scene
- Scene editing and manipulation
- Code explanation and debugging
- Architecture questions
- Game development workflows

Current Context:
- Project: ${context.projectRoot}
- Current Scene: ${context.currentScene || 'None'}
- Selected Entities: ${context.selectedEntities.length > 0 ? context.selectedEntities.join(', ') : 'None'}

${shapesInfo}

MANDATORY PLANNING WORKFLOW - YOU MUST FOLLOW THIS:

**STEP 0: ALWAYS CREATE A PLAN FIRST**
Before executing ANY scene modifications, you MUST:
1. Use the 'planning' tool with action='create_plan'
2. Define the goal and list ALL steps you will take
3. Specify which tool each step will use
4. Get plan confirmation before proceeding

**STEP 1-N: EXECUTE PLAN SEQUENTIALLY**
For each step in your plan:
1. Execute the step using the appropriate tool
2. Use planning tool with action='update_step' to mark it completed
3. Move to next step

**EXAMPLE - User asks "create a forest with 5 trees":**

Step 0 - Create plan:
{
  "action": "create_plan",
  "goal": "Create a forest with 5 trees",
  "steps": [
    {"id": 1, "description": "Create tree prefab from cylinder trunk + sphere foliage", "tool": "prefab_management", "params_summary": "create_from_primitives with 2 primitives"},
    {"id": 2, "description": "Instantiate tree at position (0, 0, 0)", "tool": "prefab_management", "params_summary": "instantiate at pos 0,0,0"},
    {"id": 3, "description": "Instantiate tree at position (5, 0, 0)", "tool": "prefab_management", "params_summary": "instantiate at pos 5,0,0"},
    {"id": 4, "description": "Instantiate tree at position (-5, 0, 0)", "tool": "prefab_management", "params_summary": "instantiate at pos -5,0,0"},
    {"id": 5, "description": "Instantiate tree at position (0, 0, 5)", "tool": "prefab_management", "params_summary": "instantiate at pos 0,0,5"},
    {"id": 6, "description": "Instantiate tree at position (0, 0, -5)", "tool": "prefab_management", "params_summary": "instantiate at pos 0,0,-5"},
    {"id": 7, "description": "Take screenshot to verify all 5 trees are visible", "tool": "screenshot_feedback", "params_summary": "reason: verify forest creation"}
  ]
}

Then execute steps 1-7 in order, calling update_step after each.

CHOOSING THE RIGHT TOOL:

1. **Single primitive** → use scene_manipulation (add_entity)

2. **Multiple different primitives** → use scene_manipulation (batch_add_entities)
   - Add multiple cubes, spheres, etc. in ONE CALL
   - Each can have different type, position, rotation, scale, material
   - More efficient than multiple add_entity calls

3. **Composition (2+ primitives)** → use prefab_management (create_from_primitives)
   - Combines available primitives into reusable templates
   - Creates prefab WITHOUT cluttering the scene first

4. **Multiple instances of same prefab** → use prefab_management (batch_instantiate)
   - After creating prefab, instantiate it at different positions IN ONE CALL
   - More efficient than multiple instantiate calls

**CRITICAL: For collections (forests, buildings, props), ALWAYS:**
1. Create prefab ONCE using create_from_primitives
2. Instantiate multiple times using batch_instantiate action (NOT individual instantiate calls)
3. ❌ NEVER add primitives individually to the scene first

**BATCH OPERATIONS - USE THESE FOR EFFICIENCY:**

When working with MULTIPLE entities, ALWAYS use batch operations:

✅ **batch_add_entities** (scene_manipulation):
- Creating 2+ different primitives at once
- Example: Grid of colored cubes at various positions

✅ **batch_instantiate** (prefab_management):
- Creating 2+ instances of same prefab
- Example: Forest with 20 trees at specific positions

✅ **set_transforms** (entity_batch_edit):
- Updating positions/rotations/scales of 2+ entities
- Example: Reposition 10 entities to new locations

✅ **set_material** (entity_batch_edit):
- Applying materials/colors to 2+ entities
- Example: Make 5 cubes red

✅ **batch_delete** (entity_edit):
- Deleting 2+ entities at once
- Example: Remove all temporary objects

SETTING MATERIALS AND COLORS:

**To change an entity's color or material, you MUST use entity_edit tool:**

1. **Parse the entity ID** from scene_manipulation response (e.g., "Entity ID: 42")
2. **Use entity_edit with set_component_property**:
   - component_type: "MeshRenderer"
   - property_name: "material"
   - property_value: { "color": "#ff0000" } (nested object!)

**Example - Creating a red cube:**
Step 1: scene_manipulation({ action: "add_entity", entity_type: "Cube", position: {x:0,y:0,z:0} })
Response: "Added Cube to the scene at position (0, 0, 0). Entity ID: 42"

Step 2: entity_edit({
  entity_id: 42,
  action: "set_component_property",
  component_type: "MeshRenderer",
  property_name: "material",
  property_value: { "color": "#ff0000" }
})

**Available color formats:**
- Hex: "#ff0000" (red), "#00ff00" (green), "#0000ff" (blue)
- Named: "red", "green", "blue", "yellow", "orange", "purple", etc.

**To use a specific material asset:**
- property_name: "materialId"
- property_value: "mat_name_here" (use get_available_materials tool first)

**CRITICAL:** You MUST call entity_edit to set colors. scene_manipulation only creates entities with default materials.

MANDATORY SELF-CORRECTION WORKFLOW:

**YOU MUST ALWAYS VERIFY YOUR WORK VISUALLY - THIS IS NOT OPTIONAL**

After ANY scene modification (adding entities, creating prefabs, moving objects, etc.):

1. **Make your changes** using the appropriate tools
2. **IMMEDIATELY take a screenshot** using screenshot_feedback tool
3. **Analyze the screenshot critically**:
   - Are all entities visible?
   - Are positions correct?
   - Does the scene match the user's request?
   - Are there any errors or missing objects?
4. **Self-correct if needed**:
   - If anything is wrong, fix it IMMEDIATELY
   - Take another screenshot after fixes
   - Repeat until correct
5. **Only then respond to user**

**VERIFICATION CHECKPOINTS - Always screenshot after:**
- Creating ANY prefabs (verify they exist and look correct)
- Adding multiple entities (verify count and positions)
- Creating a forest/collection (verify all instances are placed)
- Modifying transforms (verify new positions/rotations)
- Any tool execution with visual impact

**Example - Creating a Forest:**
- Create tree prefab from cylinder + sphere
- Add 5 tree entities at different positions using the prefab
- SCREENSHOT - Check: Are all 5 trees visible? Positioned correctly?
- If only 3 trees visible → Investigate and fix missing trees
- SCREENSHOT AGAIN - Verify all 5 now present
- Only now tell user "Forest created with 5 trees"

**Example - Adding Entities:**
- Add cube at (5, 0, 0)
- SCREENSHOT - Check: Is cube visible at x=5?
- If cube not visible → Check if position is off-screen, adjust camera or position
- SCREENSHOT AGAIN - Verify fix worked
- Tell user "Cube added successfully"

**CRITICAL RULES:**
- ❌ NEVER say "I've created X" without screenshot verification
- ❌ NEVER skip screenshot because "tools executed successfully"
- ✅ ALWAYS assume tools might have bugs/issues - verify visually
- ✅ ALWAYS take screenshots BEFORE responding to user
- ✅ If screenshot shows problems, FIX THEM before responding

      Tool success messages don't guarantee visual correctness. Screenshot is your ground truth.`;
  }

  /**
   * Post-process screenshot analysis text before it is shown in the UI.
   * The goal is NOT to censor the model, but to clearly flag obviously
   * overconfident language so users know to double-check the scene.
   */
  private sanitizeScreenshotAnalysis(rawAnalysis: string): string {
    const trimmed = rawAnalysis.trim();

    if (!trimmed) {
      return trimmed;
    }

    const suspiciousPatterns: RegExp[] = [
      /successfully (created|built)/i,
      /has been (created|built) successfully/i,
      /screenshot confirms/i,
      /now work with this .* model/i,
      /confirms that .* (has been|is) correctly (created|positioned)/i,
    ];

    const hasSuspiciousLanguage = suspiciousPatterns.some((pattern) => pattern.test(trimmed));

    if (!hasSuspiciousLanguage) {
      return trimmed;
    }

    // Avoid stacking warnings if one already exists
    if (trimmed.startsWith('⚠️')) {
      return trimmed;
    }

    const cautionPrefix =
      '⚠️ Automated visual analysis may be inaccurate. Always verify the screenshot yourself in the viewport.\n\n';

    return `${cautionPrefix}${trimmed}`;
  }

  async testConnection(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      const response = await this.client.messages.create({
        model: import.meta.env.VITE_CLAUDE_CODE_SDK_MODEL || 'glm-4.6',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });

      return response.content.length > 0;
    } catch (error) {
      logger.error('Connection test failed', { error });
      return false;
    }
  }

  cleanup(): void {
    this.initialized = false;
    logger.info('AgentService cleaned up');
  }
}
