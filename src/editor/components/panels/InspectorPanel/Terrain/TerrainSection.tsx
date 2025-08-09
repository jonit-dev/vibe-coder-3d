import React, { useState, useCallback } from 'react';
import { TbMountain, TbRefresh, TbTemplate, TbEye, TbActivity, TbX } from 'react-icons/tb';
import { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { Vector2Field } from '@/editor/components/shared/Vector2Field';
import { TerrainPreview, ColoredTerrainPreview } from '@/editor/components/terrain/TerrainPreview';
import {
  TerrainPresetManager,
  presetCategories,
  type ITerrainPreset,
} from '@/core/lib/terrain/TerrainPresets';
import { terrainProfiler } from '@/core/lib/terrain/TerrainProfiler';
import { terrainCache } from '@/core/lib/terrain/TerrainCache';

export interface ITerrainSectionProps {
  terrain: TerrainData;
  onUpdate: (updates: Partial<TerrainData>) => void;
  onRemove: () => void;
}

interface IPresetSelectorProps {
  onApplyPreset: (preset: ITerrainPreset) => void;
}

const PresetSelector: React.FC<IPresetSelectorProps> = ({ onApplyPreset }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('landscapes');
  const [showPresets, setShowPresets] = useState(false);

  const categoryPresets = TerrainPresetManager.getPresetsByCategory(selectedCategory);

  const handleApplyPreset = useCallback(
    (preset: ITerrainPreset) => {
      onApplyPreset(preset);
      setShowPresets(false);
    },
    [onApplyPreset],
  );

  const handleRandomPreset = useCallback(() => {
    const randomPreset = TerrainPresetManager.getRandomPreset(selectedCategory);
    onApplyPreset(randomPreset);
  }, [onApplyPreset, selectedCategory]);

  return (
    <div className="terrain-presets">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
        >
          <TbTemplate />
          Presets
        </button>
        <button
          onClick={handleRandomPreset}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors"
          title="Apply random preset"
        >
          <TbRefresh />
          Random
        </button>
      </div>

      {showPresets && (
        <div className="border border-gray-200 rounded-md p-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
          {/* Category Selector */}
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(presetCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {categoryPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="flex items-center gap-2 p-2 text-left bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-xs"
                title={preset.description}
              >
                <span className="text-base">{preset.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{preset.name}</div>
                  <div className="text-gray-500 dark:text-gray-400 truncate text-xs">
                    {preset.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface IPerformanceIndicatorProps {
  terrain: TerrainData;
}

const PerformanceIndicator: React.FC<IPerformanceIndicatorProps> = ({ terrain }) => {
  const [showStats, setShowStats] = useState(false);

  const handleShowStats = useCallback(() => {
    setShowStats(!showStats);
    if (!showStats) {
      terrainProfiler.logPerformance();
    }
  }, [showStats]);

  // Estimate performance impact
  const [sx, sz] = terrain.segments;
  const vertexCount = sx * sz;
  const triangleCount = (sx - 1) * (sz - 1) * 2;

  let performanceLevel: 'good' | 'medium' | 'high' | 'extreme' = 'good';
  let performanceColor = 'text-green-600';

  if (vertexCount > 250000) {
    performanceLevel = 'extreme';
    performanceColor = 'text-red-600';
  } else if (vertexCount > 100000) {
    performanceLevel = 'high';
    performanceColor = 'text-orange-600';
  } else if (vertexCount > 25000) {
    performanceLevel = 'medium';
    performanceColor = 'text-yellow-600';
  }

  const cacheStats = terrainCache.getStats();

  return (
    <div className="performance-indicator">
      <button
        onClick={handleShowStats}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${performanceColor} hover:bg-gray-100 dark:hover:bg-gray-700`}
        title={`${vertexCount.toLocaleString()} vertices, ${triangleCount.toLocaleString()} triangles`}
      >
        <TbActivity />
        Performance: {performanceLevel.toUpperCase()}
      </button>

      {showStats && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="font-medium">Geometry</div>
              <div>Vertices: {vertexCount.toLocaleString()}</div>
              <div>Triangles: {triangleCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-medium">Cache</div>
              <div>Entries: {cacheStats.totalEntries}</div>
              <div>Hit Rate: {(cacheStats.hitRate * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TerrainSection: React.FC<ITerrainSectionProps> = ({ terrain, onUpdate, onRemove }) => {
  const [showColoredPreview, setShowColoredPreview] = useState(false);

  const handleApplyPreset = useCallback(
    (preset: ITerrainPreset) => {
      const presetConfig = TerrainPresetManager.createTerrainProps(
        preset,
        terrain.size,
        terrain.segments,
      );

      onUpdate({
        heightScale: presetConfig.heightScale,
        noiseEnabled: presetConfig.noiseEnabled,
        noiseSeed: presetConfig.noiseSeed,
        noiseFrequency: presetConfig.noiseFrequency,
        noiseOctaves: presetConfig.noiseOctaves,
        noisePersistence: presetConfig.noisePersistence,
        noiseLacunarity: presetConfig.noiseLacunarity,
      });
    },
    [terrain.size, terrain.segments, onUpdate],
  );

  const handleRandomizeSeed = useCallback(() => {
    onUpdate({ noiseSeed: Math.floor(Math.random() * 10000) });
  }, [onUpdate]);

  const handleClearCache = useCallback(() => {
    terrainCache.clear();
    console.log('🗑️ Terrain cache cleared');
  }, []);

  return (
    <GenericComponentSection
      title="Terrain"
      icon={<TbMountain />}
      headerColor="green"
      componentId="Terrain"
      onRemove={onRemove}
    >
      {/* Preview Section */}
      <CollapsibleSection title="Preview" defaultExpanded>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {showColoredPreview ? (
              <ColoredTerrainPreview terrain={terrain} />
            ) : (
              <TerrainPreview terrain={terrain} />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <button
              onClick={() => setShowColoredPreview(!showColoredPreview)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
            >
              <TbEye />
              {showColoredPreview ? 'Height Map' : 'Color Map'}
            </button>

            <PerformanceIndicator terrain={terrain} />

            <button
              onClick={handleClearCache}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              title="Clear terrain cache"
            >
              <TbX />
              Clear Cache
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Presets Section */}
      <CollapsibleSection title="Terrain Presets" defaultExpanded={false}>
        <PresetSelector onApplyPreset={handleApplyPreset} />
      </CollapsibleSection>

      {/* Dimensions Section */}
      <CollapsibleSection title="Dimensions" defaultExpanded>
        <div className="space-y-2">
          <Vector2Field
            label="Size (X,Z)"
            value={[terrain.size[0], terrain.size[1]]}
            min={1}
            step={1}
            onChange={([x, z]) => onUpdate({ size: [x, z] })}
          />
          <Vector2Field
            label="Segments (X,Z)"
            value={[terrain.segments[0], terrain.segments[1]]}
            min={2}
            max={1024}
            step={1}
            onChange={([sx, sz]) =>
              onUpdate({
                segments: [Math.max(2, Math.floor(sx)), Math.max(2, Math.floor(sz))],
              })
            }
          />
          <SingleAxisField
            label="Height Scale"
            value={terrain.heightScale}
            min={0}
            max={200}
            step={0.1}
            precision={2}
            onChange={(v) => onUpdate({ heightScale: Math.max(0, v) })}
          />
        </div>
      </CollapsibleSection>

      {/* Enhanced Noise Section */}
      <CollapsibleSection title="Procedural Noise" defaultExpanded>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckboxField
              label="Enable Noise"
              value={terrain.noiseEnabled}
              onChange={(v) => onUpdate({ noiseEnabled: v })}
            />
            <button
              onClick={handleRandomizeSeed}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              title="Generate random seed"
            >
              <TbRefresh />
              Random
            </button>
          </div>

          <SingleAxisField
            label="Seed"
            value={terrain.noiseSeed}
            min={0}
            max={9999}
            step={1}
            precision={0}
            onChange={(v) => onUpdate({ noiseSeed: Math.max(0, Math.floor(v)) })}
          />
          <SingleAxisField
            label="Frequency"
            value={terrain.noiseFrequency}
            min={0.1}
            max={10}
            step={0.1}
            precision={2}
            onChange={(v) => onUpdate({ noiseFrequency: Math.max(0.1, v) })}
          />
          <SingleAxisField
            label="Octaves"
            value={terrain.noiseOctaves}
            min={1}
            max={8}
            step={1}
            precision={0}
            onChange={(v) => onUpdate({ noiseOctaves: Math.min(8, Math.max(1, Math.floor(v))) })}
          />
          <SingleAxisField
            label="Persistence"
            value={terrain.noisePersistence}
            min={0}
            max={1}
            step={0.05}
            precision={2}
            onChange={(v) => onUpdate({ noisePersistence: Math.min(1, Math.max(0, v)) })}
          />
          <SingleAxisField
            label="Lacunarity"
            value={terrain.noiseLacunarity}
            min={1}
            max={4}
            step={0.1}
            precision={2}
            onChange={(v) => onUpdate({ noiseLacunarity: Math.max(1, v) })}
          />
        </div>
      </CollapsibleSection>

      {/* Advanced Options */}
      <CollapsibleSection title="Advanced Options" defaultExpanded={false}>
        <div className="space-y-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div>💡 Tip: Higher segment counts provide more detail but impact performance</div>
            <div>🎯 Sweet spot: 65-129 segments for most use cases</div>
            <div>⚡ Use presets for instant professional results</div>
            <div>🚀 Web worker keeps UI responsive during generation</div>
            <div>📊 Cache system speeds up repeated terrain loading</div>
          </div>
        </div>
      </CollapsibleSection>
    </GenericComponentSection>
  );
};
