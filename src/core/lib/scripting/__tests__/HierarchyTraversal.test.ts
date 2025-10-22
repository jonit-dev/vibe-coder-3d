/**
 * Tests for Entity Hierarchy Traversal API
 *
 * These tests verify that scripts can navigate the entity hierarchy
 * using getParent(), getChildren(), and findChild() methods.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DirectScriptExecutor } from '../DirectScriptExecutor';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { ECSWorld } from '@/core/lib/ecs/World';
import type { IScriptExecutionOptions } from '../DirectScriptExecutor';
import type { EntityId } from '../../ecs/types';

describe('Hierarchy Traversal API', () => {
  let executor: DirectScriptExecutor;
  let entityManager: EntityManager;
  let parentId: EntityId;
  let child1Id: EntityId;
  let child2Id: EntityId;
  let grandchildId: EntityId;

  beforeEach(() => {
    // Reset ECS world
    ECSWorld.getInstance().reset();

    executor = DirectScriptExecutor.getInstance();
    executor.clearAll();

    entityManager = EntityManager.getInstance();
    entityManager.reset();

    // Create a hierarchy:
    // Parent
    //   ├─ Child1
    //   │   └─ Grandchild
    //   └─ Child2

    parentId = entityManager.createEntity('Parent').id;
    child1Id = entityManager.createEntity('Child1', parentId).id;
    child2Id = entityManager.createEntity('Child2', parentId).id;
    grandchildId = entityManager.createEntity('Grandchild', child1Id).id;
  });

  afterEach(() => {
    executor.clearAll();
  });

  const createMockOptions = (
    entityId: EntityId,
    overrides?: Partial<IScriptExecutionOptions>,
  ): IScriptExecutionOptions => ({
    entityId,
    timeInfo: {
      time: 1.0,
      deltaTime: 0.016,
      frameCount: 60,
    },
    inputInfo: {} as any,
    parameters: {},
    ...overrides,
  });

  describe('entity.getParent()', () => {
    it('should return parent entity for child', () => {
      const code = `
        function onStart() {
          const parent = entity.getParent();
          if (!parent || parent.id !== ${parentId}) {
            throw new Error(\`Expected parent ID ${parentId}, got \${parent ? parent.id : 'null'}\`);
          }
        }
      `;

      executor.compileScript(code, 'test-get-parent');
      const result = executor.executeScript(
        'test-get-parent',
        createMockOptions(child1Id),
        'onStart',
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return null for root entity', () => {
      const code = `
        function onStart() {
          const parent = entity.getParent();
          if (parent !== null) {
            throw new Error(\`Expected null parent for root entity, got \${parent}\`);
          }
        }
      `;

      executor.compileScript(code, 'test-root-parent');
      const result = executor.executeScript(
        'test-root-parent',
        createMockOptions(parentId),
        'onStart',
      );

      expect(result.success).toBe(true);
    });

    it('should work for nested hierarchy', () => {
      const code = `
        function onStart() {
          const parent = entity.getParent();
          if (!parent || parent.id !== ${child1Id}) {
            throw new Error('Expected parent to be Child1');
          }

          const grandparent = parent.getParent();
          if (!grandparent || grandparent.id !== ${parentId}) {
            throw new Error('Expected grandparent to be Parent');
          }
        }
      `;

      executor.compileScript(code, 'test-nested-parent');
      const result = executor.executeScript(
        'test-nested-parent',
        createMockOptions(grandchildId),
        'onStart',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('entity.getChildren()', () => {
    it('should return all children for parent', () => {
      const code = `
        function onStart() {
          const children = entity.getChildren();
          if (!Array.isArray(children)) {
            throw new Error('getChildren should return an array');
          }
          if (children.length !== 2) {
            throw new Error(\`Expected 2 children, got \${children.length}\`);
          }
          const childIds = children.map(c => c.id);
          if (!childIds.includes(${child1Id}) || !childIds.includes(${child2Id})) {
            throw new Error('Children IDs do not match');
          }
        }
      `;

      executor.compileScript(code, 'test-get-children');
      const result = executor.executeScript(
        'test-get-children',
        createMockOptions(parentId),
        'onStart',
      );

      expect(result.success).toBe(true);
    });

    it('should return empty array for leaf entity', () => {
      const code = `
        function onStart() {
          const children = entity.getChildren();
          if (!Array.isArray(children)) {
            throw new Error('getChildren should return an array');
          }
          if (children.length !== 0) {
            throw new Error(\`Expected 0 children, got \${children.length}\`);
          }
        }
      `;

      executor.compileScript(code, 'test-leaf-children');
      const result = executor.executeScript(
        'test-leaf-children',
        createMockOptions(child2Id),
        'onStart',
      );

      expect(result.success).toBe(true);
    });

    it('should allow iteration over children', () => {
      const code = `
        function onStart() {
          const children = entity.getChildren();
          const names = [];
          for (let i = 0; i < children.length; i++) {
            names.push(children[i].name);
          }
          if (!names.includes('Child1') || !names.includes('Child2')) {
            throw new Error(\`Expected Child1 and Child2, got \${names.join(', ')}\`);
          }
        }
      `;

      executor.compileScript(code, 'test-iterate-children');
      const result = executor.executeScript(
        'test-iterate-children',
        createMockOptions(parentId),
        'onStart',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('entity.findChild(name)', () => {
    it('should find child by exact name', () => {
      const code = `
        function onStart() {
          const foundChild = entity.findChild('Child1');
          if (!foundChild || foundChild.id !== ${child1Id}) {
            throw new Error(\`Expected to find Child1 with ID ${child1Id}\`);
          }
        }
      `;

      executor.compileScript(code, 'test-find-child');
      const result = executor.executeScript(
        'test-find-child',
        createMockOptions(parentId),
        'onStart',
      );

      expect(result.success).toBe(true);
    });

    it('should return null if child not found', () => {
      const code = `
        function onStart() {
          const foundChild = entity.findChild('NonExistent');
          if (foundChild !== null) {
            throw new Error(\`Expected null, got \${foundChild}\`);
          }
        }
      `;

      executor.compileScript(code, 'test-child-not-found');
      const result = executor.executeScript(
        'test-child-not-found',
        createMockOptions(parentId),
        'onStart',
      );

      expect(result.success).toBe(true);
    });

    it('should not find grandchildren (only direct children)', () => {
      const code = `
        function onStart() {
          const foundChild = entity.findChild('Grandchild');
          if (foundChild !== null) {
            throw new Error('Should not find grandchildren, only direct children');
          }
        }
      `;

      executor.compileScript(code, 'test-no-grandchild');
      const result = executor.executeScript(
        'test-no-grandchild',
        createMockOptions(parentId),
        'onStart',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Combined Hierarchy Navigation', () => {
    it('should navigate down then up the hierarchy', () => {
      const code = `
        function onStart() {
          const child = entity.findChild('Child1');
          if (!child) {
            throw new Error('Failed to find Child1');
          }

          const parent = child.getParent();
          if (!parent || parent.id !== ${parentId}) {
            throw new Error('Failed to navigate back to parent');
          }
        }
      `;

      executor.compileScript(code, 'test-down-up');
      const result = executor.executeScript('test-down-up', createMockOptions(parentId), 'onStart');

      expect(result.success).toBe(true);
    });

    it('should find sibling via parent', () => {
      const code = `
        function onStart() {
          const parent = entity.getParent();
          if (!parent) {
            throw new Error('Failed to get parent');
          }

          const sibling = parent.findChild('Child2');
          if (!sibling || sibling.id !== ${child2Id}) {
            throw new Error('Failed to find sibling Child2');
          }
        }
      `;

      executor.compileScript(code, 'test-find-sibling');
      const result = executor.executeScript(
        'test-find-sibling',
        createMockOptions(child1Id),
        'onStart',
      );

      expect(result.success).toBe(true);
    });

    it('should traverse entire subtree', () => {
      const code = `
        const descendants = [];

        function collectDescendants(ent) {
          const children = ent.getChildren();
          for (let i = 0; i < children.length; i++) {
            descendants.push(children[i].name);
            collectDescendants(children[i]);
          }
        }

        function onStart() {
          collectDescendants(entity);
          if (descendants.length !== 3) {
            throw new Error(\`Expected 3 descendants, got \${descendants.length}\`);
          }
          if (!descendants.includes('Child1') || !descendants.includes('Child2') || !descendants.includes('Grandchild')) {
            throw new Error(\`Missing descendants: \${descendants.join(', ')}\`);
          }
        }
      `;

      executor.compileScript(code, 'test-traverse-subtree');
      const result = executor.executeScript(
        'test-traverse-subtree',
        createMockOptions(parentId),
        'onStart',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle entity with no parent gracefully', () => {
      const orphanId = entityManager.createEntity({ name: 'Orphan' });

      const code = `
        function onStart() {
          const parent = entity.getParent();
          if (parent !== null) {
            throw new Error('Orphan entity should have no parent');
          }
        }
      `;

      executor.compileScript(code, 'test-orphan');
      const result = executor.executeScript('test-orphan', createMockOptions(orphanId), 'onStart');

      expect(result.success).toBe(true);

      entityManager.deleteEntity(orphanId);
    });

    it('should handle empty name search', () => {
      const code = `
        function onStart() {
          const foundChild = entity.findChild('');
          if (foundChild !== null) {
            throw new Error('Empty name should not match any child');
          }
        }
      `;

      executor.compileScript(code, 'test-empty-name');
      const result = executor.executeScript(
        'test-empty-name',
        createMockOptions(parentId),
        'onStart',
      );

      expect(result.success).toBe(true);
    });
  });
});
