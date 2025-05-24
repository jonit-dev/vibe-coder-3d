import React, { forwardRef } from 'react';

import { EditableEntityName } from '@/editor/components/ui/EditableEntityName';

import { CubeIcon } from './HierarchyPanel';

export interface IHierarchyItemProps {
  id: number;
  selected: boolean;
  onSelect: (id: number) => void;
  onContextMenu: (event: React.MouseEvent, id: number) => void;
  name: string;
}

export const HierarchyItem = forwardRef<HTMLLIElement, IHierarchyItemProps>(
  ({ id, selected, onSelect, onContextMenu }, ref) => {
    const handleClick = (e: React.MouseEvent) => {
      // Only select if not editing the name
      if (!(e.target as HTMLElement).matches('input')) {
        onSelect(id);
      }
    };

    return (
      <li
        ref={ref}
        className={`px-2 py-1 rounded cursor-pointer text-xs flex items-center gap-2 outline-none transition-all duration-200 ${
          selected
            ? 'bg-gray-700/60 text-gray-100 border border-gray-600/40 shadow-sm'
            : 'hover:bg-gray-800/50 text-gray-300 border border-transparent hover:border-gray-700/30'
        }`}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, id);
        }}
        tabIndex={-1}
      >
        <CubeIcon
          className={`${selected ? 'text-blue-300' : 'text-gray-400'} transition-colors duration-200 w-3 h-3`}
        />
        <EditableEntityName
          entityId={id}
          enableDoubleClick={true}
          className="font-medium truncate flex-1 min-w-0"
          onDoubleClick={() => {
            // Prevent selection when double-clicking to edit
          }}
        />
        {selected && (
          <div className="ml-auto">
            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
          </div>
        )}
      </li>
    );
  },
);
HierarchyItem.displayName = 'HierarchyItem';
