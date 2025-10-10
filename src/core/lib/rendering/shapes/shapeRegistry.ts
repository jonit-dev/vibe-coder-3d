/**
 * Shape Registry
 * Manages registration, resolution, and discovery of custom shapes
 * HMR-safe implementation that supports hot module replacement
 */

import type { z } from 'zod';

import { Logger } from '../../logger';
import type { ICustomShapeDescriptor } from './IShapeDescriptor';

const logger = Logger.create('ShapeRegistry');

/**
 * Shape Registry Interface
 * Provides methods for managing custom shape descriptors
 */
export interface IShapeRegistry {
  /**
   * Register a shape descriptor
   * @param descriptor - The shape descriptor to register
   * @throws Error if a shape with the same ID is already registered
   */
  register<T extends z.ZodTypeAny>(descriptor: ICustomShapeDescriptor<T>): void;

  /**
   * Resolve a shape descriptor by ID
   * @param id - The unique shape ID
   * @returns The shape descriptor or undefined if not found
   */
  resolve(id: string): ICustomShapeDescriptor<any> | undefined;

  /**
   * List all registered shapes
   * @returns Array of all registered shape descriptors
   */
  list(): ICustomShapeDescriptor<any>[];

  /**
   * List shapes filtered by category
   * @param category - The category to filter by
   * @returns Array of shape descriptors in the specified category
   */
  listByCategory(category: string): ICustomShapeDescriptor<any>[];

  /**
   * Search shapes by name or tags
   * @param query - Search query string
   * @returns Array of matching shape descriptors
   */
  search(query: string): ICustomShapeDescriptor<any>[];

  /**
   * Check if a shape is registered
   * @param id - The unique shape ID
   * @returns True if the shape is registered
   */
  has(id: string): boolean;

  /**
   * Unregister a shape (for HMR support)
   * @param id - The unique shape ID
   * @returns True if the shape was unregistered
   */
  unregister(id: string): boolean;

  /**
   * Clear all registered shapes (for testing and HMR)
   */
  clear(): void;
}

/**
 * Shape Registry Implementation
 * In-memory storage with HMR-safe re-registration
 */
class ShapeRegistry implements IShapeRegistry {
  private shapes: Map<string, ICustomShapeDescriptor<any>> = new Map();

  register<T extends z.ZodTypeAny>(descriptor: ICustomShapeDescriptor<T>): void {
    const { id } = descriptor.meta;

    // Validate ID format (should be kebab-case)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
      logger.warn('Shape ID should be kebab-case', { id, name: descriptor.meta.name });
    }

    // Check for duplicate registration
    if (this.shapes.has(id)) {
      // In development, allow re-registration for HMR
      if (import.meta.env.DEV) {
        logger.debug('Re-registering shape (HMR)', { id, name: descriptor.meta.name });
      } else {
        logger.error('Duplicate shape ID', { id, name: descriptor.meta.name });
        throw new Error(`Shape with ID "${id}" is already registered`);
      }
    }

    this.shapes.set(id, descriptor);
    logger.info('Shape registered', {
      id,
      name: descriptor.meta.name,
      category: descriptor.meta.category,
    });
  }

  resolve(id: string): ICustomShapeDescriptor<any> | undefined {
    return this.shapes.get(id);
  }

  list(): ICustomShapeDescriptor<any>[] {
    return Array.from(this.shapes.values());
  }

  listByCategory(category: string): ICustomShapeDescriptor<any>[] {
    return this.list().filter((shape) => shape.meta.category === category);
  }

  search(query: string): ICustomShapeDescriptor<any>[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter((shape) => {
      const nameMatch = shape.meta.name.toLowerCase().includes(lowerQuery);
      const idMatch = shape.meta.id.toLowerCase().includes(lowerQuery);
      const tagMatch = shape.meta.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));
      return nameMatch || idMatch || tagMatch;
    });
  }

  has(id: string): boolean {
    return this.shapes.has(id);
  }

  unregister(id: string): boolean {
    const existed = this.shapes.delete(id);
    if (existed) {
      logger.debug('Shape unregistered', { id });
    }
    return existed;
  }

  clear(): void {
    const count = this.shapes.size;
    this.shapes.clear();
    logger.debug('All shapes cleared', { count });
  }
}

/**
 * Singleton shape registry instance
 * Used throughout the application for shape management
 */
export const shapeRegistry: IShapeRegistry = new ShapeRegistry();
