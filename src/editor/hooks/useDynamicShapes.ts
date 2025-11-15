/**
 * useDynamicShapes Hook
 * Provides access to registered custom shapes for UI integration
 */

import { useMemo } from 'react';
import { z } from 'zod';
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
 * Note: Returns fresh list each render to pick up newly registered shapes
 */
export function useCustomShapes(): ICustomShapeDescriptor<z.ZodTypeAny>[] {
  // Don't use useMemo here - we want to always get the latest shapes from registry
  // This is cheap since shapeRegistry.list() just returns an array reference
  return shapeRegistry.list();
}

/**
 * Get shapes filtered by category
 */
export function useCustomShapesByCategory(category: string): ICustomShapeDescriptor<z.ZodTypeAny>[] {
  // Memoize by category since filtering is slightly more expensive
  return useMemo(() => {
    return shapeRegistry.listByCategory(category);
  }, [category]);
}

/**
 * Search shapes by query
 */
export function useCustomShapesSearch(query: string): ICustomShapeDescriptor<z.ZodTypeAny>[] {
  return useMemo(() => {
    if (!query) return shapeRegistry.list();
    return shapeRegistry.search(query);
  }, [query]);
}

/**
 * Get all unique categories from registered shapes
 */
export function useShapeCategories(): string[] {
  // Don't memoize - need fresh categories from registry
  const shapes = shapeRegistry.list();
  const categories = new Set<string>();
  shapes.forEach((shape) => {
    if (shape.meta.category) {
      categories.add(shape.meta.category);
    }
  });
  return Array.from(categories).sort();
}

/**
 * Get menu items for custom shapes
 * Groups shapes by category
 */
export function useCustomShapeMenuItems(): Record<string, IShapeMenuItem[]> {
  // Don't memoize - need fresh shapes from registry
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
}
