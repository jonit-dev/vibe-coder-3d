import React from 'react';
import { FiBox, FiSun, FiZap } from 'react-icons/fi';
import {
  TbBox,
  TbBuildingBridge,
  TbCircle,
  TbCone,
  TbCube,
  TbCylinder,
  TbLamp,
  TbShape,
  TbSphere,
  TbSquare,
} from 'react-icons/tb';

import {
  IMenuCategory,
  IMenuItemOption,
  NestedDropdownMenu,
} from './components/common/NestedDropdownMenu';
import { useEditorStore } from './store/editorStore';

export interface IEnhancedAddObjectMenuProps {
  anchorRef: React.RefObject<HTMLElement>;
  onAdd: (type: 'Cube' | 'Sphere' | 'Cylinder' | 'Cone' | 'Torus' | 'Plane') => void;
}

const OBJECT_CATEGORIES: IMenuCategory[] = [
  {
    label: 'Basic Shapes',
    icon: <TbBox size={18} />,
    items: [
      {
        type: 'Cube',
        label: 'Cube',
        icon: <TbCube size={18} />,
      },
      {
        type: 'Sphere',
        label: 'Sphere',
        icon: <TbSphere size={18} />,
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
    ],
  },
  {
    label: 'Advanced Shapes',
    icon: <TbShape size={18} />,
    items: [
      {
        type: 'Torus',
        label: 'Torus',
        icon: (
          <TbCircle size={18} style={{ border: '2px solid currentColor', borderRadius: '50%' }} />
        ),
      },
      // Add more advanced shapes in the future
    ],
  },
  {
    label: 'Lighting',
    icon: <FiSun size={18} />,
    items: [
      // Placeholder for future lighting objects
      {
        type: 'DirectionalLight',
        label: 'Directional Light',
        icon: <TbLamp size={18} />,
      },
      {
        type: 'PointLight',
        label: 'Point Light',
        icon: <FiZap size={18} />,
      },
    ],
  },
  {
    label: 'Structural',
    icon: <TbBuildingBridge size={18} />,
    items: [
      {
        type: 'Plane',
        label: 'Plane',
        icon: <TbSquare size={18} />,
      },
      // Placeholder for future structural objects
      {
        type: 'Wall',
        label: 'Wall',
        icon: <FiBox size={18} />,
      },
    ],
  },
];

export const EnhancedAddObjectMenu: React.FC<IEnhancedAddObjectMenuProps> = ({
  anchorRef,
  onAdd,
}) => {
  const open = useEditorStore((s) => s.showAddMenu);
  const setShowAddMenu = useEditorStore((s) => s.setShowAddMenu);

  const handleItemSelect = (item: IMenuItemOption) => {
    // Only handle the basic shapes for now
    const validTypes = ['Cube', 'Sphere', 'Cylinder', 'Cone', 'Torus', 'Plane'];
    if (validTypes.includes(item.type)) {
      onAdd(item.type as 'Cube' | 'Sphere' | 'Cylinder' | 'Cone' | 'Torus' | 'Plane');
    } else {
      // For future object types, show a placeholder message
      console.log(`[AddObjectMenu] Future object type selected: ${item.type}`);
      // You could show a toast notification here
    }
  };

  return (
    <NestedDropdownMenu
      anchorRef={anchorRef}
      open={open}
      onClose={() => setShowAddMenu(false)}
      onItemSelect={handleItemSelect}
      categories={OBJECT_CATEGORIES}
    />
  );
};
