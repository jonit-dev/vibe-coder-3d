/**
 * useDynamicShapes Hook
 * Provides access to registered custom shapes for UI integration
 */

import { useMemo } from 'react';
import { shapeRegistry } from '@/core/lib/rendering/shapes/shapeRegistry';
import type { ICustomShapeDescriptor } from '@/core/lib/rendering/shapes/IShapeDescriptor';

export interface IShapeMenuItem {
  shapeId: string;
  label: string;
  category?: string;
  tags?: string[];
  icon?: string;
}

/**
 * Get all registered custom shapes
 */
export function useCustomShapes(): ICustomShapeDescriptor<any>[] {
  return useMemo(() => {
    return shapeRegistry.list();
  }, []);
}

/**
 * Get shapes filtered by category
 */
export function useCustomShapesByCategory(category: string): ICustomShapeDescriptor<any>[] {
  return useMemo(() => {
    return shapeRegistry.listByCategory(category);
  }, [category]);
}

/**
 * Search shapes by query
 */
export function useCustomShapesSearch(query: string): ICustomShapeDescriptor<any>[] {
  return useMemo(() => {
    if (!query) return shapeRegistry.list();
    return shapeRegistry.search(query);
  }, [query]);
}

/**
 * Get all unique categories from registered shapes
 */
export function useShapeCategories(): string[] {
  return useMemo(() => {
    const shapes = shapeRegistry.list();
    const categories = new Set<string>();
    shapes.forEach((shape) => {
      if (shape.meta.category) {
        categories.add(shape.meta.category);
      }
    });
    return Array.from(categories).sort();
  }, []);
}

/**
 * Get menu items for custom shapes
 * Groups shapes by category
 */
export function useCustomShapeMenuItems(): Record<string, IShapeMenuItem[]> {
  return useMemo(() => {
    const shapes = shapeRegistry.list();
    const grouped: Record<string, IShapeMenuItem[]> = {};

    shapes.forEach((shape) => {
      const category = shape.meta.category || 'Uncategorized';

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({
        shapeId: shape.meta.id,
        label: shape.meta.name,
        category: shape.meta.category,
        tags: shape.meta.tags,
        icon: shape.meta.icon,
      });
    });

    // Sort items within each category by name
    Object.values(grouped).forEach((items) => {
      items.sort((a, b) => a.label.localeCompare(b.label));
    });

    return grouped;
  }, []);
}
