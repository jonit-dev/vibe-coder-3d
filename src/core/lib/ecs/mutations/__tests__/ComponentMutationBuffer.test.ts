/**
 * ComponentMutationBuffer Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentMutationBuffer } from '../ComponentMutationBuffer';

describe('ComponentMutationBuffer', () => {
  let buffer: ComponentMutationBuffer;

  beforeEach(() => {
    buffer = new ComponentMutationBuffer();
  });

  describe('queue', () => {
    it('should queue a component field update', () => {
      buffer.queue(1, 'MeshRenderer', 'enabled', true);

      expect(buffer.size).toBe(1);
      expect(buffer.hasPending).toBe(true);
    });

    it('should coalesce multiple updates to the same field (last-write-wins)', () => {
      buffer.queue(1, 'MeshRenderer', 'enabled', false);
      buffer.queue(1, 'MeshRenderer', 'enabled', true);
      buffer.queue(1, 'MeshRenderer', 'enabled', false);

      expect(buffer.size).toBe(1); // Only one key

      const applied: Array<{
        entityId: number;
        componentId: string;
        field: string;
        value: unknown;
      }> = [];
      buffer.flush((entityId, componentId, field, value) => {
        applied.push({ entityId, componentId, field, value });
      });

      expect(applied).toHaveLength(1);
      expect(applied[0].value).toBe(false); // Last write wins
    });

    it('should keep separate entries for different fields', () => {
      buffer.queue(1, 'MeshRenderer', 'enabled', true);
      buffer.queue(1, 'MeshRenderer', 'castShadows', false);

      expect(buffer.size).toBe(2);
    });

    it('should keep separate entries for different components', () => {
      buffer.queue(1, 'MeshRenderer', 'enabled', true);
      buffer.queue(1, 'Transform', 'position', [0, 0, 0]);

      expect(buffer.size).toBe(2);
    });

    it('should keep separate entries for different entities', () => {
      buffer.queue(1, 'MeshRenderer', 'enabled', true);
      buffer.queue(2, 'MeshRenderer', 'enabled', false);

      expect(buffer.size).toBe(2);
    });
  });

  describe('flush', () => {
    it('should apply all pending mutations via callback', () => {
      buffer.queue(1, 'MeshRenderer', 'enabled', true);
      buffer.queue(1, 'MeshRenderer', 'castShadows', false);
      buffer.queue(2, 'Transform', 'position', [1, 2, 3]);

      const applied: Array<{
        entityId: number;
        componentId: string;
        field: string;
        value: unknown;
      }> = [];
      buffer.flush((entityId, componentId, field, value) => {
        applied.push({ entityId, componentId, field, value });
      });

      expect(applied).toHaveLength(3);
      expect(applied).toEqual(
        expect.arrayContaining([
          { entityId: 1, componentId: 'MeshRenderer', field: 'enabled', value: true },
          { entityId: 1, componentId: 'MeshRenderer', field: 'castShadows', value: false },
          { entityId: 2, componentId: 'Transform', field: 'position', value: [1, 2, 3] },
        ]),
      );
    });

    it('should clear buffer after flushing', () => {
      buffer.queue(1, 'MeshRenderer', 'enabled', true);

      expect(buffer.size).toBe(1);

      buffer.flush(() => {});

      expect(buffer.size).toBe(0);
      expect(buffer.hasPending).toBe(false);
    });

    it('should handle flush with no pending mutations', () => {
      const mockCallback = vi.fn();
      buffer.flush(mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle complex nested values', () => {
      const complexValue = {
        color: '#ff0000',
        metalness: 0.5,
        nested: { deep: { value: 42 } },
      };

      buffer.queue(1, 'MeshRenderer', 'material', complexValue);

      const applied: unknown[] = [];
      buffer.flush((entityId, componentId, field, value) => {
        applied.push(value);
      });

      expect(applied[0]).toEqual(complexValue);
    });
  });

  describe('clear', () => {
    it('should clear all pending mutations without applying them', () => {
      buffer.queue(1, 'MeshRenderer', 'enabled', true);
      buffer.queue(2, 'Transform', 'position', [0, 0, 0]);

      expect(buffer.size).toBe(2);

      buffer.clear();

      expect(buffer.size).toBe(0);
      expect(buffer.hasPending).toBe(false);
    });

    it('should not invoke flush callback when clearing', () => {
      buffer.queue(1, 'MeshRenderer', 'enabled', true);

      buffer.clear();

      const mockCallback = vi.fn();
      buffer.flush(mockCallback);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('size and hasPending', () => {
    it('should return correct size', () => {
      expect(buffer.size).toBe(0);

      buffer.queue(1, 'MeshRenderer', 'enabled', true);
      expect(buffer.size).toBe(1);

      buffer.queue(1, 'MeshRenderer', 'castShadows', false);
      expect(buffer.size).toBe(2);

      buffer.queue(1, 'MeshRenderer', 'enabled', false); // Coalesced
      expect(buffer.size).toBe(2);
    });

    it('should return correct hasPending status', () => {
      expect(buffer.hasPending).toBe(false);

      buffer.queue(1, 'MeshRenderer', 'enabled', true);
      expect(buffer.hasPending).toBe(true);

      buffer.flush(() => {});
      expect(buffer.hasPending).toBe(false);
    });
  });
});
