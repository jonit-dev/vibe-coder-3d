/**
 * useScreenshotEvents Hook
 * Handles window event listeners for screenshot and analysis events
 */

import { useEffect } from 'react';
import { useChatStore } from '@editor/store/chatStore';
import { ScreenshotEventSchema, AnalysisEventSchema } from '@editor/chat/state/schemas';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('useScreenshotEvents');

export const useScreenshotEvents = () => {
  useEffect(() => {
    const handleScreenshotCaptured = (event: Event) => {
      const customEvent = event as CustomEvent;
      const parsed = ScreenshotEventSchema.safeParse(customEvent.detail);

      if (!parsed.success) {
        logger.warn('Invalid screenshot event payload', { error: parsed.error });
        return;
      }

      const { imageData, sceneInfo, reason } = parsed.data;
      const session = useChatStore.getState().getActiveSession();

      if (!session) {
        logger.warn('Screenshot captured but no active session');
        return;
      }

      logger.debug('Screenshot captured', {
        sessionId: session.id,
        entityCount: sceneInfo.entity_count,
        reason,
      });

      useChatStore.getState().addMessage(session.id, {
        id: `screenshot-${Date.now()}`,
        type: 'tool',
        content: `📸 Screenshot captured: ${reason}`,
        timestamp: new Date(),
        metadata: { imageData, sceneInfo, reason, isScreenshot: true },
      });
    };

    const handleScreenshotAnalysis = (event: Event) => {
      const customEvent = event as CustomEvent;
      const parsed = AnalysisEventSchema.safeParse(customEvent.detail);

      if (!parsed.success) {
        logger.warn('Invalid analysis event payload', { error: parsed.error });
        return;
      }

      const { analysis } = parsed.data;
      const session = useChatStore.getState().getActiveSession();

      if (!session) {
        logger.warn('Analysis received but no active session');
        return;
      }

      logger.debug('Screenshot analysis received', {
        sessionId: session.id,
        analysisLength: analysis.length,
      });

      useChatStore.getState().addMessage(session.id, {
        id: `analysis-${Date.now()}`,
        type: 'ai',
        content: `🔍 Visual Analysis:\n\n${analysis}`,
        timestamp: new Date(),
        metadata: { isAnalysis: true },
      });
    };

    window.addEventListener('agent:screenshot-captured', handleScreenshotCaptured);
    window.addEventListener('agent:screenshot-analysis', handleScreenshotAnalysis);

    return () => {
      window.removeEventListener('agent:screenshot-captured', handleScreenshotCaptured);
      window.removeEventListener('agent:screenshot-analysis', handleScreenshotAnalysis);
    };
  }, []); // Empty deps - listeners persist for component lifetime
};
