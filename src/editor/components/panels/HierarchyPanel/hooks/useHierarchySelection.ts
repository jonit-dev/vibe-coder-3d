import { useCallback, useState } from 'react';

import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useGroupSelection } from '@/editor/hooks/useGroupSelection';
import { useEditorStore } from '@/editor/store/editorStore';

export const useHierarchySelection = () => {
  const entityManager = useEntityManager();
  const groupSelection = useGroupSelection();
  const selectedId = useEditorStore((s) => s.selectedId);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const handleToggleExpanded = useCallback((id: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleEntitySelect = useCallback(
    (entityId: number, allEntityIds: number[], event?: React.MouseEvent) => {
      groupSelection.handleHierarchySelection(entityId, {
        ctrlKey: event?.ctrlKey || false,
        shiftKey: event?.shiftKey || false,
        selectChildren: true,
        allEntityIds,
      });
    },
    [groupSelection],
  );

  const scrollToSelected = useCallback(
    (itemRefs: Record<number, React.RefObject<HTMLLIElement>>) => {
      if (selectedId == null) return;

      const pathToRoot = new Set<number>();
      let currentId: number | undefined | null = selectedId;
      while (currentId != null) {
        pathToRoot.add(currentId);
        const entity = entityManager.getEntity(currentId);
        if (!entity || !entity.parentId) break;
        currentId = entity.parentId;
      }
      setExpandedNodes((prev) => new Set<number>([...prev, ...Array.from(pathToRoot)]));

      const scroll = () => {
        const ref = itemRefs[selectedId]?.current;
        ref?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };
      const raf = requestAnimationFrame(scroll);
      return () => cancelAnimationFrame(raf);
    },
    [selectedId, entityManager],
  );

  return {
    expandedNodes,
    setExpandedNodes,
    handleToggleExpanded,
    handleEntitySelect,
    scrollToSelected,
  };
};
