import { Logger } from '@/core/lib/logger';
import { Modal } from '@/editor/components/shared/Modal';
import React, { useState } from 'react';
import { FiAlertCircle, FiBox } from 'react-icons/fi';
import { usePrefabs } from './hooks/usePrefabs';

const logger = Logger.create('PrefabCreateModal');

export interface IPrefabCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (prefabId: string) => void;
}

export const PrefabCreateModal: React.FC<IPrefabCreateModalProps> = React.memo(
  ({ isOpen, onClose, onCreated }) => {
    const { createFromSelection, replaceSelectionWithPrefab } = usePrefabs();
    const [name, setName] = useState('');
    const [id, setId] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleCreate = () => {
      logger.debug('Create button clicked', { name: name.trim(), id: id.trim() });

      if (!name.trim()) {
        setError('Prefab name is required');
        return;
      }

      try {
        logger.debug('Calling createFromSelection');
        const prefab = createFromSelection({ name: name.trim(), id: id.trim() || undefined });

        if (prefab) {
          logger.info('Prefab created successfully', {
            prefabId: prefab.id,
            prefabName: prefab.name,
          });
          // Immediately replace current selection with an instance of the new prefab
          try {
            replaceSelectionWithPrefab(prefab.id);
            logger.info('Replaced selection with prefab instance', { prefabId: prefab.id });
          } catch (e) {
            logger.error('Failed to replace selection with prefab instance', e);
          }
          onCreated?.(prefab.id);
          onClose();
          setName('');
          setId('');
          setError(null);
        } else {
          logger.error('createFromSelection returned null');
          setError('Failed to create prefab. Make sure an entity is selected.');
        }
      } catch (err) {
        logger.error('Exception creating prefab:', err);
        setError(err instanceof Error ? err.message : 'Failed to create prefab');
      }
    };

    const handleClose = () => {
      setName('');
      setId('');
      setError(null);
      onClose();
    };

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Create Prefab" size="md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
            <FiBox className="text-blue-400 flex-shrink-0" size={24} />
            <p className="text-sm text-gray-300">
              Create a reusable prefab from the selected entities and their children.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
              <FiAlertCircle className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prefab Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Prefab"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prefab ID <span className="text-sm text-gray-500">(optional)</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="my-prefab (auto-generated if empty)"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to auto-generate. Use lowercase letters, numbers, and hyphens only.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className={`px-4 py-2 rounded transition-colors ${
                name.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Create Prefab
            </button>
          </div>
        </div>
      </Modal>
    );
  },
);

PrefabCreateModal.displayName = 'PrefabCreateModal';
