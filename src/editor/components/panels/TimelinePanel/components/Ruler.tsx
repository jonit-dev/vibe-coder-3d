import React, { useMemo } from 'react';
import { useTimelineStore } from '@editor/store/timelineStore';

export const Ruler: React.FC = () => {
  const { zoom, pan, activeClip, setCurrentTime } = useTimelineStore();

  const duration = activeClip?.duration || 10;

  // Generate tick marks
  const ticks = useMemo(() => {
    const tickArray: { time: number; major: boolean; label?: string }[] = [];
    const pixelsPerSecond = zoom;

    // Determine tick interval based on zoom level
    let interval = 1; // Default: 1 second
    if (pixelsPerSecond > 200) interval = 0.1; // 100ms
    else if (pixelsPerSecond > 100) interval = 0.25; // 250ms
    else if (pixelsPerSecond > 50) interval = 0.5; // 500ms
    else if (pixelsPerSecond < 20) interval = 5; // 5 seconds

    const majorInterval = interval * 5;

    for (let time = 0; time <= duration; time += interval) {
      const isMajor = Math.abs(time % majorInterval) < 0.001;
      tickArray.push({
        time,
        major: isMajor,
        label: isMajor ? time.toFixed(time < 1 ? 1 : 0) : undefined,
      });
    }

    return tickArray;
  }, [zoom, duration]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left + pan;
    const time = clickX / zoom;
    setCurrentTime(time);
  };

  return (
    <div
      className="h-8 bg-gray-800 border-b border-gray-700 relative cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <div className="absolute inset-0" style={{ transform: `translateX(-${pan}px)` }}>
        {ticks.map((tick, i) => {
          const x = tick.time * zoom;
          return (
            <div
              key={i}
              className="absolute top-0"
              style={{ left: `${x}px` }}
            >
              {/* Tick mark */}
              <div
                className={`${
                  tick.major ? 'h-4 bg-gray-400' : 'h-2 bg-gray-600'
                } w-px`}
              />
              {/* Label */}
              {tick.label && (
                <div className="absolute top-4 -translate-x-1/2 text-xs text-gray-400">
                  {tick.label}s
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
