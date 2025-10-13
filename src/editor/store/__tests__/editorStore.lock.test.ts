import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../editorStore';

describe('editorStore - Entity Lock', () => {
  beforeEach(() => {
    // Reset store state before each test
    useEditorStore.setState({
      lockedEntityIds: new Set<number>(),
    });
  });

  describe('toggleEntityLock', () => {
    it('should lock an unlocked entity', () => {
      const { toggleEntityLock, isEntityLocked } = useEditorStore.getState();

      expect(isEntityLocked(1)).toBe(false);

      toggleEntityLock(1);

      expect(isEntityLocked(1)).toBe(true);
    });

    it('should unlock a locked entity', () => {
      const { toggleEntityLock, isEntityLocked } = useEditorStore.getState();

      // Lock the entity first
      toggleEntityLock(1);
      expect(isEntityLocked(1)).toBe(true);

      // Unlock it
      toggleEntityLock(1);
      expect(isEntityLocked(1)).toBe(false);
    });

    it('should handle multiple entities', () => {
      const { toggleEntityLock, isEntityLocked } = useEditorStore.getState();

      toggleEntityLock(1);
      toggleEntityLock(2);
      toggleEntityLock(3);

      expect(isEntityLocked(1)).toBe(true);
      expect(isEntityLocked(2)).toBe(true);
      expect(isEntityLocked(3)).toBe(true);
      expect(isEntityLocked(4)).toBe(false);
    });

    it('should create a new Set to trigger reactivity', () => {
      const initialSet = useEditorStore.getState().lockedEntityIds;

      useEditorStore.getState().toggleEntityLock(1);

      const newSet = useEditorStore.getState().lockedEntityIds;

      expect(newSet).not.toBe(initialSet);
      expect(newSet.has(1)).toBe(true);
    });
  });

  describe('isEntityLocked', () => {
    it('should return false for unlocked entity', () => {
      const { isEntityLocked } = useEditorStore.getState();

      expect(isEntityLocked(1)).toBe(false);
    });

    it('should return true for locked entity', () => {
      const { toggleEntityLock, isEntityLocked } = useEditorStore.getState();

      toggleEntityLock(1);

      expect(isEntityLocked(1)).toBe(true);
    });

    it('should handle entity ID 0', () => {
      const { toggleEntityLock, isEntityLocked } = useEditorStore.getState();

      toggleEntityLock(0);

      expect(isEntityLocked(0)).toBe(true);
    });
  });

  describe('lockedEntityIds state', () => {
    it('should maintain locked state across multiple operations', () => {
      const { toggleEntityLock, isEntityLocked } = useEditorStore.getState();

      // Lock entities
      toggleEntityLock(1);
      toggleEntityLock(2);
      toggleEntityLock(3);

      // Unlock one
      toggleEntityLock(2);

      // Check state
      expect(isEntityLocked(1)).toBe(true);
      expect(isEntityLocked(2)).toBe(false);
      expect(isEntityLocked(3)).toBe(true);
    });

    it('should allow direct state manipulation for restoration', () => {
      const lockedIds = new Set([1, 2, 3]);
      useEditorStore.setState({ lockedEntityIds: lockedIds });

      const { isEntityLocked } = useEditorStore.getState();

      expect(isEntityLocked(1)).toBe(true);
      expect(isEntityLocked(2)).toBe(true);
      expect(isEntityLocked(3)).toBe(true);
      expect(isEntityLocked(4)).toBe(false);
    });
  });
});
