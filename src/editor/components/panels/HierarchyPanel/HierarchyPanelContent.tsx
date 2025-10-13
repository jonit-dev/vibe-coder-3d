/**
 * HierarchyPanelContent - Shows the hierarchical tree of entities with group selection support
 *
 * Group Selection Features:
 * - Click: Select entity and all its children
 * - Ctrl+Click: Add entity and its children to selection, or remove if already selected
 * - Shift+Click: Range selection from last selected to current entity
 * - Delete Key: Delete all selected entities
 * - Escape Key: Clear selection
 * - Context menu shows different options for single vs group selection
 *
 * Visual Indicators:
 * - Primary selection: Highlighted with strong blue background
 * - Part of group selection: Highlighted with lighter blue background
 * - Selection count shown in header when multiple items selected
 */

import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import React from 'react';

import { useGroupSelection } from '@/editor/hooks/useGroupSelection';
import { useEditorStore } from '@/editor/store/editorStore';
import { usePrefabs } from '@/editor/components/prefabs/hooks/usePrefabs';

import { TbCube } from 'react-icons/tb';

import { HierarchyContextMenu } from './HierarchyContextMenu';
import { HierarchyItem } from './HierarchyItem';
import { useHierarchyTree } from './hooks/useHierarchyTree';
import { useHierarchyDragDrop } from './hooks/useHierarchyDragDrop';
import { useHierarchyContextMenu } from './hooks/useHierarchyContextMenu';
import { useHierarchySelection } from './hooks/useHierarchySelection';

const CubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <TbCube className={className} size={16} />
);

const RootDropZone: React.FC<{ isDragging: boolean }> = React.memo(({ isDragging }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'root-drop-zone',
  });

  if (!isDragging) return null;

  return (
    <div
      ref={setNodeRef}
      className={`mt-2 py-3 px-3 border-2 border-dashed rounded text-xs text-center transition-all duration-200 ${
        isOver
          ? 'border-green-400 bg-green-600/20 text-green-300'
          : 'border-gray-500 bg-gray-700/20 text-gray-400'
      }`}
    >
      {isOver ? '✓ Release to make root entity' : 'Drop here to make root entity'}
    </div>
  );
});

export const HierarchyPanelContent: React.FC = () => {
  const entityIds = useEditorStore((s) => s.entityIds);
  const lockedEntityIds = useEditorStore((s) => s.lockedEntityIds);
  const toggleEntityLock = useEditorStore((s) => s.toggleEntityLock);
  const groupSelection = useGroupSelection();
  const { openCreate } = usePrefabs();

  // Force re-render when locked IDs change by tracking the Set size
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const lockedIdsRef = React.useRef(lockedEntityIds);

  React.useEffect(() => {
    if (lockedIdsRef.current !== lockedEntityIds) {
      lockedIdsRef.current = lockedEntityIds;
      forceUpdate();
    }
  }, [lockedEntityIds]);

  // Helper function to check if entity is locked
  const isEntityLocked = React.useCallback(
    (id: number) => lockedEntityIds.has(id),
    [lockedEntityIds],
  );

  const {
    expandedNodes,
    setExpandedNodes,
    handleToggleExpanded,
    handleEntitySelect,
    scrollToSelected,
  } = useHierarchySelection();

  const hierarchicalTree = useHierarchyTree(entityIds, expandedNodes);

  const {
    sensors,
    draggedEntity,
    dragOverEntity,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    collisionDetection,
  } = useHierarchyDragDrop(setExpandedNodes);

  const {
    contextMenu,
    itemRefs,
    handleContextMenu,
    handleCloseMenu,
    handleDelete,
    handleDuplicate,
    handleRename,
  } = useHierarchyContextMenu(hierarchicalTree);

  React.useEffect(() => {
    scrollToSelected(itemRefs.current);
  }, [scrollToSelected, itemRefs, hierarchicalTree.length]);

  const allEntityIds = hierarchicalTree.map((node) => node.entity.id.toString());
  const selectionInfo = groupSelection.getSelectionInfo();

  return (
    <div className="p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">{hierarchicalTree.length} objects</span>
        {selectionInfo.hasMultiple && (
          <span className="text-xs text-blue-400 font-medium">{selectionInfo.count} selected</span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allEntityIds} strategy={verticalListSortingStrategy}>
          {hierarchicalTree.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="mb-2">No entities in scene</div>
              <div className="text-xs">Create objects using the + menu</div>
            </div>
          ) : (
            <ul
              className="space-y-0.5"
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            >
              {hierarchicalTree.map(({ entity, depth, hasChildren, isExpanded }) => (
                <HierarchyItem
                  key={entity.id}
                  id={entity.id}
                  selected={groupSelection.isPrimarySelection(entity.id)}
                  isPartOfSelection={
                    groupSelection.isSelected(entity.id) &&
                    !groupSelection.isPrimarySelection(entity.id)
                  }
                  onSelect={(id, event) => handleEntitySelect(id, allEntityIds.map(Number), event)}
                  onContextMenu={handleContextMenu}
                  ref={itemRefs.current[entity.id]}
                  name={entity.name || `Entity ${entity.id}`}
                  depth={depth}
                  hasChildren={hasChildren}
                  isExpanded={isExpanded}
                  onToggleExpanded={handleToggleExpanded}
                  isDragOver={dragOverEntity === entity.id}
                  isLocked={isEntityLocked(entity.id)}
                  onToggleLock={toggleEntityLock}
                />
              ))}
            </ul>
          )}
        </SortableContext>

        <RootDropZone isDragging={!!draggedEntity} />

        <DragOverlay>
          {draggedEntity ? (
            <div className="bg-gray-800/95 border border-gray-600 rounded px-3 py-2 text-xs text-gray-200 shadow-xl backdrop-blur-sm flex items-center gap-2 transform rotate-2">
              <CubeIcon className="text-blue-400 w-3 h-3 flex-shrink-0" />
              <span className="font-medium">{draggedEntity.name}</span>
              <span className="text-gray-400">→ {dragOverEntity ? 'Nesting...' : 'Move'}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <HierarchyContextMenu
        anchorRef={contextMenu.anchorRef as React.RefObject<HTMLElement>}
        open={contextMenu.open}
        onClose={handleCloseMenu}
        onRename={handleRename}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onCreatePrefab={openCreate}
        isGroupSelection={selectionInfo.hasMultiple}
        selectedCount={selectionInfo.count}
      />
    </div>
  );
};
