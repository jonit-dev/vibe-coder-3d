import React, { useState } from 'react';
import { lodManager, type LODQuality } from '@core/lib/rendering/LODManager';

export const LODSettings: React.FC = () => {
  const [quality, setQuality] = useState<LODQuality>(lodManager.getQuality());
  const [autoSwitch, setAutoSwitch] = useState(lodManager.getConfig().autoSwitch);

  const handleQualityChange = (newQuality: LODQuality) => {
    setQuality(newQuality);
    lodManager.setQuality(newQuality);
  };

  const handleAutoSwitchToggle = () => {
    const newValue = !autoSwitch;
    setAutoSwitch(newValue);
    lodManager.setAutoSwitch(newValue);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">LOD (Level of Detail) Settings</h3>

      <div className="space-y-4">
        {/* Quality Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Model Quality</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lod-quality"
                value="original"
                checked={quality === 'original'}
                onChange={() => handleQualityChange('original')}
                className="text-blue-500"
              />
              <span className="text-sm text-gray-200">Original (60% optimized, best quality)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lod-quality"
                value="high_fidelity"
                checked={quality === 'high_fidelity'}
                onChange={() => handleQualityChange('high_fidelity')}
                className="text-blue-500"
              />
              <span className="text-sm text-gray-200">High Fidelity (75% triangles, balanced)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lod-quality"
                value="low_fidelity"
                checked={quality === 'low_fidelity'}
                onChange={() => handleQualityChange('low_fidelity')}
                className="text-blue-500"
              />
              <span className="text-sm text-gray-200">
                Low Fidelity (35% triangles, best performance)
              </span>
            </label>
          </div>
        </div>

        {/* Auto-Switch Toggle */}
        <div className="pt-4 border-t border-gray-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSwitch}
              onChange={handleAutoSwitchToggle}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <div>
              <span className="text-sm font-medium text-gray-200">
                Auto-switch based on distance
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Automatically adjust quality based on camera distance
              </p>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
          <p className="text-xs text-blue-200">
            <strong>Note:</strong> LOD changes apply to newly loaded models. Reload the scene to see
            changes on existing models.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-4 p-3 bg-gray-900 rounded">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Quality Comparison</h4>
          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Original:</span>
              <span className="text-gray-200">Base optimized (100%)</span>
            </div>
            <div className="flex justify-between">
              <span>High Fidelity:</span>
              <span className="text-gray-200">~98% size, 75% triangles</span>
            </div>
            <div className="flex justify-between">
              <span>Low Fidelity:</span>
              <span className="text-gray-200">~96% size, 35% triangles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
