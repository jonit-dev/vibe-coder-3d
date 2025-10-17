import { Logger } from '@core/lib/logger';
import { lodManager, type LODQuality } from '@core/lib/rendering/LODManager';
import { useGLTF } from '@react-three/drei';
import React, { useEffect, useState } from 'react';

const logger = Logger.create('useLODModel');

export interface IUseLODModelOptions {
  basePath: string;
  distance?: number;
  quality?: LODQuality;
}

/**
 * Hook to get LOD-aware model path
 * Automatically switches model paths based on LOD quality settings
 *
 * COMPLETE REWRITE with extensive logging for debugging
 */
export function useLODModel(options: IUseLODModelOptions): string {
  const { basePath, distance, quality: overrideQuality } = options;

  logger.info('🎬 useLODModel HOOK CALLED', {
    basePath,
    distance,
    overrideQuality,
    timestamp: Date.now(),
  });

  // Track global quality changes via polling
  const [globalQuality, setGlobalQuality] = useState(() => {
    const initial = lodManager.getQuality();
    logger.info('📊 Initial global quality', { initial });
    return initial;
  });

  // Track LOD config state
  const [autoSwitch, setAutoSwitch] = useState(() => {
    const config = lodManager.getConfig();
    logger.info('⚙️ Initial LOD config', { config });
    return config.autoSwitch;
  });

  // Poll for config changes
  useEffect(() => {
    logger.debug('🔄 Setting up config polling interval');
    const interval = setInterval(() => {
      const config = lodManager.getConfig();
      const currentQuality = config.quality;
      const currentAutoSwitch = config.autoSwitch;

      if (currentQuality !== globalQuality) {
        logger.info('🔔 Global quality CHANGED', {
          from: globalQuality,
          to: currentQuality,
          autoSwitch: currentAutoSwitch,
        });
        setGlobalQuality(currentQuality);
      }

      if (currentAutoSwitch !== autoSwitch) {
        logger.info('🔔 Auto-switch CHANGED', {
          from: autoSwitch,
          to: currentAutoSwitch,
        });
        setAutoSwitch(currentAutoSwitch);
      }
    }, 100);

    return () => {
      logger.debug('🛑 Cleaning up config polling interval');
      clearInterval(interval);
    };
  }, [globalQuality, autoSwitch]);

  // Determine which quality to use
  const determineQuality = (): LODQuality => {
    logger.debug('🎯 === QUALITY DETERMINATION START ===');

    const config = lodManager.getConfig();
    logger.debug('📋 Current config', {
      globalQuality: config.quality,
      autoSwitch: config.autoSwitch,
      distanceThresholds: config.distanceThresholds,
    });

    // Priority 1: Override quality (explicit prop)
    if (overrideQuality) {
      logger.info('✅ Using OVERRIDE quality', {
        overrideQuality,
        reason: 'Explicit quality prop provided',
      });
      return overrideQuality;
    }

    // Priority 2: If auto-switch is DISABLED, always use global quality
    if (!config.autoSwitch) {
      logger.info('✅ Using GLOBAL quality (auto-switch disabled)', {
        globalQuality: config.quality,
        reason: 'Auto-switch is disabled',
      });
      return config.quality;
    }

    // Priority 3: If auto-switch is ENABLED and distance provided, use distance-based
    if (distance !== undefined) {
      const distanceQuality = lodManager.getQualityForDistance(distance);
      logger.info('✅ Using DISTANCE-BASED quality (auto-switch enabled)', {
        distance,
        distanceQuality,
        globalQuality: config.quality,
        thresholds: config.distanceThresholds,
        reason: 'Auto-switch enabled and distance provided',
      });
      return distanceQuality;
    }

    // Priority 4: Fallback to global quality
    logger.info('✅ Using GLOBAL quality (fallback)', {
      globalQuality: config.quality,
      reason: 'No distance provided, auto-switch enabled but no distance',
    });
    return config.quality;
  };

  // Initialize model path
  const [modelPath, setModelPath] = useState(() => {
    logger.info('🏗️ INITIALIZING model path state');
    const quality = determineQuality();
    const path = lodManager.getLODPath(basePath, quality);

    logger.info('✨ Initial LOD path resolved', {
      basePath,
      quality,
      resolvedPath: path,
      isLODVariant: path !== basePath,
    });

    return path;
  });

  // Track if we're currently switching
  const isSwitchingRef = React.useRef(false);

  // Effect to handle path changes
  useEffect(() => {
    logger.debug('🔄 === PATH CHANGE EFFECT TRIGGERED ===', {
      currentModelPath: modelPath,
      distance,
      globalQuality,
      autoSwitch,
      overrideQuality,
    });

    // Skip if already switching
    if (isSwitchingRef.current) {
      logger.warn('⏸️ Already switching models, skipping', {
        currentPath: modelPath,
      });
      return;
    }

    // Determine what quality we should be using
    const targetQuality = determineQuality();
    const targetPath = lodManager.getLODPath(basePath, targetQuality);

    logger.info('🎯 Path change check', {
      currentPath: modelPath,
      targetPath,
      currentQuality: 'unknown',
      targetQuality,
      needsChange: targetPath !== modelPath,
    });

    // Only switch if path actually changed
    if (targetPath === modelPath) {
      logger.debug('✅ Path unchanged, no switch needed', {
        path: modelPath,
      });
      return;
    }

    // Start switching
    logger.info('🚀 === STARTING MODEL SWITCH ===', {
      from: modelPath,
      to: targetPath,
      quality: targetQuality,
    });

    isSwitchingRef.current = true;

    // Preload the new model first
    logger.debug('⏳ Preloading new model...', { path: targetPath });

    // useGLTF.preload() doesn't return a promise, it just starts loading
    // We'll switch immediately and let React handle the loading state
    try {
      useGLTF.preload(targetPath);

      logger.info('✅ Model preload initiated', {
        path: targetPath,
        quality: targetQuality,
      });

      // Clear old model from cache
      try {
        useGLTF.clear(modelPath);
        logger.debug('🗑️ Cleared old model from cache', {
          clearedPath: modelPath,
        });
      } catch (error) {
        logger.warn('⚠️ Failed to clear old model from cache', {
          path: modelPath,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Switch the path immediately
      logger.info('🔄 Switching model path NOW', {
        from: modelPath,
        to: targetPath,
      });
      setModelPath(targetPath);

      logger.info('✅ === MODEL SWITCH COMPLETE ===', {
        newPath: targetPath,
        quality: targetQuality,
      });
    } catch (error) {
      logger.error('❌ Failed to initiate LOD preload', {
        attemptedPath: targetPath,
        keepingPath: modelPath,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      isSwitchingRef.current = false;
    }
  }, [basePath, distance, globalQuality, autoSwitch, overrideQuality, modelPath]);

  logger.debug('🎬 Returning model path', {
    path: modelPath,
    basePath,
    distance,
  });

  return modelPath;
}

/**
 * Hook to get all available LOD paths for a model
 */
export function useLODPaths(basePath: string): Record<LODQuality, string> {
  logger.debug('useLODPaths called', { basePath });
  return lodManager.getAllLODPaths(basePath);
}

/**
 * Hook to get current LOD quality
 */
export function useLODQuality(): LODQuality {
  const [quality, setQuality] = useState(() => {
    const initial = lodManager.getQuality();
    logger.debug('useLODQuality initial', { initial });
    return initial;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const currentQuality = lodManager.getQuality();
      if (currentQuality !== quality) {
        logger.info('useLODQuality changed', {
          from: quality,
          to: currentQuality,
        });
        setQuality(currentQuality);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quality]);

  return quality;
}
