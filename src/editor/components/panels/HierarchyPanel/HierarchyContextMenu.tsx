import React from 'react';

import { DropdownMenu } from '@/editor/components/menus/DropdownMenu';

export interface IHierarchyContextMenuProps {
  anchorRef: React.RefObject<HTMLElement | HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isGroupSelection?: boolean;
  selectedCount?: number;
}

export const HierarchyContextMenu: React.FC<IHierarchyContextMenuProps> = ({
  anchorRef,
  open,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  isGroupSelection = false,
  selectedCount = 1,
}) => {
  return (
    <DropdownMenu anchorRef={anchorRef} open={open} onClose={onClose}>
      <ul className="menu bg-base-200 rounded-box w-full">
        {!isGroupSelection && (
          <li>
            <button className="w-full text-left" onClick={onRename}>
              Rename
            </button>
          </li>
        )}
        <li>
          <button className="w-full text-left" onClick={onDuplicate}>
            {isGroupSelection ? `Duplicate ${selectedCount} items` : 'Duplicate'}
          </button>
        </li>
        <li>
          <button className="w-full text-left text-red-500" onClick={onDelete}>
            {isGroupSelection ? `Delete ${selectedCount} items` : 'Delete'}
          </button>
        </li>
      </ul>
    </DropdownMenu>
  );
};
