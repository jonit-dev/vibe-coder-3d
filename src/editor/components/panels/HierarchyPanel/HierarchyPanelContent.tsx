import { addEntity } from 'bitecs';
import React, { useRef, useState } from 'react';

import { componentManager } from '@/core/dynamic-components/init';
import { useEditorStore } from '@/editor/store/editorStore';
import { destroyEntity, getEntityName, world } from '@core/lib/ecs';

import { HierarchyContextMenu } from './HierarchyContextMenu';
import { HierarchyItem } from './HierarchyItem';

export interface IHierarchyPanelContentProps {
  entityIds: number[];
}

export const HierarchyPanelContent: React.FC<IHierarchyPanelContentProps> = ({ entityIds }) => {
  const selectedId = useEditorStore((s) => s.selectedId);
  const setSelectedId = useEditorStore((s) => s.setSelectedId);
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
      destroyEntity(contextMenu.entityId);
      if (selectedId === contextMenu.entityId)
        setSelectedId(entityIds.length > 0 ? entityIds[0] : 0);
    }
    handleCloseMenu();
  };

  const handleDuplicate = async () => {
    if (contextMenu.entityId != null) {
      try {
        const src = contextMenu.entityId;
        console.log(`[HierarchyPanel] Duplicating entity ${src}...`);

        // Create a raw BitECS entity
        const newId = addEntity(world);
        console.log(`[HierarchyPanel] Created new entity ${newId}`);

        // Get all components from the source entity
        const sourceComponents = componentManager.getEntityComponents(src);
        console.log(`[HierarchyPanel] Source entity has components:`, sourceComponents);

        // Copy each component from source to new entity
        for (const componentId of sourceComponents) {
          const sourceData = componentManager.getComponentData(src, componentId);
          if (sourceData) {
            console.log(`[HierarchyPanel] Copying component '${componentId}' to entity ${newId}`);
            const result = await componentManager.addComponent(newId, componentId, sourceData);
            if (!result.valid) {
              console.warn(
                `[HierarchyPanel] Failed to copy component '${componentId}':`,
                result.errors,
              );
            }
          }
        }

        // Update the name to indicate it's a copy
        const srcName = getEntityName(src) || `Entity ${src}`;
        const copyName = `${srcName} Copy`;
        const nameResult = await componentManager.updateComponent(newId, 'name', {
          value: copyName,
        });

        if (!nameResult.valid) {
          console.warn(`[HierarchyPanel] Failed to set copy name:`, nameResult.errors);
        }

        // Offset position slightly so copy is visible
        const transformResult = await componentManager.updateComponent(newId, 'transform', {
          position: [0.5, 0, 0], // Offset by 0.5 units on X axis
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          needsUpdate: 1,
        });

        if (!transformResult.valid) {
          console.warn(`[HierarchyPanel] Failed to offset copy position:`, transformResult.errors);
        }

        setSelectedId(newId);
        console.log(`[HierarchyPanel] ✅ Successfully duplicated entity ${src} as ${newId}`);
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
    <div className="p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">{entityIds.length} objects</span>
      </div>

      <ul
        className="space-y-0.5"
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
  );
};
