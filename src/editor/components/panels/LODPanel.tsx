import React, { useEffect, useState } from 'react';
import { useLODStore, type LODQuality } from '@core/state/lodStore';
import { useEditorStore } from '@/editor/store/editorStore';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { Logger } from '@core/lib/logger';
import * as THREE from 'three';

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
  const [showWireframe, setShowWireframe] = useState(false);
  const [cameraDistance, setCameraDistance] = useState<number | null>(null);
  const [effectiveQuality, setEffectiveQuality] = useState<LODQuality>(quality);

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

  // Count triangles and track camera distance
  useEffect(() => {
    const updateStats = () => {
      try {
        const scene = (window as unknown as { __r3fScene?: THREE.Scene }).__r3fScene;
        const camera = (window as unknown as { __r3fCamera?: THREE.Camera }).__r3fCamera;
        if (!scene) return;

        // Count triangles
        let count = 0;
        scene.traverse((obj: THREE.Object3D) => {
          if (obj.geometry) {
            const geometry = obj.geometry;
            if (geometry.index) {
              count += geometry.index.count / 3;
            } else if (geometry.attributes?.position) {
              count += geometry.attributes.position.count / 3;
            }
          }
        });
        setTriangleCount(Math.floor(count));

        // Track camera distance to selected entity
        if (selectedId && camera) {
          const entityManager = EntityManager.getInstance();
          const entity = entityManager.getEntity(selectedId);
          if (entity) {
            const components = componentRegistry.getComponentsForEntity(selectedId);
            const transform = components.find((c) => c.type === 'Transform');
            if (
              transform?.data &&
              typeof transform.data === 'object' &&
              'position' in transform.data
            ) {
              const pos = transform.data.position as { x: number; y: number; z: number };
              const dx = camera.position.x - pos.x;
              const dy = camera.position.y - pos.y;
              const dz = camera.position.z - pos.z;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              setCameraDistance(dist);

              // Calculate effective quality - get fresh function from store
              const currentAutoSwitch = useLODStore.getState().autoSwitch;
              const currentQuality = useLODStore.getState().quality;
              const effectiveQ = currentAutoSwitch
                ? useLODStore.getState().getQualityForDistance(dist)
                : currentQuality;
              setEffectiveQuality(effectiveQ);
            }
          }
        } else {
          setCameraDistance(null);
          setEffectiveQuality(useLODStore.getState().quality);
        }
      } catch {
        // Ignore errors
      }
    };

    const interval = setInterval(updateStats, 500);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Apply wireframe to all meshes - only when toggled
  const wireframeAppliedRef = React.useRef<boolean>(false);

  useEffect(() => {
    const scene = (window as unknown as { __r3fScene?: THREE.Scene }).__r3fScene;
    if (!scene) return;

    // Prevent redundant updates
    if (wireframeAppliedRef.current === showWireframe) return;
    wireframeAppliedRef.current = showWireframe;

    logger.info(`Wireframe ${showWireframe ? 'enabled' : 'disabled'}`);

    scene.traverse((obj: THREE.Object3D) => {
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat: THREE.Material) => {
            // Only update if different to prevent flashing
            if (mat.wireframe !== showWireframe) {
              mat.wireframe = showWireframe;
            }
          });
        } else {
          // Only update if different to prevent flashing
          if (obj.material.wireframe !== showWireframe) {
            obj.material.wireframe = showWireframe;
          }
        }
      }
    });
  }, [showWireframe]);

  const handleQualityChange = (newQuality: LODQuality) => {
    logger.info('Quality changed via UI', {
      from: quality,
      to: newQuality,
      autoSwitch,
      action: autoSwitch ? 'auto-switch remains ON' : 'manual mode',
    });
    setQuality(newQuality);
  };

  const handleAutoSwitchToggle = () => {
    const newAutoSwitch = !autoSwitch;
    logger.info('Auto-switch toggled via UI', {
      from: autoSwitch,
      to: newAutoSwitch,
      currentQuality: quality,
      message: newAutoSwitch
        ? 'LOD will now switch based on camera distance'
        : 'LOD will use manual quality setting',
    });
    setAutoSwitch(newAutoSwitch);
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
            Set Quality: <span className="text-cyan-400 font-mono font-bold">{quality}</span>
          </p>
          {autoSwitch && cameraDistance !== null && (
            <>
              <p className="text-gray-400 text-xs flex items-center gap-2">
                Effective:{' '}
                <span
                  className={`font-mono font-bold ${
                    effectiveQuality === quality ? 'text-cyan-400' : 'text-yellow-400 animate-pulse'
                  }`}
                >
                  {effectiveQuality}
                </span>
                {effectiveQuality !== quality && <span className="text-yellow-400">⚡</span>}
              </p>
              <p className="text-gray-400 text-xs">
                Distance:{' '}
                <span className="text-purple-400 font-mono">{cameraDistance.toFixed(1)}</span>
              </p>
            </>
          )}
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
              onChange={handleAutoSwitchToggle}
              className="w-4 h-4"
            />
            <span className="text-xs text-gray-300">
              Auto-switch by distance {autoSwitch && <span className="text-green-400">✓</span>}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showWireframe}
              onChange={() => setShowWireframe(!showWireframe)}
              className="w-4 h-4"
            />
            <span className="text-xs text-yellow-400">Wireframe (shows polygons)</span>
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
