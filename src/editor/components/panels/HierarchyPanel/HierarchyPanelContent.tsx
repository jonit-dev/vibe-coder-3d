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

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { Logger } from '@/core/lib/logger';
import { IEntity } from '@/core/lib/ecs/IEntity';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useGroupSelection } from '@/editor/hooks/useGroupSelection';
import { useEditorStore } from '@/editor/store/editorStore';

import { HierarchyContextMenu } from './HierarchyContextMenu';
import { HierarchyItem } from './HierarchyItem';
import { CubeIcon } from './HierarchyPanel';

interface IHierarchyTreeNode {
  entity: IEntity;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

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

export const HierarchyPanelContent: React.FC = React.memo(() => {
  const entityIds = useEditorStore((s) => s.entityIds);
  const selectedId = useEditorStore((s) => s.selectedId);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const groupSelection = useGroupSelection();

  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [draggedEntity, setDraggedEntity] = useState<IEntity | null>(null);
  const [dragOverEntity, setDragOverEntity] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    entityId: number | null;
    anchorRef: React.RefObject<HTMLLIElement> | null;
  }>({ open: false, entityId: null, anchorRef: null });

  // Build hierarchical tree structure
  const hierarchicalTree = useMemo(() => {
    // Get entities from synchronized list first, then build full entity objects
    const allEntities = entityIds
      .map((id) => entityManager.getEntity(id))
      .filter(Boolean) as IEntity[];
    const entityMap = new Map(allEntities.map((e) => [e.id, e]));

    // Function to build tree recursively
    const buildTree = (entity: IEntity, depth = 0): IHierarchyTreeNode[] => {
      const hasChildren = entity.children.length > 0;
      const isExpanded = expandedNodes.has(entity.id);

      const nodes: IHierarchyTreeNode[] = [
        {
          entity,
          depth,
          hasChildren,
          isExpanded,
        },
      ];

      // Add children if expanded
      if (isExpanded && hasChildren) {
        entity.children.forEach((childId) => {
          const childEntity = entityMap.get(childId);
          if (childEntity) {
            nodes.push(...buildTree(childEntity, depth + 1));
          }
        });
      }

      return nodes;
    };

    // Start with root entities (those without parents)
    const rootEntities = allEntities.filter((e) => !e.parentId);
    const tree: IHierarchyTreeNode[] = [];

    rootEntities.forEach((entity) => {
      tree.push(...buildTree(entity));
    });

    return tree;
  }, [entityIds, entityManager, expandedNodes]);

  // Store refs for each item for context menu positioning
  const itemRefs = useRef<Record<number, React.RefObject<HTMLLIElement>>>({});
  hierarchicalTree.forEach(({ entity }) => {
    if (!itemRefs.current[entity.id]) {
      itemRefs.current[entity.id] =
        React.createRef<HTMLLIElement>() as React.RefObject<HTMLLIElement>;
    }
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleToggleExpanded = (id: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEntitySelect = (entityId: number, event?: React.MouseEvent) => {
    const allEntityIds = hierarchicalTree.map((node) => node.entity.id);

    groupSelection.handleHierarchySelection(entityId, {
      ctrlKey: event?.ctrlKey || false,
      shiftKey: event?.shiftKey || false,
      selectChildren: true,
      allEntityIds,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = parseInt(event.active.id as string);
    const entity = entityManager.getEntity(activeId);
    setDraggedEntity(entity || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over ? parseInt(event.over.id as string) : null;
    setDragOverEntity(overId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset drag state
    setDraggedEntity(null);
    setDragOverEntity(null);

    if (!over) {
      return;
    }

    const activeId = parseInt(active.id as string);

    if (over.id === 'root-drop-zone') {
      try {
        entityManager.setParent(activeId, undefined);
      } catch (error) {
        Logger.create('HierarchyPanel').error('Error making entity root:', error);
      }
      return;
    }

    if (active.id === over.id) {
      return;
    }

    const overId = parseInt(over.id as string);

    const activeEntity = entityManager.getEntity(activeId);
    const overEntity = entityManager.getEntity(overId);

    if (!activeEntity || !overEntity) {
      return;
    }

    let current: IEntity | undefined = overEntity;
    while (current?.parentId) {
      if (current.parentId === activeId) {
        return;
      }
      current = entityManager.getEntity(current.parentId);
    }

    try {
      const success = entityManager.setParent(activeId, overId);
      if (success) {
        setExpandedNodes((prev) => new Set([...prev, overId]));
      }
    } catch (error) {
      Logger.create('HierarchyPanel').error('Error setting parent:', error);
    }
  };

  const handleContextMenu = (_: React.MouseEvent, id: number) => {
    setContextMenu({ open: true, entityId: id, anchorRef: itemRefs.current[id] });
  };

  const handleCloseMenu = () => {
    setContextMenu({ open: false, entityId: null, anchorRef: null });
  };

  const handleDelete = () => {
    if (contextMenu.entityId != null) {
      const entityToDelete = contextMenu.entityId;

      // If the entity to delete is part of the current selection, delete all selected entities
      if (groupSelection.isSelected(entityToDelete)) {
        const selectionInfo = groupSelection.getSelectionInfo();
        if (selectionInfo.ids) {
          selectionInfo.ids.forEach((id: number) => {
            entityManager.deleteEntity(id);
          });
        }
        groupSelection.clearSelection();
      } else {
        // Delete only the targeted entity
        entityManager.deleteEntity(entityToDelete);

        // Remove from selection if it was selected
        if (selectedId === entityToDelete) {
          setSelectedId(null);
        }
      }
    }
    handleCloseMenu();
  };

  const handleDuplicate = async () => {
    if (contextMenu.entityId != null) {
      try {
        // Check if the entity being right-clicked is part of a group selection
        const selectionInfo = groupSelection.getSelectionInfo();
        const isPartOfGroupSelection =
          groupSelection.isSelected(contextMenu.entityId) && selectionInfo.hasMultiple;

        if (isPartOfGroupSelection && selectionInfo.ids) {
          const newEntityIds: number[] = [];
          const entityMapping = new Map<number, number>(); // old ID -> new ID

          // First pass: Create all entities and components
          for (const srcEntityId of selectionInfo.ids) {
            const srcEntity = entityManager.getEntity(srcEntityId);
            if (!srcEntity) {
              continue;
            }

            const newEntity = entityManager.createEntity(`${srcEntity.name} Copy`);

            entityMapping.set(srcEntityId, newEntity.id);
            newEntityIds.push(newEntity.id);

            // Get all components from the source entity
            const sourceComponents = componentManager.getComponentsForEntity(srcEntityId);

            // Copy each component to new entity
            for (const component of sourceComponents) {
              // For transform, offset position slightly
              if (component.type === KnownComponentTypes.TRANSFORM && component.data) {
                const originalTransformData = component.data as ITransformData;
                const transformData = {
                  ...originalTransformData,
                  position: [
                    (originalTransformData.position?.[0] || 0) + 0.5,
                    originalTransformData.position?.[1] || 0,
                    originalTransformData.position?.[2] || 0,
                  ] as [number, number, number],
                };
                componentManager.addComponent(newEntity.id, component.type, transformData);
              } else {
                componentManager.addComponent(newEntity.id, component.type, component.data);
              }
            }
          }

          // Second pass: Restore parent-child relationships
          for (const srcEntityId of selectionInfo.ids) {
            const srcEntity = entityManager.getEntity(srcEntityId);
            const newEntityId = entityMapping.get(srcEntityId);

            if (
              srcEntity &&
              newEntityId &&
              srcEntity.parentId &&
              entityMapping.has(srcEntity.parentId)
            ) {
              // If the parent was also duplicated, set the relationship
              const newParentId = entityMapping.get(srcEntity.parentId);
              if (newParentId) {
                entityManager.setParent(newEntityId, newParentId);
              }
            }
          }

          setSelectedIds(newEntityIds);
        } else {
          const srcEntityId = contextMenu.entityId;

          const srcEntity = entityManager.getEntity(srcEntityId);
          if (!srcEntity) {
            return;
          }

          const newEntity = entityManager.createEntity(`${srcEntity.name} Copy`);

          // Get all components from the source entity
          const sourceComponents = componentManager.getComponentsForEntity(srcEntityId);

          // Copy each component to new entity
          for (const component of sourceComponents) {
            // For transform, offset position slightly
            if (component.type === KnownComponentTypes.TRANSFORM && component.data) {
              const originalTransformData = component.data as ITransformData;
              const transformData = {
                ...originalTransformData,
                position: [
                  (originalTransformData.position?.[0] || 0) + 0.5,
                  originalTransformData.position?.[1] || 0,
                  originalTransformData.position?.[2] || 0,
                ] as [number, number, number],
              };
              componentManager.addComponent(newEntity.id, component.type, transformData);
            } else {
              componentManager.addComponent(newEntity.id, component.type, component.data);
            }
          }

          groupSelection.selectSingle(newEntity.id);
        }
      } catch (error) {
        Logger.create('HierarchyPanel').error('Failed to duplicate entity/entities:', error);
      }
    }
    handleCloseMenu();
  };

  const handleRename = () => {
    // No longer using prompt - users can double-click to edit inline
    handleCloseMenu();
  };

  const allEntityIds = hierarchicalTree.map((node) => node.entity.id.toString());

  const selectionInfo = groupSelection.getSelectionInfo();

  // Auto-expand to and scroll the selected entity into view
  useEffect(() => {
    if (selectedId == null) return;

    // Expand the chain of parents up to the root so the selected item is visible
    const pathToRoot = new Set<number>();
    let currentId: number | undefined | null = selectedId;
    while (currentId != null) {
      pathToRoot.add(currentId);
      const entity = entityManager.getEntity(currentId);
      if (!entity || !entity.parentId) break;
      currentId = entity.parentId;
    }
    setExpandedNodes((prev) => new Set<number>([...prev, ...Array.from(pathToRoot)]));

    // Scroll the selected item into view after the list renders
    const scroll = () => {
      const ref = itemRefs.current[selectedId]?.current;
      ref?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    // Use rAF to ensure DOM is updated after state changes
    const raf = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(raf);
  }, [selectedId, hierarchicalTree.length, entityManager]);

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
        collisionDetection={closestCenter}
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
                  onSelect={handleEntitySelect}
                  onContextMenu={handleContextMenu}
                  ref={itemRefs.current[entity.id]}
                  name={entity.name || `Entity ${entity.id}`}
                  depth={depth}
                  hasChildren={hasChildren}
                  isExpanded={isExpanded}
                  onToggleExpanded={handleToggleExpanded}
                  isDragOver={dragOverEntity === entity.id}
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
        isGroupSelection={selectionInfo.hasMultiple}
        selectedCount={selectionInfo.count}
      />
    </div>
  );
});
