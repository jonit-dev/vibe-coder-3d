import React from 'react';
import { FiFolder, FiSun, FiZap } from 'react-icons/fi';
import {
  TbBox,
  TbBoxMultiple,
  TbBuildingBridge,
  TbCircle,
  TbCone,
  TbCube,
  TbCylinder,
  TbDiamond,
  TbHeart,
  TbHexagon,
  TbLamp,
  TbMath,
  TbMountain,
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
import { ShapeType } from '@editor/types/shapes';
import type { ICustomShapeDescriptor } from '@/core/lib/rendering/shapes/IShapeDescriptor';

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
    label: 'Environment',
    icon: <TbTriangle size={18} />,
    items: [
      {
        type: ShapeType.Terrain,
        label: 'Terrain',
        icon: <TbMountain size={18} />,
      },
      {
        type: ShapeType.Tree,
        label: 'Tree',
        icon: <TbTriangle size={18} />,
      },
      {
        type: ShapeType.Rock,
        label: 'Rock',
        icon: <TbBox size={18} />,
      },
      {
        type: ShapeType.Bush,
        label: 'Bush',
        icon: <TbSphere size={18} />,
      },
      {
        type: ShapeType.Grass,
        label: 'Grass',
        icon: <TbTriangle size={18} />,
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
 * Builds a Custom Shapes category from registered shapes
 * Used to dynamically generate menu items for custom shapes
 */
export function buildCustomShapesCategory(
  customShapes: Array<ICustomShapeDescriptor<any>>,
): IGameObjectCategory | null {
  if (customShapes.length === 0) {
    return null;
  }

  return {
    label: 'Custom Shapes',
    icon: <TbBoxMultiple size={18} />,
    items: customShapes.map((shape) => ({
      type: `customShape:${shape.meta.id}`,
      label: shape.meta.name,
      icon: <TbBoxMultiple size={18} />,
    })),
  };
}

/**
 * Builds complete game object categories including custom shapes
 * @param customShapes - Array of registered custom shape descriptors
 * @returns All game object categories with custom shapes appended
 */
export function buildGameObjectCategories(
  customShapes: Array<ICustomShapeDescriptor<any>>,
): IGameObjectCategory[] {
  const categories = [...GAME_OBJECT_CATEGORIES];

  const customShapesCategory = buildCustomShapesCategory(customShapes);
  if (customShapesCategory) {
    // Insert custom shapes before Assets category
    const assetsIndex = categories.findIndex((cat) => cat.label === 'Assets');
    if (assetsIndex !== -1) {
      categories.splice(assetsIndex, 0, customShapesCategory);
    } else {
      categories.push(customShapesCategory);
    }
  }

  return categories;
}
