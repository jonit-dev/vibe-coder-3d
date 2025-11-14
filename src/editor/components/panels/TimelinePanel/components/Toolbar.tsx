import React from 'react';
import {
  FiPlay,
  FiPause,
  FiSquare,
  FiZoomIn,
  FiZoomOut,
  FiGrid,
  FiRotateCcw,
  FiRotateCw,
} from 'react-icons/fi';
import { useTimelineStore } from '@editor/store/timelineStore';

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
  } = useTimelineStore();

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
        <label className="flex items-center gap-2 px-2 text-sm cursor-pointer hover:text-primary transition-colors">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          Loop
        </label>
      </div>

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
