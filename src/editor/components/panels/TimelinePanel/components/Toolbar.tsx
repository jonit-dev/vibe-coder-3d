import React, { useState } from 'react';
import {
  FiPlay,
  FiPause,
  FiSquare,
  FiZoomIn,
  FiZoomOut,
  FiGrid,
  FiRotateCcw,
  FiRotateCw,
  FiRepeat,
  FiFastForward,
} from 'react-icons/fi';
import { useTimelineStore } from '@editor/store/timelineStore';

const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4];
const FRAME_RATES = [24, 30, 60];

export const Toolbar: React.FC = () => {
  const {
    playing,
    loop,
    snapEnabled,
    zoom,
    togglePlay,
    stop,
    setLoop,
    zoomIn,
    zoomOut,
    toggleSnap,
    undo,
    redo,
    canUndo,
    canRedo,
    activeClip,
  } = useTimelineStore();

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [frameRate, setFrameRate] = useState(30);

  const cyclePlaybackSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex]);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#23272E] border-b border-cyan-900/20 text-gray-300">
      {/* Playback Controls */}
      <div className="flex items-center gap-1 pr-2 border-r border-cyan-900/20">
        <button
          onClick={togglePlay}
          className="p-2 hover:bg-[#2D2F34] hover:text-primary rounded transition-colors"
          title={playing ? 'Pause (Ctrl+Space)' : 'Play (Ctrl+Space)'}
        >
          {playing ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
        </button>
        <button
          onClick={stop}
          className="p-2 hover:bg-[#2D2F34] hover:text-primary rounded transition-colors"
          title="Stop"
        >
          <FiSquare className="w-4 h-4" />
        </button>
        <button
          onClick={() => setLoop(!loop)}
          className={`p-2 rounded transition-colors ${
            loop
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'hover:bg-[#2D2F34] hover:text-primary'
          }`}
          title="Toggle Loop"
        >
          <FiRepeat className="w-4 h-4" />
        </button>
      </div>

      {/* Playback Speed */}
      <div className="flex items-center gap-1 px-2 border-r border-cyan-900/20">
        <button
          onClick={cyclePlaybackSpeed}
          className="flex items-center gap-1 p-2 hover:bg-[#2D2F34] hover:text-primary rounded transition-colors"
          title="Cycle playback speed"
        >
          <FiFastForward className="w-4 h-4" />
          <span className="text-xs font-mono min-w-[3ch] text-cyan-400">{playbackSpeed}x</span>
        </button>
      </div>

      {/* Frame Rate */}
      <div className="flex items-center gap-1 px-2 border-r border-cyan-900/20">
        <span className="text-xs text-gray-500">FPS:</span>
        <select
          value={frameRate}
          onChange={(e) => setFrameRate(parseInt(e.target.value))}
          className="px-2 py-1 text-xs bg-[#2D2F34] border border-cyan-900/30 rounded focus:border-primary focus:outline-none cursor-pointer hover:bg-[#1B1C1F] transition-colors"
        >
          {FRAME_RATES.map((fps) => (
            <option key={fps} value={fps}>
              {fps}
            </option>
          ))}
        </select>
      </div>

      {/* Clip Info */}
      {activeClip && (
        <div className="flex items-center gap-2 px-2 border-r border-cyan-900/20">
          <span className="text-xs text-gray-500">Duration:</span>
          <span className="text-xs font-mono text-cyan-400">{activeClip.duration.toFixed(2)}s</span>
          <span className="text-xs text-gray-600">•</span>
          <span className="text-xs font-mono text-cyan-400">
            {Math.ceil(activeClip.duration * frameRate)} frames
          </span>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 px-2 border-r border-cyan-900/20">
        <button
          onClick={zoomOut}
          className="p-2 hover:bg-[#2D2F34] hover:text-primary rounded transition-colors"
          title="Zoom Out"
        >
          <FiZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-cyan-400 w-16 text-center font-mono">
          {Math.round(zoom)}px/s
        </span>
        <button
          onClick={zoomIn}
          className="p-2 hover:bg-[#2D2F34] hover:text-primary rounded transition-colors"
          title="Zoom In"
        >
          <FiZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Snap Controls */}
      <div className="flex items-center gap-1 px-2 border-r border-cyan-900/20">
        <button
          onClick={toggleSnap}
          className={`p-2 rounded transition-colors ${
            snapEnabled
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'hover:bg-[#2D2F34] hover:text-primary'
          }`}
          title="Toggle Snap to Grid"
        >
          <FiGrid className="w-4 h-4" />
        </button>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 px-2">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="p-2 hover:bg-[#2D2F34] hover:text-primary rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <FiRotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="p-2 hover:bg-[#2D2F34] hover:text-primary rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <FiRotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
