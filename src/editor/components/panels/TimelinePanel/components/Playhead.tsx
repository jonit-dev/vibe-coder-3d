import React, { useRef, useState } from 'react';
import { useTimelineStore } from '@editor/store/timelineStore';

export const Playhead: React.FC = () => {
  const { currentTime, zoom, pan, setCurrentTime, snapEnabled, snapInterval } =
    useTimelineStore();
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, time: 0 });

  const x = currentTime * zoom - pan;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      time: currentTime,
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

    setCurrentTime(newTime);
  };

  const handleMouseUp = () => {
    setDragging(false);
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
  }, [dragging, currentTime, zoom, snapEnabled, snapInterval]);

  return (
    <>
      {/* Playhead line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
        style={{ left: `${x}px` }}
      />

      {/* Playhead handle */}
      <div
        className="absolute top-0 w-4 h-4 bg-red-500 rounded-sm cursor-ew-resize z-20 -translate-x-1/2"
        style={{ left: `${x}px` }}
        onMouseDown={handleMouseDown}
      >
        {/* Triangle pointer */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-red-500" />
      </div>
    </>
  );
};
