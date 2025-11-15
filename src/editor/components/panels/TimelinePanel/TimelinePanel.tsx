import { useTimelineStore } from '@editor/store/timelineStore';
import React, { useRef, useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Playhead } from './components/Playhead';
import { Ruler } from './components/Ruler';
import { Toolbar } from './components/Toolbar';
import { TrackList } from './components/TrackList';
import { useTimelineKeyboard } from './hooks/useTimelineKeyboard';
import { useTimelinePlayback } from './hooks/useTimelinePlayback';
import { useAnimationFocus } from './hooks/useAnimationFocus';
import { useCameraFocus } from './hooks/useCameraFocus';

export interface ITimelinePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (clip: Record<string, unknown>) => void;
}

const MIN_HEIGHT = 200;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 350;

export const TimelinePanel: React.FC<ITimelinePanelProps> = ({ isOpen, onClose, onSave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeClip, currentTime, playing, setIsOpen } = useTimelineStore();

  // Sync local isOpen prop with store
  React.useEffect(() => {
    setIsOpen(isOpen);
  }, [isOpen, setIsOpen]);

  // Resize state
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const resizeStartRef = useRef({ y: 0, height: 0 });

  const handleClose = () => {
    if (activeClip && onSave) {
      onSave(activeClip);
    }
    onClose();
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      y: e.clientY,
      height: height,
    };
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaY = resizeStartRef.current.y - e.clientY; // Inverted: drag up = increase height
    const newHeight = Math.max(
      MIN_HEIGHT,
      Math.min(MAX_HEIGHT, resizeStartRef.current.height + deltaY),
    );
    setHeight(newHeight);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Setup resize listeners
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, height]);

  // Setup keyboard shortcuts
  useTimelineKeyboard();

  // Handle playback updates
  useTimelinePlayback();

  // Animation focus mode - manages focus state
  const { focusedEntityId, isFocusMode } = useAnimationFocus(isOpen);

  // Auto-frame camera on focused entity when timeline opens
  useCameraFocus({ focusedEntityId, isFocusMode });

  if (!isOpen) return null;

  const displayHeight = isMinimized ? 40 : height;

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40 bg-[#23272E] border-t border-cyan-900/20 shadow-2xl flex flex-col transition-all duration-200"
      style={{
        height: `${displayHeight}px`,
      }}
    >
      {/* Resize Handle - Only show when not minimized */}
      {!isMinimized && (
        <div
          onMouseDown={handleResizeStart}
          className="h-1 bg-[#2D2F34] hover:bg-primary cursor-row-resize transition-colors relative group"
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#1B1C1F] via-[#23272E] to-[#1B1C1F] border-b border-cyan-900/20 relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 via-purple-900/5 to-cyan-900/5 pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full shadow-lg shadow-primary/50" />
            <h2 className="text-base font-semibold text-gray-100">Animation Timeline</h2>
          </div>
          {activeClip && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1B1C1F]/80 rounded-md border border-cyan-900/30">
              <span className="text-xs font-medium text-gray-300">{activeClip.name}</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-cyan-400">{activeClip.duration.toFixed(2)}s</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400">{activeClip.tracks.length} tracks</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 text-gray-400 hover:text-primary hover:bg-[#2D2F34] rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 text-sm font-medium bg-[#2D2F34] hover:bg-primary/20 text-gray-200 hover:text-primary rounded transition-colors border border-transparent hover:border-primary/50"
          >
            Close
          </button>
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>

      {/* Toolbar - Only show when not minimized */}
      {!isMinimized && <Toolbar />}

      {/* Timeline Content - Only show when not minimized */}
      {!isMinimized && (
        <>
          {activeClip ? (
            <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden bg-[#1B1C1F]">
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
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-[#1B1C1F]">
              <div className="text-center">
                <p className="text-lg mb-2 text-gray-400">No animation clip loaded</p>
                <p className="text-sm text-gray-500">
                  Select an entity with an Animation component and choose a clip to edit
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Status Bar */}
      {!isMinimized && (
        <div className="px-4 py-2 bg-gradient-to-r from-[#1B1C1F] via-[#23272E] to-[#1B1C1F] border-t border-cyan-900/20 flex items-center justify-between text-xs relative">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 via-purple-900/5 to-cyan-900/5 pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Time:</span>
              <span className="text-primary font-mono font-semibold">
                {currentTime.toFixed(3)}s
              </span>
            </div>
            {activeClip && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Frame:</span>
                <span className="text-success font-mono font-semibold">
                  {Math.floor(currentTime * 30)} / {Math.ceil(activeClip.duration * 30)}
                </span>
              </div>
            )}
            <div
              className={`flex items-center gap-2 px-2 py-1 rounded ${
                playing
                  ? 'bg-error/20 text-error border border-error/30'
                  : 'bg-[#2D2F34] text-gray-400 border border-transparent'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  playing ? 'bg-error animate-pulse' : 'bg-gray-500'
                }`}
              />
              <span className="font-medium">{playing ? 'Playing' : 'Stopped'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-400 relative z-10">
            <span className="px-2 py-1 bg-[#2D2F34] border border-cyan-900/30 rounded font-mono text-cyan-400">
              Ctrl+Space
            </span>
            <span>Play/Pause</span>
            <span className="text-gray-600">•</span>
            <span className="px-2 py-1 bg-[#2D2F34] border border-cyan-900/30 rounded font-mono text-cyan-400">
              S
            </span>
            <span>Add Keyframe</span>
            <span className="text-gray-600">•</span>
            <span className="px-2 py-1 bg-[#2D2F34] border border-cyan-900/30 rounded font-mono text-cyan-400">
              Del
            </span>
            <span>Remove</span>
          </div>

          {/* Top glow line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>
      )}
    </div>
  );
};
