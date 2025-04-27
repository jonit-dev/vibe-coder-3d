import React from 'react';

import { DropdownMenu } from './components/ui/DropdownMenu';

export interface IAddObjectMenuProps {
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onAdd: (type: 'Cube' | 'Sphere') => void;
  onClose: () => void;
}

const OBJECTS = [
  {
    type: 'Cube', label: 'Cube', icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" /></svg>
    )
  },
  {
    type: 'Sphere', label: 'Sphere', icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" /></svg>
    )
  },
  // Add more objects as needed
];

export const AddObjectMenu: React.FC<IAddObjectMenuProps> = ({ anchorRef, open, onAdd, onClose }) => {
  return (
    <DropdownMenu anchorRef={anchorRef} open={open} onClose={onClose}>
      <ul className="menu bg-base-200 rounded-box w-full">
        {OBJECTS.map(obj => (
          <li key={obj.type}>
            <button
              className="flex items-center gap-2 text-base-content text-sm font-medium px-2 py-2 hover:bg-base-300 rounded-box transition-colors"
              onClick={e => {
                e.stopPropagation();
                console.log('[AddObjectMenu] Clicked', obj.type);
                onAdd(obj.type as 'Cube' | 'Sphere');
              }}
            >
              <span className="w-5 h-5 flex items-center justify-center">{obj.icon}</span>
              <span>{obj.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </DropdownMenu>
  );
}; 
