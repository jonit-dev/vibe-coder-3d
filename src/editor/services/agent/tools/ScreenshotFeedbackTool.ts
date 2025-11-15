/**
 * Screenshot Feedback Tool
 * Allows AI agent to capture screenshots of the current scene for visual feedback
 * and iterate on changes based on what it sees
 */

import type { Tool } from '@anthropic-ai/sdk/resources';
import { Logger } from '@core/lib/logger';
import { OpenRouterService } from '@editor/services/openrouter';

const logger = Logger.create('ScreenshotFeedbackTool');

export const screenshotFeedbackTool: Tool = {
  name: 'screenshot_feedback',
  description: `Capture a screenshot of the current 3D scene to get visual feedback on your changes.

Use this tool ONLY when changes have VISIBLE impact on the scene.

WHEN TO USE (visual changes):
✓ After adding/removing entities
✓ After moving/rotating/scaling objects
✓ After material/color changes
✓ After creating/instantiating prefabs
✓ After geometry modifications
✓ When verifying scene composition

WHEN NOT TO USE (non-visual operations):
✗ After scene queries (get_entity, list_entities)
✗ After getting schemas/metadata
✗ After planning operations
✗ After reading scene info
✗ After script creation (unless testing visual effects)

VERIFICATION MODES:
- 'quick': Lightweight check - just verify objects exist and are positioned correctly
- 'detailed': Full analysis with counts, materials, composition suggestions (default)

The screenshot analysis method is controlled by VITE_USE_OPENROUTER_FOR_SCREENSHOTS environment variable:
- If enabled: Uses OpenRouter with custom vision model (e.g., Gemini 2.5 Flash) for analysis
- If disabled: Sends screenshot to the main agent for analysis

You can override the env setting by explicitly setting use_openrouter parameter.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      reason: {
        type: 'string',
        description:
          'Brief explanation of why you are taking this screenshot (e.g., "Verify cube position after moving to x:5", "Check material changes on sphere")',
      },
      verification_mode: {
        type: 'string',
        enum: ['quick', 'detailed'],
        description:
          'Verification depth: "quick" for basic existence/position checks, "detailed" for full analysis with suggestions (default)',
        default: 'detailed',
      },
      wait_ms: {
        type: 'number',
        description: 'Milliseconds to wait before capturing (default: 500, allows scene to render)',
        default: 500,
      },
      use_openrouter: {
        type: 'boolean',
        description:
          'Use OpenRouter for advanced screenshot analysis with custom vision models (requires VITE_OPENROUTER_VISION_API_KEY). If true, analysis will be returned directly instead of being sent to the main agent.',
        default: false,
      },
      analysis_prompt: {
        type: 'string',
        description:
          'Custom prompt for OpenRouter analysis (only used if use_openrouter is true). If not provided, a default verification prompt will be used.',
      },
    },
    required: ['reason'],
  },
};

export async function executeScreenshotFeedback(params: {
  reason: string;
  verification_mode?: 'quick' | 'detailed';
  wait_ms?: number;
  use_openrouter?: boolean;
  analysis_prompt?: string;
}): Promise<string> {
  try {
    logger.info('Capturing screenshot for feedback', { reason: params.reason });

    const waitMs = params.wait_ms || 500;

    // Determine if we should use OpenRouter based on env variable or explicit parameter
    const useOpenRouterFromEnv =
      import.meta.env.VITE_USE_OPENROUTER_FOR_SCREENSHOTS === 'true' ||
      import.meta.env.VITE_USE_OPENROUTER_FOR_SCREENSHOTS === true;
    const shouldUseOpenRouter = params.use_openrouter ?? useOpenRouterFromEnv;

    logger.info('Screenshot mode selection', {
      explicitParam: params.use_openrouter,
      envSetting: useOpenRouterFromEnv,
      willUseOpenRouter: shouldUseOpenRouter,
    });

    // Wait for scene to render
    await new Promise((resolve) => setTimeout(resolve, waitMs));

    // Get the canvas element from the Three.js renderer
    const canvas = getViewportCanvas();
    if (!canvas) {
      throw new Error('No canvas element found - is the scene renderer active?');
    }

    // Capture the canvas as a data URL
    const dataUrl = canvas.toDataURL('image/png');

    // Extract base64 data (remove the data:image/png;base64, prefix)
    const base64Data = dataUrl.split(',')[1];

    // Generate thumbnail (smaller version for chat preview)
    const thumbnailData = await generateThumbnail(canvas, 200);

    // Get scene context for annotations
    const sceneInfo = getSceneInfo();

    // If OpenRouter is enabled (via env or explicit param), analyze directly instead of dispatching to agent
    if (shouldUseOpenRouter) {
      logger.info('Using OpenRouter for screenshot analysis', { reason: params.reason });

      try {
        const openRouter = OpenRouterService.getInstance();

        // Initialize if not already done
        if (!openRouter.isInitialized()) {
          openRouter.initialize();
        }

        // Build analysis prompt based on verification mode
        const verificationMode = params.verification_mode || 'detailed';

        const quickPrompt = `Quick verification of 3D scene:

Scene Context:
- Expected entities: ${sceneInfo.entity_count}
- Reason: ${params.reason}

Verify:
1. Are the expected objects visible?
2. Are they in the correct positions?
3. Any obvious issues?

Be concise.`;

        const detailedPrompt = `Analyze this 3D scene screenshot and verify:

Scene Context:
- Entities: ${sceneInfo.entity_count}
- Selected: ${sceneInfo.selected_entities.join(', ') || 'none'}
- Scene: ${sceneInfo.scene_name || 'unnamed'}

Reason for screenshot: ${params.reason}

Please provide:
1. What entities/objects are visible in the scene
2. Their positions, orientations, and appearances
3. Any issues or inconsistencies you notice
4. Whether the scene matches the expected state based on the reason

Be specific about counts, positions, and visual details.`;

        const defaultPrompt = verificationMode === 'quick' ? quickPrompt : detailedPrompt;

        const prompt = params.analysis_prompt || defaultPrompt;

        const systemPrompt = `You are an expert 3D scene analyst for a game engine. Your job is to carefully examine screenshots and provide detailed, accurate observations about the scene contents, entity positions, materials, and any potential issues.`;

        // Get thinking effort from environment
        const thinkingEffort = import.meta.env.VITE_OPENROUTER_THINKING_EFFORT as
          | 'low'
          | 'medium'
          | 'high'
          | undefined;

        const analysis = await openRouter.analyzeScreenshot({
          imageData: base64Data,
          prompt,
          systemPrompt,
          thinkingEffort: thinkingEffort || undefined,
        });

        // Still dispatch event for UI to show thumbnail
        window.dispatchEvent(
          new CustomEvent('agent:screenshot-captured', {
            detail: {
              imageData: base64Data,
              thumbnailData,
              sceneInfo,
              reason: params.reason,
              openRouterAnalysis: analysis,
            },
          }),
        );

        return `Screenshot analyzed with OpenRouter (${openRouter.getModel()})

Reason: ${params.reason}
Timestamp: ${new Date().toISOString()}

Scene State:
- Entities: ${sceneInfo.entity_count}
- Selected: ${sceneInfo.selected_entities.join(', ') || 'none'}
- Scene: ${sceneInfo.scene_name || 'unnamed'}
- Camera: ${sceneInfo.camera_position}

Analysis Result:
${analysis}`;
      } catch (error) {
        logger.error('OpenRouter analysis failed, falling back to standard mode', { error });
        // Fall through to standard screenshot dispatch
      }
    }

    logger.info('SCREENSHOT STEP 1: Dispatching screenshot-captured event', {
      imageDataLength: base64Data.length,
      thumbnailDataLength: thumbnailData.length,
      entityCount: sceneInfo.entity_count,
      reason: params.reason,
    });

    // Dispatch custom event to send image to agent conversation
    // This allows the AgentService to include the image in the next message
    window.dispatchEvent(
      new CustomEvent('agent:screenshot-captured', {
        detail: {
          imageData: base64Data,
          thumbnailData,
          sceneInfo,
          reason: params.reason,
        },
      }),
    );

    logger.info('SCREENSHOT STEP 2: Event dispatched successfully');

    // Return descriptive text for the tool result
    return `Screenshot captured successfully!

Reason: ${params.reason}
Timestamp: ${new Date().toISOString()}

Scene State:
- Entities: ${sceneInfo.entity_count}
- Selected: ${sceneInfo.selected_entities.join(', ') || 'none'}
- Scene: ${sceneInfo.scene_name || 'unnamed'}
- Camera: ${sceneInfo.camera_position}

The screenshot has been added to the conversation. Please analyze the image to verify your changes are correct.`;
  } catch (error) {
    logger.error('Failed to capture screenshot', { error });
    return `Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Generate a thumbnail from a canvas element
 * @param canvas Source canvas to thumbnail
 * @param maxWidth Maximum width of thumbnail (maintains aspect ratio)
 * @returns Base64-encoded JPEG thumbnail data
 */
async function generateThumbnail(canvas: HTMLCanvasElement, maxWidth: number): Promise<string> {
  try {
    // Create offscreen canvas for thumbnail
    const thumbCanvas = document.createElement('canvas');
    const ctx = thumbCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context for thumbnail');
    }

    // Calculate dimensions maintaining aspect ratio
    const aspectRatio = canvas.height / canvas.width;
    thumbCanvas.width = maxWidth;
    thumbCanvas.height = Math.round(maxWidth * aspectRatio);

    // Draw scaled image
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

    // Convert to JPEG with quality compression
    const thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);

    // Extract base64 data
    return thumbDataUrl.split(',')[1];
  } catch (error) {
    logger.warn('Failed to generate thumbnail, using full image', { error });
    return canvas.toDataURL('image/png').split(',')[1];
  }
}

