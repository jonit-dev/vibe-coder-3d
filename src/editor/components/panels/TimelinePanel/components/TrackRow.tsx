import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import {
  type ITrack,
  TrackType,
  getDefaultKeyframeValueForTrackType,
} from '@core/components/animation/tracks/TrackTypes';
import { useTimelineStore } from '@editor/store/timelineStore';
import { Keyframe } from './Keyframe';

export interface ITrackRowProps {
  track: ITrack;
  clipDuration: number;
  onDelete?: () => void;
}

export const TrackRow: React.FC<ITrackRowProps> = ({ track, clipDuration, onDelete }) => {
  const { zoom, pan, selection, selectTrack, currentTime, addKeyframe } = useTimelineStore();

  const isSelected = selection.trackId === track.id;

  const getTrackTypeLabel = (type: string): string => {
    const parts = type.split('.');
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const getTrackColor = (type: string): string => {
    if (type.startsWith('transform.position')) return 'bg-red-500';
    if (type.startsWith('transform.rotation')) return 'bg-green-500';
    if (type.startsWith('transform.scale')) return 'bg-blue-500';
    if (type.startsWith('morph')) return 'bg-purple-500';
    if (type.startsWith('material')) return 'bg-yellow-500';
    if (type.startsWith('event')) return 'bg-pink-500';
    return 'bg-gray-500';
  };

  const getTrackIcon = (type: string): string => {
    if (type.startsWith('transform.position')) return '🎯';
    if (type.startsWith('transform.rotation')) return '🔄';
    if (type.startsWith('transform.scale')) return '📏';
    if (type.startsWith('morph')) return '🎭';
    if (type.startsWith('material')) return '🎨';
    if (type.startsWith('event')) return '⚡';
    return '📦';
  };

  return (
    <div
      className={`flex border-b border-cyan-900/10 h-14 transition-colors ${
        isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'bg-[#1B1C1F] hover:bg-[#23272E]'
      }`}
      onClick={() => selectTrack(track.id)}
    >
      {/* Track Label */}
      <div className="w-64 flex-shrink-0 px-3 py-2 border-r border-cyan-900/20 flex items-center gap-3 group bg-[#23272E]">
        <div className="flex items-center gap-2">
          <div className={`w-1 h-8 rounded-full ${getTrackColor(track.type)} shadow-lg`} />
          <span className="text-base">{getTrackIcon(track.type)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-100 truncate">
            {getTrackTypeLabel(track.type)}
          </div>
          <div className="text-xs text-gray-500 truncate">{track.keyframes.length} keyframes</div>
        </div>

        {/* Add keyframe at current playhead time, similar to Unity/Unreal */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addKeyframe(track.id, {
              time: currentTime,
              value: getDefaultKeyframeValueForTrackType(track.type),
              easing: 'linear',
            });
          }}
          className="p-1.5 text-xs text-primary hover:text-cyan-300 hover:bg-primary/20 rounded transition-colors border border-transparent hover:border-primary/30"
          title="Add keyframe at current time (S)"
        >
          <FiPlus size={14} />
        </button>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-error hover:text-red-300 hover:bg-error/20 rounded transition-all border border-transparent hover:border-error/30"
            title="Delete track"
          >
            <FiTrash2 size={14} />
          </button>
        )}
      </div>

      {/* Track Timeline */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0" style={{ transform: `translateX(-${pan}px)` }}>
          {/* Background grid */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: Math.ceil(clipDuration) }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-cyan-500/30"
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
