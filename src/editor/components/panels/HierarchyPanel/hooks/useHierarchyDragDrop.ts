import {
  closestCenter,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState } from 'react';

import { Logger } from '@/core/lib/logger';
import { IEntity } from '@/core/lib/ecs/IEntity';
import { useEntityManager } from '@/editor/hooks/useEntityManager';

const logger = Logger.create('HierarchyDragDrop');

export const useHierarchyDragDrop = (
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<number>>>,
) => {
  const entityManager = useEntityManager();
  const [draggedEntity, setDraggedEntity] = useState<IEntity | null>(null);
  const [dragOverEntity, setDragOverEntity] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
        logger.error('Error making entity root:', error);
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
      logger.error('Error setting parent:', error);
    }
  };

  return {
    sensors,
    draggedEntity,
    dragOverEntity,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    collisionDetection: closestCenter,
  };
};
