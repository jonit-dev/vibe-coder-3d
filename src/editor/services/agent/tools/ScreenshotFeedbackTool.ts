/**
 * Screenshot Feedback Tool
 * Allows AI agent to capture screenshots of the current scene for visual feedback
 * and iterate on changes based on what it sees
 */

import type { Tool } from '@anthropic-ai/sdk/resources';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('ScreenshotFeedbackTool');

export const screenshotFeedbackTool: Tool = {
  name: 'screenshot_feedback',
  description: `Capture a screenshot of the current 3D scene to get visual feedback on your changes.

Use this tool to:
- Verify that your changes appear correctly in the scene
- Compare before/after states when making modifications
- Debug visual issues or unexpected rendering
- Iterate on geometry, materials, or positioning based on what you see

IMPORTANT: After making changes to entities, geometry, or scene properties, you SHOULD use this tool to verify the results visually before considering the task complete. This allows you to self-correct if something doesn't look right.

The screenshot will be returned as a base64-encoded PNG image with annotations about the current scene state.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      reason: {
        type: 'string',
        description:
          'Brief explanation of why you are taking this screenshot (e.g., "Verify cube position after moving to x:5", "Check material changes on sphere")',
      },
      wait_ms: {
        type: 'number',
        description: 'Milliseconds to wait before capturing (default: 500, allows scene to render)',
        default: 500,
      },
    },
    required: ['reason'],
  },
};

export async function executeScreenshotFeedback(params: {
  reason: string;
  wait_ms?: number;
}): Promise<string> {
  try {
    logger.info('Capturing screenshot for feedback', { reason: params.reason });

    const waitMs = params.wait_ms || 500;

    // Wait for scene to render
    await new Promise((resolve) => setTimeout(resolve, waitMs));

    // Get the canvas element from the Three.js renderer
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      throw new Error('No canvas element found - is the scene renderer active?');
    }

    // Capture the canvas as a data URL
    const dataUrl = canvas.toDataURL('image/png');

    // Extract base64 data (remove the data:image/png;base64, prefix)
    const base64Data = dataUrl.split(',')[1];

    // Get scene context for annotations
    const sceneInfo = getSceneInfo();

    logger.info('SCREENSHOT STEP 1: Dispatching screenshot-captured event', {
      imageDataLength: base64Data.length,
      entityCount: sceneInfo.entity_count,
      reason: params.reason,
    });

    // Dispatch custom event to send image to agent conversation
    // This allows the AgentService to include the image in the next message
    window.dispatchEvent(
      new CustomEvent('agent:screenshot-captured', {
        detail: {
          imageData: base64Data,
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

function getSceneInfo(): {
  entity_count: number;
  camera_position: string;
  selected_entities: number[];
  scene_name: string | null;
} {
  try {
    // Access the editor store to get current scene state
    // Using the globally exposed store to avoid circular dependencies
    const editorStore = (window as any).__editorStore;

    if (!editorStore) {
      logger.debug('Editor store not available on window.__editorStore');
      return {
        entity_count: 0,
        camera_position: 'unknown',
        selected_entities: [],
        scene_name: null,
      };
    }

    const state = editorStore.getState();

    return {
      entity_count: state.entityIds?.length || 0,
      camera_position: 'from viewport', // Will be enhanced with actual camera data
      selected_entities: state.selectedIds || [],
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
