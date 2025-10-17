import React from 'react';
import { useLODStore, type LODQuality } from '@core/state/lodStore';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('LODSystemDemo');

/**
 * @deprecated Use LODPanel instead. This component is kept for backward compatibility only.
 */

/**
 * Demo component to test and demonstrate LOD system functionality
 * Shows real-time quality switching and logs to prove the system works
 */
export const LODSystemDemo: React.FC = () => {
  const quality = useLODStore((state) => state.quality);
  const autoSwitch = useLODStore((state) => state.autoSwitch);
  const setQuality = useLODStore((state) => state.setQuality);
  const setAutoSwitch = useLODStore((state) => state.setAutoSwitch);
  const [triangleCount, setTriangleCount] = React.useState(0);
  const [showWireframe, setShowWireframe] = React.useState(false);
  const [isChanging, setIsChanging] = React.useState(false);

  // Count triangles in the scene
  React.useEffect(() => {
    const countTriangles = () => {
      try {
        // This needs to be wrapped in a Canvas context
        const scene = (window as any).__r3fScene;
        if (!scene) return 0;

        let count = 0;
        scene.traverse((obj: any) => {
          if (obj.geometry) {
            const geometry = obj.geometry;
            if (geometry.index) {
              count += geometry.index.count / 3;
            } else if (geometry.attributes.position) {
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

  // Toggle wireframe on all meshes to visualize polygon reduction
  // This effect runs continuously to catch new meshes from LOD switching
  React.useEffect(() => {
    const applyWireframe = () => {
      const scene = (window as any).__r3fScene;
      if (!scene) return;

      scene.traverse((obj: any) => {
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat: any) => {
              // Only update if wireframe state differs
              if (mat.wireframe !== showWireframe) {
                mat.wireframe = showWireframe;
                mat.needsUpdate = true;
              }
            });
          } else {
            // Only update if wireframe state differs
            if (obj.material.wireframe !== showWireframe) {
              obj.material.wireframe = showWireframe;
              obj.material.needsUpdate = true;
            }
          }
        }
      });
    };

    // Apply wireframe immediately
    applyWireframe();

    // Set up interval to reapply wireframe (catches new meshes from LOD switching)
    const interval = setInterval(applyWireframe, 100);

    logger.info(`Wireframe ${showWireframe ? 'enabled' : 'disabled'}`);

    return () => clearInterval(interval);
  }, [showWireframe, quality]); // Re-run when quality changes

  const handleQualityChange = (newQuality: LODQuality) => {
    logger.info('🎨 Quality changed via demo UI', {
      from: quality,
      to: newQuality,
    });

    setIsChanging(true);
    setQuality(newQuality);

    // Flash the changing indicator
    setTimeout(() => setIsChanging(false), 1000);
  };

  const handleAutoSwitchToggle = () => {
    logger.info('🔄 Auto-switch toggled', {
      enabled: !autoSwitch,
    });

    setAutoSwitch(!autoSwitch);
  };

  const testQualitySequence = async () => {
    logger.info('🧪 Starting LOD quality test sequence...');

    const qualities: LODQuality[] = ['original', 'high_fidelity', 'low_fidelity', 'original'];

    for (let i = 0; i < qualities.length; i++) {
      const quality = qualities[i];
      logger.info(`🔄 Test step ${i + 1}/${qualities.length}: Switching to ${quality}`, {
        quality,
        step: i + 1,
      });

      handleQualityChange(quality);

      // Wait 2 seconds between switches
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    logger.info('✅ LOD quality test sequence complete!');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl z-50 min-w-[280px]">
      <div className="mb-3">
        <h3 className="text-white font-bold text-sm mb-2">🎮 LOD System Demo</h3>
        <div className="space-y-1">
          <p className="text-gray-400 text-xs flex items-center gap-2">
            Quality: <span className="text-cyan-400 font-mono font-bold">{quality}</span>
            {isChanging && (
              <span className="text-yellow-400 text-xs animate-pulse">🔄 Updating...</span>
            )}
          </p>
          <p className="text-gray-400 text-xs">
            Triangles:{' '}
            <span
              className={`font-mono font-bold ${isChanging ? 'text-yellow-400 animate-pulse' : 'text-green-400'}`}
            >
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
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              quality === 'original'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => handleQualityChange('high_fidelity')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              quality === 'high_fidelity'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            High
          </button>
          <button
            onClick={() => handleQualityChange('low_fidelity')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              quality === 'low_fidelity'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
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
            <span className="text-xs text-gray-300">Auto-switch</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showWireframe}
              onChange={() => setShowWireframe(!showWireframe)}
              className="w-4 h-4"
            />
            <span className="text-xs text-yellow-400">🔍 Wireframe (shows polygons)</span>
          </label>
        </div>

        <button
          onClick={testQualitySequence}
          className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded hover:from-purple-700 hover:to-blue-700 transition-colors"
        >
          🧪 Run Test Sequence
        </button>

        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500">Check console for detailed logs</p>
        </div>
      </div>
    </div>
  );
};
