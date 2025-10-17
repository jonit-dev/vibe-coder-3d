import React, { useEffect, useState } from 'react';
import { useLODStore, type LODQuality } from '@core/state/lodStore';
import { useEditorStore } from '@/editor/store/editorStore';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('LODPanel');

interface ILODPanelProps {
  isExpanded: boolean;
}

/**
 * LOD Panel - Shows LOD controls and statistics
 * - When expanded: Full quality controls for all models
 * - When collapsed: Shows LOD info for selected model only
 */
export const LODPanel: React.FC<ILODPanelProps> = ({ isExpanded }) => {
  const quality = useLODStore((state) => state.quality);
  const autoSwitch = useLODStore((state) => state.autoSwitch);
  const setQuality = useLODStore((state) => state.setQuality);
  const setAutoSwitch = useLODStore((state) => state.setAutoSwitch);

  const selectedId = useEditorStore((state) => state.selectedId);

  const [triangleCount, setTriangleCount] = useState(0);
  const [hasLODModel, setHasLODModel] = useState(false);

  // Debug logging
  React.useEffect(() => {
    logger.info('LODPanel render state', { isExpanded, selectedId, hasLODModel });
  }, [isExpanded, selectedId, hasLODModel]);

  // Check if selected entity has a custom model (LOD-capable)
  useEffect(() => {
    if (!selectedId) {
      setHasLODModel(false);
      return;
    }

    const entityManager = EntityManager.getInstance();
    const entity = entityManager.getEntity(selectedId);
    if (!entity) {
      setHasLODModel(false);
      return;
    }

    // Get components from the component registry
    const components = componentRegistry.getComponentsForEntity(selectedId);
    const meshRenderer = components.find((c) => c.type === 'MeshRenderer');
    const hasCustomModel =
      meshRenderer?.data &&
      typeof meshRenderer.data === 'object' &&
      'modelPath' in meshRenderer.data;

    setHasLODModel(Boolean(hasCustomModel));
  }, [selectedId]);

  // Count triangles in the scene
  useEffect(() => {
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
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleQualityChange = (newQuality: LODQuality) => {
    logger.info('Quality changed', { from: quality, to: newQuality });
    setQuality(newQuality);
  };

  // Collapsed view - show minimal inline info
  if (!isExpanded) {
    if (!selectedId || !hasLODModel) {
      return (
        <span className="text-xs text-gray-500">
          <span className="text-gray-600">—</span>
        </span>
      );
    }

    return (
      <span className="text-xs flex items-center gap-2">
        <span className="text-gray-400">
          LOD: <span className="text-cyan-400 font-mono">{quality}</span>
        </span>
        <span className="text-gray-500 text-[10px]">{triangleCount.toLocaleString()} tris</span>
      </span>
    );
  }

  // Expanded view - full controls
  return (
    <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg p-4 shadow-2xl min-w-[320px]">
      <div className="mb-3">
        <h3 className="text-white font-bold text-base mb-2 flex items-center gap-2">
          <span className="text-cyan-400">●</span> LOD System
        </h3>
        <div className="space-y-1">
          <p className="text-gray-400 text-xs flex items-center gap-2">
            Quality: <span className="text-cyan-400 font-mono font-bold">{quality}</span>
          </p>
          <p className="text-gray-400 text-xs">
            Triangles:{' '}
            <span className="text-green-400 font-mono font-bold">
              {triangleCount.toLocaleString()}
            </span>
          </p>
          <div className="h-px bg-gray-700 my-2" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => handleQualityChange('original')}
            disabled={!hasLODModel && selectedId !== null}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              quality === 'original'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            title={!hasLODModel && selectedId ? 'Selected model has no LOD variants' : ''}
          >
            Original
          </button>
          <button
            onClick={() => handleQualityChange('high_fidelity')}
            disabled={!hasLODModel && selectedId !== null}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              quality === 'high_fidelity'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            title={!hasLODModel && selectedId ? 'Selected model has no LOD variants' : ''}
          >
            High
          </button>
          <button
            onClick={() => handleQualityChange('low_fidelity')}
            disabled={!hasLODModel && selectedId !== null}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              quality === 'low_fidelity'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            title={!hasLODModel && selectedId ? 'Selected model has no LOD variants' : ''}
          >
            Low
          </button>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-gray-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSwitch}
              onChange={() => setAutoSwitch(!autoSwitch)}
              className="w-4 h-4"
            />
            <span className="text-xs text-gray-300">Auto-switch by distance</span>
          </label>
        </div>

        {!hasLODModel && selectedId && (
          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-yellow-500">Selected entity has no LOD-capable model</p>
          </div>
        )}
      </div>
    </div>
  );
};
