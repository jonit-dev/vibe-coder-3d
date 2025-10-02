import React from 'react';

import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { MaterialBrowserModal } from '@/editor/components/materials/MaterialBrowserModal';
import { MaterialCreateModal } from '@/editor/components/materials/MaterialCreateModal';
import { MaterialInspector } from '@/editor/components/materials/MaterialInspector';
import { useMaterials } from '@/editor/components/materials/hooks/useMaterials';

export interface IMaterialsPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const MaterialsPanel: React.FC<IMaterialsPanelProps> = ({ isExpanded, onToggle }) => {
  const {
    isCreateOpen,
    isInspectorOpen,
    openCreate,
    closeCreate,
    openInspector,
    closeInspector,
    handleBrowserSelect,
    handleCreate,
    getSelectedMaterial,
  } = useMaterials();

  const handleMaterialSelect = (materialId: string) => {
    handleBrowserSelect(materialId);
  };

  const handleMaterialCreate = (material: IMaterialDefinition) => {
    handleCreate(material);
  };

  const handleMaterialSave = (_material: IMaterialDefinition) => {
    // Material is saved in the inspector
  };

  const handleEdit = (materialId: string) => {
    openInspector(materialId);
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <>
      {/* Main Material Browser */}
      <MaterialBrowserModal
        isOpen={isExpanded}
        onClose={onToggle}
        onSelect={handleMaterialSelect}
        selectedMaterialId={getSelectedMaterial()?.id}
        onEdit={handleEdit}
        onCreate={openCreate}
      />

      {/* Create Modal */}
      <MaterialCreateModal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        onCreate={handleMaterialCreate}
      />

      {/* Inspector Modal */}
      <MaterialInspector
        materialId={getSelectedMaterial()?.id || null}
        isOpen={isInspectorOpen}
        onClose={closeInspector}
        onSave={handleMaterialSave}
      />
    </>
  );
};