function getViewportCanvas(): HTMLCanvasElement | null {
  try {
    const globalWindow = window as Window & { __editorCanvas?: HTMLCanvasElement };
    if (globalWindow.__editorCanvas instanceof HTMLCanvasElement) {
      return globalWindow.__editorCanvas;
    }

    const fallbackCanvas = document.querySelector('canvas');
    if (fallbackCanvas instanceof HTMLCanvasElement) {
      logger.debug('Using fallback canvas selector for screenshot capture');
      return fallbackCanvas;
    }
  } catch (error) {
    logger.warn('Failed to get viewport canvas', { error });
  }
  return null;
}

function getSceneInfo(): {
  entity_count: number;
  camera_position: string;
  selected_entities: number[];
  scene_name: string | null;
} {
  try {
    // Access the editor store to get current scene state
    // Using the globally exposed store to avoid circular dependencies
    const editorStore = (window as { __editorStore?: Record<string, unknown> }).__editorStore;

    if (!editorStore) {
      logger.debug('Editor store not available on window.__editorStore');
      return {
        entity_count: 0,
        camera_position: 'unknown',
        selected_entities: [],
        scene_name: null,
      };
    }

    const state = (editorStore as { getState: () => Record<string, unknown> }).getState();

    const entityIds = state.entityIds as unknown as number[] | undefined;
    const selectedIds = state.selectedIds as unknown as number[] | undefined;

    return {
      entity_count: entityIds?.length || 0,
      camera_position: 'from viewport', // Will be enhanced with actual camera data
      selected_entities: selectedIds || [],
      scene_name: localStorage.getItem('lastLoadedScene') || null,
    };
  } catch (error) {
    logger.warn('Could not get scene info', { error });
    return {
      entity_count: 0,
      camera_position: 'unknown',
      selected_entities: [],
      scene_name: null,
    };
  }
}
