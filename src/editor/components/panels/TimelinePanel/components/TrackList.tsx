import React, { useState, useMemo } from 'react';
import { FiPlus } from 'react-icons/fi';
import type { IClip } from '@core/components/animation/AnimationComponent';
import { type ITrack, TrackType } from '@core/components/animation/tracks/TrackTypes';
import { useTimelineStore } from '@editor/store/timelineStore';
import { useEditorStore } from '@editor/store/editorStore';
import { useEntityComponents } from '@editor/hooks/useEntityComponents';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import { TrackRow } from './TrackRow';

export interface ITrackListProps {
  clip: IClip;
}

interface ITrackOption {
  type: TrackType;
  label: string;
  componentRequired: string;
}

export const TrackList: React.FC<ITrackListProps> = ({ clip }) => {
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [trackType, setTrackType] = useState<TrackType>(TrackType.TRANSFORM_POSITION);
  const { updateClip } = useTimelineStore();
  const selectedId = useEditorStore((state) => state.selectedId);
  const { hasComponent, components } = useEntityComponents(selectedId);

  // Dynamically determine available track types based on entity components
  const availableTrackOptions = useMemo<ITrackOption[]>(() => {
    const options: ITrackOption[] = [];

    // Transform tracks - available if entity has Transform component
    if (hasComponent(KnownComponentTypes.TRANSFORM)) {
      options.push(
        { type: TrackType.TRANSFORM_POSITION, label: 'Position', componentRequired: 'Transform' },
        { type: TrackType.TRANSFORM_ROTATION, label: 'Rotation', componentRequired: 'Transform' },
        { type: TrackType.TRANSFORM_SCALE, label: 'Scale', componentRequired: 'Transform' },
      );
    }

    // Material tracks - available if entity has MeshRenderer component
    if (hasComponent(KnownComponentTypes.MESH_RENDERER)) {
      options.push({
        type: TrackType.MATERIAL,
        label: 'Material',
        componentRequired: 'MeshRenderer',
      });
    }

    // Morph target tracks - available if entity has MeshRenderer
    // (typically meshes with morph targets have MeshRenderer)
    if (hasComponent(KnownComponentTypes.MESH_RENDERER)) {
      options.push({
        type: TrackType.MORPH,
        label: 'Morph Target',
        componentRequired: 'MeshRenderer',
      });
    }

    // Event tracks - always available
    options.push({ type: TrackType.EVENT, label: 'Event', componentRequired: 'None' });

    return options;
  }, [hasComponent, components]);

  const handleAddTrack = () => {
    const newTrack: ITrack = {
      id: `track_${Date.now()}`,
      type: trackType,
      targetPath: 'root', // Default to root - can be changed later if needed
      keyframes: [],
    };

    const updatedClip: IClip = {
      ...clip,
      tracks: [...clip.tracks, newTrack],
    };

    updateClip(updatedClip);
    setShowAddTrack(false);
  };

  return (
    <div className="relative bg-gray-900">
      {/* Add Track Button */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-900 to-gray-900/95 border-b border-gray-700 p-3">
        {!showAddTrack ? (
          <button
            onClick={() => setShowAddTrack(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md shadow-sm transition-colors"
          >
            <FiPlus size={16} />
            Add Track
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
            {availableTrackOptions.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">Type:</span>
                  <select
                    value={trackType}
                    onChange={(e) => setTrackType(e.target.value as TrackType)}
                    className="px-3 py-2 text-sm font-medium bg-gray-700 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableTrackOptions.map((option) => (
                      <option key={option.type} value={option.type}>
                        {option.label}
                        {option.componentRequired !== 'None' && ` (${option.componentRequired})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1" />
                <button
                  onClick={handleAddTrack}
                  className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowAddTrack(false);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm text-gray-400">
                  No animatable components found. Add Transform or MeshRenderer to enable animation
                  tracks.
                </span>
                <button
                  onClick={() => {
                    setShowAddTrack(false);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Track List */}
      {clip.tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-8">
          <div className="text-center space-y-3">
            <p className="text-lg font-medium text-gray-300">No animation tracks yet</p>
            <p className="text-sm text-gray-500 max-w-md">
              Click <span className="text-blue-400 font-semibold">"Add Track"</span> above to start
              animating properties like position, rotation, and scale
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {clip.tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              clipDuration={clip.duration}
              onDelete={() => {
                const updatedClip: IClip = {
                  ...clip,
                  tracks: clip.tracks.filter((t) => t.id !== track.id),
                };
                updateClip(updatedClip);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
