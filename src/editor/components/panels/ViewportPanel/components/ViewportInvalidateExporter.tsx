/**
 * ViewportInvalidateExporter
 * Exposes the React Three Fiber invalidate function to window for agent tools
 */

import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('ViewportInvalidateExporter');

export const ViewportInvalidateExporter: React.FC = () => {
  const { invalidate } = useThree();

  useEffect(() => {
    // Expose invalidate function globally for agent tools
    const globalWindow = window as Window & {
      __editorInvalidate?: () => void;
    };

    globalWindow.__editorInvalidate = invalidate;
    logger.debug('Viewport invalidate function exposed to window');

    return () => {
      globalWindow.__editorInvalidate = undefined;
    };
  }, [invalidate]);

  return null;
};
