import React, { useState, useEffect } from 'react';
import { terrainProfiler } from '@/core/lib/terrain/TerrainProfiler';
import { terrainCache } from '@/core/lib/terrain/TerrainCache';
import { TbMountain, TbX } from 'react-icons/tb';
import { useEditorStore } from '@/editor/store/editorStore';

export const TerrainProfilerOverlay: React.FC = () => {
  const isVisible = useEditorStore((state) => state.isTerrainProfilerExpanded);
  const setIsVisible = useEditorStore((state) => state.setIsTerrainProfilerExpanded);
  const [report, setReport] = useState<ReturnType<typeof terrainProfiler.getPerformanceReport>>();
  const [cacheStats, setCacheStats] = useState<ReturnType<typeof terrainCache.getStats>>();

  // Ensure profiler is enabled
  useEffect(() => {
    terrainProfiler.enable();
  }, []);

  // Record frames using requestAnimationFrame (fallback if not in Canvas)
  useEffect(() => {
    let rafId: number;
    const recordFrame = () => {
      terrainProfiler.recordFrame();
      rafId = requestAnimationFrame(recordFrame);
    };
    rafId = requestAnimationFrame(recordFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setReport(terrainProfiler.getPerformanceReport());
      setCacheStats(terrainCache.getStats());
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const hasData = report && report.averageFPS > 0;
  const performanceColor = report?.isPerformant ? 'text-green-500' : 'text-red-500';

  return (
    <div className="fixed bottom-10 right-4 bg-gray-900 bg-opacity-95 text-white p-4 rounded-lg shadow-2xl z-50 max-w-sm border border-purple-600/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TbMountain size={20} className="text-purple-400" />
          <h3 className="font-semibold">Terrain Monitor</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
          title="Close"
        >
          <TbX size={18} />
        </button>
      </div>

      {!hasData && (
        <div className="text-xs text-gray-400 text-center py-4">
          <p>Initializing profiler...</p>
          <p className="mt-2">
            {report ? 'Waiting for frame data to stabilize' : 'Loading metrics'}
          </p>
          <p className="mt-2 text-xs text-gray-500">Add a terrain entity to see generation stats</p>
        </div>
      )}

      {hasData && report && (
        <div className="space-y-3 text-xs">
          {/* Performance Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`font-semibold ${performanceColor}`}>
              {report.isPerformant ? 'PERFORMANT' : 'ISSUES DETECTED'}
            </span>
          </div>

          {/* Frame Rate */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Avg FPS:</span>
            <span className="font-mono">{report.averageFPS.toFixed(1)}</span>
          </div>

          {/* Generation Time */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Gen Time:</span>
            <span className="font-mono">
              {report.generationTime > 0 ? `${report.generationTime.toFixed(2)} ms` : 'N/A'}
            </span>
          </div>

          {/* Memory */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Memory:</span>
            <span className="font-mono">
              {report.memoryUsage.toFixed(1)} MB
              <span className="ml-1 text-gray-500">({report.memoryTrend})</span>
            </span>
          </div>

          {/* Geometry Stats */}
          {(report.vertexCount > 0 || report.triangleCount > 0) && (
            <div className="border-t border-gray-700 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Vertices:</span>
                <span className="font-mono">{report.vertexCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Triangles:</span>
                <span className="font-mono">{report.triangleCount.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Cache Stats */}
          {cacheStats && cacheStats.totalEntries > 0 && (
            <div className="border-t border-gray-700 pt-2">
              <div className="font-semibold text-gray-300 mb-1">Cache</div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Entries:</span>
                <span className="font-mono">{cacheStats.totalEntries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Memory:</span>
                <span className="font-mono">
                  {(cacheStats.totalMemoryUsage / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Hit Rate:</span>
                <span className="font-mono">{(cacheStats.hitRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}

          {/* Warnings */}
          {report.warnings.length > 0 && (
            <div className="border-t border-gray-700 pt-2">
              <div className="text-yellow-400 font-semibold mb-1">Warnings:</div>
              {report.warnings.map((warning, i) => (
                <div key={i} className="text-yellow-300 text-xs">
                  • {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
