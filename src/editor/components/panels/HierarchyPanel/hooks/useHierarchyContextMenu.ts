import React, { useRef, useState } from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { Logger } from '@/core/lib/logger';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useGroupSelection } from '@/editor/hooks/useGroupSelection';
import { useEditorStore } from '@/editor/store/editorStore';

import { IHierarchyTreeNode } from './useHierarchyTree';

const logger = Logger.create('HierarchyContextMenu');

interface IContextMenuState {
  open: boolean;
  entityId: number | null;
  anchorRef: React.RefObject<HTMLLIElement> | null;
}

export const useHierarchyContextMenu = (hierarchicalTree: IHierarchyTreeNode[]) => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const groupSelection = useGroupSelection();
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  const [contextMenu, setContextMenu] = useState<IContextMenuState>({
    open: false,
    entityId: null,
    anchorRef: null,
  });

  const itemRefs = useRef<Record<number, React.RefObject<HTMLLIElement>>>({});
  hierarchicalTree.forEach(({ entity }) => {
    if (!itemRefs.current[entity.id]) {
      itemRefs.current[entity.id] =
        React.createRef<HTMLLIElement>() as React.RefObject<HTMLLIElement>;
    }
  });

  const handleContextMenu = (_: React.MouseEvent, id: number) => {
    logger.debug('Context menu opened', {
      rightClickedId: id,
      currentSelection: groupSelection.selectedIds,
    });

    if (!groupSelection.selectedIds.includes(id)) {
      logger.debug('Entity not in selection, selecting with children', { id });
      groupSelection.selectWithChildren(id);

      const newSelection = useEditorStore.getState().selectedIds;
      logger.debug('Selection updated', { newSelection });
    }

    setContextMenu({ open: true, entityId: id, anchorRef: itemRefs.current[id] });
  };

  const handleCloseMenu = () => {
    setContextMenu({ open: false, entityId: null, anchorRef: null });
  };

  const handleDelete = () => {
    if (contextMenu.entityId != null) {
      const entityToDelete = contextMenu.entityId;

      if (groupSelection.isSelected(entityToDelete)) {
        const selectionInfo = groupSelection.getSelectionInfo();
        if (selectionInfo.ids) {
          selectionInfo.ids.forEach((id: number) => {
            entityManager.deleteEntity(id);
          });
        }
        groupSelection.clearSelection();
      } else {
        entityManager.deleteEntity(entityToDelete);

        if (useEditorStore.getState().selectedId === entityToDelete) {
          setSelectedId(null);
        }
      }
    }
    handleCloseMenu();
  };

  const handleDuplicate = async () => {
    if (contextMenu.entityId != null) {
      try {
        const selectionInfo = groupSelection.getSelectionInfo();
        const isPartOfGroupSelection =
          groupSelection.isSelected(contextMenu.entityId) && selectionInfo.hasMultiple;

        if (isPartOfGroupSelection && selectionInfo.ids) {
          const newEntityIds: number[] = [];
          const entityMapping = new Map<number, number>();

          for (const srcEntityId of selectionInfo.ids) {
            const srcEntity = entityManager.getEntity(srcEntityId);
            if (!srcEntity) {
              continue;
            }

            const newEntity = entityManager.createEntity(`${srcEntity.name} Copy`);
            entityMapping.set(srcEntityId, newEntity.id);
            newEntityIds.push(newEntity.id);

            const sourceComponents = componentManager.getComponentsForEntity(srcEntityId);

            for (const component of sourceComponents) {
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

          for (const srcEntityId of selectionInfo.ids) {
            const srcEntity = entityManager.getEntity(srcEntityId);
            const newEntityId = entityMapping.get(srcEntityId);

            if (
              srcEntity &&
              newEntityId &&
              srcEntity.parentId &&
              entityMapping.has(srcEntity.parentId)
            ) {
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
          const sourceComponents = componentManager.getComponentsForEntity(srcEntityId);

          for (const component of sourceComponents) {
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
        logger.error('Failed to duplicate entity/entities:', error);
      }
    }
    handleCloseMenu();
  };

  const handleRename = () => {
    handleCloseMenu();
  };

  return {
    contextMenu,
    itemRefs,
    handleContextMenu,
    handleCloseMenu,
    handleDelete,
    handleDuplicate,
    handleRename,
  };
};
