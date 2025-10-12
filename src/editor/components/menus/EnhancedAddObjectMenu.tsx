import React, { useState, useMemo } from 'react';
import { TbBoxMultiple } from 'react-icons/tb';
import { useEditorStore } from '@editor/store/editorStore';
import { ShapeType } from '@editor/types/shapes';
import { TerrainWizard } from '@editor/components/terrain/TerrainWizard';
import { useEntityCreation } from '@editor/hooks/useEntityCreation';
import { useCustomShapes } from '@editor/hooks/useDynamicShapes';
import { GAME_OBJECT_CATEGORIES } from '@editor/config/gameObjectMenuData';
import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { IMenuCategory, IMenuItemOption, NestedDropdownMenu } from './NestedDropdownMenu';

export interface IEnhancedAddObjectMenuProps {
  anchorRef: React.RefObject<HTMLElement>;
  onAdd: (type: ShapeType | string) => void;
  onCustomModel?: () => void;
}

// Convert shared data to NestedDropdownMenu format
function buildObjectCategories(customShapes: any[]): IMenuCategory[] {
  const baseCategories: IMenuCategory[] = GAME_OBJECT_CATEGORIES.map((category) => ({
    label: category.label,
    icon: category.icon,
    items: category.items.map((item) => ({
      type: item.type,
      label: item.label,
      icon: item.icon,
    })),
  }));

  // Add Custom Shapes category if there are any registered shapes
  if (customShapes.length > 0) {
    const customShapesCategory: IMenuCategory = {
      label: 'Custom Shapes',
      icon: <TbBoxMultiple size={18} />,
      items: customShapes.map((shape) => ({
        type: `customShape:${shape.meta.id}`,
        label: shape.meta.name,
        icon: <TbBoxMultiple size={18} />,
      })),
    };
    baseCategories.push(customShapesCategory);
  }

  return baseCategories;
}

export const EnhancedAddObjectMenu: React.FC<IEnhancedAddObjectMenuProps> = ({
  anchorRef,
  onAdd,
  onCustomModel,
}) => {
  const open = useEditorStore((s) => s.showAddMenu);
  const setShowAddMenu = useEditorStore((s) => s.setShowAddMenu);
  const [showTerrainWizard, setShowTerrainWizard] = useState(false);

  const { createTerrain, createCustomShape } = useEntityCreation();
  const customShapes = useCustomShapes();

  // Build categories dynamically including custom shapes
  const objectCategories = useMemo(() => buildObjectCategories(customShapes), [customShapes]);

  const handleItemSelect = (item: IMenuItemOption) => {
    // Handle custom shapes
    if (item.type.startsWith('customShape:')) {
      const shapeId = item.type.replace('customShape:', '');
      createCustomShape(shapeId);
      setShowAddMenu(false);
      return;
    }

    if (item.type === 'CustomModel') {
      onCustomModel?.();
      return;
    }

    // Special handling for Terrain - show wizard
    if (item.type === ShapeType.Terrain) {
      setShowTerrainWizard(true);
      setShowAddMenu(false);
      return;
    }

    // Handle light types
    const lightTypes = ['DirectionalLight', 'PointLight', 'SpotLight', 'AmbientLight'];
    if (lightTypes.includes(item.type as string)) {
      onAdd(item.type as string);
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
      ShapeType.Terrain,
      ShapeType.Tree,
      ShapeType.Rock,
      ShapeType.Bush,
      ShapeType.Grass,
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
      // You could show a toast notification here
    }
  };

  const handleTerrainWizardComplete = (terrainConfig: Partial<TerrainData>) => {
    createTerrain(undefined, undefined, terrainConfig);
    setShowTerrainWizard(false);
  };

  const handleTerrainWizardCancel = () => {
    setShowTerrainWizard(false);
  };

  // Render terrain wizard modal
  if (showTerrainWizard) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <TerrainWizard
          onComplete={handleTerrainWizardComplete}
          onCancel={handleTerrainWizardCancel}
        />
      </div>
    );
  }

  return (
    <NestedDropdownMenu
      anchorRef={anchorRef}
      open={open}
      onClose={() => setShowAddMenu(false)}
      onItemSelect={handleItemSelect}
      categories={objectCategories}
    />
  );
};
