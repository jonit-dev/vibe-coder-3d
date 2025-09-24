import React, { useCallback, useEffect, useState } from 'react';
import { FiChevronDown, FiFile, FiFolder, FiPlus } from 'react-icons/fi';

import { loadScene, sceneRegistry } from '@/core/lib/scene/SceneRegistry';
import { ISceneDefinition } from '@/core/lib/scene/SceneRegistry';
import { registerAllScenes } from '@/core/lib/scene/scenes';
import { useProjectToasts, useToastStore } from '@/core/stores/toastStore';

interface ISceneSelectorProps {
  className?: string;
}

export const SceneSelector: React.FC<ISceneSelectorProps> = ({ className = '' }) => {
  const [scenes, setScenes] = useState<ISceneDefinition[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const projectToasts = useProjectToasts();
  const { removeToast } = useToastStore();

  const refreshScenes = useCallback(() => {
    const availableScenes = sceneRegistry.listScenes();
    setScenes(availableScenes);

    const current = sceneRegistry.getCurrentSceneId();
    setCurrentSceneId(current);
  }, []);

  useEffect(() => {
    // Ensure scenes are registered first
    if (sceneRegistry.listScenes().length === 0) {
      registerAllScenes();
    }

    // Get list of available scenes
    refreshScenes();
  }, [refreshScenes]);

  const handleSceneSelect = async (sceneId: string) => {
    if (sceneId === currentSceneId) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const loadingToastId = projectToasts.showOperationStart(`Loading scene: ${sceneId}`);

    try {
      // Clear saved scene from localStorage when switching scenes
      localStorage.removeItem('editorScene');

      await loadScene(sceneId, true);
      setCurrentSceneId(sceneId);
      refreshScenes(); // Refresh to update current scene

      // Remove loading toast and show success
      removeToast(loadingToastId);
      projectToasts.showOperationSuccess(`Scene loaded: ${sceneId}`);
    } catch (error) {
      console.error('Failed to load scene:', error);
      removeToast(loadingToastId);
      projectToasts.showOperationError(`Failed to load scene: ${error}`);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const currentScene = scenes.find((s) => s.id === currentSceneId);

  const handleDropdownToggle = () => {
    if (!isOpen) {
      // Refresh scenes when opening dropdown
      refreshScenes();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleDropdownToggle}
        disabled={isLoading}
        className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-sm text-gray-200 transition-colors"
        title="Select Scene"
      >
        <FiFolder className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-medium">
          {isLoading ? 'Loading...' : currentScene?.name || 'No Scene'}
        </span>
        <FiChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !isLoading && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-2 border-b border-gray-700">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Available Scenes
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {scenes.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No scenes available</div>
            ) : (
              <div className="p-1">
                {scenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => handleSceneSelect(scene.id)}
                    className={`w-full text-left px-3 py-2 rounded flex items-start space-x-2 transition-colors ${
                      scene.id === currentSceneId
                        ? 'bg-cyan-900/30 text-cyan-300'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <FiFile className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{scene.name}</div>
                      {scene.description && (
                        <div className="text-xs text-gray-500 mt-0.5">{scene.description}</div>
                      )}
                      {scene.metadata?.tags && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {scene.metadata.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {scene.id === currentSceneId && (
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-700">
            <button
              className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/50 text-purple-300 rounded text-sm transition-colors"
              onClick={() => {
                setIsOpen(false);
                // TODO: Implement new scene creation
                projectToasts.showInfo('Scene creation coming soon!');
              }}
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>Create New Scene</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
