import React from 'react';

import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { MaterialBrowserModal } from '@/editor/components/materials/MaterialBrowserModal';
import { MaterialCreateModal } from '@/editor/components/materials/MaterialCreateModal';
import { MaterialInspector } from '@/editor/components/materials/MaterialInspector';
import { MaterialPreviewSphere } from '@/editor/components/materials/MaterialPreviewSphere';
import { useMaterials } from '@/editor/components/materials/hooks/useMaterials';
import { Modal } from '@/editor/components/shared/Modal';

export interface IMaterialsPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const MaterialsPanel: React.FC<IMaterialsPanelProps> = ({
  isExpanded,
  onToggle,
}) => {
  const {
    isBrowserOpen,
    isCreateOpen,
    isInspectorOpen,
    openBrowser,
    closeBrowser,
    openCreate,
    closeCreate,
    openInspector,
    closeInspector,
    handleBrowserSelect,
    handleCreate,
    getFilteredMaterials,
    getSelectedMaterial,
  } = useMaterials();

  const handleMaterialSelect = (materialId: string) => {
    handleBrowserSelect(materialId);
  };

  const handleMaterialCreate = (material: IMaterialDefinition) => {
    handleCreate(material);
  };

  const handleMaterialSave = (material: IMaterialDefinition) => {
    // Material is saved in the inspector
    console.log('Material saved:', material);
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <>
      <Modal
        isOpen={isExpanded}
        onClose={onToggle}
        title="Materials"
        maxWidth="w-[500px]"
        maxHeight="max-h-[80vh]"
      >
        {/* Header Actions */}
        <div className="flex justify-end space-x-2 p-4 border-b border-gray-600">
          <button
            onClick={openCreate}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
          >
            New
          </button>
          <button
            onClick={openBrowser}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Browse
          </button>
        </div>

        {/* Materials List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {getFilteredMaterials().map((material: IMaterialDefinition) => (
              <div
                key={material.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${getSelectedMaterial()?.id === material.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                  }`}
                onClick={() => openInspector(material.id)}
              >
                <div className="flex items-center space-x-3">
                  {/* 3D Preview */}
                  <div className="flex-shrink-0">
                    <MaterialPreviewSphere
                      material={material}
                      size={56}
                      showControls={false}
                    />
                  </div>

                  {/* Material Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{material.name}</div>
                    <div className="text-xs text-gray-400 truncate">{material.id}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {material.shader} • {material.materialType}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getFilteredMaterials().length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No materials found. Create your first material!
            </div>
          )}
        </div>
      </Modal>

      {/* Modals */}
      <MaterialBrowserModal
        isOpen={isBrowserOpen}
        onClose={closeBrowser}
        onSelect={handleMaterialSelect}
        selectedMaterialId={getSelectedMaterial()?.id}
      />

      <MaterialCreateModal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        onCreate={handleMaterialCreate}
      />

      <MaterialInspector
        materialId={getSelectedMaterial()?.id || null}
        isOpen={isInspectorOpen}
        onClose={closeInspector}
        onSave={handleMaterialSave}
      />
    </>
  );
};
