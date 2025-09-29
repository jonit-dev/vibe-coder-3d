import React, { useRef, useState } from 'react';
import { FiLayers } from 'react-icons/fi';
import { TbCube } from 'react-icons/tb';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { SidePanel } from '@/editor/components/layout/SidePanel';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useEditorStore } from '@/editor/store/editorStore';
import { getEntityName } from '@core/lib/ecs';

import { HierarchyContextMenu } from './HierarchyContextMenu';
import { HierarchyItem } from './HierarchyItem';

export interface IHierarchyPanelProps {
  entityIds: number[];
}

// Cube icon component (Unity-style, reused from AddObjectMenu)
export const CubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <TbCube className={className} size={16} />
);

export const HierarchyPanel: React.FC<IHierarchyPanelProps> = ({ entityIds }) => {
  const selectedId = useEditorStore((s) => s.selectedId);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    entityId: number | null;
    anchorRef: React.RefObject<HTMLLIElement> | null;
  }>({ open: false, entityId: null, anchorRef: null });

  // Store refs for each item for context menu positioning
  const itemRefs = useRef<Record<number, React.RefObject<HTMLLIElement>>>({});
  entityIds.forEach((id) => {
    if (!itemRefs.current[id]) {
      itemRefs.current[id] = React.createRef<HTMLLIElement>() as React.RefObject<HTMLLIElement>;
    }
  });

  const handleContextMenu = (_: React.MouseEvent, id: number) => {
    setContextMenu({ open: true, entityId: id, anchorRef: itemRefs.current[id] });
  };

  const handleCloseMenu = () => {
    setContextMenu({ open: false, entityId: null, anchorRef: null });
  };

  const handleDelete = () => {
    if (contextMenu.entityId != null) {
      // Use new ECS system to delete entity
      entityManager.deleteEntity(contextMenu.entityId);
      if (selectedId === contextMenu.entityId) {
        setSelectedId(entityIds.length > 0 ? entityIds[0] : null);
      }
    }
    handleCloseMenu();
  };

  const handleDuplicate = async () => {
    if (contextMenu.entityId != null) {
      try {
        const srcEntityId = contextMenu.entityId;

        // Get the source entity
        const srcEntity = entityManager.getEntity(srcEntityId);
        if (!srcEntity) {
          console.error(`[HierarchyPanel] Source entity ${srcEntityId} not found`);
          return;
        }

        // Create new entity with new ECS system
        const newEntity = entityManager.createEntity(`${srcEntity.name} Copy`);

        // Get all components from the source entity
        const sourceComponents = componentManager.getComponentsForEntity(srcEntityId);

        // Copy each component to new entity
        for (const component of sourceComponents) {
          // Copying component to new entity

          // For transform, offset position slightly
          if (component.type === KnownComponentTypes.TRANSFORM && component.data) {
            const transformData = component.data as ITransformData;
            const newTransformData = {
              ...transformData,
              position: [
                (transformData.position?.[0] || 0) + 0.5,
                transformData.position?.[1] || 0,
                transformData.position?.[2] || 0,
              ] as [number, number, number],
            };
            componentManager.addComponent(newEntity.id, component.type, newTransformData);
          } else {
            componentManager.addComponent(newEntity.id, component.type, component.data);
          }
        }

        setSelectedId(newEntity.id);
        // Successfully duplicated entity
      } catch (error) {
        console.error(`[HierarchyPanel] ❌ Failed to duplicate entity:`, error);
      }
    }
    handleCloseMenu();
  };

  const handleRename = () => {
    // No longer using prompt - users can double-click to edit inline
    handleCloseMenu();
  };

  return (
    <SidePanel
      title="Hierarchy"
      subtitle={`${entityIds.length} objects`}
      width="w-80"
      position="left"
      icon={<FiLayers />}
    >
      <div className="p-4">
        <ul
          className="space-y-1"
          onContextMenu={(e) => {
            e.preventDefault();
          }}
        >
          {entityIds.map((id) => (
            <HierarchyItem
              key={id}
              id={id}
              selected={selectedId === id}
              onSelect={setSelectedId}
              onContextMenu={handleContextMenu}
              ref={itemRefs.current[id]}
              name={getEntityName(id) || `Entity ${id}`}
            />
          ))}
        </ul>
        <HierarchyContextMenu
          anchorRef={contextMenu.anchorRef as React.RefObject<HTMLElement>}
          open={contextMenu.open}
          onClose={handleCloseMenu}
          onRename={handleRename}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </div>
    </SidePanel>
  );
};
