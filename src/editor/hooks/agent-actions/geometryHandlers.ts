/**
 * Geometry file management handlers for agent actions
 */

import { Logger } from '@core/lib/logger';

const logger = Logger.create('AgentActions:Geometry');

export const createGeometryHandlers = () => {
  const handleSaveGeometry = async (event: Event) => {
    const customEvent = event as CustomEvent;
    const { filepath, content } = customEvent.detail;

    logger.info('Agent requested geometry save', { filepath });

    try {
      const response = await fetch('/api/save-geometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath, content }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save geometry: ${response.statusText}`);
      }

      logger.info('Geometry saved successfully', { filepath });
    } catch (error) {
      logger.error('Failed to save geometry', { error, filepath });
    }
  };

  return {
    handleSaveGeometry,
  };
};
