import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import type { IClip } from '@core/components/animation/AnimationComponent';
import { type ITrack, TrackType } from '@core/components/animation/tracks/TrackTypes';
import { useTimelineStore } from '@editor/store/timelineStore';
import { TrackRow } from './TrackRow';

export interface ITrackListProps {
  clip: IClip;
}

export const TrackList: React.FC<ITrackListProps> = ({ clip }) => {
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [trackType, setTrackType] = useState<TrackType>(TrackType.TRANSFORM_POSITION);
  const [trackTarget, setTrackTarget] = useState('');
  const { updateClip } = useTimelineStore();

  const handleAddTrack = () => {
    if (!trackTarget.trim()) {
      return;
    }

    const newTrack: ITrack = {
      id: `track_${Date.now()}`,
      type: trackType,
      targetPath: trackTarget.trim(),
      keyframes: [],
    };

    const updatedClip: IClip = {
      ...clip,
      tracks: [...clip.tracks, newTrack],
    };

    updateClip(updatedClip);
    setTrackTarget('');
    setShowAddTrack(false);
  };

  return (
    <div className="relative">
      {/* Add Track Button */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 p-2">
        {!showAddTrack ? (
          <button
            onClick={() => setShowAddTrack(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded"
          >
            <FiPlus size={14} />
            Add Track
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={trackType}
              onChange={(e) => setTrackType(e.target.value as TrackType)}
              className="px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded"
            >
              <option value={TrackType.TRANSFORM_POSITION}>Position</option>
              <option value={TrackType.TRANSFORM_ROTATION}>Rotation</option>
              <option value={TrackType.TRANSFORM_SCALE}>Scale</option>
              <option value={TrackType.MORPH}>Morph Target</option>
              <option value={TrackType.MATERIAL}>Material Property</option>
              <option value={TrackType.EVENT}>Event</option>
            </select>
            <input
              type="text"
              value={trackTarget}
              onChange={(e) => setTrackTarget(e.target.value)}
              placeholder="Target path (e.g., root/cube)"
              className="flex-1 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded"
            />
            <button
              onClick={handleAddTrack}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddTrack(false);
                setTrackTarget('');
              }}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Track List */}
      {clip.tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-4">
          <p className="mb-2">No tracks in this clip</p>
          <p className="text-sm text-gray-600">Click "Add Track" above to begin animating</p>
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
