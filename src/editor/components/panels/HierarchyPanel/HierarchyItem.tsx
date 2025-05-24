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
        className={`px-2 py-1 rounded cursor-pointer text-xs flex items-center gap-2 outline-none transition-all duration-200 ${
          selected
            ? 'bg-gradient-to-r from-cyan-600/80 to-purple-600/80 text-white border border-cyan-500/30 shadow-sm'
            : 'hover:bg-gray-800/50 text-gray-300 border border-transparent hover:border-gray-700/30'
        }`}
        onClick={() => onSelect(id)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, id);
        }}
        tabIndex={-1}
      >
        <CubeIcon
          className={`${selected ? 'text-cyan-200' : 'text-gray-400'} transition-colors duration-200 w-3 h-3`}
        />
        <span className="font-medium truncate">{name}</span>
        {selected && (
          <div className="ml-auto">
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </li>
    );
  },
);
HierarchyItem.displayName = 'HierarchyItem';
