import React from 'react';
import { FiFolder, FiSun, FiZap } from 'react-icons/fi';
import {
  TbBox,
  TbBuildingBridge,
  TbCircle,
  TbCone,
  TbCube,
  TbCylinder,
  TbDiamond,
  TbHexagon,
  TbLamp,
  TbMountain,
  TbOctagon,
  TbPyramid,
  TbRectangle,
  TbShape,
  TbSphere,
  TbSquare,
  TbTriangle,
} from 'react-icons/tb';
import { ShapeType } from '@editor/types/shapes';

export interface IGameObjectMenuItem {
  type: ShapeType | string;
  label: string;
  icon?: React.ReactNode;
}

export interface IGameObjectCategory {
  label: string;
  icon?: React.ReactNode;
  items: IGameObjectMenuItem[];
}

export const GAME_OBJECT_CATEGORIES: IGameObjectCategory[] = [
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
    label: 'Structural',
    icon: <TbBuildingBridge size={18} />,
    items: [
      {
        type: ShapeType.Wall,
        label: 'Wall',
        icon: <TbRectangle size={18} />,
      },
    ],
  },
  {
    label: 'Environment',
    icon: <TbTriangle size={18} />,
    items: [
      {
        type: ShapeType.Terrain,
        label: 'Terrain',
        icon: <TbMountain size={18} />,
      },
    ],
  },
  {
    label: 'Lighting',
    icon: <FiSun size={18} />,
    items: [
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
      {
        type: 'SpotLight',
        label: 'Spot Light',
        icon: <TbLamp size={18} />,
      },
      {
        type: 'AmbientLight',
        label: 'Ambient Light',
        icon: <FiSun size={18} />,
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

/**
 * Builds complete game object categories
 * NOTE: Custom shapes are now JSON-based and rendered in Rust
 * No dynamic shape registration needed in TypeScript
 */
export function buildGameObjectCategories(): IGameObjectCategory[] {
  return [...GAME_OBJECT_CATEGORIES];
}
