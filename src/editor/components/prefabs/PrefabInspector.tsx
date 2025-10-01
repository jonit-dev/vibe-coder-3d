import React from 'react';
import { usePrefabsStore } from '@/editor/store/prefabsStore';
import { usePrefabs } from './hooks/usePrefabs';
import { FiBox, FiLayers, FiTag, FiPackage } from 'react-icons/fi';

export interface IPrefabInspectorProps {
  prefabId: string;
}

export const PrefabInspector: React.FC<IPrefabInspectorProps> = React.memo(({ prefabId }) => {
  const prefab = usePrefabsStore((state) => state.registry.get(prefabId));
  const { instantiate } = usePrefabs();

  if (!prefab) {
    return (
      <div className="p-4 text-center text-gray-400">
        <FiBox size={48} className="mx-auto mb-2 opacity-50" />
        <p>Prefab not found</p>
      </div>
    );
  }

  const handleInstantiate = () => {
    instantiate(prefab.id);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
        <FiBox className="text-blue-400" size={24} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-100">{prefab.name}</h2>
          <p className="text-sm text-gray-400">v{prefab.version}</p>
        </div>
      </div>

      {/* Description */}
      {prefab.description && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Description</h3>
          <p className="text-sm text-gray-400">{prefab.description}</p>
        </div>
      )}

      {/* Tags */}
      {prefab.tags && prefab.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <FiTag size={14} />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {prefab.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dependencies */}
      {prefab.dependencies && prefab.dependencies.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <FiLayers size={14} />
            Dependencies
          </h3>
          <div className="space-y-1">
            {prefab.dependencies.map((dep) => (
              <div key={dep} className="text-sm text-gray-400 pl-4">
                • {dep}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          <FiPackage size={14} />
          Details
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">ID:</span>
            <span className="text-gray-300 font-mono">{prefab.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Version:</span>
            <span className="text-gray-300">{prefab.version}</span>
          </div>
          {prefab.metadata?.createdAt && typeof prefab.metadata.createdAt === 'string' ? (
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="text-gray-300">
                {new Date(prefab.metadata.createdAt as string).toLocaleDateString()}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={handleInstantiate}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-2"
        >
          <FiBox />
          Instantiate in Scene
        </button>
      </div>
    </div>
  );
});

PrefabInspector.displayName = 'PrefabInspector';
