import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { IKeyframe } from '@core/components/animation/tracks/TrackTypes';
import { TrackType } from '@core/components/animation/tracks/TrackTypes';
import type { EasingType } from '@core/components/animation/curves/Easing';

export interface IKeyframeValueEditorProps {
  keyframe: IKeyframe;
  trackType: TrackType;
  onSave: (value: IKeyframe['value'], easing?: EasingType, easingArgs?: number[]) => void;
  onCancel: () => void;
}

interface IEasingPreset {
  name: string;
  type: EasingType;
  args?: number[];
  description: string;
}

const EASING_PRESETS: IEasingPreset[] = [
  { name: 'Linear', type: 'linear', description: 'Constant speed' },
  { name: 'Step', type: 'step', description: 'No interpolation' },
  {
    name: 'Ease In Out',
    type: 'bezier',
    args: [0.42, 0, 0.58, 1],
    description: 'Smooth start and end',
  },
  { name: 'Ease In', type: 'bezier', args: [0.42, 0, 1, 1], description: 'Slow start' },
  { name: 'Ease Out', type: 'bezier', args: [0, 0, 0.58, 1], description: 'Slow end' },
  {
    name: 'Ease In Quad',
    type: 'bezier',
    args: [0.11, 0, 0.5, 0],
    description: 'Quadratic ease in',
  },
  {
    name: 'Ease Out Quad',
    type: 'bezier',
    args: [0.5, 1, 0.89, 1],
    description: 'Quadratic ease out',
  },
  {
    name: 'Ease In Out Quad',
    type: 'bezier',
    args: [0.45, 0, 0.55, 1],
    description: 'Quadratic ease in/out',
  },
  { name: 'Ease In Cubic', type: 'bezier', args: [0.32, 0, 0.67, 0], description: 'Cubic ease in' },
  {
    name: 'Ease Out Cubic',
    type: 'bezier',
    args: [0.33, 1, 0.68, 1],
    description: 'Cubic ease out',
  },
  {
    name: 'Ease In Out Cubic',
    type: 'bezier',
    args: [0.65, 0, 0.35, 1],
    description: 'Cubic ease in/out',
  },
];

