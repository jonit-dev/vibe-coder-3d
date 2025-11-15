import React, { useState } from 'react';
import { FiEdit, FiFilm } from 'react-icons/fi';
import type { IAnimationComponent, IClipBinding } from '@core/components/animation/AnimationComponent';
import type { IAnimationAsset } from '@core/animation/assets/defineAnimations';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import { GenericComponentSection } from '@editor/components/shared/GenericComponentSection';
import { CollapsibleSection } from '@editor/components/shared/CollapsibleSection';
import { AnimationBrowserModal } from '@editor/components/animations/AnimationBrowserModal';
import { AnimationCreateModal } from '@editor/components/animations/AnimationCreateModal';
import { useAnimationsStore } from '@editor/store/animationsStore';
import { useTimelineStore } from '@editor/store/timelineStore';

interface IAnimationSectionProps {
  animation: IAnimationComponent;
  setAnimation: (animation: IAnimationComponent | null) => void;
  entityId: number;
  onRemove?: () => void;
}

export const AnimationSection: React.FC<IAnimationSectionProps> = ({
  animation,
  setAnimation,
  entityId,
  onRemove,
}) => {
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const animationsStore = useAnimationsStore();
  const clipBindings = animation.clipBindings || [];
  const { setIsOpen, setActiveEntity } = useTimelineStore();

  const handleAddClipBinding = (animationId: string) => {
    const newBinding: IClipBinding = {
      bindingId: `binding_${animationId}_${Date.now()}`,
      clipId: animationId,
      assetRef: `@/animations/${animationId}`,
    };

    const updatedAnimation: IAnimationComponent = {
      ...animation,
      clipBindings: [...clipBindings, newBinding],
      // Don't auto-activate - let user choose when to activate
      activeBindingId: animation.activeBindingId,
    };

    setAnimation(updatedAnimation);
  };

  const handleRemoveClipBinding = (bindingId: string) => {
    const updatedBindings = clipBindings.filter((b) => b.bindingId !== bindingId);
    const updatedAnimation: IAnimationComponent = {
      ...animation,
      clipBindings: updatedBindings,
      activeBindingId:
        animation.activeBindingId === bindingId
          ? updatedBindings[0]?.clipId
          : animation.activeBindingId,
    };

    setAnimation(updatedAnimation);
  };

  const handleSetActiveBinding = (clipId: string) => {
    const updatedAnimation: IAnimationComponent = {
      ...animation,
      activeBindingId: clipId,
    };

    setAnimation(updatedAnimation);
  };

  const handleEditTimeline = (clipId: string) => {
    if (entityId == null) {
      console.warn('[AnimationSection] Cannot open timeline without entity', { entityId });
      return;
    }

    const clipAsset = animationsStore.getAnimationById(clipId);
    if (!clipAsset) {
      window.alert('Animation clip data is not loaded yet. Please ensure the asset exists.');
      return;
    }

    setActiveEntity(entityId, clipAsset);
    setIsOpen(true);
  };

  const handleCreateModalOpen = () => {
    setIsBrowserOpen(false);
    setIsCreateOpen(true);
  };

  const handleAnimationCreated = (animation: IAnimationAsset) => {
    handleAddClipBinding(animation.id);
    handleEditTimeline(animation.id);
  };

  // Clean up inconsistent state (activeBindingId without corresponding clipBinding)
  React.useEffect(() => {
    if (animation.activeBindingId && !clipBindings.some(b => b.clipId === animation.activeBindingId)) {
      // Remove orphaned activeBindingId
      setAnimation({
        ...animation,
        activeBindingId: undefined,
        playing: false,
      });
    }
  }, [animation, clipBindings, setAnimation]);

  
  return (
    <>
      <GenericComponentSection
        title="Animation"
        icon={<FiFilm />}
        headerColor="purple"
        componentId={KnownComponentTypes.ANIMATION}
        onRemove={onRemove}
      >
        <CollapsibleSection
          title="Animation Clips"
          icon={<FiFilm />}
          defaultExpanded={true}
          badge={clipBindings.length > 0 ? `${clipBindings.length}` : undefined}
        >
          {clipBindings.length === 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 text-center py-2">
                No animations assigned
              </div>
              <button
                onClick={() => setIsBrowserOpen(true)}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex items-center justify-center gap-1"
              >
                <span>+ Add Animation Clip</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Animation Clips List */}
              {clipBindings.map((binding, index) => {
                const animAsset = animationsStore.getAnimationById(binding.clipId);
                const isActive = animation.activeBindingId === binding.clipId;
                return (
                  <div
                    key={binding.bindingId}
                    className={`flex items-center gap-2 p-2 rounded ${
                      isActive ? 'bg-purple-500/20 border border-purple-500/50' : 'bg-gray-800'
                    }`}
                  >
                    <span className="text-xs text-gray-400 w-6">#{index}</span>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm text-white truncate">
                        {animAsset?.name || binding.clipId}
                        {isActive && <span className="ml-2 text-xs text-purple-400">(Active)</span>}
                      </span>
                      <div className="flex space-x-1">
                        {!isActive && (
                          <button
                            onClick={() => handleSetActiveBinding(binding.clipId)}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                            title="Set as active"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          onClick={() => handleEditTimeline(binding.clipId)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                          title="Edit"
                        >
                          <FiEdit size={12} />
                        </button>
                        <button
                          onClick={() => handleRemoveClipBinding(binding.bindingId)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Clip Button */}
              <button
                onClick={() => setIsBrowserOpen(true)}
                className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded flex items-center justify-center gap-1"
              >
                <span>+ Add Animation Clip</span>
              </button>
            </div>
          )}
        </CollapsibleSection>
      </GenericComponentSection>

      {/* Animation Browser Modal */}
      <AnimationBrowserModal
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        onSelect={handleAddClipBinding}
        selectedAnimationId={animation.activeBindingId}
        onEdit={(animationId) => {
          setIsBrowserOpen(false);
          handleEditTimeline(animationId);
        }}
        onCreate={handleCreateModalOpen}
      />
      <AnimationCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleAnimationCreated}
      />
    </>
  );
};
