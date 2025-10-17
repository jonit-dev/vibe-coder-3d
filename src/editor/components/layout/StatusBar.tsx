import React from 'react';
import { FiActivity, FiHardDrive, FiWifi, FiZap } from 'react-icons/fi';
import { TbBoxMultiple } from 'react-icons/tb';

import { useFPS } from '@/editor/hooks/useFPS';
import { StatusIndicator } from '../shared/StatusIndicator';
import { useEditorStore } from '@/editor/store/editorStore';
import { Logger } from '@core/lib/logger';
import { useLODStore } from '@core/state/lodStore';

const logger = Logger.create('StatusBar');

export interface IStatusBarProps {
  statusMessage: string;
  lodPanelCollapsed?: React.ReactNode;
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
  lodPanelCollapsed,
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
  const isLODExpanded = useEditorStore((state) => state.isLODExpanded);
  const setIsLODExpanded = useEditorStore((state) => state.setIsLODExpanded);

  // Get LOD quality from store
  const lodQuality = useLODStore((state) => state.quality);
  const autoSwitch = useLODStore((state) => state.autoSwitch);

  // Format quality for display
  const qualityLabel = autoSwitch
    ? 'AUTO'
    : lodQuality === 'high_fidelity'
      ? 'HIGH'
      : lodQuality === 'low_fidelity'
        ? 'LOW'
        : 'ORIG';

  // Triangle counting and budget calculation
  const [triangleCount, setTriangleCount] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // Detect if mobile
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
    setIsMobile(checkMobile);

    const countTriangles = () => {
      try {
        const scene = (window as any).__r3fScene;
        if (!scene) return 0;

        let count = 0;
        scene.traverse((obj: any) => {
          if (obj.geometry) {
            const geometry = obj.geometry;
            if (geometry.index) {
              count += geometry.index.count / 3;
            } else if (geometry.attributes?.position) {
              count += geometry.attributes.position.count / 3;
            }
          }
        });
        return Math.floor(count);
      } catch {
        return 0;
      }
    };

    const interval = setInterval(() => {
      const count = countTriangles();
      setTriangleCount(count);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate budget status
  const mobileBudget = 500000; // 500k triangles for mobile
  const desktopBudget = 2000000; // 2M triangles for desktop
  const budget = isMobile ? mobileBudget : desktopBudget;
  const budgetPercentage = (triangleCount / budget) * 100;

  // Determine color based on budget
  let budgetColor = 'text-green-400';
  let budgetStatus = 'Good';
  let budgetTooltip = 'Triangle count is within optimal range for smooth 60 FPS';

  if (budgetPercentage > 100) {
    budgetColor = 'text-red-400';
    budgetStatus = 'Critical';
    budgetTooltip = `Scene exceeds ${isMobile ? 'mobile' : 'desktop'} budget by ${Math.round(budgetPercentage - 100)}%! Performance will suffer. Reduce LOD quality or use mesh instancing.`;
  } else if (budgetPercentage > 80) {
    budgetColor = 'text-orange-400';
    budgetStatus = 'High';
    budgetTooltip = `Scene is at ${Math.round(budgetPercentage)}% of ${isMobile ? 'mobile' : 'desktop'} budget. Consider optimizing for better performance.`;
  } else if (budgetPercentage > 50) {
    budgetColor = 'text-yellow-400';
    budgetStatus = 'Moderate';
    budgetTooltip = `Scene is at ${Math.round(budgetPercentage)}% of ${isMobile ? 'mobile' : 'desktop'} budget. Performance is good.`;
  }

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

          {/* LOD Button - shows current quality */}
          <button
            onClick={() => {
              const newValue = !isLODExpanded;
              logger.info('LOD button clicked', {
                currentState: isLODExpanded,
                newState: newValue,
              });
              setIsLODExpanded(newValue);
            }}
            className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
              isLODExpanded
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/50'
                : 'hover:bg-gray-800/50 text-gray-400 hover:text-cyan-400'
            }`}
            title={`Toggle LOD Panel (Current: ${qualityLabel})`}
          >
            <TbBoxMultiple className="w-4 h-4" />
            <span className="text-xs font-mono">{qualityLabel}</span>
          </button>

          {/* Collapsed LOD Panel - renders inline when not expanded */}
          {lodPanelCollapsed}

          <div className="w-px h-4 bg-gray-700"></div>

          {/* Triangle Budget Display */}
          <div className="flex items-center space-x-2 text-xs cursor-help" title={budgetTooltip}>
            <span className="text-gray-500">Triangles:</span>
            <span className={`font-mono font-bold ${budgetColor}`}>
              {triangleCount.toLocaleString()}
            </span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-500 font-mono">{(budget / 1000).toFixed(0)}k</span>
            <span className={`text-[10px] ${budgetColor}`}>({budgetStatus})</span>
          </div>
        </div>
      </div>

      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
    </footer>
  );
};
