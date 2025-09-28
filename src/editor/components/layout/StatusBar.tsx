import React, { useState } from 'react';
import { FiActivity, FiClock, FiCpu, FiHardDrive, FiWifi, FiX } from 'react-icons/fi';

import { usePerformanceMonitor } from '@/editor/hooks/usePerformanceMonitor';

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
  enablePerformanceMonitoring?: boolean;
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
  enablePerformanceMonitoring = true,
  streamingProgress,
}) => {
  const { metrics, profilerStats } = usePerformanceMonitor(enablePerformanceMonitoring);
  const [showDetailedPerf, setShowDetailedPerf] = useState(false);
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

          {(enablePerformanceMonitoring || stats) && (
            <>
              <div className="w-px h-4 bg-gray-700"></div>

              <div className="flex items-center space-x-4">
                {enablePerformanceMonitoring && metrics.averageFPS > 0 && (
                  <StatusIndicator
                    icon={<FiCpu />}
                    value={Math.round(metrics.averageFPS)}
                    label="FPS"
                    color="cyan"
                  />
                )}

                {enablePerformanceMonitoring && metrics.frameTime > 0 && (
                  <StatusIndicator
                    icon={<FiClock />}
                    value={`${metrics.frameTime.toFixed(1)}ms`}
                    color="yellow"
                  />
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

                {/* Profiler Stats */}
                {enablePerformanceMonitoring && profilerStats.totalMeasurements > 0 && (
                  <>
                    <div className="w-px h-4 bg-gray-700"></div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowDetailedPerf(!showDetailedPerf)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                        title="Click for detailed performance view"
                      >
                        <FiActivity className="w-3 h-3" />
                        <span className="text-xs">{profilerStats.totalMeasurements} ops</span>
                      </button>

                      {profilerStats.topOperations.length > 0 && (
                        <div className="flex items-center space-x-2">
                          {profilerStats.topOperations.slice(0, 2).map((op) => (
                            <span key={op.name} className="text-cyan-400 text-xs font-mono">
                              {op.name.split('.')[0]}: {op.averageTime.toFixed(1)}ms
                            </span>
                          ))}
                        </div>
                      )}

                      {profilerStats.memoryUsage && (
                        <StatusIndicator
                          icon={<FiHardDrive />}
                          value={`${profilerStats.memoryUsage.used}MB`}
                          label={`${profilerStats.memoryUsage.percentage}%`}
                          color="purple"
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right section - Keyboard shortcuts */}
        <div className="flex items-center space-x-6">
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

      {/* Detailed Performance Panel */}
      {showDetailedPerf && enablePerformanceMonitoring && (
        <div className="absolute bottom-full left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-200 flex items-center space-x-2">
              <FiActivity className="w-4 h-4 text-cyan-400" />
              <span>Performance Details</span>
            </h3>
            <button
              onClick={() => setShowDetailedPerf(false)}
              className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
              title="Close performance panel"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Basic Metrics */}
            <div className="space-y-2">
              <div className="text-gray-400 font-medium">Frame Metrics</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">FPS:</span>
                  <span className="text-cyan-400">{Math.round(metrics.averageFPS)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Frame Time:</span>
                  <span className="text-yellow-400">{metrics.frameTime.toFixed(1)}ms</span>
                </div>
              </div>
            </div>

            {/* Top Operations */}
            <div className="space-y-2">
              <div className="text-gray-400 font-medium">Top Operations</div>
              <div className="space-y-1">
                {profilerStats.topOperations.map((op) => (
                  <div key={op.name} className="flex justify-between">
                    <span className="text-gray-500 truncate mr-2">{op.name.split('.')[0]}:</span>
                    <span className="text-cyan-400">{op.averageTime.toFixed(1)}ms</span>
                  </div>
                ))}
                {profilerStats.topOperations.length === 0 && (
                  <div className="text-gray-500">No operations measured</div>
                )}
              </div>
            </div>

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="text-gray-400 font-medium">Memory</div>
              <div className="space-y-1">
                {profilerStats.memoryUsage ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Used:</span>
                      <span className="text-purple-400">{profilerStats.memoryUsage.used}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Usage:</span>
                      <span className="text-purple-400">
                        {profilerStats.memoryUsage.percentage}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">Memory info unavailable</div>
                )}
              </div>
            </div>

            {/* System Stats */}
            <div className="space-y-2">
              <div className="text-gray-400 font-medium">System Stats</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Measurements:</span>
                  <span className="text-green-400">{profilerStats.totalMeasurements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Entities:</span>
                  <span className="text-green-400">{stats?.entities || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
