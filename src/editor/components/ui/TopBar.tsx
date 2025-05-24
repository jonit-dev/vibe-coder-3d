import React from 'react';
import { BiCube } from 'react-icons/bi';
import {
  FiActivity,
  FiCpu,
  FiFolder,
  FiMessageSquare,
  FiPause,
  FiPlay,
  FiSave,
  FiSettings,
  FiSquare,
  FiTrash2,
} from 'react-icons/fi';

export interface ITopBarProps {
  entityCount: number;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  onAddObject: () => void;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export const TopBar: React.FC<ITopBarProps> = ({
  entityCount,
  onSave,
  onLoad,
  onClear,
  onAddObject,
  isPlaying = false,
  onPlay,
  onPause,
  onStop,
  onToggleChat,
  isChatOpen = false,
}) => {
  return (
    <header className="h-14 bg-gradient-to-r from-[#0a0a0b] via-[#12121a] to-[#0a0a0b] border-b border-cyan-900/20 shadow-lg relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 via-purple-900/5 to-cyan-900/5 animate-pulse"></div>

      <div className="relative z-10 flex items-center justify-between h-full px-6">
        {/* Left section - Logo and project info */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <FiCpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                VibeEngine
              </h1>
              <div className="text-xs text-gray-400">v1.0.0</div>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-700"></div>

          <div className="flex items-center space-x-4">
            <div className="px-3 py-1 bg-cyan-950/30 border border-cyan-800/30 rounded-lg text-cyan-300 text-sm flex items-center space-x-2">
              <BiCube className="w-4 h-4" />
              <span>{entityCount} Objects</span>
            </div>

            <div className="px-3 py-1 bg-green-950/30 border border-green-800/30 rounded-lg text-green-300 text-sm flex items-center space-x-2">
              <FiActivity className="w-4 h-4" />
              <span>Ready</span>
            </div>
          </div>
        </div>

        {/* Center section - Playback controls */}
        <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-1">
          <button
            onClick={onPlay}
            disabled={isPlaying}
            className={`p-2 rounded-md transition-all duration-200 ${
              isPlaying
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-green-400 hover:bg-green-900/30 hover:text-green-300'
            }`}
            title="Play (Space)"
          >
            <FiPlay className="w-5 h-5" />
          </button>
          <button
            onClick={onPause}
            disabled={!isPlaying}
            className={`p-2 rounded-md transition-all duration-200 ${
              !isPlaying
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300'
            }`}
            title="Pause"
          >
            <FiPause className="w-5 h-5" />
          </button>
          <button
            onClick={onStop}
            className="p-2 rounded-md text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-200"
            title="Stop"
          >
            <FiSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Right section - File operations and settings */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-black/30 backdrop-blur-sm rounded-lg border border-gray-700/50 p-1">
            <button
              onClick={onAddObject}
              className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-md transition-all duration-200 text-sm font-medium flex items-center space-x-2 shadow-lg"
              title="Add Object (Ctrl+N)"
            >
              <BiCube className="w-4 h-4" />
              <span>Add</span>
            </button>

            <button
              onClick={onSave}
              className="p-2 text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300 rounded-md transition-all duration-200"
              title="Save Scene (Ctrl+S)"
            >
              <FiSave className="w-5 h-5" />
            </button>

            <button
              onClick={onLoad}
              className="p-2 text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 rounded-md transition-all duration-200"
              title="Load Scene"
            >
              <FiFolder className="w-5 h-5" />
            </button>

            <button
              onClick={onClear}
              className="p-2 text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-md transition-all duration-200"
              title="Clear Scene"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>

          <button className="p-2 text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 rounded-md transition-all duration-200">
            <FiSettings className="w-5 h-5" />
          </button>

          <button
            onClick={onToggleChat}
            className={`p-2 rounded-md transition-all duration-200 ${
              isChatOpen
                ? 'text-cyan-400 bg-cyan-900/30 border border-cyan-500/30'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
            }`}
            title="Toggle AI Chat (Ctrl+/)"
          >
            <FiMessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
    </header>
  );
};
