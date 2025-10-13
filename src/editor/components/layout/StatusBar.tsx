import React from 'react';
import { FiActivity, FiHardDrive, FiWifi, FiZap } from 'react-icons/fi';

import { useFPS } from '@/editor/hooks/useFPS';
import { StatusIndicator } from '../shared/StatusIndicator';

export interface IStatusBarProps {
  statusMessage: string;
  shortcuts?: Array<{
    key: string;
    description: string;
  }>;
  stats?: {
    memory?: string;
    entities?: number;
  };
  streamingProgress?: {
    isActive: boolean;
    phase: string;
    percentage: number;
    current: number;
    total: number;
    entitiesPerSecond?: number;
  };
}

export const StatusBar: React.FC<IStatusBarProps> = ({
  statusMessage,
  shortcuts = [
    { key: 'Ctrl+N', description: 'Add Object' },
    { key: 'Ctrl+S', description: 'Save Scene' },
    { key: 'Ctrl+/', description: 'Toggle Chat' },
    { key: 'Delete', description: 'Delete Object' },
  ],
  stats,
  streamingProgress,
}) => {
  const fps = useFPS();
  const rendererLabel = 'WebGL';
  return (
    <footer className="h-8 bg-gradient-to-r from-[#0a0a0b] via-[#12121a] to-[#0a0a0b] border-t border-gray-800/50 flex items-center text-xs text-gray-400 relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/3 via-purple-900/3 to-cyan-900/3"></div>

      <div className="relative z-10 flex items-center justify-between w-full px-4">
        {/* Left section - Status message */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                streamingProgress?.isActive ? 'bg-cyan-400' : 'bg-green-400'
              }`}
            ></div>
            <span className="text-gray-300">{statusMessage}</span>
            {streamingProgress?.isActive && (
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-200 ease-out"
                    style={{ width: `${streamingProgress.percentage}%` }}
                  />
                </div>
                <span className="text-cyan-400 text-xs">
                  {Math.round(streamingProgress.percentage)}%
                </span>
                {streamingProgress.entitiesPerSecond && (
                  <span className="text-gray-500 text-xs">
                    ({Math.round(streamingProgress.entitiesPerSecond)} e/s)
                  </span>
                )}
              </div>
            )}
          </div>

          {(fps > 0 || stats) && (
            <>
              <div className="w-px h-4 bg-gray-700"></div>

              <div className="flex items-center space-x-4">
                {fps > 0 && (
                  <StatusIndicator icon={<FiActivity />} value={fps} label="FPS" color="cyan" />
                )}

                {stats?.memory && (
                  <StatusIndicator icon={<FiHardDrive />} value={stats.memory} color="purple" />
                )}

                {stats?.entities && (
                  <StatusIndicator
                    icon={<FiWifi />}
                    value={stats.entities}
                    label="Entities"
                    color="green"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Right section - Renderer + Keyboard shortcuts */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-xs">
            <FiZap className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">{rendererLabel}</span>
          </div>

          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 opacity-70 hover:opacity-100 transition-opacity duration-200"
            >
              <kbd className="px-2 py-0.5 bg-gray-800/50 border border-gray-700/50 rounded text-xs font-mono">
                {shortcut.key}
              </kbd>
              <span className="text-xs">{shortcut.description}</span>
            </div>
          ))}

          <div className="w-px h-4 bg-gray-700"></div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-500">VibeEngine</span>
            <span className="text-cyan-400">Ready</span>
          </div>
        </div>
      </div>

      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
    </footer>
  );
};
