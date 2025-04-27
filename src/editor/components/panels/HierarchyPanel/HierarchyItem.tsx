import React, { forwardRef } from 'react';

import { CubeIcon } from './HierarchyPanel';

export interface IHierarchyItemProps {
  id: number;
  selected: boolean;
  onSelect: (id: number) => void;
  onContextMenu: (event: React.MouseEvent, id: number) => void;
  name: string;
}

export const HierarchyItem = forwardRef<HTMLLIElement, IHierarchyItemProps>(
  ({ id, selected, onSelect, onContextMenu, name }, ref) => {
    return (
      <li
        ref={ref}
        className={`px-2 py-1 rounded cursor-pointer text-sm flex items-center gap-2 outline-none ${selected ? 'bg-blue-700 text-white' : 'hover:bg-[#333] text-gray-300'}`}
        onClick={() => onSelect(id)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, id);
        }}
        tabIndex={-1}
      >
        <CubeIcon className="text-gray-400" />
        <span>{name}</span>
      </li>
    );
  },
);
HierarchyItem.displayName = 'HierarchyItem';
