import React, { useMemo, useState } from 'react';
import { FiCopy, FiEdit, FiFilm, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';

import type { IAnimationAsset } from '@core/animation/assets/defineAnimations';
import { Modal } from '@editor/components/shared/Modal';
import { useAnimationsStore } from '@editor/store/animationsStore';

export interface IAnimationBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (animationId: string) => void;
  selectedAnimationId?: string | null;
  onCreate?: () => void;
  onEdit?: (animationId: string) => void;
}

export const AnimationBrowserModal: React.FC<IAnimationBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedAnimationId,
  onCreate,
  onEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const store = useAnimationsStore();

  const animations = useMemo(() => {
    const allAnimations = store.animations;
    return allAnimations.filter(
      (animation) =>
        animation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (animation.tags && animation.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))),
    );
  }, [searchTerm, store.animations]);

  const handleAnimationClick = (animationId: string) => {
    onSelect(animationId);
    onClose();
  };

  const handleDuplicate = async (animationId: string) => {
    try {
      const duplicate = await store.duplicateAnimation(animationId);
      onSelect(duplicate.id);
      onClose();
    } catch (error) {
      console.error('Failed to duplicate animation:', error);
      alert('Failed to duplicate animation');
    }
  };

  const handleDelete = async (animationId: string) => {
    if (confirm('Are you sure you want to delete this animation?')) {
      try {
        await store.deleteAnimation(animationId);
      } catch (error) {
        console.error('Failed to delete animation:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete animation');
      }
    }
  };

  const renderAnimationItem = (animation: IAnimationAsset) => {
    const isSelected = selectedAnimationId === animation.id;

    return (
      <div
        key={animation.id}
        className={`flex items-center gap-3 p-3 border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-colors ${
          isSelected ? 'bg-purple-500/10' : ''
        }`}
        onClick={() => handleAnimationClick(animation.id)}
      >
        {/* Animation Icon */}
        <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
          <FiFilm size={24} className={isSelected ? 'text-purple-400' : 'text-gray-500'} />
        </div>

        {/* Animation Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white text-sm truncate">{animation.name}</div>
          <div className="text-xs text-gray-400 truncate">{animation.id}</div>
          <div className="text-xs text-gray-500 mt-1">
            {animation.duration.toFixed(1)}s • {animation.tracks.length} tracks
            {animation.tags && animation.tags.length > 0 && (
              <span className="ml-2">
                {animation.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="ml-1 px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">
                    {tag}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(animation.id);
              }}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
              title="Edit"
            >
              <FiEdit size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate(animation.id);
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Duplicate"
          >
            <FiCopy size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(animation.id);
            }}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
            title="Delete"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Animation Browser"
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
              placeholder="Search animations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {onCreate && (
            <button
              onClick={onCreate}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center space-x-2"
            >
              <FiPlus size={16} />
              <span>Create</span>
            </button>
          )}
        </div>

        {/* Animation list */}
        <div className="flex-1 overflow-y-auto border border-gray-700 rounded">
          {animations.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <FiFilm size={48} className="mx-auto mb-4 opacity-50" />
              <div className="text-lg mb-2">No animations found</div>
              {searchTerm && <div className="text-sm">Try a different search term</div>}
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {animations.map(renderAnimationItem)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-600 mt-4">
          <div className="text-sm text-gray-400">
            {animations.length} animation{animations.length !== 1 ? 's' : ''}
          </div>

          <button
            onClick={onClose}
            className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
