import React, { useCallback, useMemo, useState } from 'react';
import { slugify, generateUniqueId } from '@/core/lib/utils/idGenerator';
import type { IAnimationAsset } from '@/core/animation/assets/defineAnimations';
import { Modal } from '@/editor/components/shared/Modal';
import { useAnimationsStore } from '@/editor/store/animationsStore';

interface IAnimationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (animation: IAnimationAsset) => void;
}

interface IAnimationCreateFormState {
  name: string;
  id: string;
  duration: number;
  loop: boolean;
  timeScale: number;
  tags: string;
  author: string;
  description: string;
}

const INITIAL_FORM_STATE: IAnimationCreateFormState = {
  name: '',
  id: '',
  duration: 1,
  loop: true,
  timeScale: 1,
  tags: '',
  author: '',
  description: '',
};

export const AnimationCreateModal: React.FC<IAnimationCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const store = useAnimationsStore();
  const [form, setForm] = useState<IAnimationCreateFormState>(() => ({ ...INITIAL_FORM_STATE }));
  const [isIdTouched, setIsIdTouched] = useState(false);

  const existingIds = useMemo(() => new Set(store.animations.map((animation) => animation.id)), [
    store.animations,
  ]);

  const resetForm = useCallback(() => {
    setForm({ ...INITIAL_FORM_STATE });
    setIsIdTouched(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleNameChange = useCallback(
    (value: string) => {
      setForm((prev) => {
        const nextState = { ...prev, name: value };
        if (!isIdTouched) {
          const slug = slugify(value);
          const uniqueId = generateUniqueId(slug, (id) => existingIds.has(id));
          nextState.id = uniqueId;
        }
        return nextState;
      });
    },
    [isIdTouched, existingIds],
  );

  const handleIdChange = useCallback((value: string) => {
    setIsIdTouched(true);
    setForm((prev) => ({ ...prev, id: value }));
  }, []);

  const handleDurationChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      duration: Math.max(0.01, parseFloat(value) || 0),
    }));
  }, []);

  const handleTimeScaleChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      timeScale: Math.max(0.01, parseFloat(value) || 0),
    }));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!form.name.trim() || !form.id.trim()) {
      return;
    }

    const newAnimation: IAnimationAsset = {
      id: form.id.trim(),
      name: form.name.trim(),
      duration: form.duration,
      loop: form.loop,
      timeScale: form.timeScale,
      tracks: [],
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      author: form.author.trim() || undefined,
      description: form.description.trim() || undefined,
    };

    try {
      await store.createAnimation(newAnimation);
      onCreate(newAnimation);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create animation:', error);
      window.alert('Failed to create animation. Please try again.');
    }
  }, [form, onCreate, onClose, resetForm, store]);

  const isSubmitDisabled = !form.name.trim() || !form.id.trim() || form.duration <= 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Animation" size="lg">
      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Enter animation name"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</label>
            <input
              type="text"
              value={form.id}
              onChange={(event) => handleIdChange(event.target.value)}
              placeholder="animation-id"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration (s)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.duration}
              onChange={(event) => handleDurationChange(event.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Time Scale</label>
            <input
              type="number"
              step="0.1"
              min="0.01"
              value={form.timeScale}
              onChange={(event) => handleTimeScaleChange(event.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="flex flex-col justify-end space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Loop</label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-200">
              <input
                type="checkbox"
                checked={form.loop}
                onChange={(event) => setForm((prev) => ({ ...prev, loop: event.target.checked }))}
                className="w-4 h-4 rounded bg-gray-900 border border-gray-600"
              />
              <span>Loop playback</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="locomotion, hero, fast"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500">Comma-separated tags help you filter later.</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Author</label>
            <input
              type="text"
              value={form.author}
              onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))}
              placeholder="Your name (optional)"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={2}
              placeholder="Document what this animation is used for..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-900 border border-gray-600 rounded hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isSubmitDisabled}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-500 disabled:bg-purple-400 transition-colors"
          >
            Create Animation
          </button>
        </div>
      </div>
    </Modal>
  );
};
