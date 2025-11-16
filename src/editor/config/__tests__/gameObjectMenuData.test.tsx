/**
 * Tests for Game Object Menu Data
 * Validates Empty Entity menu item integration per PRD: 4-30-empty-entity-add-menu-prd.md
 */

import { describe, it, expect } from 'vitest';
import { GAME_OBJECT_CATEGORIES, buildGameObjectCategories } from '../gameObjectMenuData';

describe('gameObjectMenuData - Empty Entity Support', () => {
  it('should include a Core category', () => {
    const coreCategory = GAME_OBJECT_CATEGORIES.find((cat) => cat.label === 'Core');
    expect(coreCategory).toBeDefined();
  });

  it('should have Empty Entity item in Core category', () => {
    const coreCategory = GAME_OBJECT_CATEGORIES.find((cat) => cat.label === 'Core');
    const emptyEntityItem = coreCategory?.items.find((item) => item.type === 'Entity');

    expect(emptyEntityItem).toBeDefined();
    expect(emptyEntityItem?.label).toBe('Empty Entity');
  });

  it('should place Core category at the beginning', () => {
    expect(GAME_OBJECT_CATEGORIES[0].label).toBe('Core');
  });

  it('should return same categories from buildGameObjectCategories', () => {
    const categories = buildGameObjectCategories();
    expect(categories).toEqual(GAME_OBJECT_CATEGORIES);

    const coreCategory = categories.find((cat) => cat.label === 'Core');
    expect(coreCategory).toBeDefined();
  });

  it('should have an icon for Empty Entity', () => {
    const coreCategory = GAME_OBJECT_CATEGORIES.find((cat) => cat.label === 'Core');
    const emptyEntityItem = coreCategory?.items.find((item) => item.type === 'Entity');

    expect(emptyEntityItem?.icon).toBeDefined();
  });
});
