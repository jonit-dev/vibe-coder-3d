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
  const dragStartRef = useRef({ x: 0, time: 0 });

  const isSelected =
    selection.trackId === trackId && selection.keyframeIndices.includes(index);

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
    if (e.key === 'Delete' && isSelected) {
      removeKeyframe(trackId, index);
    }
  };

  // Setup global mouse handlers
  React.useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, keyframe.time, zoom, snapEnabled, snapInterval]);

  const getEasingColor = (easing: string): string => {
    switch (easing) {
      case 'linear':
        return 'bg-blue-500';
      case 'step':
        return 'bg-gray-500';
      case 'bezier':
        return 'bg-green-500';
      case 'custom':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <>
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-sm cursor-move ${
          isSelected ? 'ring-2 ring-white' : ''
        } ${getEasingColor(keyframe.easing)} hover:scale-125 transition-transform`}
        style={{ left: `${x}px` }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleDelete}
        tabIndex={0}
        title={`Time: ${keyframe.time.toFixed(3)}s\nEasing: ${keyframe.easing}\n\nDouble-click to edit value\nDrag to move\nShift+click to multi-select`}
      />

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
