import React, { useState } from 'react';
import { Modal } from '@/editor/components/shared/Modal';
import { usePrefabsStore } from '@/editor/store/prefabsStore';
import { FiSearch, FiBox, FiCopy, FiTrash2, FiPlus } from 'react-icons/fi';

export interface IPrefabBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prefabId: string) => void;
  onCreateNew?: () => void;
}

export const PrefabBrowserModal: React.FC<IPrefabBrowserModalProps> = React.memo(
  ({ isOpen, onClose, onSelect, onCreateNew }) => {
    const {
      searchTerm,
      setSearchTerm,
      getFilteredPrefabs,
      duplicatePrefab,
      deletePrefab,
      prefabs,
    } = usePrefabsStore();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Debug logging when modal opens
    React.useEffect(() => {
      if (isOpen) {
        console.log('[PrefabBrowserModal] Modal opened');
        console.log('[PrefabBrowserModal] Prefabs from store:', prefabs);
        console.log('[PrefabBrowserModal] Prefabs count:', prefabs?.length || 0);
      }
    }, [isOpen, prefabs]);

    const filteredPrefabs = getFilteredPrefabs();

    const handleSelect = (prefabId: string) => {
      setSelectedId(prefabId);
    };

    const handleConfirm = () => {
      if (selectedId) {
        onSelect(selectedId);
        onClose();
      }
    };

    const handleDuplicate = async (prefabId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await duplicatePrefab(prefabId);
    };

    const handleDelete = async (prefabId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this prefab?')) {
        await deletePrefab(prefabId);
        if (selectedId === prefabId) {
          setSelectedId(null);
        }
      }
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Select Prefab" size="lg">
        <div className="flex flex-col h-[600px]">
          {/* Search bar */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search prefabs..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                <FiPlus />
                Create New Prefab
              </button>
            )}
          </div>

          {/* Prefab list */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredPrefabs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FiBox size={48} className="mb-4 opacity-50" />
                <p>No prefabs found</p>
                {searchTerm && <p className="text-sm mt-2">Try a different search term</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredPrefabs.map((prefab) => (
                  <div
                    key={prefab.id}
                    onClick={() => handleSelect(prefab.id)}
                    className={`
                      relative p-4 border rounded cursor-pointer transition-all
                      ${
                        selectedId === prefab.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FiBox className="text-blue-400 flex-shrink-0" />
                        <h3 className="font-medium text-gray-100 truncate">{prefab.name}</h3>
                      </div>
                    </div>

                    {prefab.description && (
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {prefab.description}
                      </p>
                    )}

                    {prefab.tags && prefab.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {prefab.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>v{prefab.version}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => handleDuplicate(prefab.id, e)}
                          className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                          title="Duplicate"
                        >
                          <FiCopy size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(prefab.id, e)}
                          className="p-1.5 hover:bg-red-600/20 text-red-400 rounded transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedId}
              className={`px-4 py-2 rounded transition-colors ${
                selectedId
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Select
            </button>
          </div>
        </div>
      </Modal>
    );
  },
);

PrefabBrowserModal.displayName = 'PrefabBrowserModal';
