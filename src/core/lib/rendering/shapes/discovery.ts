/**
 * Shape Discovery Module
 * Auto-discovers and registers custom shapes from the game/shapes directory
 * Uses Vite's import.meta.glob for dynamic module loading
 */

import type { z } from 'zod';

import { Logger } from '../../logger';
import type { ICustomShapeDescriptor } from './IShapeDescriptor';
import { shapeRegistry } from './shapeRegistry';

const logger = Logger.create('ShapeDiscovery');

/**
 * Shape module export structure
 * Each shape module should export a named export called 'shape'
 */
interface IShapeModule {
  shape?: ICustomShapeDescriptor<z.ZodTypeAny>;
}

/**
 * Discovers and registers all custom shapes from the game/shapes directory
 * Uses eager loading to ensure shapes are available immediately
 *
 * @returns Number of shapes successfully registered
 */
export function discoverShapes(): number {
  let registeredCount = 0;
  let errorCount = 0;

  try {
    // Import all shape modules from game/shapes directory
    // Note: This glob pattern is relative to the project root
    const modules = import.meta.glob<IShapeModule>('/src/game/shapes/**/*.{ts,tsx}', {
      eager: true,
    });

    // Process each module
    for (const [path, module] of Object.entries(modules)) {
      try {
        // Check if the module exports a 'shape' descriptor
        if (!module.shape) {
          logger.warn('Shape module missing "shape" export', { path });
          continue;
        }

        const descriptor = module.shape;

        // Validate descriptor structure
        if (!descriptor.meta?.id) {
          logger.error('Shape descriptor missing meta.id', { path });
          errorCount++;
          continue;
        }

        if (!descriptor.meta.name) {
          logger.error('Shape descriptor missing meta.name', { path, id: descriptor.meta.id });
          errorCount++;
          continue;
        }

        if (!descriptor.paramsSchema) {
          logger.error('Shape descriptor missing paramsSchema', {
            path,
            id: descriptor.meta.id,
          });
          errorCount++;
          continue;
        }

        if (typeof descriptor.getDefaultParams !== 'function') {
          logger.error('Shape descriptor missing getDefaultParams function', {
            path,
            id: descriptor.meta.id,
          });
          errorCount++;
          continue;
        }

        if (typeof descriptor.renderGeometry !== 'function') {
          logger.error('Shape descriptor missing renderGeometry function', {
            path,
            id: descriptor.meta.id,
          });
          errorCount++;
          continue;
        }

        // Register the shape
        shapeRegistry.register(descriptor);
        registeredCount++;

        logger.debug('Shape discovered and registered', {
          path,
          id: descriptor.meta.id,
          name: descriptor.meta.name,
        });
      } catch (error) {
        logger.error('Failed to register shape from module', { path, error });
        errorCount++;
      }
    }
  } catch (error) {
    logger.error('Shape discovery failed', { error });
  }

  return registeredCount;
}

/**
 * Initialize shape discovery
 * Call this during application startup to discover and register all shapes
 * Can be called multiple times (useful for HMR)
 */
export function initializeShapeDiscovery(): void {
  // In development mode, clear existing shapes to support HMR
  if (import.meta.env.DEV) {
    shapeRegistry.clear();
  }

  const count = discoverShapes();

  if (count > 0) {
    logger.info('Shape discovery initialized', { shapesRegistered: count });
  }
}

// Auto-initialize in development and production
// This ensures shapes are available as soon as the module is imported
// DEPRECATED: Disabled in favor of explicit shape registration in src/game/shapes/index.ts
// if (import.meta.env.VITE_AUTO_DISCOVER_SHAPES !== 'false') {
//   initializeShapeDiscovery();
// }
