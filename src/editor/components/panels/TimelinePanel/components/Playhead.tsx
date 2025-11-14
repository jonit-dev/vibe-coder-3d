import React, { useRef, useState } from 'react';
import { useTimelineStore } from '@editor/store/timelineStore';

export const Playhead: React.FC = () => {
  const { currentTime, zoom, pan, setCurrentTime, snapEnabled, snapInterval, playing } =
    useTimelineStore();
  const [dragging, setDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dragStartRef = useRef({ x: 0, time: 0 });

  // Convert timeline time to on-screen X coordinate. `pan` represents the
  // world-space offset (in pixels) currently scrolled to the left, so we
  // subtract it here to keep the playhead aligned with the ruler and tracks.
  const x = Math.round(currentTime * zoom - pan);

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

    // Drag based on delta from the initial mouse‑down position so the logic
    // doesn't depend on container DOM measurements.
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaTime = deltaX / zoom;
    let newTime = dragStartRef.current.time + deltaTime;

    // Apply snapping
    if (snapEnabled) {
      newTime = Math.round(newTime / snapInterval) * snapInterval;
    }

    setCurrentTime(newTime);
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
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
  }, [dragging, currentTime, zoom, pan, snapEnabled, snapInterval]);

  const getPlayheadColor = () => {
    return playing ? 'bg-error' : 'bg-primary';
  };

  const getPlayheadShadow = () => {
    return playing ? 'shadow-lg shadow-error/50' : 'shadow-lg shadow-primary/50';
  };

  return (
    <>
      {/* Timeline ruler for click seeking */}
      <div
        data-testid="timeline-ruler"
        className="absolute top-0 bottom-0 left-0 right-0 cursor-pointer z-5"
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          // Map screen‑space X into timeline time. Content is shifted left by
          // `pan`, so we add it back here to recover the world X value.
          const newTime = (clickX + pan) / zoom;

          if (snapEnabled) {
            const snappedTime = Math.round(newTime / snapInterval) * snapInterval;
            setCurrentTime(Math.max(0, snappedTime));
          } else {
            setCurrentTime(Math.max(0, newTime));
          }
        }}
      />

      {/* Playhead line */}
      <div
        className={`absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none ${getPlayheadColor()} ${getPlayheadShadow()}`}
        style={{ left: `${x}px` }}
      />

      {/* Playhead handle */}
      <div
        data-testid="playhead"
        className={`absolute top-0 w-4 h-4 rounded-sm cursor-ew-resize z-20 -translate-x-1/2 ${getPlayheadColor()} ${getPlayheadShadow()}`}
        style={{ left: `${x}px` }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Triangle pointer */}
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent ${playing ? 'border-t-error' : 'border-t-primary'}`}
        />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute z-30 px-2 py-1 text-xs text-white bg-[#1B1C1F] border border-cyan-900/30 rounded whitespace-nowrap -top-8 left-1/2 -translate-x-1/2 shadow-lg"
        >
          {currentTime.toFixed(2)}s
        </div>
      )}
    </>
  );
};
