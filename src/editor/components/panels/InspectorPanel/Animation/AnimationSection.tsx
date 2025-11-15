import React, { useState } from 'react';
import { FiFilm, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { IAnimationComponent, IClip } from '@core/components/animation/AnimationComponent';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import { useTimelineStore } from '@editor/store/timelineStore';
import { TimelinePanel } from '@editor/components/panels/TimelinePanel/TimelinePanel';
import { GenericComponentSection } from '@editor/components/shared/GenericComponentSection';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('AnimationSection');

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
  const [showCreateClip, setShowCreateClip] = useState(false);
  const [newClipName, setNewClipName] = useState('');
  const [newClipDuration, setNewClipDuration] = useState(1.0);
  const { setActiveEntity, setIsOpen, isOpen: timelineOpen } = useTimelineStore();

  const handleClipSelect = (clipId: string) => {
    setAnimation({
      ...animation,
      activeClipId: clipId,
    });
  };

  const handleOpenTimeline = () => {
    if (animation.activeClipId) {
      const activeClip = animation.clips.find((c) => c.id === animation.activeClipId);
      if (activeClip) {
        setActiveEntity(entityId, activeClip);
        setIsOpen(true);
      }
    } else if (animation.clips.length > 0) {
      setActiveEntity(entityId, animation.clips[0]);
      setIsOpen(true);
    } else {
      logger.warn('No clips available to edit');
    }
  };

  const handleCreateClip = () => {
    if (!newClipName.trim()) {
      logger.warn('Clip name cannot be empty');
      return;
    }

    const newClip: IClip = {
      id: `clip_${Date.now()}`,
      name: newClipName.trim(),
      duration: newClipDuration,
      tracks: [],
      timeScale: 1,
      loop: true,
    };

    setAnimation({
      ...animation,
      clips: [...animation.clips, newClip],
      activeClipId: newClip.id,
    });

    setNewClipName('');
    setNewClipDuration(1.0);
    setShowCreateClip(false);
    logger.info('Created new clip', { name: newClip.name, duration: newClip.duration });
  };

  const handleDeleteClip = (clipId: string) => {
    setAnimation({
      ...animation,
      clips: animation.clips.filter((c) => c.id !== clipId),
      activeClipId: animation.activeClipId === clipId ? undefined : animation.activeClipId,
    });
    logger.info('Deleted clip', { clipId });
  };

  return (
    <>
      <GenericComponentSection
        title="Animation"
        icon={<FiFilm />}
        headerColor="purple"
        componentId={KnownComponentTypes.ANIMATION}
        onRemove={onRemove}
      >
        {/* Clip Management */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Clips ({animation.clips.length})</label>
            <button
              onClick={() => setShowCreateClip(!showCreateClip)}
              className="p-1 text-xs text-blue-400 hover:text-blue-300 rounded"
              title="Create new clip"
            >
              <FiPlus size={14} />
            </button>
          </div>

          {/* Create Clip Form */}
          {showCreateClip && (
            <div className="p-2 bg-gray-800 rounded space-y-2 border border-gray-700">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Clip Name</label>
                <input
                  type="text"
                  value={newClipName}
                  onChange={(e) => setNewClipName(e.target.value)}
                  placeholder="Enter clip name"
                  className="w-full px-2 py-1 text-sm bg-gray-900 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Duration (s)</label>
                <input
                  type="number"
                  value={newClipDuration}
                  onChange={(e) => setNewClipDuration(parseFloat(e.target.value) || 1.0)}
                  min="0.1"
                  step="0.1"
                  className="w-full px-2 py-1 text-sm bg-gray-900 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateClip}
                  className="flex-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateClip(false);
                    setNewClipName('');
                    setNewClipDuration(1.0);
                  }}
                  className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Clip List */}
          {animation.clips.length > 0 ? (
            <div className="space-y-1">
              {animation.clips.map((clip) => (
                <div
                  key={clip.id}
                  className={`flex items-center justify-between p-2 rounded ${
                    animation.activeClipId === clip.id
                      ? 'bg-blue-900/30 border border-blue-700'
                      : 'bg-gray-800'
                  }`}
                >
                  <button
                    onClick={() => handleClipSelect(clip.id)}
                    className="flex-1 text-left text-sm"
                  >
                    <div className="font-medium">{clip.name}</div>
                    <div className="text-xs text-gray-400">
                      {clip.duration.toFixed(2)}s • {clip.tracks.length} tracks
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteClip(clip.id)}
                    className="p-1 text-red-400 hover:text-red-300 rounded"
                    title="Delete clip"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic p-2 text-center">
              No clips defined. Click + to create one.
            </div>
          )}
        </div>

        {/* Timeline Editor Button */}
        {animation.clips.length > 0 && (
          <div className="pt-2 border-t border-gray-700">
            <button
              onClick={handleOpenTimeline}
              disabled={!animation.activeClipId}
              className="w-full px-3 py-2 text-sm bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded transition-colors font-medium"
            >
              Open Timeline Editor
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {animation.activeClipId
                ? 'Edit keyframes, easing, and playback in Timeline'
                : 'Select a clip above to edit'}
            </p>
          </div>
        )}
      </GenericComponentSection>

      {/* Timeline Panel Modal */}
      <TimelinePanel
        isOpen={timelineOpen}
        onClose={() => setIsOpen(false)}
        onSave={(updatedClip) => {
          const updatedClips = animation.clips.map((c) =>
            c.id === updatedClip.id ? updatedClip : c,
          );
          setAnimation({
            ...animation,
            clips: updatedClips,
          });
        }}
      />
    </>
  );
};
