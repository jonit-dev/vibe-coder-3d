import React, { useState, useCallback } from 'react';
import { TbArrowLeft, TbArrowRight, TbCheck, TbX, TbMountain, TbRuler } from 'react-icons/tb';
import { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import {
  TerrainPresetManager,
  presetCategories,
  type ITerrainPreset,
} from '@/core/lib/terrain/TerrainPresets';
import { ColoredTerrainPreview } from './TerrainPreview';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { Vector2Field } from '@/editor/components/shared/Vector2Field';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';

interface ITerrainWizardProps {
  onComplete: (terrainConfig: Partial<TerrainData>) => void;
  onCancel: () => void;
  initialConfig?: Partial<TerrainData>;
}

interface IWizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<{ config: Partial<TerrainData>; updateConfig: (config: Partial<TerrainData>) => void }>;
}

// Step 1: Size & Resolution Configuration
const SizeStep: React.FC<{
  config: Partial<TerrainData>;
  updateConfig: (updates: Partial<TerrainData>) => void;
}> = ({ config, updateConfig }) => {
  const size = config.size || [100, 100];
  const segments = config.segments || [129, 129];

  const vertexCount = segments[0] * segments[1];
  const triangleCount = (segments[0] - 1) * (segments[1] - 1) * 2;

  let performanceLevel = 'Excellent';
  let performanceColor = 'text-green-600';

  if (vertexCount > 250000) {
    performanceLevel = 'Poor';
    performanceColor = 'text-red-600';
  } else if (vertexCount > 100000) {
    performanceLevel = 'Fair';
    performanceColor = 'text-orange-600';
  } else if (vertexCount > 25000) {
    performanceLevel = 'Good';
    performanceColor = 'text-yellow-600';
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Vector2Field
            label="Terrain Size (units)"
            value={size}
            min={1}
            max={1000}
            step={1}
            onChange={(newSize) => updateConfig({ size: newSize as [number, number] })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Physical dimensions of your terrain in world units
          </p>
        </div>

        <div>
          <Vector2Field
            label="Resolution (segments)"
            value={segments}
            min={2}
            max={513}
            step={1}
            onChange={(newSegments) => updateConfig({ segments: newSegments as [number, number] })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Number of subdivisions - higher = more detail but slower performance
          </p>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Performance Impact</span>
          <span className={`font-bold ${performanceColor}`}>{performanceLevel}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div>Vertices: {vertexCount.toLocaleString()}</div>
          <div>Triangles: {triangleCount.toLocaleString()}</div>
        </div>
      </div>

      {/* Quick Size Presets */}
      <div>
        <div className="text-sm font-medium mb-2">Quick Presets</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Small', size: [50, 50], segments: [65, 65] },
            { label: 'Medium', size: [100, 100], segments: [129, 129] },
            { label: 'Large', size: [200, 200], segments: [257, 257] },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() =>
                updateConfig({
                  size: preset.size as [number, number],
                  segments: preset.segments as [number, number],
                })
              }
              className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Step 2: Height Generation
const HeightStep: React.FC<{
  config: Partial<TerrainData>;
  updateConfig: (updates: Partial<TerrainData>) => void;
}> = ({ config, updateConfig }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [presetCategory, setPresetCategory] = useState<string>('landscapes');

  const categoryPresets = TerrainPresetManager.getPresetsByCategory(presetCategory);

  const handlePresetSelect = useCallback(
    (preset: ITerrainPreset) => {
      setSelectedPreset(preset.id);
      updateConfig({
        heightScale: preset.config.heightScale,
        noiseEnabled: preset.config.noiseEnabled,
        noiseSeed: preset.config.noiseSeed,
        noiseFrequency: preset.config.noiseFrequency,
        noiseOctaves: preset.config.noiseOctaves,
        noisePersistence: preset.config.noisePersistence,
        noiseLacunarity: preset.config.noiseLacunarity,
      });
    },
    [updateConfig],
  );

  const terrainProps = {
    size: config.size || [100, 100],
    segments: config.segments || [129, 129],
    heightScale: config.heightScale || 20,
    noiseEnabled: config.noiseEnabled ?? true,
    noiseSeed: config.noiseSeed || 42,
    noiseFrequency: config.noiseFrequency || 2.5,
    noiseOctaves: config.noiseOctaves || 4,
    noisePersistence: config.noisePersistence || 0.5,
    noiseLacunarity: config.noiseLacunarity || 2.0,
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          {/* Category Selector */}
          <div className="mb-3">
            <div className="text-sm font-medium mb-2">Terrain Type</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(presetCategories).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setPresetCategory(key)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    presetCategory === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {categoryPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`p-3 text-left rounded border transition-colors ${
                  selectedPreset === preset.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{preset.icon}</span>
                  <span className="font-medium text-sm">{preset.name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0">
          <div className="text-sm font-medium mb-2">Live Preview</div>
          <ColoredTerrainPreview terrain={terrainProps} size={150} />
        </div>
      </div>

      {/* Manual Controls */}
      <details className="bg-gray-50 dark:bg-gray-800 rounded p-3">
        <summary className="cursor-pointer font-medium text-sm">Manual Configuration</summary>
        <div className="mt-3 space-y-2">
          <CheckboxField
            label="Enable Noise"
            value={config.noiseEnabled ?? true}
            onChange={(v) => updateConfig({ noiseEnabled: v })}
          />
          <SingleAxisField
            label="Height Scale"
            value={config.heightScale || 20}
            min={0}
            max={200}
            step={1}
            onChange={(v) => updateConfig({ heightScale: v })}
          />
          <SingleAxisField
            label="Frequency"
            value={config.noiseFrequency || 2.5}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(v) => updateConfig({ noiseFrequency: v })}
          />
          <SingleAxisField
            label="Octaves"
            value={config.noiseOctaves || 4}
            min={1}
            max={8}
            step={1}
            onChange={(v) => updateConfig({ noiseOctaves: v })}
          />
        </div>
      </details>
    </div>
  );
};

// Step 3: Final Review
const ReviewStep: React.FC<{
  config: Partial<TerrainData>;
}> = ({ config }) => {
  const terrainProps = {
    size: config.size || [100, 100],
    segments: config.segments || [129, 129],
    heightScale: config.heightScale || 20,
    noiseEnabled: config.noiseEnabled ?? true,
    noiseSeed: config.noiseSeed || 42,
    noiseFrequency: config.noiseFrequency || 2.5,
    noiseOctaves: config.noiseOctaves || 4,
    noisePersistence: config.noisePersistence || 0.5,
    noiseLacunarity: config.noiseLacunarity || 2.0,
  };

  const vertexCount = terrainProps.segments[0] * terrainProps.segments[1];
  const triangleCount = (terrainProps.segments[0] - 1) * (terrainProps.segments[1] - 1) * 2;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <ColoredTerrainPreview terrain={terrainProps} size={200} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
          <h4 className="font-medium mb-2">Dimensions</h4>
          <div className="text-sm space-y-1">
            <div>
              Size: {terrainProps.size[0]} x {terrainProps.size[1]} units
            </div>
            <div>
              Resolution: {terrainProps.segments[0]} x {terrainProps.segments[1]} segments
            </div>
            <div>Height Scale: {terrainProps.heightScale} units</div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
          <h4 className="font-medium mb-2">Performance</h4>
          <div className="text-sm space-y-1">
            <div>Vertices: {vertexCount.toLocaleString()}</div>
            <div>Triangles: {triangleCount.toLocaleString()}</div>
            <div>Noise: {terrainProps.noiseEnabled ? 'Enabled' : 'Disabled'}</div>
          </div>
        </div>
      </div>

      {terrainProps.noiseEnabled && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
          <h4 className="font-medium mb-2">Procedural Settings</h4>
          <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
            <div>Frequency: {terrainProps.noiseFrequency}</div>
            <div>Octaves: {terrainProps.noiseOctaves}</div>
            <div>Persistence: {terrainProps.noisePersistence}</div>
            <div>Lacunarity: {terrainProps.noiseLacunarity}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const wizardSteps: IWizardStep[] = [
  {
    id: 'size',
    title: 'Size & Resolution',
    description: 'Configure terrain dimensions and detail level',
    icon: <TbRuler />,
    component: SizeStep,
  },
  {
    id: 'height',
    title: 'Height Generation',
    description: 'Choose terrain shape and procedural settings',
    icon: <TbMountain />,
    component: HeightStep,
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Review your terrain configuration',
    icon: <TbCheck />,
    component: ReviewStep,
  },
];

export const TerrainWizard: React.FC<ITerrainWizardProps> = ({
  onComplete,
  onCancel,
  initialConfig = {},
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [terrainConfig, setTerrainConfig] = useState<Partial<TerrainData>>({
    size: [100, 100],
    segments: [129, 129],
    heightScale: 20,
    noiseEnabled: true,
    noiseSeed: 42,
    noiseFrequency: 2.5,
    noiseOctaves: 4,
    noisePersistence: 0.5,
    noiseLacunarity: 2.0,
    ...initialConfig,
  });

  const handleConfigChange = useCallback((updates: Partial<TerrainData>) => {
    setTerrainConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(terrainConfig);
    }
  }, [currentStep, onComplete, terrainConfig]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const currentStepData = wizardSteps[currentStep];
  const StepComponent = currentStepData.component;

  return (
    <div className="terrain-wizard max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TbMountain className="text-green-600" />
            Terrain Creation Wizard
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <TbX size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {wizardSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${index < wizardSteps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index === currentStep
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : index < currentStep
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400 dark:bg-gray-700 dark:border-gray-600'
                }`}
              >
                {index < currentStep ? <TbCheck size={16} /> : step.icon}
              </div>

              {index < wizardSteps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-2 text-center">
          <h3 className="font-medium">{currentStepData.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{currentStepData.description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        <StepComponent config={terrainConfig} updateConfig={handleConfigChange} />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>

        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            <TbArrowLeft /> Previous
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            {currentStep === wizardSteps.length - 1 ? (
              <>
                <TbCheck /> Create Terrain
              </>
            ) : (
              <>
                Next <TbArrowRight />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
