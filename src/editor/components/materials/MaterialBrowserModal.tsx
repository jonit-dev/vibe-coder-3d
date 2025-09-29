import React, { useMemo, useState } from 'react';
import { FiCopy, FiEdit, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';

import type { IMaterialDefinition } from '@/core/materials/Material.types';
import { Modal } from '@/editor/components/shared/Modal';
import { MaterialPreviewSphere } from './MaterialPreviewSphere';
import { useMaterialsStore } from '@/editor/store/materialsStore';

export interface IMaterialBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (materialId: string) => void;
  selectedMaterialId?: string | null;
  allowMultiSelect?: boolean;
  onEdit?: (materialId: string) => void;
  onCreate?: () => void;
}

export const MaterialBrowserModal: React.FC<IMaterialBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedMaterialId,
  allowMultiSelect = false,
  onEdit,
  onCreate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const store = useMaterialsStore();

  const materials = useMemo(() => {
    const allMaterials = store.materials;
    return allMaterials.filter(
      (material) =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, store.materials]);

  const handleMaterialClick = (materialId: string) => {
    if (allowMultiSelect) {
      const newSelected = new Set(selectedMaterials);
      if (newSelected.has(materialId)) {
        newSelected.delete(materialId);
      } else {
        newSelected.add(materialId);
      }
      setSelectedMaterials(newSelected);
    } else {
      onSelect(materialId);
      onClose();
    }
  };

  const handleDuplicate = async (materialId: string) => {
    try {
      const duplicate = await store.duplicateMaterial(materialId);
      // Auto-select the duplicate
      onSelect(duplicate.id);
      onClose();
    } catch (error) {
      console.error('Failed to duplicate material:', error);
      alert('Failed to duplicate material');
    }
  };

  const handleDelete = async (materialId: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      try {
        await store.deleteMaterial(materialId);
        // If this was the selected material, clear selection
        if (selectedMaterialId === materialId) {
          onSelect('default');
        }
      } catch (error) {
        console.error('Failed to delete material:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete material');
      }
    }
  };

  const handleConfirmSelection = () => {
    if (allowMultiSelect && selectedMaterials.size > 0) {
      // For now, just select the first one. In the future, this could return multiple IDs
      const firstSelected = selectedMaterials.values().next().value;
      if (firstSelected) {
        onSelect(firstSelected);
      }
    }
    onClose();
  };

  const renderMaterialItem = (material: IMaterialDefinition) => {
    const isSelected =
      selectedMaterialId === material.id ||
      (allowMultiSelect && selectedMaterials.has(material.id));

    return (
      <div
        key={material.id}
        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-blue-500 bg-blue-500/10 shadow-lg'
            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 hover:shadow-md'
        }`}
        onClick={() => handleMaterialClick(material.id)}
      >
        {/* 3D Preview Sphere */}
        <div className="flex justify-center mb-3">
          <MaterialPreviewSphere
            material={material}
            size={90}
            showControls={false}
            className="shadow-sm"
          />
        </div>

        {/* Material Info */}
        <div className="space-y-2">
          <div className="text-center">
            <div className="font-medium text-white text-sm truncate">{material.name}</div>
            <div className="text-xs text-gray-400 truncate">{material.id}</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {material.shader} • {material.materialType}
            </div>

            <div className="flex items-center space-x-1">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(material.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded transition-colors"
                  title="Edit"
                >
                  <FiEdit size={12} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate(material.id);
                }}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                title="Duplicate"
              >
                <FiCopy size={12} />
              </button>
              {material.id !== 'default' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(material.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                  title="Delete"
                >
                  <FiTrash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={allowMultiSelect ? 'Select Materials' : 'Select Material'}
      size="xl"
      maxHeight="max-h-[85vh]"
    >
      <div className="flex flex-col h-full p-4">
        {/* Search and controls */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1 relative">
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              if (onCreate) {
                onCreate();
              } else {
                onClose();
              }
            }}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center space-x-2"
          >
            <FiPlus size={16} />
            <span>Create</span>
          </button>
        </div>

        {/* Material list */}
        <div className="flex-1 overflow-y-auto bg-gray-900/30 rounded-lg p-3 border border-gray-700">
          <div className="grid grid-cols-3 gap-4">{materials.map(renderMaterialItem)}</div>

          {materials.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <div className="text-lg mb-2">No materials found</div>
              {searchTerm && <div className="text-sm">Try a different search term</div>}
            </div>
          )}

          {/* Show helpful message when only default material exists */}
          {materials.length === 1 && materials[0].id === 'default' && !searchTerm && (
            <div className="text-center text-gray-400 py-8 border border-dashed border-gray-600 rounded-lg mt-4">
              <div className="text-sm mb-2">💡 Only the default material exists</div>
              <div className="text-xs text-gray-500">Click "Create" to add custom materials</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-600 mt-4">
          <div className="text-sm text-gray-400">
            {materials.length} material{materials.length !== 1 ? 's' : ''}
            {allowMultiSelect && selectedMaterials.size > 0 && (
              <span> • {selectedMaterials.size} selected</span>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              Cancel
            </button>

            {allowMultiSelect && selectedMaterials.size > 0 && (
              <button
                onClick={handleConfirmSelection}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Select ({selectedMaterials.size})
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
