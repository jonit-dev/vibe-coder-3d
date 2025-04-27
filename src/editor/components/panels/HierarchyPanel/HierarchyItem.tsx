import React, { useRef } from 'react';

import { CubeIcon } from './HierarchyPanel';

export interface IHierarchyItemProps {
  id: number;
  selected: boolean;
  onSelect: (id: number) => void;
  onContextMenu: (event: React.MouseEvent, id: number) => void;
}

export const HierarchyItem: React.FC<IHierarchyItemProps> = ({
  id,
  selected,
  onSelect,
  onContextMenu,
}) => {
  const itemRef = useRef<HTMLLIElement>(null);

  return (
    <li
      ref={itemRef}
      className={`px-2 py-1 rounded cursor-pointer text-sm flex items-center gap-2 ${selected ? 'bg-blue-700 text-white' : 'hover:bg-[#333] text-gray-300'}`}
      onClick={() => onSelect(id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, id);
      }}
      tabIndex={0}
    >
      <CubeIcon className="text-gray-400" />
      <span>Entity {id}</span>
    </li>
  );
};
