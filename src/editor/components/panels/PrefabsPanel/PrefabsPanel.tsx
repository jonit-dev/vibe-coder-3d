import React from 'react';
import { usePrefabsStore } from '@/editor/store/prefabsStore';
import { usePrefabs } from '@/editor/components/prefabs/hooks/usePrefabs';
import { PrefabBrowserModal } from '@/editor/components/prefabs/PrefabBrowserModal';
import { PrefabCreateModal } from '@/editor/components/prefabs/PrefabCreateModal';
import { PrefabInspector } from '@/editor/components/prefabs/PrefabInspector';
import { FiBox, FiPlus, FiSearch } from 'react-icons/fi';

export const PrefabsPanel: React.FC = React.memo(() => {
  const {
    prefabs,
    selectedPrefabId,
    setSelectedPrefab,
    isBrowserOpen,
    isCreateOpen,
    searchTerm,
    setSearchTerm,
    getFilteredPrefabs,
  } = usePrefabsStore();

  const { instantiate, closeBrowser, openCreate, closeCreate } = usePrefabs();

  const filteredPrefabs = getFilteredPrefabs();

  const handleSelectPrefab = (prefabId: string) => {
    setSelectedPrefab(prefabId);
  };

  const handleInstantiate = (prefabId: string) => {
    instantiate(prefabId);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <FiBox />
            Prefabs
          </h2>
          <button
            onClick={openCreate}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            title="Create Prefab"
          >
            <FiPlus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={14}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prefabs..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Prefab List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredPrefabs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FiBox size={48} className="mb-4 opacity-50" />
            <p className="text-sm">No prefabs found</p>
            {prefabs.length === 0 ? (
              <button
                onClick={openCreate}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                Create your first prefab
              </button>
            ) : (
              <p className="text-xs mt-2">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredPrefabs.map((prefab) => (
              <div
                key={prefab.id}
                onClick={() => handleSelectPrefab(prefab.id)}
                onDoubleClick={() => handleInstantiate(prefab.id)}
                className={`
                  p-2 rounded cursor-pointer transition-colors
                  ${
                    selectedPrefabId === prefab.id
                      ? 'bg-blue-500/20 border border-blue-500/50'
                      : 'hover:bg-gray-800 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <FiBox className="text-blue-400 flex-shrink-0" size={14} />
                  <span className="text-sm text-gray-100 truncate">{prefab.name}</span>
                </div>
                {prefab.description && (
                  <p className="text-xs text-gray-500 mt-1 ml-6 truncate">{prefab.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspector */}
      {selectedPrefabId && (
        <div className="border-t border-gray-700 max-h-[50%] overflow-y-auto">
          <PrefabInspector prefabId={selectedPrefabId} />
        </div>
      )}

      {/* Modals */}
      <PrefabBrowserModal
        isOpen={isBrowserOpen}
        onClose={closeBrowser}
        onSelect={handleInstantiate}
        onCreateNew={openCreate}
      />

      <PrefabCreateModal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        onCreated={(prefabId) => setSelectedPrefab(prefabId)}
      />
    </div>
  );
});

PrefabsPanel.displayName = 'PrefabsPanel';
