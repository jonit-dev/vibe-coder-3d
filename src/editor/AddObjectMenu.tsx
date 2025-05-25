import React from 'react';
import { TbCircle, TbCone, TbCube, TbCylinder, TbSquare } from 'react-icons/tb';

import { DropdownMenu } from './components/menus/DropdownMenu';
import { useEditorStore } from './store/editorStore';

export interface IAddObjectMenuProps {
  anchorRef: React.RefObject<HTMLElement>;
  onAdd: (type: 'Cube' | 'Sphere' | 'Cylinder' | 'Cone' | 'Torus' | 'Plane') => void;
}

const OBJECTS = [
  {
    type: 'Cube',
    label: 'Cube',
    icon: <TbCube size={18} />,
  },
  {
    type: 'Sphere',
    label: 'Sphere',
    icon: <TbCircle size={18} />,
  },
  {
    type: 'Cylinder',
    label: 'Cylinder',
    icon: <TbCylinder size={18} />,
  },
  {
    type: 'Cone',
    label: 'Cone',
    icon: <TbCone size={18} />,
  },
  {
    type: 'Torus',
    label: 'Torus',
    icon: <TbCircle size={18} style={{ border: '2px solid currentColor', borderRadius: '50%' }} />,
  },
  {
    type: 'Plane',
    label: 'Plane',
    icon: <TbSquare size={18} />,
  },
];

export const AddObjectMenu: React.FC<IAddObjectMenuProps> = ({ anchorRef, onAdd }) => {
  const open = useEditorStore((s) => s.showAddMenu);
  const setShowAddMenu = useEditorStore((s) => s.setShowAddMenu);
  return (
    <DropdownMenu anchorRef={anchorRef} open={open} onClose={() => setShowAddMenu(false)}>
      <ul className="menu bg-base-200 rounded-box w-full">
        {OBJECTS.map((obj) => (
          <li key={obj.type}>
            <button
              className="flex items-center gap-2 text-base-content text-sm font-medium px-2 py-2 hover:bg-base-300 rounded-box transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(obj.type as any);
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
