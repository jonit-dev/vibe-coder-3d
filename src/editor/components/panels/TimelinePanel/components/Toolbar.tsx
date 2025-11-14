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
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
      {/* Playback Controls */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-700">
        <button
          onClick={togglePlay}
          className="p-2 hover:bg-gray-700 rounded"
          title={playing ? 'Pause (Ctrl+Space)' : 'Play (Ctrl+Space)'}
        >
          {playing ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
        </button>
        <button
          onClick={stop}
          className="p-2 hover:bg-gray-700 rounded"
          title="Stop"
        >
          <FiSquare className="w-4 h-4" />
        </button>
        <label className="flex items-center gap-2 px-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
            className="w-4 h-4"
          />
          Loop
        </label>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 px-2 border-r border-gray-700">
        <button
          onClick={zoomOut}
          className="p-2 hover:bg-gray-700 rounded"
          title="Zoom Out"
        >
          <FiZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-400 w-16 text-center">
          {Math.round(zoom)}px/s
        </span>
        <button
          onClick={zoomIn}
          className="p-2 hover:bg-gray-700 rounded"
          title="Zoom In"
        >
          <FiZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Snap Controls */}
      <div className="flex items-center gap-1 px-2 border-r border-gray-700">
        <button
          onClick={toggleSnap}
          className={`p-2 rounded ${
            snapEnabled ? 'bg-blue-600 hover:bg-blue-500' : 'hover:bg-gray-700'
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
          className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <FiRotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Shift+Z)"
        >
          <FiRotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
