/**
 * Viewport Refresh Utility
 * Forces the React Three Fiber canvas to re-render after agent tool calls
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('ViewportRefresh');

/**
 * Forces the viewport to refresh/re-render
 * This ensures that changes made by agent tools are immediately visible
 */
export function refreshViewport(): void {
  try {
    // Access the global invalidate function exposed by ViewportPanel
    const globalWindow = window as Window & {
      __editorInvalidate?: () => void;
    };

    if (globalWindow.__editorInvalidate) {
      globalWindow.__editorInvalidate();
      logger.debug('Viewport refreshed after tool execution');
    } else {
      logger.warn('Viewport invalidate function not available - refresh may be delayed');
    }
  } catch (error) {
    logger.error('Failed to refresh viewport', { error });
  }
}
