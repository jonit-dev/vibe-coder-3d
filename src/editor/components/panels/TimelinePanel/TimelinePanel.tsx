import React, { useRef } from 'react';
import { useTimelineStore } from '@editor/store/timelineStore';
import { Toolbar } from './components/Toolbar';
import { Ruler } from './components/Ruler';
import { TrackList } from './components/TrackList';
import { Playhead } from './components/Playhead';
import { useTimelineKeyboard } from './hooks/useTimelineKeyboard';
import { useTimelinePlayback } from './hooks/useTimelinePlayback';

export interface ITimelinePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (clip: any) => void;
}

export const TimelinePanel: React.FC<ITimelinePanelProps> = ({ isOpen, onClose, onSave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeClip, currentTime, playing } = useTimelineStore();

  const handleClose = () => {
    if (activeClip && onSave) {
      onSave(activeClip);
    }
    onClose();
  };

  // Setup keyboard shortcuts
  useTimelineKeyboard();

  // Handle playback updates
  useTimelinePlayback();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
      <div className="w-full h-2/3 bg-gray-900 border-t-2 border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Animation Timeline</h2>
          <div className="flex items-center gap-2">
            {activeClip && (
              <span className="text-sm text-gray-400">
                {activeClip.name} ({activeClip.duration.toFixed(2)}s)
              </span>
            )}
            <button
              onClick={handleClose}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
            >
              Close
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <Toolbar />

        {/* Timeline Content */}
        {activeClip ? (
          <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
            {/* Ruler and Playhead */}
            <div className="relative">
              <Ruler />
              <Playhead />
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-auto">
              <TrackList clip={activeClip} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No animation clip loaded</p>
              <p className="text-sm">
                Select an entity with an Animation component and choose a clip to edit
              </p>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Time: {currentTime.toFixed(3)}s</span>
            {activeClip && <span>Tracks: {activeClip.tracks.length}</span>}
          </div>
          <div className="flex items-center gap-4">
            <span>{playing ? 'Playing' : 'Stopped'}</span>
            <span>Ctrl+Space: Play/Pause</span>
            <span>S: Add Keyframe</span>
            <span>Double-click: Edit Value</span>
            <span>Ctrl+C/V: Copy/Paste</span>
            <span>Delete: Remove</span>
          </div>
        </div>
      </div>
    </div>
  );
};