export const KeyframeValueEditor: React.FC<IKeyframeValueEditorProps> = ({
  keyframe,
  trackType,
  onSave,
  onCancel,
}) => {
  const [value, setValue] = useState<IKeyframe['value']>(keyframe.value);
  const [easing, setEasing] = useState<EasingType>(keyframe.easing as EasingType);
  const [easingArgs, setEasingArgs] = useState<number[]>(keyframe.easingArgs || []);
  const [customBezier, setCustomBezier] = useState<[number, number, number, number]>(
    keyframe.easingArgs && keyframe.easingArgs.length === 4
      ? [
          keyframe.easingArgs[0],
          keyframe.easingArgs[1],
          keyframe.easingArgs[2],
          keyframe.easingArgs[3],
        ]
      : [0.42, 0, 0.58, 1],
  );

  useEffect(() => {
    setValue(keyframe.value);
    setEasing(keyframe.easing as EasingType);
    setEasingArgs(keyframe.easingArgs || []);
    if (keyframe.easingArgs && keyframe.easingArgs.length === 4) {
      setCustomBezier([
        keyframe.easingArgs[0],
        keyframe.easingArgs[1],
        keyframe.easingArgs[2],
        keyframe.easingArgs[3],
      ]);
    }
  }, [keyframe]);

  const handleSave = () => {
    const finalEasingArgs = easing === 'bezier' ? customBezier : easingArgs;
    onSave(value, easing, finalEasingArgs);
  };

  const handlePresetSelect = (preset: IEasingPreset) => {
    setEasing(preset.type);
    if (preset.args) {
      setEasingArgs(preset.args);
      if (preset.args.length === 4) {
        setCustomBezier([preset.args[0], preset.args[1], preset.args[2], preset.args[3]]);
      }
    } else {
      setEasingArgs([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const renderValueInputs = () => {
    // Vector3 (Position, Scale)
    if (trackType === TrackType.TRANSFORM_POSITION || trackType === TrackType.TRANSFORM_SCALE) {
      const vec = Array.isArray(value) ? value : [0, 0, 0];
      return (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">X</label>
            <input
              type="number"
              value={vec[0]}
              onChange={(e) => setValue([parseFloat(e.target.value) || 0, vec[1], vec[2]])}
              onKeyDown={handleKeyDown}
              step="0.1"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Y</label>
            <input
              type="number"
              value={vec[1]}
              onChange={(e) => setValue([vec[0], parseFloat(e.target.value) || 0, vec[2]])}
              onKeyDown={handleKeyDown}
              step="0.1"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Z</label>
            <input
              type="number"
              value={vec[2]}
              onChange={(e) => setValue([vec[0], vec[1], parseFloat(e.target.value) || 0])}
              onKeyDown={handleKeyDown}
              step="0.1"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      );
    }

    // Quaternion (Rotation) - show as Euler angles for easier editing
    if (trackType === TrackType.TRANSFORM_ROTATION) {
      const quat = Array.isArray(value) && value.length === 4 ? value : [0, 0, 0, 1];
      // TODO: Convert quaternion to euler for display, convert back on save
      // For now, show raw quaternion values with warning
      return (
        <div className="space-y-2">
          <div className="text-xs text-yellow-400 mb-2">
            Note: Editing quaternions directly. Euler angle editor coming soon.
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">X</label>
            <input
              type="number"
              value={quat[0]}
              onChange={(e) =>
                setValue([parseFloat(e.target.value) || 0, quat[1], quat[2], quat[3]])
              }
              onKeyDown={handleKeyDown}
              step="0.01"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Y</label>
            <input
              type="number"
              value={quat[1]}
              onChange={(e) =>
                setValue([quat[0], parseFloat(e.target.value) || 0, quat[2], quat[3]])
              }
              onKeyDown={handleKeyDown}
              step="0.01"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Z</label>
            <input
              type="number"
              value={quat[2]}
              onChange={(e) =>
                setValue([quat[0], quat[1], parseFloat(e.target.value) || 0, quat[3]])
              }
              onKeyDown={handleKeyDown}
              step="0.01"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">W</label>
            <input
              type="number"
              value={quat[3]}
              onChange={(e) =>
                setValue([quat[0], quat[1], quat[2], parseFloat(e.target.value) || 1])
              }
              onKeyDown={handleKeyDown}
              step="0.01"
              className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      );
    }

    // Single number (Morph, Material properties)
    if (typeof value === 'number') {
      return (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Value</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            onKeyDown={handleKeyDown}
            step="0.01"
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            autoFocus
          />
        </div>
      );
    }

    // Object/Record (Event data, Material properties map)
    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-2">Event Data (JSON)</div>
          <textarea
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                setValue(JSON.parse(e.target.value));
              } catch {
                // Keep editing
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSave();
              } else if (e.key === 'Escape') {
                onCancel();
              }
            }}
            rows={8}
            className="w-full px-2 py-1 text-sm font-mono bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <div className="text-xs text-gray-500">Press Ctrl+Enter to save</div>
        </div>
      );
    }

    return <div className="text-xs text-red-400">Unknown value type</div>;
  };

  const renderEasingSection = () => {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-2">Easing Presets</label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {EASING_PRESETS.map((preset) => {
              const isActive =
                preset.type === easing &&
                JSON.stringify(preset.args || []) === JSON.stringify(easingArgs);
              return (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-3 py-2 text-left text-xs rounded transition-colors ${
                    isActive
                      ? 'bg-cyan-600 text-white border border-cyan-400'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{preset.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {easing === 'bezier' && (
          <div className="pt-3 border-t border-gray-700">
            <label className="block text-xs text-gray-400 mb-2">Custom Bezier Curve</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">X1</label>
                <input
                  type="number"
                  value={customBezier[0]}
                  onChange={(e) =>
                    setCustomBezier([
                      parseFloat(e.target.value) || 0,
                      customBezier[1],
                      customBezier[2],
                      customBezier[3],
                    ])
                  }
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full px-2 py-1 text-sm bg-gray-900 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y1</label>
                <input
                  type="number"
                  value={customBezier[1]}
                  onChange={(e) =>
                    setCustomBezier([
                      customBezier[0],
                      parseFloat(e.target.value) || 0,
                      customBezier[2],
                      customBezier[3],
                    ])
                  }
                  step="0.01"
                  className="w-full px-2 py-1 text-sm bg-gray-900 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">X2</label>
                <input
                  type="number"
                  value={customBezier[2]}
                  onChange={(e) =>
                    setCustomBezier([
                      customBezier[0],
                      customBezier[1],
                      parseFloat(e.target.value) || 0,
                      customBezier[3],
                    ])
                  }
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full px-2 py-1 text-sm bg-gray-900 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y2</label>
                <input
                  type="number"
                  value={customBezier[3]}
                  onChange={(e) =>
                    setCustomBezier([
                      customBezier[0],
                      customBezier[1],
                      customBezier[2],
                      parseFloat(e.target.value) || 0,
                    ])
                  }
                  step="0.01"
                  className="w-full px-2 py-1 text-sm bg-gray-900 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              CSS: cubic-bezier({customBezier.join(', ')})
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-gray-700">
          <label className="block text-xs text-gray-400 mb-2">Current Easing</label>
          <div className="px-3 py-2 bg-gray-800 rounded border border-gray-700">
            <div className="text-sm text-white font-medium capitalize">{easing}</div>
            {easingArgs.length > 0 && (
              <div className="text-xs text-gray-400 mt-1">Args: [{easingArgs.join(', ')}]</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Edit Keyframe</h3>
          <p className="text-xs text-gray-400 mt-1">
            Time: {keyframe.time.toFixed(3)}s • Type: {trackType}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 p-4">
            {/* Left Column - Value */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-700 pb-2">
                Value
              </h4>
              {renderValueInputs()}
            </div>

            {/* Right Column - Easing */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3 border-b border-gray-700 pb-2">
                Easing
              </h4>
              {renderEasingSection()}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-700 flex justify-end gap-2 bg-gray-900">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
