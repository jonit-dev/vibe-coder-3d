import React, { useRef, useState } from 'react';

import { useEditorStore } from '@/editor/store/editorStore';
import {
  createEntity,
  destroyEntity,
  getEntityName,
  MeshType,
  setEntityName,
  Transform,
} from '@core/lib/ecs';

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
  const [, forceUpdate] = useState(0); // for re-render on rename

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

  const handleDuplicate = () => {
    if (contextMenu.entityId != null) {
      const src = contextMenu.entityId;
      const newId = createEntity();
      MeshType.type[newId] = MeshType.type[src];
      for (let i = 0; i < 3; i++) {
        Transform.position[newId][i] = Transform.position[src][i];
        Transform.rotation[newId][i] = Transform.rotation[src][i];
        Transform.scale[newId][i] = Transform.scale[src][i];
      }
      Transform.needsUpdate[newId] = 1;
      // Copy name if present
      const srcName = getEntityName(src);
      if (srcName) setEntityName(newId, srcName);
      setSelectedId(newId);
    }
    handleCloseMenu();
  };

  const handleRename = () => {
    if (contextMenu.entityId != null) {
      const currentName = getEntityName(contextMenu.entityId) || `Entity ${contextMenu.entityId}`;
      const newName = window.prompt('Enter new name for entity', currentName);
      if (newName && newName.trim()) {
        setEntityName(contextMenu.entityId, newName.trim());
        forceUpdate((n) => n + 1); // force re-render
      }
    }
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
