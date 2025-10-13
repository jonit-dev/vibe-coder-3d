import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../../store/editorStore';

describe('useGroupSelection - Lock Prevention Logic', () => {
  beforeEach(() => {
    // Reset editor store
    useEditorStore.setState({
      selectedIds: [],
      selectedId: null,
      lockedEntityIds: new Set<number>(),
    });
  });

  describe('Lock state integration with selection', () => {
    it('should track locked entities in store', () => {
      const { toggleEntityLock, isEntityLocked } = useEditorStore.getState();

      toggleEntityLock(1);
      toggleEntityLock(3);

      expect(isEntityLocked(1)).toBe(true);
      expect(isEntityLocked(2)).toBe(false);
      expect(isEntityLocked(3)).toBe(true);
    });

    it('should prevent locked entities from being in selected IDs', () => {
      const { toggleEntityLock, setSelectedIds } = useEditorStore.getState();

      // Lock entity 2
      toggleEntityLock(2);

      // Try to select entities 1, 2, 3
      const idsToSelect = [1, 2, 3];
      // Get fresh lockedEntityIds after toggle
      const { lockedEntityIds } = useEditorStore.getState();
      const filteredIds = idsToSelect.filter((id) => !lockedEntityIds.has(id));

      setSelectedIds(filteredIds);

      const { selectedIds } = useEditorStore.getState();
      expect(selectedIds).toEqual([1, 3]);
      expect(selectedIds).not.toContain(2);
    });

    it('should filter out locked entities from range selection', () => {
      const { toggleEntityLock } = useEditorStore.getState();
      const allEntityIds = [1, 2, 3, 4, 5];

      // Lock entities 2 and 4
      toggleEntityLock(2);
      toggleEntityLock(4);

      // Get fresh lockedEntityIds
      const { lockedEntityIds } = useEditorStore.getState();

      // Simulate range selection from 1 to 5
      const rangeIds = allEntityIds.filter((id) => !lockedEntityIds.has(id));

      expect(rangeIds).toEqual([1, 3, 5]);
    });

    it('should maintain lock state when selection changes', () => {
      const { toggleEntityLock, isEntityLocked, setSelectedIds } = useEditorStore.getState();

      // Lock entity 1
      toggleEntityLock(1);

      // Change selection multiple times
      setSelectedIds([2, 3]);
      expect(isEntityLocked(1)).toBe(true);

      setSelectedIds([3, 4, 5]);
      expect(isEntityLocked(1)).toBe(true);

      setSelectedIds([]);
      expect(isEntityLocked(1)).toBe(true);
    });

    it('should allow unlocking entities and then selecting them', () => {
      const { toggleEntityLock, isEntityLocked, setSelectedIds } = useEditorStore.getState();

      // Lock entity 1
      toggleEntityLock(1);
      expect(isEntityLocked(1)).toBe(true);

      // Verify selection would be filtered
      let lockedIds = useEditorStore.getState().lockedEntityIds;
      let filtered = [1, 2, 3].filter((id) => !lockedIds.has(id));
      expect(filtered).toEqual([2, 3]);

      // Unlock entity 1
      toggleEntityLock(1);
      expect(isEntityLocked(1)).toBe(false);

      // Now can select entity 1
      lockedIds = useEditorStore.getState().lockedEntityIds;
      filtered = [1, 2, 3].filter((id) => !lockedIds.has(id));
      expect(filtered).toEqual([1, 2, 3]);

      setSelectedIds(filtered);
      expect(useEditorStore.getState().selectedIds).toEqual([1, 2, 3]);
    });

    it('should handle multiple locked entities', () => {
      const { toggleEntityLock } = useEditorStore.getState();

      // Lock multiple entities
      [1, 3, 5, 7].forEach((id) => toggleEntityLock(id));

      // Get fresh lockedEntityIds
      const { lockedEntityIds } = useEditorStore.getState();

      // Verify all are locked
      expect(lockedEntityIds.size).toBe(4);
      expect(lockedEntityIds.has(1)).toBe(true);
      expect(lockedEntityIds.has(3)).toBe(true);
      expect(lockedEntityIds.has(5)).toBe(true);
      expect(lockedEntityIds.has(7)).toBe(true);

      // Filter selection
      const allIds = [1, 2, 3, 4, 5, 6, 7, 8];
      const filtered = allIds.filter((id) => !lockedEntityIds.has(id));

      expect(filtered).toEqual([2, 4, 6, 8]);
    });

    it('should preserve locked state through store resets', () => {
      const { toggleEntityLock } = useEditorStore.getState();

      toggleEntityLock(1);
      toggleEntityLock(2);

      // Get current state
      const { lockedEntityIds } = useEditorStore.getState();
      expect(lockedEntityIds.has(1)).toBe(true);
      expect(lockedEntityIds.has(2)).toBe(true);

      // Reset selection but preserve locks
      useEditorStore.setState({
        selectedIds: [],
        selectedId: null,
        // lockedEntityIds unchanged
      });

      // Locks should still be there
      const { lockedEntityIds: newLocks } = useEditorStore.getState();
      expect(newLocks.has(1)).toBe(true);
      expect(newLocks.has(2)).toBe(true);
    });
  });
});
