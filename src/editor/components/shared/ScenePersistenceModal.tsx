import React, { useState, useEffect } from 'react';
import { FiSave, FiFolder, FiTrash2, FiClock, FiHardDrive } from 'react-icons/fi';
import { Modal } from './Modal';
import type { ISceneFileInfo } from '@/editor/hooks/useScenePersistence';

export interface IScenePersistenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
  availableScenes: ISceneFileInfo[];
  isLoading: boolean;
  error: string | null;
  onSave: (sceneName: string, format?: 'json' | 'tsx') => Promise<void>;
  onLoad: (sceneName: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const ScenePersistenceModal: React.FC<IScenePersistenceModalProps> = ({
  isOpen,
  onClose,
  mode,
  availableScenes,
  isLoading,
  error,
  onSave,
  onLoad,
  onRefresh,
}) => {
  const [sceneName, setSceneName] = useState('');
  const [saveFormat, setSaveFormat] = useState<'json' | 'tsx'>('tsx');
  const [selectedScene, setSelectedScene] = useState<string>('');

  useEffect(() => {
    if (isOpen && mode === 'load') {
      onRefresh();
    }
  }, [isOpen, mode, onRefresh]);

  useEffect(() => {
    if (!isOpen) {
      setSceneName('');
      setSelectedScene('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!sceneName.trim()) return;
    await onSave(sceneName.trim(), saveFormat);
    onClose();
  };

  const handleLoad = async () => {
    if (!selectedScene) return;
    await onLoad(selectedScene);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'save' ? 'Save Scene' : 'Load Scene'}
      maxWidth="w-[500px]"
      maxHeight="max-h-[600px]"
    >
      <div className="p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        {mode === 'save' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Scene Name
            </label>
            <input
              type="text"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              placeholder="Enter scene name..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && sceneName.trim()) {
                  handleSave();
                }
              }}
            />

            <div>
              <div className="px-3 py-2 bg-purple-900/20 border border-purple-700/50 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 text-xs rounded font-mono bg-purple-900/30 text-purple-300 border border-purple-700">
                    TSX
                  </span>
                  <span className="text-sm text-gray-300">TypeScript React Component</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Creates a reusable React component with type safety, IDE support, and better version control
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!sceneName.trim() || isLoading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white text-sm rounded flex items-center space-x-2"
              >
                <FiSave className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save as TSX'}</span>
              </button>
            </div>
          </div>
        )}

        {mode === 'load' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-300">
                Available Scenes
              </label>
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 disabled:text-gray-500"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {availableScenes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FiFolder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No scenes found</p>
                <p className="text-xs mt-1">Save a scene to get started</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {availableScenes.map((scene) => (
                  <div
                    key={scene.name}
                    onClick={() => setSelectedScene(scene.name)}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedScene === scene.name
                        ? 'bg-cyan-900/30 border-cyan-600 text-cyan-300'
                        : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium truncate">
                            {scene.name.replace(/\.(json|tsx)$/, '')}
                          </p>
                          {scene.type && (
                            <span className={`px-1.5 py-0.5 text-xs rounded font-mono ${
                              scene.type === 'tsx'
                                ? 'bg-purple-900/30 text-purple-300 border border-purple-700'
                                : 'bg-blue-900/30 text-blue-300 border border-blue-700'
                            }`}>
                              {scene.type.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs opacity-75">
                          <span className="flex items-center space-x-1">
                            <FiClock className="w-3 h-3" />
                            <span>{formatDate(scene.modified)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FiHardDrive className="w-3 h-3" />
                            <span>{formatFileSize(scene.size)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleLoad}
                disabled={!selectedScene || isLoading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white text-sm rounded flex items-center space-x-2"
              >
                <FiFolder className="w-4 h-4" />
                <span>{isLoading ? 'Loading...' : 'Load Scene'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};