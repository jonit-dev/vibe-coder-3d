import React, { useRef, useState } from 'react';
import type { IKeyframe } from '@core/components/animation/tracks/TrackTypes';
import { TrackType } from '@core/components/animation/tracks/TrackTypes';
import { useTimelineStore } from '@editor/store/timelineStore';
import { KeyframeValueEditor } from './KeyframeValueEditor';

export interface IKeyframeProps {
  trackId: string;
  trackType: TrackType;
  keyframe: IKeyframe;
  index: number;
}

export const Keyframe: React.FC<IKeyframeProps> = ({ trackId, trackType, keyframe, index }) => {
  const {
    zoom,
    selection,
    selectKeyframes,
    moveKeyframe,
    updateKeyframeValue,
    removeKeyframe,
    snapEnabled,
    snapInterval,
  } = useTimelineStore();

  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dragStartRef = useRef({ x: 0, time: 0 });

  const isSelected = selection.trackId === trackId && selection.keyframeIndices.includes(index);

  const x = keyframe.time * zoom;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Select this keyframe
    if (e.shiftKey) {
      // Add to selection
      const newIndices = isSelected
        ? selection.keyframeIndices.filter((i) => i !== index)
        : [...selection.keyframeIndices, index];
      selectKeyframes(trackId, newIndices);
    } else if (!isSelected) {
      // Select only this keyframe
      selectKeyframes(trackId, [index]);
    }

    // Start dragging
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      time: keyframe.time,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaTime = deltaX / zoom;
    let newTime = Math.max(0, dragStartRef.current.time + deltaTime);

    // Apply snapping
    if (snapEnabled) {
      newTime = Math.round(newTime / snapInterval) * snapInterval;
    }

    moveKeyframe(trackId, index, newTime);
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handleDelete = (e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && isSelected) {
      removeKeyframe(trackId, index);
    }
  };

  // Setup global mouse handlers
  React.useEffect(() => {
    if (dragging) {
      document.body.style.cursor = 'grabbing';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, keyframe.time, zoom, snapEnabled, snapInterval, trackId, index]);

  const getEasingColor = (easing: string): string => {
    switch (easing) {
      case 'linear':
        return 'bg-primary';
      case 'step':
        return 'bg-gray-500';
      case 'bezier':
        return 'bg-success';
      case 'custom':
        return 'bg-purple-500';
      default:
        return 'bg-primary';
    }
  };

  const getEasingShadow = (easing: string): string => {
    switch (easing) {
      case 'linear':
        return 'shadow-md shadow-primary/50';
      case 'step':
        return 'shadow-md shadow-gray-500/50';
      case 'bezier':
        return 'shadow-md shadow-success/50';
      case 'custom':
        return 'shadow-md shadow-purple-500/50';
      default:
        return 'shadow-md shadow-primary/50';
    }
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return `[${value.join(', ')}]`;
    }
    return String(value);
  };

  return (
    <>
      <div
        role="button"
        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-sm cursor-move ${
          isSelected ? 'ring-2 ring-cyan-400' : ''
        } ${getEasingColor(keyframe.easing)} ${getEasingShadow(keyframe.easing)} hover:scale-125 transition-transform`}
        style={{ left: `${x}px` }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleDelete}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        tabIndex={0}
        title={`Time: ${keyframe.time.toFixed(3)}s
Easing: ${keyframe.easing}

Double-click to edit value
Drag to move
Shift+click to multi-select`}
      />

      {showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full mb-2 px-2 py-1 text-xs bg-[#1B1C1F] border border-cyan-900/30 text-white rounded whitespace-nowrap z-50 shadow-lg"
          style={{ left: `${x}px`, transform: 'translateX(-50%)' }}
        >
          Time: {keyframe.time.toFixed(2)}s
          <br />
          Value: {formatValue(keyframe.value)}
        </div>
      )}

      {editing && (
        <KeyframeValueEditor
          keyframe={keyframe}
          trackType={trackType}
          onSave={(newValue) => {
            updateKeyframeValue(trackId, index, newValue);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </>
  );
};
