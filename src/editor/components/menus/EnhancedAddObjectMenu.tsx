import React from 'react';
import { FiBox, FiFolder } from 'react-icons/fi';
import {
  TbBox,
  TbBuildingBridge,
  TbCircle,
  TbCone,
  TbCube,
  TbCylinder,
  TbDiamond,
  TbHeart,
  TbHexagon,
  TbMath,
  TbOctagon,
  TbPlus,
  TbPyramid,
  TbRectangle,
  TbShape,
  TbSphere,
  TbSpiral,
  TbSquare,
  TbStar,
  TbTriangle,
} from 'react-icons/tb';

import { useEditorStore } from '../../store/editorStore';
import { ShapeType } from '../../types/shapes';

import { IMenuCategory, IMenuItemOption, NestedDropdownMenu } from './NestedDropdownMenu';

export interface IEnhancedAddObjectMenuProps {
  anchorRef: React.RefObject<HTMLElement>;
  onAdd: (type: ShapeType) => void;
  onCustomModel?: () => void;
}

const OBJECT_CATEGORIES: IMenuCategory[] = [
  {
    label: 'Basic Shapes',
    icon: <TbBox size={18} />,
    items: [
      {
        type: ShapeType.Cube,
        label: 'Cube',
        icon: <TbCube size={18} />,
      },
      {
        type: ShapeType.Sphere,
        label: 'Sphere',
        icon: <TbSphere size={18} />,
      },
      {
        type: ShapeType.Cylinder,
        label: 'Cylinder',
        icon: <TbCylinder size={18} />,
      },
      {
        type: ShapeType.Cone,
        label: 'Cone',
        icon: <TbCone size={18} />,
      },
      {
        type: ShapeType.Plane,
        label: 'Plane',
        icon: <TbSquare size={18} />,
      },
    ],
  },
  {
    label: 'Geometric Shapes',
    icon: <TbShape size={18} />,
    items: [
      {
        type: ShapeType.Torus,
        label: 'Torus',
        icon: (
          <TbCircle size={18} style={{ border: '2px solid currentColor', borderRadius: '50%' }} />
        ),
      },
      {
        type: ShapeType.Trapezoid,
        label: 'Trapezoid',
        icon: <TbRectangle size={18} />,
      },
      {
        type: ShapeType.Prism,
        label: 'Prism',
        icon: <TbCylinder size={18} />,
      },
      {
        type: ShapeType.Pyramid,
        label: 'Pyramid',
        icon: <TbPyramid size={18} />,
      },
      {
        type: ShapeType.Capsule,
        label: 'Capsule',
        icon: <TbRectangle size={18} />,
      },
    ],
  },
  {
    label: 'Polyhedra',
    icon: <TbOctagon size={18} />,
    items: [
      {
        type: ShapeType.Octahedron,
        label: 'Octahedron',
        icon: <TbOctagon size={18} />,
      },
      {
        type: ShapeType.Dodecahedron,
        label: 'Dodecahedron',
        icon: <TbHexagon size={18} />,
      },
      {
        type: ShapeType.Icosahedron,
        label: 'Icosahedron',
        icon: <TbDiamond size={18} />,
      },
      {
        type: ShapeType.Tetrahedron,
        label: 'Tetrahedron',
        icon: <TbPyramid size={18} />,
      },
    ],
  },
  {
    label: 'Mathematical Shapes',
    icon: <TbMath size={18} />,
    items: [
      {
        type: ShapeType.TorusKnot,
        label: 'Torus Knot',
        icon: <TbMath size={18} />,
      },
      {
        type: ShapeType.Helix,
        label: 'Helix',
        icon: <TbSpiral size={18} />,
      },
      {
        type: ShapeType.MobiusStrip,
        label: 'Möbius Strip',
        icon: <TbMath size={18} />,
      },
    ],
  },
  {
    label: 'Structural',
    icon: <TbBuildingBridge size={18} />,
    items: [
      {
        type: ShapeType.Wall,
        label: 'Wall',
        icon: <TbRectangle size={18} />,
      },
      {
        type: ShapeType.Ramp,
        label: 'Ramp',
        icon: <TbTriangle size={18} />,
      },
      {
        type: ShapeType.Stairs,
        label: 'Stairs',
        icon: <TbBox size={18} />,
      },
      {
        type: ShapeType.SpiralStairs,
        label: 'Spiral Stairs',
        icon: <TbSpiral size={18} />,
      },
    ],
  },
  {
    label: 'Decorative',
    icon: <TbDiamond size={18} />,
    items: [
      {
        type: ShapeType.Star,
        label: 'Star',
        icon: <TbStar size={18} />,
      },
      {
        type: ShapeType.Heart,
        label: 'Heart',
        icon: <TbHeart size={18} />,
      },
      {
        type: ShapeType.Diamond,
        label: 'Diamond',
        icon: <TbDiamond size={18} />,
      },
      {
        type: ShapeType.Cross,
        label: 'Cross',
        icon: <TbPlus size={18} />,
      },
      {
        type: ShapeType.Tube,
        label: 'Tube',
        icon: <TbCylinder size={18} />,
      },
    ],
  },
  {
    label: 'Assets',
    icon: <FiFolder size={18} />,
    items: [
      {
        type: ShapeType.CustomModel,
        label: 'Custom Model...',
        icon: <FiFolder size={18} />,
      },
    ],
  },
];

export const EnhancedAddObjectMenu: React.FC<IEnhancedAddObjectMenuProps> = ({
  anchorRef,
  onAdd,
  onCustomModel,
}) => {
  const open = useEditorStore((s) => s.showAddMenu);
  const setShowAddMenu = useEditorStore((s) => s.setShowAddMenu);

  const handleItemSelect = (item: IMenuItemOption) => {
    if (item.type === 'CustomModel') {
      onCustomModel?.();
      return;
    }

    // Handle all primitive shapes
    const validTypes: ShapeType[] = [
      ShapeType.Cube,
      ShapeType.Sphere,
      ShapeType.Cylinder,
      ShapeType.Cone,
      ShapeType.Torus,
      ShapeType.Plane,
      ShapeType.Wall,
      ShapeType.Trapezoid,
      ShapeType.Octahedron,
      ShapeType.Prism,
      ShapeType.Pyramid,
      ShapeType.Capsule,
      ShapeType.Helix,
      ShapeType.MobiusStrip,
      ShapeType.Dodecahedron,
      ShapeType.Icosahedron,
      ShapeType.Tetrahedron,
      ShapeType.TorusKnot,
      ShapeType.Ramp,
      ShapeType.Stairs,
      ShapeType.SpiralStairs,
      ShapeType.Star,
      ShapeType.Heart,
      ShapeType.Diamond,
      ShapeType.Tube,
      ShapeType.Cross,
    ];
    if (validTypes.includes(item.type as ShapeType)) {
      onAdd(item.type as ShapeType);
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
