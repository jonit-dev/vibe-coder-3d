import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { type ITrack, TrackType } from '@core/components/animation/tracks/TrackTypes';
import { useTimelineStore } from '@editor/store/timelineStore';
import { Keyframe } from './Keyframe';

export interface ITrackRowProps {
  track: ITrack;
  clipDuration: number;
  onDelete?: () => void;
}

export const TrackRow: React.FC<ITrackRowProps> = ({ track, clipDuration, onDelete }) => {
  const { zoom, pan, selection, selectTrack } = useTimelineStore();

  const isSelected = selection.trackId === track.id;

  const getTrackTypeLabel = (type: string): string => {
    const parts = type.split('.');
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const getTrackColor = (type: string): string => {
    if (type.startsWith('transform.position')) return 'bg-red-600';
    if (type.startsWith('transform.rotation')) return 'bg-green-600';
    if (type.startsWith('transform.scale')) return 'bg-blue-600';
    if (type.startsWith('morph')) return 'bg-purple-600';
    if (type.startsWith('material')) return 'bg-yellow-600';
    if (type.startsWith('event')) return 'bg-pink-600';
    return 'bg-gray-600';
  };

  return (
    <div
      className={`flex border-b border-gray-700 h-12 ${
        isSelected ? 'bg-gray-800' : 'bg-gray-900'
      }`}
      onClick={() => selectTrack(track.id)}
    >
      {/* Track Label */}
      <div className="w-48 flex-shrink-0 px-3 py-2 border-r border-gray-700 flex items-center gap-2 group">
        <div className={`w-3 h-3 rounded-sm ${getTrackColor(track.type)}`} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">
            {getTrackTypeLabel(track.type)}
          </div>
          <div className="text-xs text-gray-500 truncate">{track.targetPath || '(root)'}</div>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-all"
            title="Delete track"
          >
            <FiTrash2 size={12} />
          </button>
        )}
      </div>

      {/* Track Timeline */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ transform: `translateX(-${pan}px)` }}
        >
          {/* Background grid */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: Math.ceil(clipDuration) }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gray-600"
                style={{ left: `${i * zoom}px` }}
              />
            ))}
          </div>

          {/* Keyframes */}
          {track.keyframes.map((keyframe, index) => (
            <Keyframe
              key={index}
              trackId={track.id}
              trackType={track.type as TrackType}
              keyframe={keyframe}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
